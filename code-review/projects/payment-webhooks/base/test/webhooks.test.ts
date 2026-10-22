import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Payment } from "../src/schemas";
import {
  ADMIN,
  acmeEvent,
  NOW_SECONDS,
  postWebhook,
  type TestContext,
  testApp,
} from "./helpers";

const count = (ctx: TestContext, table: "events" | "outbox"): number =>
  Number(ctx.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);

describe("acme webhooks", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = testApp();
  });

  afterEach(async () => {
    await ctx.app.close();
  });

  it("records a payment and an outbox row for payment.succeeded", async () => {
    const response = await postWebhook(ctx.app, acmeEvent());
    assert.equal(response.statusCode, 202);
    const { eventId, status } = response.json();
    assert.equal(status, "processed");

    const event = await ctx.app.inject({
      method: "GET",
      url: `/admin/events/${eventId}`,
      headers: ADMIN,
    });
    assert.equal(event.json().status, "processed");
    assert.equal(event.json().payload.data.paymentId, "pay_001");

    const rows = ctx.db.prepare("SELECT topic, payload FROM outbox").all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.topic, "payments.succeeded");
    const queued = JSON.parse(rows[0]?.payload as string) as Payment;

    const payment = await ctx.app.inject({
      method: "GET",
      url: `/admin/payments/${queued.id}`,
      headers: ADMIN,
    });
    assert.equal(payment.statusCode, 200);
    assert.deepEqual(payment.json(), {
      id: queued.id,
      provider: "acme",
      externalId: "pay_001",
      status: "succeeded",
      amountCents: 12_500,
      currency: "USD",
      refundedCents: 0,
      updatedAt: "2026-01-15T00:00:00.000Z",
    });
  });

  it("acknowledges a redelivered event without applying it twice", async () => {
    const first = await postWebhook(ctx.app, acmeEvent());
    const again = await postWebhook(ctx.app, acmeEvent());

    assert.equal(again.statusCode, 200);
    assert.deepEqual(again.json(), {
      duplicate: true,
      eventId: first.json().eventId,
    });
    assert.equal(count(ctx, "events"), 1);
    assert.equal(count(ctx, "outbox"), 1);
  });

  it("rejects a bad signature with 401 and stores nothing", async () => {
    const response = await postWebhook(
      ctx.app,
      acmeEvent(),
      `t=${NOW_SECONDS},v1=${"0".repeat(64)}`,
    );
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "unauthorized");
    assert.equal(count(ctx, "events"), 0);
  });

  it("delivers outbox messages through the publisher when drained", async () => {
    await postWebhook(ctx.app, acmeEvent());
    await postWebhook(
      ctx.app,
      acmeEvent({
        id: "evt_002",
        type: "refund.created",
        data: { paymentId: "pay_001", amountCents: 2_500, currency: "USD" },
      }),
    );

    const drain = () =>
      ctx.app.inject({
        method: "POST",
        url: "/admin/outbox/drain",
        headers: ADMIN,
      });

    const first = await drain();
    assert.deepEqual(first.json(), { delivered: 2, failed: 0 });
    assert.deepEqual(
      ctx.publisher.published.map((message) => message.topic),
      ["payments.succeeded", "payments.partially_refunded"],
    );

    const second = await drain();
    assert.deepEqual(second.json(), { delivered: 0, failed: 0 });
    assert.equal(ctx.publisher.published.length, 2);
  });
});
