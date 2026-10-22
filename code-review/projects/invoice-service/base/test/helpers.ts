import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import type { CreateInvoiceBody, Invoice } from "../src/schemas";

export const NOW = new Date("2026-01-15T00:00:00Z");

export const ADMIN = { "x-api-key": "admin-dev-key" };
export const READONLY = { "x-api-key": "readonly-dev-key" };

/** A fresh app on its own in-memory database with a frozen clock. */
export function testApp(): FastifyInstance {
  return buildApp({ clock: () => NOW });
}

export const sampleInvoice = (
  overrides: Partial<CreateInvoiceBody> = {},
): CreateInvoiceBody => ({
  customerId: "cus_acme",
  currency: "USD",
  lines: [
    {
      description: "Consulting, January",
      quantity: 10,
      unitPriceCents: 15_000,
      taxRateBps: 2_000,
    },
  ],
  ...overrides,
});

export async function createInvoice(
  app: FastifyInstance,
  body: CreateInvoiceBody = sampleInvoice(),
): Promise<Invoice> {
  const response = await app.inject({
    method: "POST",
    url: "/invoices",
    headers: ADMIN,
    payload: body,
  });
  if (response.statusCode !== 201) {
    throw new Error(`create failed: ${response.statusCode} ${response.body}`);
  }
  return response.json<Invoice>();
}
