import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { FastifyBaseLogger } from "fastify";
import type { DrainResult } from "../schemas";

export type Clock = () => Date;

/** Where outbox messages go: a message bus in production. */
export type Publisher = {
  publish(topic: string, payload: unknown): Promise<void>;
};

export type PublishedMessage = { topic: string; payload: unknown };

/** In-process publisher that records every message it is given. */
export class FakePublisher implements Publisher {
  readonly published: PublishedMessage[] = [];

  constructor(
    private readonly onPublish?: (message: PublishedMessage) => void,
  ) {}

  async publish(topic: string, payload: unknown): Promise<void> {
    const message = { topic, payload };
    this.published.push(message);
    this.onPublish?.(message);
  }
}

type Row = Record<string, unknown>;

/**
 * Transactional outbox: messages are written in the same transaction as the
 * state change they describe, and `drain` delivers them afterwards, at least
 * once, in the order they were written.
 */
export class Outbox {
  private inflight: Promise<DrainResult> | null = null;

  constructor(
    private readonly db: DatabaseSync,
    private readonly clock: Clock,
    private readonly log?: FastifyBaseLogger,
  ) {}

  private now(): string {
    return this.clock().toISOString();
  }

  /** Queues a message. Call it inside the transaction that produced it. */
  enqueue(topic: string, payload: unknown): void {
    const now = this.now();
    this.db
      .prepare(
        `INSERT INTO outbox (id, topic, payload, next_attempt_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(randomUUID(), topic, JSON.stringify(payload), now, now);
  }

  /**
   * Publishes up to `limit` due messages. Only one drain runs at a time: a
   * call made while another is in progress joins it and gets its result.
   */
  drain(publisher: Publisher, limit = 50): Promise<DrainResult> {
    this.inflight ??= this.deliver(publisher, limit).finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  /** Resolves once any drain in progress has finished. */
  async idle(): Promise<void> {
    await this.inflight?.catch(() => undefined);
  }

  private async deliver(
    publisher: Publisher,
    limit: number,
  ): Promise<DrainResult> {
    const rows = this.db
      .prepare(
        `SELECT id, topic, payload FROM outbox
         WHERE delivered_at IS NULL AND next_attempt_at <= ?
         ORDER BY created_at, rowid
         LIMIT ?`,
      )
      .all(this.now(), limit) as Row[];

    const result: DrainResult = { delivered: 0, failed: 0 };
    for (const row of rows) {
      const id = row.id as string;
      try {
        await publisher.publish(
          row.topic as string,
          JSON.parse(row.payload as string),
        );
      } catch (error) {
        this.db
          .prepare(
            `UPDATE outbox SET attempts = attempts + 1, next_attempt_at = ?
             WHERE id = ?`,
          )
          .run(this.now(), id);
        this.log?.warn(
          { err: error, id, topic: row.topic },
          "outbox delivery failed",
        );
        result.failed++;
        continue;
      }
      this.db
        .prepare("UPDATE outbox SET delivered_at = ? WHERE id = ?")
        .run(this.now(), id);
      result.delivered++;
    }
    return result;
  }
}
