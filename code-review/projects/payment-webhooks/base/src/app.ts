import type { DatabaseSync } from "node:sqlite";
import Fastify, { type FastifyInstance } from "fastify";
import { adminKeyAuth } from "./auth";
import { openDb } from "./db";
import { errorHandler, notFoundHandler } from "./lib/errors";
import { adminRoutes } from "./routes/admin";
import { webhookRoutes } from "./routes/webhooks";
import type { DrainResult } from "./schemas";
import { EventService } from "./services/events";
import {
  type Clock,
  FakePublisher,
  Outbox,
  type Publisher,
} from "./services/outbox";
import { loadProviders } from "./services/signature";

export type AppOptions = {
  /** Defaults to `openDb()`, which honours `DB_PATH`. */
  db?: DatabaseSync;
  /** Source of "now" for every timestamp and signature check. */
  clock?: Clock;
  /** Where outbox messages are delivered; an in-memory fake by default. */
  publisher?: Publisher;
  /** Request logging; off by default so tests stay quiet. */
  logger?: boolean;
};

declare module "fastify" {
  interface FastifyInstance {
    /** Delivers due outbox messages once; server.ts calls it on a timer. */
    drainOutbox(): Promise<DrainResult>;
  }
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const db = options.db ?? openDb();
  const clock = options.clock ?? (() => new Date());
  const publisher = options.publisher ?? new FakePublisher();

  const app = Fastify({ logger: options.logger ?? false });
  const outbox = new Outbox(db, clock, app.log);
  const events = new EventService(db, clock, outbox);
  const drain = () => outbox.drain(publisher);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  app.decorate("drainOutbox", drain);

  app.get("/health", async () => ({ ok: true }));

  // Webhooks are authenticated by signature, which covers the exact bytes the
  // provider sent, so this scope keeps JSON bodies as unparsed strings.
  app.register(async (scope) => {
    scope.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (_request, body, done) => done(null, body),
    );
    webhookRoutes(scope, { providers: loadProviders(), events, clock });
  });

  // Everything registered in this scope sits behind the admin key check.
  app.register(async (admin) => {
    admin.addHook("onRequest", adminKeyAuth());
    adminRoutes(admin, { events, drain });
  });

  app.addHook("onClose", async () => {
    await outbox.idle();
    // Only close a connection we opened; a caller-supplied db is theirs.
    if (!options.db) db.close();
  });

  return app;
}
