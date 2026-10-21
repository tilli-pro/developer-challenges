# Code-review challenges: design

Date: 2026-10-21
Status: draft for review

## Purpose

A second class of interview challenge alongside `simple-js`. Instead of writing
code, the candidate reviews it. Each challenge is a small, realistic Node.js
service plus a pool of feature pull requests against it. An interview spends
about 45 minutes walking through the base service and about 45 minutes
reviewing one feature PR.

Success looks like: an interviewer runs one command, gets a git repository
with a `main` branch and a feature branch, opens it in an IDE or pushes it to
GitHub, and has a private answer key that says what the PR gets wrong, what it
gets right, and what to ask next.

## Non-goals

- No React or front-end projects in this round. All projects are Node.js.
- No live third-party services. Anything external (payment providers, email,
  upstream APIs) is mocked inside the project.
- No automated scoring of the candidate. The answer key supports a human
  interviewer.
- No pnpm workspace. Each project installs independently.

## Layout

```
code-review/
  package.json              CLI dependencies only (commander, tsx, biome, typescript)
  pnpm-lock.yaml
  index.ts                  the `cr` CLI
  types.ts                  ProjectMeta, FeatureMeta, Tags
  utils.ts                  pick/shuffle, fs helpers
  README.md                 interviewer guide: setup, 45/45 script, rubric
  .gitignore                .work/, node_modules/, REVIEW.md
  projects/
    <slug>/
      project.json          see "Project metadata"
      base/                 the service; its own package.json and pnpm-lock.yaml
      features/
        <feature-slug>/
          feature.json      see "Feature metadata"
          changes.patch     unified diff from base, produced by `cr regen`
          REVIEW.md         answer key, gitignored
```

`REVIEW.md` is listed in `code-review/.gitignore`, the same way `SOLUTION.md` is in `simple-js/.gitignore`, so
the public repository never contains answer keys.

### Project metadata (`project.json`)

```json
{
  "name": "invoice-service",
  "description": "Invoices, line items, tax and status transitions for a billing team.",
  "tags": { "domain": "billing", "minutes": 45, "topics": ["http", "sqlite", "money"] },
  "walkthrough": [
    "Start at src/app.ts and follow one request through routes, service, repository.",
    "Ask how status transitions are enforced and where that would break.",
    "Point out the money type and ask what they think of integer cents."
  ]
}
```

### Feature metadata (`feature.json`)

```json
{
  "name": "discounts",
  "title": "Add percentage and fixed discounts to invoices",
  "body": "Adds a discount field to invoices...\n\nCloses #42",
  "tags": {
    "difficulty": "medium",
    "focus": ["correctness", "security", "api-design"],
    "minutes": 45
  }
}
```

`difficulty` is one of easy, medium, hard. `focus` names the taxonomy areas
the planted issues emphasise, so an interviewer can pick a PR that matches the
role.

## The `cr` CLI

Run as `pnpm cr <command>` from `code-review/`. Mirrors the `sj` CLI in shape.

- `list [filters]`: table of projects and their features with tags.
  Filters: `--difficulty`, `--focus`, `--domain`, `--max-minutes`.
- `random [filters]`: pick a random project and feature matching the filters,
  then run `prepare` on it.
- `prepare <project> [feature] [--out DIR] [--no-install] [--force]`:
  1. Copy `projects/<project>/base/` to `.work/<project>[-<feature>]/`,
     excluding `node_modules`. Refuse if the target exists unless `--force`.
  2. `git init`, commit everything as `Initial codebase` on `main`.
  3. If a feature was given: create `feature/<feature>`, `git apply
     --index changes.patch`, commit with the PR title as subject and the PR
     body as the message.
  4. `pnpm install` in the work dir unless `--no-install`.
  5. Print the path, the branch names, `git diff --stat main..feature/<x>`,
     and a reminder of where REVIEW.md lives.
- `regen <project> <feature> [--from DIR]`: from a work dir, write
  `git diff main..HEAD` to `changes.patch`. The default `--from` is the
  `.work` path `prepare` would have used. This is the authoring loop: prepare,
  edit on the feature branch, commit, regen.
- `check [project] [feature]`: for each selected feature, prepare into a temp
  directory, confirm the patch applies cleanly, run `pnpm typecheck` and
  `pnpm test` on `main` and on the feature branch, and report a pass/fail
  table. Exit code 1 on any failure. This guards against base drift.

Git operations use `execFile("git", ...)`, never shell strings. The CLI has
no dependency on any project's packages.

## Base project profile

Every base service follows the same conventions so the walkthrough transfers
between projects.

- TypeScript, ESM, Node 22. `tsx` to run, `tsc --noEmit` to typecheck, same
  strict tsconfig as `simple-js` (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`).
- Fastify for HTTP. Worker-style projects still expose a small admin API.
- `node:sqlite` for persistence, in-memory by default, with a `DB_PATH`
  environment variable for a file. `NODE_OPTIONS=--no-warnings=ExperimentalWarning`
  in the npm scripts to silence the experimental banner.
- `node:test` for tests, run with `tsx --test`. Between 4 and 8 test files or
  cases, enough to show the style and leave gaps.
- biome with the same config as `simple-js`.
- At most 20 files including config and tests, and roughly 600 to 1000 lines
  of source. A walkthrough must be able to cover every file.
- Standard shape:

```
base/
  package.json  pnpm-lock.yaml  tsconfig.json  biome.jsonc  README.md
  src/
    app.ts            builds the Fastify instance, registers plugins and routes
    server.ts         listens; the only file with side effects on import
    db.ts             opens sqlite, runs migrations from src/migrations.ts
    migrations.ts     ordered SQL statements
    schemas.ts        request and response schemas (JSON schema or zod)
    routes/*.ts       one file per resource
    services/*.ts     business rules
    repositories/*.ts SQL
    lib/*.ts          money, ids, clock, errors
  test/*.test.ts
  scripts/seed.ts     populates sample data
```

- Each base has two or three deliberate rough edges (an inconsistent error
  shape, a service that reaches into SQL directly, a missing index) that are
  not bugs but give the walkthrough something to discuss. `project.json`
  `walkthrough` lists them.
- Every external system is an in-process fake behind an interface
  (`PaymentProvider`, `Mailer`, `Clock`), so tests are deterministic and the
  service runs with no network.

## Feature PR profile

Each project has exactly four features. A feature is a realistic ticket a
mid-level engineer might ship in a day.

- Diff size: 3 to 6 files changed, 150 to 300 lines added or removed. This is
  what a careful reviewer reads in 45 minutes.
- The PR body reads like a real one: motivation, what changed, how it was
  tested, open questions. Open questions may hint at or distract from issues.
- Existing tests still pass on the feature branch. The PR usually adds tests,
  and at least one of them is weak or asserts the buggy behaviour.
- `pnpm typecheck` passes on the feature branch. Type-level smells are allowed
  (`as`, `!`, `any` via an untyped library) but must compile.
- 5 to 8 planted issues per PR, with at least one blocker, spread across at
  least four taxonomy areas. No PR plants the same issue twice, and a
  project's four features do not repeat a planted issue.
- 2 or 3 genuinely good decisions per PR, named in the answer key.

### Planted-issue taxonomy

| Area | Examples |
|---|---|
| correctness | off-by-one, rounding, wrong state transition, timezone |
| security | missing authz, injection, secrets in logs, timing comparison |
| concurrency | non-idempotent retry, lost update, race on reservation |
| performance | N+1, unbounded query, sync I/O in request path |
| api-design | breaking response change, inconsistent errors, leaking internals |
| error-handling | swallowed error, wrong status code, partial failure left dirty |
| tests | asserts the bug, mocks the thing under test, no negative case |
| data | migration not backward compatible, nullable without default |
| style | naming, dead code, duplicated logic, misleading comment |

### REVIEW.md format

```markdown
# <project> / <feature>: review key

One paragraph on what the PR does and the one-line verdict a strong reviewer
reaches (for example "request changes: blocker in rounding, otherwise close").

## Planted issues

| # | Severity | Area | Location | What | Why it matters | Strong candidate says |
|---|---|---|---|---|---|---|
| 1 | blocker | correctness | src/services/invoice.ts:88 | ... | ... | ... |

## Good decisions

- ...

## Discussion prompts

1. ...
2. ...
3. ...

## Scoring notes

Which issues a junior, mid and senior candidate typically find, and what
separates them.
```

Severity: blocker (must not merge), major (should fix before merge), minor
(fix soon), nit (optional).

## Projects and feature pools

Ten services, loosely the backend of a payments company. Features are listed
with their main focus areas.

1. **invoice-service**: invoices, line items, tax, status transitions.
   - discounts (correctness, data, tests)
   - csv-export (performance, security, api-design)
   - payment-reminders (concurrency, error-handling)
   - soft-delete (api-design, data, correctness)
2. **payment-webhooks**: PSP webhook intake, signature verification,
   idempotency, outbox.
   - second-provider (security, correctness)
   - replay-endpoint (security, concurrency)
   - dead-letter-queue (error-handling, data)
   - event-filtering (performance, api-design)
3. **ledger-service**: double-entry accounts, postings, balances.
   - multi-currency (correctness, data)
   - balance-snapshots (concurrency, performance)
   - reversal-postings (correctness, api-design)
   - statement-export (performance, security)
4. **auth-service**: password hashing, sessions, refresh tokens, API keys.
   - password-reset (security, error-handling)
   - api-key-scopes (security, api-design)
   - session-limits (concurrency, correctness)
   - login-rate-limit (security, performance)
5. **feature-flags**: flags, targeting rules, percentage rollouts, SDK
   endpoint with caching.
   - scheduled-rollouts (correctness, concurrency)
   - rule-dependencies (correctness, performance)
   - audit-trail (data, api-design)
   - sdk-cache-headers (performance, api-design)
6. **notification-dispatcher**: templates, channels, retry queue, worker
   loop plus admin API.
   - sms-channel (error-handling, security)
   - batch-send (performance, concurrency)
   - template-versioning (data, api-design)
   - quiet-hours (correctness, tests)
7. **inventory-service**: SKUs, reservations with expiry, stock adjustments.
   - reservation-extension (concurrency, correctness)
   - low-stock-alerts (performance, error-handling)
   - bulk-adjustments (data, api-design)
   - warehouse-transfers (correctness, concurrency)
8. **scheduler-service**: recurring jobs, leases, worker polling, run history.
   - job-priorities (correctness, performance)
   - retry-backoff (concurrency, error-handling)
   - run-history-pruning (data, performance)
   - pause-resume (api-design, correctness)
9. **audit-log-service**: append-only events, filtering, retention, streamed
   NDJSON export.
   - retention-policies (data, correctness)
   - actor-search (performance, security)
   - export-signing (security, correctness)
   - event-redaction (security, api-design)
10. **subscription-billing**: plans, subscriptions, proration, dunning state.
    - plan-upgrades (correctness, api-design)
    - trial-periods (correctness, tests)
    - dunning-retries (concurrency, error-handling)
    - usage-based-addons (data, performance)

Feature titles and plantings are finalised per project during delivery; the
pairs above fix the scope and focus so the pool stays balanced.

## Interviewer guide (`code-review/README.md`)

- Setup: Node 22, pnpm, `pnpm install` in `code-review/`, `pnpm cr prepare`.
- The 45/45 script: 10 minutes for the candidate to read the README and run
  the tests, 35 minutes of guided walkthrough using `project.json`
  `walkthrough`, a short break, then 45 minutes of PR review with the
  candidate driving. Suggested prompts for a stuck candidate.
- Rubric: four dimensions scored 1 to 4: finds issues (coverage of the
  answer key weighted by severity), prioritises (leads with blockers),
  communicates (specific, actionable, kind), and judgement (recognises good
  decisions, asks the right open questions).
- Pushing to GitHub for a real PR page: `git remote add` plus `git push
  --all`, then open a PR from the feature branch. Remind the interviewer to
  use a private repository.

## Authoring workflow

1. Build the base in `projects/<slug>/base/` until `pnpm typecheck`,
   `pnpm test` and `pnpm biome check` pass and the file count is 20 or fewer.
2. `pnpm cr prepare <slug>` with no feature, then on a feature branch
   implement the feature with its planted issues, commit, and `pnpm cr regen`.
3. Write `feature.json` and `REVIEW.md`.
4. `pnpm cr check <slug>` must pass for all four features before the project
   is considered done.

Base changes after features exist require re-running `check`, and fixing any
patch that no longer applies by preparing, rebasing the feature branch, and
regenerating.

## Delivery phases

1. **Tooling and two projects.** The CLI, the README skeleton, the gitignore
   entry, and `invoice-service` plus `payment-webhooks` with all eight
   features and answer keys. Review the pattern before continuing.
2. **Four more projects.** `ledger-service`, `auth-service`,
   `feature-flags`, `notification-dispatcher`.
3. **Final four and the guide.** `inventory-service`, `scheduler-service`,
   `audit-log-service`, `subscription-billing`, plus the full interviewer
   README with the rubric.

Each phase ends with `pnpm cr check` passing for everything built so far.

## Open decisions already made

- Patches over full copies or branches: compact, regenerable, and handles
  renames and deletes through `git apply`.
- Planted issues with an answer key rather than open-ended review, so
  interviews are comparable across interviewers.
- `node:sqlite` over `better-sqlite3` to avoid native builds on candidate
  machines; the experimental warning is suppressed in scripts.
- Fastify over Express for first-class schema validation and typed routes,
  which gives reviews a validation layer to discuss.
