import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { transaction } from "../db";
import { notFound } from "../lib/errors";
import type {
  EventStatus,
  EventType,
  IngestResult,
  Payment,
  PaymentStatus,
  StoredEvent,
  WebhookEvent,
} from "../schemas";
import type { Clock, Outbox } from "./outbox";

type Row = Record<string, unknown>;

const toPayment = (row: Row): Payment => ({
  id: row.id as string,
  provider: row.provider as string,
  externalId: row.external_id as string,
  status: row.status as PaymentStatus,
  amountCents: Number(row.amount_cents),
  currency: row.currency as string,
  refundedCents: Number(row.refunded_cents),
  updatedAt: row.updated_at as string,
});

/**
 * Records provider events exactly once per (provider, external id) and applies
 * them to `payments`, queueing a `payments.<status>` message for each change.
 */
export class EventService {
  constructor(
    private readonly db: DatabaseSync,
    private readonly clock: Clock,
    private readonly outbox: Outbox,
  ) {}

  private now(): string {
    return this.clock().toISOString();
  }

  /**
   * Stores a verified event with status `received`. A provider retry of an
   * event we already have is reported as a duplicate and stores nothing.
   */
  ingest(provider: string, body: WebhookEvent): IngestResult {
    const eventId = randomUUID();
    const now = this.now();
    const { changes } = this.db
      .prepare(
        `INSERT INTO events
           (id, provider, external_id, type, payload, status, received_at)
         VALUES (?, ?, ?, ?, ?, 'received', ?)
         ON CONFLICT (provider, external_id) DO NOTHING`,
      )
      .run(eventId, provider, body.id, body.type, JSON.stringify(body), now);
    if (Number(changes) === 1) return { eventId, duplicate: false };

    const existing = this.db
      .prepare("SELECT id FROM events WHERE provider = ? AND external_id = ?")
      .get(provider, body.id);
    return { eventId: existing?.id as string, duplicate: true };
  }

  /**
   * Applies a received event to its payment, queues the outbox message and
   * marks the event processed, all in one transaction. If anything throws,
   * the event is marked failed with the error and the error is re-thrown.
   */
  processEvent(eventId: string): EventStatus {
    try {
      return transaction(this.db, () => {
        const row = this.db
          .prepare("SELECT provider, status, payload FROM events WHERE id = ?")
          .get(eventId);
        if (!row) throw notFound("event");
        if (row.status !== "received") return row.status as EventStatus;

        const provider = row.provider as string;
        const event = JSON.parse(row.payload as string) as WebhookEvent;
        const { paymentId, amountCents, currency } = event.data;
        const now = this.now();
        const upsert = {
          id: randomUUID(),
          provider,
          paymentId,
          amountCents,
          currency,
          now,
        };

        switch (event.type) {
          case "payment.succeeded": {
            this.db
              .prepare(
                `INSERT INTO payments (id, provider, external_id, status,
                   amount_cents, currency, updated_at)
                 VALUES (:id, :provider, :paymentId, 'succeeded',
                   :amountCents, :currency, :now)
                 ON CONFLICT (provider, external_id) DO UPDATE SET
                   status = excluded.status,
                   amount_cents = excluded.amount_cents,
                   currency = excluded.currency,
                   updated_at = excluded.updated_at`,
              )
              .run(upsert);
            break;
          }
          case "payment.failed": {
            this.db
              .prepare(
                `INSERT INTO payments (id, provider, external_id, status,
                   amount_cents, currency, updated_at)
                 VALUES (:id, :provider, :paymentId, 'failed',
                   :amountCents, :currency, :now)
                 ON CONFLICT (provider, external_id) DO UPDATE SET
                   status = excluded.status,
                   updated_at = excluded.updated_at`,
              )
              .run(upsert);
            break;
          }
          case "refund.created": {
            const payment = this.db
              .prepare(
                `SELECT status, amount_cents, currency, refunded_cents
                 FROM payments WHERE provider = ? AND external_id = ?`,
              )
              .get(provider, paymentId);
            if (!payment || payment.status === "failed") {
              throw new Error(`no refundable payment ${paymentId}`);
            }
            if (payment.currency !== currency) {
              throw new Error(
                `refund in ${currency}, paid in ${payment.currency}`,
              );
            }
            const refunded = Number(payment.refunded_cents) + amountCents;
            const status: PaymentStatus =
              refunded >= Number(payment.amount_cents)
                ? "refunded"
                : "partially_refunded";
            this.db
              .prepare(
                `UPDATE payments
                 SET refunded_cents = ?, status = ?, updated_at = ?
                 WHERE provider = ? AND external_id = ?`,
              )
              .run(refunded, status, now, provider, paymentId);
            break;
          }
        }

        const payment = toPayment(
          this.db
            .prepare(
              "SELECT * FROM payments WHERE provider = ? AND external_id = ?",
            )
            .get(provider, paymentId) as Row,
        );
        this.outbox.enqueue(`payments.${payment.status}`, payment);

        this.db
          .prepare(
            "UPDATE events SET status = 'processed', processed_at = ? WHERE id = ?",
          )
          .run(now, eventId);
        return "processed";
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.db
        .prepare(
          "UPDATE events SET status = 'failed', error = ? WHERE id = ? AND status = 'received'",
        )
        .run(message, eventId);
      throw error;
    }
  }

  /** Newest first, optionally filtered by status. */
  list(filter: { status?: EventStatus | undefined; limit: number }) {
    const rows = this.db
      .prepare(
        `SELECT * FROM events
         WHERE (:status IS NULL OR status = :status)
         ORDER BY received_at DESC, rowid DESC
         LIMIT :limit`,
      )
      .all({ status: filter.status ?? null, limit: filter.limit });

    return rows.map(
      (row): StoredEvent => ({
        id: row.id as string,
        provider: row.provider as string,
        externalId: row.external_id as string,
        type: row.type as EventType,
        payload: JSON.parse(row.payload as string),
        status: row.status as EventStatus,
        error: row.error as string | null,
        receivedAt: row.received_at as string,
        processedAt: row.processed_at as string | null,
      }),
    );
  }

  get(id: string): StoredEvent {
    const row = this.db.prepare("SELECT * FROM events WHERE id = ?").get(id);
    if (!row) throw notFound("event");
    return {
      id: row.id as string,
      provider: row.provider as string,
      externalId: row.external_id as string,
      type: row.type as EventType,
      payload: JSON.parse(row.payload as string),
      status: row.status as EventStatus,
      error: row.error as string | null,
      receivedAt: row.received_at as string,
      processedAt: row.processed_at as string | null,
    };
  }

  payment(id: string): Payment {
    const row = this.db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    if (!row) throw notFound("payment");
    return toPayment(row);
  }
}
