import { DatabaseSync } from "node:sqlite";

/**
 * Ordered schema migrations. Append new statements to the end; never edit or
 * reorder one that has shipped. `schema_version` records how many have run.
 */
export const MIGRATIONS: string[] = [
  `CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    currency TEXT NOT NULL,
    issued_at TEXT,
    due_at TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices (id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    tax_rate_bps INTEGER NOT NULL,
    position INTEGER NOT NULL
  )`,
  "CREATE INDEX invoice_lines_invoice_id ON invoice_lines (invoice_id, position)",
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
