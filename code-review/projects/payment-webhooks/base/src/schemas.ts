// Domain types. Amounts are integer cents; timestamps are ISO 8601 UTC strings.

export const EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "refund.created",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** The JSON body a provider posts to `/webhooks/:provider`. */
export type WebhookEvent = {
  id: string;
  type: EventType;
  /** Unix seconds at which the provider created the event. */
  created: number;
  data: {
    paymentId: string;
    amountCents: number;
    currency: string;
    reason?: string;
  };
};

export const EVENT_STATUSES = ["received", "processed", "failed"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export type StoredEvent = {
  id: string;
  provider: string;
  externalId: string;
  type: EventType;
  payload: WebhookEvent;
  status: EventStatus;
  error: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export const PAYMENT_STATUSES = [
  "succeeded",
  "failed",
  "partially_refunded",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Payment = {
  id: string;
  provider: string;
  externalId: string;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  refundedCents: number;
  updatedAt: string;
};

export type IngestResult = { eventId: string; duplicate: boolean };
export type DrainResult = { delivered: number; failed: number };

// Route generics, so handlers get typed params, bodies and querystrings.

export type WebhookRoute = { Params: { provider: string }; Body: string };
export type ListEventsRoute = {
  Querystring: { status?: EventStatus; limit: number };
};
export type ByIdRoute = { Params: { id: string } };

// JSON schemas. Fastify validates requests and serializes responses with these.

const nonEmpty = { type: "string", minLength: 1 } as const;
const dateTime = { type: "string", format: "date-time" } as const;
const cents = { type: "integer", minimum: 0 } as const;

const byIdParams = {
  type: "object",
  required: ["id"],
  properties: { id: nonEmpty },
} as const;

const eventProperties = {
  id: { type: "string" },
  provider: { type: "string" },
  externalId: { type: "string" },
  type: { type: "string", enum: EVENT_TYPES },
  payload: { type: "object", additionalProperties: true },
  status: { type: "string", enum: EVENT_STATUSES },
  error: { type: ["string", "null"] },
  receivedAt: dateTime,
  processedAt: { ...dateTime, type: ["string", "null"] },
} as const;

const eventSchema = {
  type: "object",
  required: Object.keys(eventProperties),
  properties: eventProperties,
} as const;

const paymentProperties = {
  id: { type: "string" },
  provider: { type: "string" },
  externalId: { type: "string" },
  status: { type: "string", enum: PAYMENT_STATUSES },
  amountCents: cents,
  currency: { type: "string" },
  refundedCents: cents,
  updatedAt: dateTime,
} as const;

const paymentSchema = {
  type: "object",
  required: Object.keys(paymentProperties),
  properties: paymentProperties,
} as const;

export const listEventsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: { type: "string", enum: EVENT_STATUSES },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
    },
  },
  response: { 200: { type: "array", items: eventSchema } },
} as const;

export const eventByIdSchema = {
  params: byIdParams,
  response: { 200: eventSchema },
} as const;

export const paymentByIdSchema = {
  params: byIdParams,
  response: { 200: paymentSchema },
} as const;

export const drainSchema = {
  response: {
    200: {
      type: "object",
      required: ["delivered", "failed"],
      properties: { delivered: cents, failed: cents },
    },
  },
} as const;
