import type { FastifyInstance } from "fastify";
import {
  type ByIdRoute,
  type DrainResult,
  drainSchema,
  eventByIdSchema,
  type ListEventsRoute,
  listEventsSchema,
  paymentByIdSchema,
} from "../schemas";
import type { EventService } from "../services/events";

/** Operator routes for inspecting events and payments. */
export function adminRoutes(
  app: FastifyInstance,
  deps: { events: EventService; drain: () => Promise<DrainResult> },
): void {
  app.get<ListEventsRoute>(
    "/admin/events",
    { schema: listEventsSchema },
    async (request) => deps.events.list(request.query),
  );

  app.get<ByIdRoute>(
    "/admin/events/:id",
    { schema: eventByIdSchema },
    async (request) => deps.events.get(request.params.id),
  );

  app.get<ByIdRoute>(
    "/admin/payments/:id",
    { schema: paymentByIdSchema },
    async (request) => deps.events.payment(request.params.id),
  );

  // Delivers due outbox messages once, without waiting for the next tick.
  app.post("/admin/outbox/drain", { schema: drainSchema }, async () =>
    deps.drain(),
  );
}
