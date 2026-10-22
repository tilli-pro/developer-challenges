import type { FastifyInstance } from "fastify";
import { badRequest, notFound, unauthorized } from "../lib/errors";
import {
  EVENT_TYPES,
  type EventType,
  type WebhookEvent,
  type WebhookRoute,
} from "../schemas";
import type { EventService } from "../services/events";
import type { Clock } from "../services/outbox";
import type { WebhookProvider } from "../services/signature";

// Large enough for any real payment, small enough that sums stay safe integers.
const MAX_AMOUNT_CENTS = 1_000_000_000_000;
const CURRENCY = /^[A-Z]{3}$/;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 255;

/** Says why a parsed body is not a WebhookEvent, or null when it is one. */
export function checkWebhookEvent(body: unknown): string | null {
  if (!isObject(body)) return "body must be a JSON object";
  if (!isId(body.id)) return "id must be a string of 1 to 255 characters";
  if (!EVENT_TYPES.includes(body.type as EventType)) {
    return `type must be one of ${EVENT_TYPES.join(", ")}`;
  }
  if (!Number.isSafeInteger(body.created)) return "created must be an integer";

  const { data } = body;
  if (!isObject(data)) return "data must be an object";
  if (!isId(data.paymentId)) {
    return "data.paymentId must be a string of 1 to 255 characters";
  }
  const amount = Number.isSafeInteger(data.amountCents)
    ? (data.amountCents as number)
    : 0;
  if (amount < 1 || amount > MAX_AMOUNT_CENTS) {
    return `data.amountCents must be an integer from 1 to ${MAX_AMOUNT_CENTS}`;
  }
  if (typeof data.currency !== "string" || !CURRENCY.test(data.currency)) {
    return "data.currency must be a three-letter ISO 4217 code";
  }
  if (data.reason !== undefined && typeof data.reason !== "string") {
    return "data.reason must be a string";
  }
  return null;
}

/**
 * `POST /webhooks/:provider`. The body arrives as the raw string (see the
 * content type parser in app.ts) so the signature covers the exact bytes.
 */
export function webhookRoutes(
  app: FastifyInstance,
  deps: {
    providers: Map<string, WebhookProvider>;
    events: EventService;
    clock: Clock;
  },
): void {
  app.post<WebhookRoute>("/webhooks/:provider", async (request, reply) => {
    const name = request.params.provider;
    const provider = deps.providers.get(name);
    if (!provider) throw notFound("provider");

    const rawBody = request.body;
    const header = request.headers[provider.signatureHeader];
    if (
      typeof header !== "string" ||
      typeof rawBody !== "string" ||
      !provider.verify(header, rawBody, provider.secret, deps.clock)
    ) {
      throw unauthorized("invalid signature");
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw badRequest("body is not valid JSON");
    }
    const problem = checkWebhookEvent(body);
    if (problem) throw badRequest(problem);

    const ingested = deps.events.ingest(name, body as WebhookEvent);
    if (ingested.duplicate) return reply.code(200).send(ingested);

    const { eventId } = ingested;
    const status = deps.events.processEvent(eventId);
    return reply.code(202).send({ eventId, status });
  });
}
