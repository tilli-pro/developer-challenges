import type { DatabaseSync } from "node:sqlite";
import Fastify, { type FastifyInstance } from "fastify";
import { apiKeyAuth } from "./auth";
import { openDb } from "./db";
import { errorHandler, notFoundHandler } from "./lib/errors";
import { InvoiceRepository } from "./repositories/invoices";
import { invoiceRoutes } from "./routes/invoices";
import {
  type Clock,
  FakePaymentProvider,
  InvoiceService,
} from "./services/invoices";

export type AppOptions = {
  /** Defaults to `openDb()`, which honours `DB_PATH`. */
  db?: DatabaseSync;
  /** Source of "now" for every timestamp the service writes. */
  clock?: Clock;
  /** Request logging; off by default so tests stay quiet. */
  logger?: boolean;
};

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const db = options.db ?? openDb();
  const clock = options.clock ?? (() => new Date());
  const service = new InvoiceService(
    new InvoiceRepository(db),
    clock,
    new FakePaymentProvider(),
  );

  const app = Fastify({ logger: options.logger ?? false });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.get("/health", async () => ({ ok: true }));

  // Everything registered in this scope sits behind the API key check.
  app.register(async (api) => {
    api.addHook("onRequest", apiKeyAuth());
    invoiceRoutes(api, service);
  });

  app.addHook("onClose", async () => {
    // Only close a connection we opened; a caller-supplied db is theirs.
    if (!options.db) db.close();
  });

  return app;
}
