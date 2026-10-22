import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import type { Invoice, InvoicePage } from "../src/schemas";
import {
  ADMIN,
  createInvoice,
  READONLY,
  sampleInvoice,
  testApp,
} from "./helpers";

describe("invoices API", () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = testApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates, issues and pays an invoice", async () => {
    const created = await createInvoice(app);
    assert.equal(created.status, "draft");
    assert.equal(created.number, "INV-000001");
    assert.equal(created.subtotalCents, 150_000);
    assert.equal(created.taxCents, 30_000);
    assert.equal(created.totalCents, 180_000);

    const issued = await app.inject({
      method: "POST",
      url: `/invoices/${created.id}/issue`,
      headers: ADMIN,
    });
    assert.equal(issued.statusCode, 200);
    assert.equal(issued.json<Invoice>().status, "issued");
    assert.equal(issued.json<Invoice>().issuedAt, "2026-01-15T00:00:00.000Z");
    assert.equal(issued.json<Invoice>().dueAt, "2026-02-14T00:00:00.000Z");

    const paid = await app.inject({
      method: "POST",
      url: `/invoices/${created.id}/pay`,
      headers: ADMIN,
      payload: { method: "card" },
    });
    assert.equal(paid.statusCode, 200);
    assert.equal(paid.json<Invoice>().status, "paid");
    assert.equal(paid.json<Invoice>().paidAt, "2026-01-15T00:00:00.000Z");
  });

  it("only allows line edits on draft invoices", async () => {
    const created = await createInvoice(app);
    await app.inject({
      method: "POST",
      url: `/invoices/${created.id}/issue`,
      headers: ADMIN,
    });

    const response = await app.inject({
      method: "POST",
      url: `/invoices/${created.id}/lines`,
      headers: ADMIN,
      payload: {
        description: "Late addition",
        quantity: 1,
        unitPriceCents: 500,
        taxRateBps: 0,
      },
    });
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().error.code, "conflict");
  });

  it("rejects a 51st line", async () => {
    const line = {
      description: "Hosting",
      quantity: 1,
      unitPriceCents: 2_000,
      taxRateBps: 0,
    };
    const created = await createInvoice(
      app,
      sampleInvoice({ lines: Array.from({ length: 50 }, () => line) }),
    );

    const response = await app.inject({
      method: "POST",
      url: `/invoices/${created.id}/lines`,
      headers: ADMIN,
      payload: line,
    });
    assert.equal(response.statusCode, 409);
  });

  it("rejects writes made with the readonly key", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/invoices",
      headers: READONLY,
      payload: sampleInvoice(),
    });
    assert.equal(response.statusCode, 403);

    const list = await app.inject({
      method: "GET",
      url: "/invoices",
      headers: READONLY,
    });
    assert.equal(list.statusCode, 200);
    assert.deepEqual(list.json<InvoicePage>().items, []);
  });

  it("paginates the invoice list with a cursor", async () => {
    for (let i = 0; i < 3; i++) await createInvoice(app);

    const first = await app.inject({
      method: "GET",
      url: "/invoices?limit=2",
      headers: ADMIN,
    });
    const page = first.json<InvoicePage>();
    assert.equal(page.items.length, 2);
    assert.ok(page.nextCursor);

    const second = await app.inject({
      method: "GET",
      url: `/invoices?limit=2&cursor=${page.nextCursor}`,
      headers: ADMIN,
    });
    const rest = second.json<InvoicePage>();
    assert.equal(rest.items.length, 1);
    assert.equal(rest.nextCursor, null);

    const seen = new Set([...page.items, ...rest.items].map((i) => i.id));
    assert.equal(seen.size, 3);
  });
});
