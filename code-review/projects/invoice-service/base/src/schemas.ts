import { CURRENCIES, type Currency } from "./lib/money";

// Domain types. Amounts are integer cents, tax rates are basis points.

export const INVOICE_STATUSES = ["draft", "issued", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type Line = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxRateBps: number;
};

export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  status: InvoiceStatus;
  currency: Currency;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  lines: Line[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
};

export type LineInput = Omit<Line, "id">;

export type CreateInvoiceBody = {
  customerId: string;
  currency: Currency;
  dueAt?: string;
  lines: LineInput[];
};

export type PaymentMethod = "card" | "bank";

export type ListInvoicesQuery = {
  customerId?: string;
  status?: InvoiceStatus;
  limit: number;
  cursor?: string;
};

export type InvoicePage = { items: Invoice[]; nextCursor: string | null };

// Route generics, so handlers get typed params, bodies and querystrings.

export type InvoiceParams = { id: string };

export type CreateInvoiceRoute = { Body: CreateInvoiceBody };
export type InvoiceByIdRoute = { Params: InvoiceParams };
export type ListInvoicesRoute = { Querystring: ListInvoicesQuery };
export type AddLineRoute = { Params: InvoiceParams; Body: LineInput };
export type RemoveLineRoute = { Params: InvoiceParams & { lineId: string } };
export type PayInvoiceRoute = {
  Params: InvoiceParams;
  Body: { method: PaymentMethod };
};

// JSON schemas. Fastify validates requests and serializes responses with these.

const cents = { type: "integer", minimum: 0 } as const;
const nonEmpty = { type: "string", minLength: 1 } as const;
const dateTime = { type: "string", format: "date-time" } as const;
const nullableDateTime = { ...dateTime, type: ["string", "null"] } as const;

const lineInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "quantity", "unitPriceCents", "taxRateBps"],
  properties: {
    description: { type: "string", minLength: 1, maxLength: 500 },
    quantity: { type: "integer", minimum: 1, maximum: 1_000_000 },
    unitPriceCents: { type: "integer", minimum: 0, maximum: 100_000_000 },
    taxRateBps: { type: "integer", minimum: 0, maximum: 10_000 },
  },
} as const;

const lineSchema = {
  type: "object",
  required: ["id", "description", "quantity", "unitPriceCents", "taxRateBps"],
  properties: {
    id: { type: "string" },
    ...lineInputSchema.properties,
  },
} as const;

const invoiceProperties = {
  id: { type: "string" },
  number: { type: "string" },
  customerId: { type: "string" },
  status: { type: "string", enum: INVOICE_STATUSES },
  currency: { type: "string", enum: CURRENCIES },
  issuedAt: nullableDateTime,
  dueAt: nullableDateTime,
  paidAt: nullableDateTime,
  lines: { type: "array", items: lineSchema },
  subtotalCents: cents,
  taxCents: cents,
  totalCents: cents,
  createdAt: dateTime,
  updatedAt: dateTime,
} as const;

// Every field is always present in a response; nullable ones are sent as null.
const invoiceSchema = {
  type: "object",
  required: Object.keys(invoiceProperties),
  properties: invoiceProperties,
} as const;

const invoiceParams = {
  type: "object",
  required: ["id"],
  properties: { id: nonEmpty },
} as const;

const invoiceResponse = { 200: invoiceSchema } as const;

export const createInvoiceSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["customerId", "currency", "lines"],
    properties: {
      customerId: { type: "string", minLength: 1, maxLength: 100 },
      currency: { type: "string", enum: CURRENCIES },
      dueAt: dateTime,
      lines: { type: "array", maxItems: 100, items: lineInputSchema },
    },
  },
  response: { 201: invoiceSchema },
} as const;

/** GET /invoices/:id and the bodiless transitions (issue, void). */
export const invoiceByIdSchema = {
  params: invoiceParams,
  response: invoiceResponse,
} as const;

export const listInvoicesSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      customerId: nonEmpty,
      status: { type: "string", enum: INVOICE_STATUSES },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      cursor: nonEmpty,
    },
  },
  response: {
    200: {
      type: "object",
      required: ["items", "nextCursor"],
      properties: {
        items: { type: "array", items: invoiceSchema },
        nextCursor: { type: ["string", "null"] },
      },
    },
  },
} as const;

export const addLineSchema = {
  params: invoiceParams,
  body: lineInputSchema,
  response: invoiceResponse,
} as const;

export const removeLineSchema = {
  params: {
    type: "object",
    required: ["id", "lineId"],
    properties: { ...invoiceParams.properties, lineId: nonEmpty },
  },
  response: invoiceResponse,
} as const;

export const payInvoiceSchema = {
  params: invoiceParams,
  body: {
    type: "object",
    additionalProperties: false,
    required: ["method"],
    properties: { method: { type: "string", enum: ["card", "bank"] } },
  },
  response: invoiceResponse,
} as const;
