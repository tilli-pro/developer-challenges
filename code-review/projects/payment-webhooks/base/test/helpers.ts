import type { DatabaseSync } from "node:sqlite";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { buildApp } from "../src/app";
import { openDb } from "../src/db";
import type { WebhookEvent } from "../src/schemas";
import { FakePublisher } from "../src/services/outbox";
import { signAcme } from "../src/services/signature";

export const NOW = new Date("2026-01-15T00:00:00Z");
export const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
export const SECRET = "acme-dev-secret";
export const ADMIN = { "x-admin-key": "admin-dev-key" };

export type TestContext = {
  app: FastifyInstance;
  db: DatabaseSync;
  publisher: FakePublisher;
};

/** A fresh app on its own in-memory database with a frozen clock. */
export function testApp(): TestContext {
  const db = openDb(":memory:");
  const publisher = new FakePublisher();
  const app = buildApp({ db, clock: () => NOW, publisher });
  app.addHook("onClose", async () => db.close());
  return { app, db, publisher };
}

export const acmeEvent = (
  overrides: Partial<WebhookEvent> = {},
): WebhookEvent => ({
  id: "evt_001",
  type: "payment.succeeded",
  created: NOW_SECONDS,
  data: { paymentId: "pay_001", amountCents: 12_500, currency: "USD" },
  ...overrides,
});

export const signatureHeader = (
  body: string,
  secret = SECRET,
  timestamp = NOW_SECONDS,
): string => `t=${timestamp},v1=${signAcme(timestamp, body, secret)}`;

/** Posts `event` to the acme webhook, signed unless a header is given. */
export function postWebhook(
  app: FastifyInstance,
  event: WebhookEvent,
  signature?: string,
): Promise<LightMyRequestResponse> {
  const body = JSON.stringify(event);
  return app.inject({
    method: "POST",
    url: "/webhooks/acme",
    headers: {
      "content-type": "application/json",
      "x-acme-signature": signature ?? signatureHeader(body),
    },
    payload: body,
  });
}
