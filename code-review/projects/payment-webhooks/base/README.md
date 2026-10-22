# payment-webhooks

A small HTTP service that receives payment webhooks from our card processor,
Acme, and keeps a local view of each payment. Every webhook is verified,
recorded once, applied to the `payments` table, and announced to the rest of
the company as a `payments.<status>` message through a transactional outbox.

```
Acme ──POST /webhooks/acme──▶ verify signature ──▶ events ──▶ payments
                                                             └──▶ outbox ──drain──▶ publisher
```

A payment moves through `succeeded` or `failed`; refunds move a succeeded
payment to `partially_refunded` and then `refunded` once the refunded total
reaches the paid amount.

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

| Variable              | Default           | Purpose                                 |
| --------------------- | ----------------- | --------------------------------------- |
| `PORT`                | `3000`            | HTTP port                               |
| `HOST`                | `127.0.0.1`       | Bind address                            |
| `DB_PATH`             | `:memory:`        | SQLite file; in-memory when unset       |
| `ACME_WEBHOOK_SECRET` | `acme-dev-secret` | Shared secret Acme signs webhooks with  |
| `ADMIN_KEY`           | `admin-dev-key`   | Value of `x-admin-key` for admin routes |

The server drains the outbox once a second. Locally the publisher is an
in-process fake that logs each message it delivers.

## Webhooks

Acme posts JSON events like this one:

```json
{
  "id": "evt_123",
  "type": "payment.succeeded",
  "created": 1768435200,
  "data": { "paymentId": "pay_123", "amountCents": 12500, "currency": "USD" }
}
```

`type` is one of `payment.succeeded`, `payment.failed` or `refund.created`.
`data.amountCents` is a positive integer number of cents, `data.currency` an
ISO 4217 code, and refunds may carry a free-text `data.reason`. Acme retries a
webhook until it gets a 2xx, so the same `id` can arrive more than once.

### Signing

Each request carries `x-acme-signature: t=<unix seconds>,v1=<hex>`, where
`<hex>` is the HMAC-SHA256 of `<t>.<raw request body>` keyed with
`ACME_WEBHOOK_SECRET`. A request is rejected with 401 if the header is missing
or malformed, if `t` is more than 300 seconds away from the server's clock, or
if the signature does not match.

To send one by hand against a local server:

```sh
BODY='{"id":"evt_123","type":"payment.succeeded","created":1768435200,"data":{"paymentId":"pay_123","amountCents":12500,"currency":"USD"}}'

SIG=$(node -e '
  const t = Math.floor(Date.now() / 1000);
  const hmac = require("node:crypto").createHmac("sha256", process.argv[2]);
  console.log(`t=${t},v1=${hmac.update(`${t}.${process.argv[1]}`).digest("hex")}`);
' "$BODY" acme-dev-secret)

curl -s localhost:3000/webhooks/acme \
  -H 'content-type: application/json' -H "x-acme-signature: $SIG" \
  -d "$BODY"
```

## API

Admin routes need an `x-admin-key` header. Amounts are integer cents and
timestamps are ISO 8601 strings in UTC. Errors look like
`{ "error": { "code", "message" } }`.

| Method | Path                  | Notes                                 | Result                             |
| ------ | --------------------- | ------------------------------------- | ---------------------------------- |
| GET    | `/health`             |                                       | `{ ok: true }`                     |
| POST   | `/webhooks/acme`      | signed raw JSON body, see above       | 202 `{ eventId, status }`          |
|        |                       | an `id` we have already seen          | 200 `{ duplicate: true, eventId }` |
| GET    | `/admin/events`       | query: `status`, `limit` (default 50) | events, newest first               |
| GET    | `/admin/events/:id`   |                                       | the event, with its payload        |
| GET    | `/admin/payments/:id` | our payment id, as in outbox messages | the payment                        |
| POST   | `/admin/outbox/drain` | delivers due messages now             | `{ delivered, failed }`            |

An event's `status` is `received`, `processed` or `failed`; a failed event
keeps the error in `error`. A payment looks like this:

```json
{
  "id": "0b6f…",
  "provider": "acme",
  "externalId": "pay_123",
  "status": "partially_refunded",
  "amountCents": 12500,
  "currency": "USD",
  "refundedCents": 2500,
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

## Design notes

- `src/app.ts` builds the Fastify instance without listening, so tests drive it
  with `app.inject`; `src/server.ts` is the only entry point with side effects
  and owns the outbox timer.
- The webhook scope registers its own JSON content type parser that keeps the
  body as a string, so the signature is checked against the exact bytes Acme
  sent. The route parses and validates the JSON only after that.
- `routes/` handle HTTP, `services/signature.ts` verifies requests,
  `services/events.ts` records and applies events, and `services/outbox.ts`
  stores and delivers outgoing messages. SQL runs against `node:sqlite` with
  prepared statements.
- Idempotency comes from the `UNIQUE (provider, external_id)` constraint on
  `events`: a redelivered event is acknowledged and not applied again.
- A payment change and its outbox message are written in one transaction, so a
  message is never lost or sent for a change that rolled back. Delivery is at
  least once.
- `db.ts` applies the `MIGRATIONS` list in order and records progress in
  `schema_version`; new migrations are appended, never edited.
- The publisher sits behind an interface with an in-process fake, and the clock
  is injected, so tests are deterministic.
