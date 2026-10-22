import { DatabaseSync } from "node:sqlite";

/**
 * Ordered schema migrations. Append new statements to the end; never edit or
 * reorder one that has shipped. `schema_version` records how many have run.
 */
export const MIGRATIONS: string[] = [
  `CREATE TABLE events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL
      CHECK (status IN ('received', 'processed', 'failed')),
    error TEXT,
    received_at TEXT NOT NULL,
    processed_at TEXT,
    UNIQUE (provider, external_id)
  )`,
  "CREATE INDEX events_status_received_at ON events (status, received_at)",
  `CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    status TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    refunded_cents INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  "CREATE UNIQUE INDEX payments_provider_external_id ON payments (provider, external_id)",
  `CREATE TABLE outbox (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TEXT NOT NULL,
    delivered_at TEXT,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX outbox_pending ON outbox (next_attempt_at) WHERE delivered_at IS NULL",
];

export function openDb(
  path: string = process.env.DB_PATH ?? ":memory:",
): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON");
  if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)",
  );
  const row = db
    .prepare("SELECT MAX(version) AS version FROM schema_version")
    .get();
  const current = Number(row?.version ?? 0);

  for (let index = current; index < MIGRATIONS.length; index++) {
    const sql = MIGRATIONS[index] as string;
    transaction(db, () => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(
        index + 1,
      );
    });
  }
}

/** Runs `fn` inside BEGIN/COMMIT, rolling back if it throws. */
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
