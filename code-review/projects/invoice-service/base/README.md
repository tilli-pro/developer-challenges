# invoice-service

A small HTTP service the billing team uses to draft, issue and collect
invoices. An invoice belongs to a customer, has one or more line items, and
moves through a simple lifecycle:

```
draft ──issue──▶ issued ──pay──▶ paid
  │                │
  └──void──▶ void ◀┘
```

Lines can only be added or removed while an invoice is a draft. Paying an
invoice charges the customer through a payment provider (an in-process fake in
this repository).

## Running it

Requires Node 22.13 or later and pnpm.

```sh
pnpm install
pnpm dev          # watch mode on http://127.0.0.1:3000
pnpm start        # without watch
pnpm test         # node:test via tsx
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome
```

| Variable           | Default            | Purpose                             |
| ------------------ | ------------------ | ----------------------------------- |
| `PORT`             | `3000`             | HTTP port                           |
| `HOST`             | `127.0.0.1`        | Bind address                        |
| `DB_PATH`          | `:memory:`         | SQLite file; in-memory when unset   |
| `API_KEY_ADMIN`    | `admin-dev-key`    | Key with read and write access      |
| `API_KEY_READONLY` | `readonly-dev-key` | Key that may only make GET requests |

## API

Every route except `/health` needs an `x-api-key` header. Amounts are integer
cents and tax rates are basis points (`2000` = 20%). Timestamps are ISO 8601
strings in UTC.

| Method | Path                          | Body                                                    | Result                     |
| ------ | ----------------------------- | ------------------------------------------------------- | -------------------------- |
| GET    | `/health`                     |                                                         | `{ ok: true }`             |
| POST   | `/invoices`                   | `{ customerId, currency, dueAt?, lines }`               | 201, the new draft invoice |
| GET    | `/invoices`                   | query: `customerId`, `status`, `limit`, `cursor`        | `{ items, nextCursor }`    |
| GET    | `/invoices/:id`               |                                                         | the invoice                |
| POST   | `/invoices/:id/lines`         | `{ description, quantity, unitPriceCents, taxRateBps }` | the invoice (draft only)   |
| DELETE | `/invoices/:id/lines/:lineId` |                                                         | the invoice (draft only)   |
| POST   | `/invoices/:id/issue`         |                                                         | the invoice, now `issued`  |
| POST   | `/invoices/:id/pay`           | `{ method: "card" \| "bank" }`                          | the invoice, now `paid`    |
| POST   | `/invoices/:id/void`          |                                                         | the invoice, now `void`    |

`currency` is one of `USD`, `EUR`, `GBP`. Issuing sets `issuedAt` and, if the
invoice has no `dueAt` yet, a due date 30 days later. The list is newest first;
pass `nextCursor` back as `cursor` to fetch the next page (`limit` defaults to
20, maximum 100).

An invoice looks like this:

```json
{
  "id": "5f0c…",
  "number": "INV-000001",
  "customerId": "cus_acme",
  "status": "draft",
  "currency": "USD",
  "issuedAt": null,
  "dueAt": null,
  "paidAt": null,
  "lines": [
    {
      "id": "9b1e…",
      "description": "Consulting, January",
      "quantity": 10,
      "unitPriceCents": 15000,
      "taxRateBps": 2000
    }
  ],
  "subtotalCents": 150000,
  "taxCents": 30000,
  "totalCents": 180000,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

### Try it

```sh
curl -s localhost:3000/invoices \
  -H 'x-api-key: admin-dev-key' -H 'content-type: application/json' \
  -d '{"customerId":"cus_acme","currency":"USD","lines":[{"description":"Consulting","quantity":10,"unitPriceCents":15000,"taxRateBps":2000}]}'

curl -s -X POST localhost:3000/invoices/<id>/issue -H 'x-api-key: admin-dev-key'

curl -s -X POST localhost:3000/invoices/<id>/pay \
  -H 'x-api-key: admin-dev-key' -H 'content-type: application/json' \
  -d '{"method":"bank"}'

curl -s 'localhost:3000/invoices?customerId=cus_acme&limit=10' \
  -H 'x-api-key: readonly-dev-key'
```

## Design notes

- `src/app.ts` builds the Fastify instance without listening, so tests drive it
  with `app.inject`; `src/server.ts` is the only entry point with side effects.
- Requests flow through three layers: `routes/` (HTTP, validation via the JSON
  schemas in `schemas.ts`), `services/` (business rules, totals, payments) and
  `repositories/` (SQL against `node:sqlite` using prepared statements).
- Totals are never stored. `services/totals.ts` derives them from the lines
  every time an invoice is read, rounding tax per line.
- `db.ts` applies the `MIGRATIONS` list in order and records progress in
  `schema_version`; new migrations are appended, never edited.
- External systems sit behind interfaces with in-process fakes
  (`PaymentProvider`), and the clock is injected, so tests are deterministic.
