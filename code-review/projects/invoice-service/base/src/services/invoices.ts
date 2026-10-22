import { randomUUID } from "node:crypto";
import { HttpError, notFound } from "../lib/errors";
import type { Currency } from "../lib/money";
import type {
  InvoiceFilter,
  InvoiceRecord,
  InvoiceRepository,
} from "../repositories/invoices";
import type {
  CreateInvoiceBody,
  Invoice,
  InvoicePage,
  LineInput,
  ListInvoicesQuery,
  PaymentMethod,
} from "../schemas";
import { computeTotals } from "./totals";

export type Clock = () => Date;

/** Net 30: the due date when an invoice is issued without one. */
const PAYMENT_TERMS_MS = 30 * 24 * 60 * 60 * 1000;

export type ChargeRequest = {
  invoiceId: string;
  amountCents: number;
  currency: Currency;
  method: PaymentMethod;
};

export interface PaymentProvider {
  charge(request: ChargeRequest): Promise<{ chargeId: string }>;
}

export class PaymentDeclinedError extends Error {
  override name = "PaymentDeclinedError";
}

/** In-process stand-in for the card/bank processor. */
export class FakePaymentProvider implements PaymentProvider {
  static readonly CARD_LIMIT_CENTS = 1_000_000;

  async charge(request: ChargeRequest): Promise<{ chargeId: string }> {
    if (
      request.method === "card" &&
      request.amountCents > FakePaymentProvider.CARD_LIMIT_CENTS
    ) {
      throw new PaymentDeclinedError("amount exceeds the card limit");
    }
    return { chargeId: `ch_${randomUUID()}` };
  }
}

type Cursor = NonNullable<InvoiceFilter["after"]>;

const encodeCursor = (invoice: Cursor): string =>
  Buffer.from(`${invoice.createdAt}|${invoice.id}`).toString("base64url");

function decodeCursor(cursor: string): Cursor {
  const [createdAt, id] = Buffer.from(cursor, "base64url")
    .toString("utf8")
    .split("|");
  if (!createdAt || !id) {
    throw new HttpError(400, "cursor is malformed", "invalid_cursor");
  }
  return { createdAt, id };
}

export class InvoiceService {
  constructor(
    private readonly repo: InvoiceRepository,
    private readonly clock: Clock,
    private readonly payments: PaymentProvider,
  ) {}

  create(input: CreateInvoiceBody): Invoice {
    const now = this.now();
    const id = randomUUID();
    this.repo.transaction(() => {
      this.repo.insert({
        id,
        number: this.repo.nextNumber(),
        customerId: input.customerId,
        status: "draft",
        currency: input.currency,
        issuedAt: null,
        dueAt: input.dueAt ?? null,
        paidAt: null,
        lines: input.lines.map((line) => ({ id: randomUUID(), ...line })),
        createdAt: now,
        updatedAt: now,
      });
    });
    return this.get(id);
  }

  get(id: string): Invoice {
    const record = this.repo.findById(id);
    if (!record) throw notFound("invoice");
    return withTotals(record);
  }

  list(query: ListInvoicesQuery): InvoicePage {
    // Fetch one extra row to learn whether another page exists.
    const records = this.repo.list({
      customerId: query.customerId,
      status: query.status,
      after: query.cursor ? decodeCursor(query.cursor) : undefined,
      limit: query.limit + 1,
    });

    const items = records.slice(0, query.limit).map(withTotals);
    const last = items.at(-1);
    const nextCursor =
      records.length > query.limit && last ? encodeCursor(last) : null;
    return { items, nextCursor };
  }

  addLine(id: string, input: LineInput): Invoice {
    this.repo.transaction(() => {
      this.repo.addLine(id, { id: randomUUID(), ...input }, this.now());
    });
    return this.get(id);
  }

  removeLine(id: string, lineId: string): Invoice {
    const removed = this.repo.transaction(() =>
      this.repo.removeLine(id, lineId, this.now()),
    );
    if (!removed) throw notFound("line");
    return this.get(id);
  }

  issue(id: string): Invoice {
    const invoice = this.get(id);
    const now = this.clock();
    const defaultDue = new Date(now.getTime() + PAYMENT_TERMS_MS);
    this.repo.updateStatus(id, {
      status: "issued",
      issuedAt: now.toISOString(),
      dueAt: invoice.dueAt ?? defaultDue.toISOString(),
      paidAt: null,
      updatedAt: now.toISOString(),
    });
    return this.get(id);
  }

  async pay(id: string, method: PaymentMethod): Promise<Invoice> {
    const invoice = this.get(id);
    try {
      await this.payments.charge({
        invoiceId: invoice.id,
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        method,
      });
    } catch (error) {
      if (error instanceof PaymentDeclinedError) {
        throw new HttpError(402, error.message, "payment_declined");
      }
      throw error;
    }

    const now = this.now();
    this.repo.updateStatus(id, {
      status: "paid",
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: now,
      updatedAt: now,
    });
    return this.get(id);
  }

  void(id: string): Invoice {
    const invoice = this.get(id);
    this.repo.updateStatus(id, {
      status: "void",
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      updatedAt: this.now(),
    });
    return this.get(id);
  }

  private now(): string {
    return this.clock().toISOString();
  }
}

function withTotals(record: InvoiceRecord): Invoice {
  return { ...record, ...computeTotals(record.lines) };
}
