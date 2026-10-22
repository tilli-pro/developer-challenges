import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { transaction } from "../db";
import type { Currency } from "../lib/money";
import type { Invoice, InvoiceStatus, Line } from "../schemas";

/** An invoice as stored: everything except the derived totals. */
export type InvoiceRecord = Omit<
  Invoice,
  "subtotalCents" | "taxCents" | "totalCents"
>;

export type InvoiceFilter = {
  customerId?: string | undefined;
  status?: InvoiceStatus | undefined;
  /** Keyset position: return rows strictly after this one. */
  after?: { createdAt: string; id: string } | undefined;
  limit: number;
};

export type StatusUpdate = Pick<
  InvoiceRecord,
  "status" | "issuedAt" | "dueAt" | "paidAt" | "updatedAt"
>;

type Row = Record<string, unknown>;

const toLine = (row: Row): Line => ({
  id: row.id as string,
  description: row.description as string,
  quantity: Number(row.quantity),
  unitPriceCents: Number(row.unit_price_cents),
  taxRateBps: Number(row.tax_rate_bps),
});

const toRecord = (row: Row, lines: Line[]): InvoiceRecord => ({
  id: row.id as string,
  number: row.number as string,
  customerId: row.customer_id as string,
  status: row.status as InvoiceStatus,
  currency: row.currency as Currency,
  issuedAt: row.issued_at as string | null,
  dueAt: row.due_at as string | null,
  paidAt: row.paid_at as string | null,
  lines,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

export class InvoiceRepository {
  constructor(private readonly db: DatabaseSync) {}

  transaction<T>(fn: () => T): T {
    return transaction(this.db, fn);
  }

  /** Next human-facing invoice number. Call inside the insert transaction. */
  nextNumber(): string {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM invoices").get();
    const sequence = Number(row?.count ?? 0) + 1;
    return `INV-${String(sequence).padStart(6, "0")}`;
  }

  insert(invoice: InvoiceRecord): void {
    const { lines, ...row } = invoice;
    this.db
      .prepare(
        `INSERT INTO invoices
           (id, number, customer_id, status, currency, issued_at, due_at,
            paid_at, created_at, updated_at)
         VALUES (:id, :number, :customerId, :status, :currency, :issuedAt,
                 :dueAt, :paidAt, :createdAt, :updatedAt)`,
      )
      .run(row);
    lines.forEach((line, position) => {
      this.insertLine(invoice.id, line, position);
    });
  }

  findById(id: string): InvoiceRecord | null {
    const row = this.db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    if (!row) return null;
    return toRecord(row, this.linesFor([id]).get(id) ?? []);
  }

  list(filter: InvoiceFilter): InvoiceRecord[] {
    const where: string[] = [];
    const params: SQLInputValue[] = [];
    if (filter.customerId !== undefined) {
      where.push("customer_id = ?");
      params.push(filter.customerId);
    }
    if (filter.status !== undefined) {
      where.push("status = ?");
      params.push(filter.status);
    }
    if (filter.after) {
      where.push("(created_at < ? OR (created_at = ? AND id < ?))");
      params.push(
        filter.after.createdAt,
        filter.after.createdAt,
        filter.after.id,
      );
    }

    const sql = `SELECT * FROM invoices
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC, id DESC
      LIMIT ?`;
    const rows = this.db.prepare(sql).all(...params, filter.limit);

    const lines = this.linesFor(rows.map((row) => row.id as string));
    return rows.map((row) => toRecord(row, lines.get(row.id as string) ?? []));
  }

  addLine(invoiceId: string, line: Line, updatedAt: string): void {
    const row = this.db
      .prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM invoice_lines WHERE invoice_id = ?",
      )
      .get(invoiceId);
    this.insertLine(invoiceId, line, Number(row?.next ?? 0));
    this.touch(invoiceId, updatedAt);
  }

  /** Returns false when the line does not belong to the invoice. */
  removeLine(invoiceId: string, lineId: string, updatedAt: string): boolean {
    const result = this.db
      .prepare("DELETE FROM invoice_lines WHERE id = ? AND invoice_id = ?")
      .run(lineId, invoiceId);
    if (result.changes === 0) return false;
    this.touch(invoiceId, updatedAt);
    return true;
  }

  updateStatus(id: string, update: StatusUpdate): void {
    this.db
      .prepare(
        `UPDATE invoices
         SET status = :status, issued_at = :issuedAt, due_at = :dueAt,
             paid_at = :paidAt, updated_at = :updatedAt
         WHERE id = :id`,
      )
      .run({ ...update, id });
  }

  private insertLine(invoiceId: string, line: Line, position: number): void {
    this.db
      .prepare(
        `INSERT INTO invoice_lines
           (id, invoice_id, description, quantity, unit_price_cents,
            tax_rate_bps, position)
         VALUES (:id, :invoiceId, :description, :quantity, :unitPriceCents,
                 :taxRateBps, :position)`,
      )
      .run({ ...line, invoiceId, position });
  }

  private touch(invoiceId: string, updatedAt: string): void {
    this.db
      .prepare("UPDATE invoices SET updated_at = ? WHERE id = ?")
      .run(updatedAt, invoiceId);
  }

  /** Loads lines for many invoices in one query, grouped by invoice id. */
  private linesFor(invoiceIds: string[]): Map<string, Line[]> {
    const grouped = new Map<string, Line[]>();
    if (invoiceIds.length === 0) return grouped;

    const placeholders = invoiceIds.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `SELECT * FROM invoice_lines
         WHERE invoice_id IN (${placeholders})
         ORDER BY invoice_id, position`,
      )
      .all(...invoiceIds);

    for (const row of rows) {
      const invoiceId = row.invoice_id as string;
      const lines = grouped.get(invoiceId) ?? [];
      lines.push(toLine(row));
      grouped.set(invoiceId, lines);
    }
    return grouped;
  }
}
