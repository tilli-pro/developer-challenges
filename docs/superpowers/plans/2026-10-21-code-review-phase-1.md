# Code-review challenges, phase 1: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `cr` CLI and two complete code-review projects (invoice-service, payment-webhooks), each with four feature PRs and private answer keys.

**Architecture:** `code-review/` is a standalone pnpm package holding a commander CLI and a `projects/` tree. Each project is a self-contained Fastify + node:sqlite service under `base/`; each feature is a `changes.patch` produced from a git work dir plus metadata and a gitignored `REVIEW.md`. The CLI copies a base into `.work/`, builds a git repo with `main` and `feature/<x>`, and can regenerate patches and check that every patch still applies and passes typecheck and tests.

**Tech Stack:** Node 22, TypeScript (strict, ESM), tsx, commander, biome, node:test, Fastify 5, node:sqlite, pnpm (no workspace).

**Spec:** `docs/superpowers/specs/2026-10-21-code-review-challenges-design.md`

## Global Constraints

- Node 22, TypeScript ESM, tsconfig copied from `simple-js/tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`).
- biome config copied from `simple-js/biome.jsonc`.
- No pnpm workspace file anywhere in the repository. Each base and the CLI install independently.
- A base has at most 20 files (config, source, tests, scripts; `node_modules` and lockfile-generated dirs excluded, `pnpm-lock.yaml` included) and 600 to 1000 lines of source.
- A feature diff touches 3 to 6 files and changes 150 to 300 lines, plants 5 to 8 issues across at least four taxonomy areas with at least one blocker, names 2 or 3 good decisions, and leaves `pnpm typecheck` and `pnpm test` passing on the feature branch.
- Every base npm script that runs node sets `NODE_OPTIONS=--no-warnings=ExperimentalWarning`.
- Git is invoked only through `execFile("git", [...])`, never a shell string. Commits made by the CLI use `-c user.name="Code Review" -c user.email="code-review@localhost"`.
- `REVIEW.md`, `.work/`, `node_modules/` are gitignored under `code-review/`.
- Commit after every task with the attribution trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. `prepare` run twice for the same project and feature: the second run must refuse with a clear message unless `--force`, never merge into a stale work dir. Test pinned in Task 3.
2. A patch that no longer applies to a drifted base: `prepare` must fail with git's message and leave no half-applied work dir, and `check` must report it as a failure rather than crash. Test pinned in Task 5.
3. A `regen` run from a work dir whose feature branch has no commits beyond `main`: must refuse rather than write an empty patch. Test pinned in Task 4.
4. A machine without git user config: commits inside `.work` must still succeed because of the `-c` overrides. Test pinned in Task 3 by clearing `GIT_AUTHOR_NAME`/`GIT_COMMITTER_NAME` and `HOME` git config in the test environment.
5. Project folders missing `project.json` or features missing `changes.patch`: `list` must warn and skip, not abort. Test pinned in Task 2.

---

### Task 1: Scaffold `code-review/`

**Files:**
- Create: `code-review/package.json`, `code-review/tsconfig.json`, `code-review/biome.jsonc`, `code-review/.gitignore`, `code-review/types.ts`, `code-review/utils.ts`, `code-review/README.md`, `code-review/index.ts` (placeholder that prints help), `code-review/projects/.gitkeep`

**Interfaces:**
- Produces `types.ts`:

```ts
export type Difficulty = "easy" | "medium" | "hard";
export type ProjectMeta = {
  name: string;
  description: string;
  tags: { domain: string; minutes: number; topics: string[] };
  walkthrough: string[];
};
export type FeatureMeta = {
  name: string;
  title: string;
  body: string;
  tags: { difficulty: Difficulty; focus: string[]; minutes: number };
};
export type Feature = { slug: string; dir: string; patchPath: string; meta: FeatureMeta };
export type Project = { slug: string; dir: string; baseDir: string; meta: ProjectMeta; features: Feature[] };
```

- Produces `utils.ts`: `pick`, `shuffle` copied from `simple-js/utils.ts`, plus `copyDir(src: string, dest: string): Promise<void>` using `fs.cp` recursive with a filter that skips any path segment named `node_modules`.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "code-review-challenges",
  "private": true,
  "type": "module",
  "scripts": {
    "cr": "tsx .",
    "typecheck": "tsc --noEmit",
    "test": "tsx --test test/*.test.ts"
  }
}
```

Then from `code-review/`: `pnpm add commander tsx typescript @biomejs/biome @types/node`.

- [ ] **Step 2: Copy tsconfig.json and biome.jsonc from `simple-js/`; write `.gitignore`**

```
node_modules
.work
REVIEW.md
```

- [ ] **Step 3: Write types.ts, utils.ts, a placeholder index.ts, and README.md**

`index.ts` for now: `new Command().name("cr").description("Code-review challenge runner").parse()`.

`README.md` contains the title, a two-paragraph description of the challenge class (from the spec's Purpose), setup (`pnpm install`, `pnpm cr list`), and the headings "Interview script" and "Rubric" each with a one-line "to be written in phase 3" note.

- [ ] **Step 4: Verify**

Run from `code-review/`: `pnpm typecheck && pnpm biome check . && pnpm cr --help`
Expected: no errors, help text shows `cr`.

- [ ] **Step 5: Commit**

```bash
git add code-review
git commit -m "feat(code-review): scaffold cr package"
```

---

### Task 2: Project discovery and `list`

**Files:**
- Create: `code-review/lib/projects.ts`, `code-review/test/projects.test.ts`, `code-review/test/fixtures/projects/demo/project.json`, `code-review/test/fixtures/projects/demo/base/package.json`, `code-review/test/fixtures/projects/demo/base/src/index.ts`, `code-review/test/fixtures/projects/demo/features/hello/feature.json`, `code-review/test/fixtures/projects/broken/base/.gitkeep` (no project.json)
- Modify: `code-review/index.ts`

**Interfaces:**
- Produces `lib/projects.ts`:
  - `loadProjects(projectsDir: string): Promise<{ projects: Project[]; warnings: string[] }>`. A project needs `project.json` and `base/`; a feature needs `feature.json` and `changes.patch`. Missing either adds a warning string and skips the entry. Projects and features sorted by slug.
  - `findProject(projects: Project[], slug: string): Project` throws `Error("Unknown project: <slug>")`.
  - `findFeature(project: Project, slug: string): Feature` throws `Error("Unknown feature: <project>/<slug>")`.
  - `type Filters = { difficulty?: Difficulty; focus?: string[]; domain?: string; maxMinutes?: number }` and `matchesFilters(project: Project, feature: Feature, filters: Filters): boolean`, same semantics as `matchesFilters` in `simple-js/index.ts` (any focus matches; minutes is the feature's).

The fixture `demo/base/package.json`:

```json
{ "name": "demo", "private": true, "type": "module",
  "scripts": { "typecheck": "node -e \"process.exit(0)\"", "test": "node -e \"process.exit(0)\"" } }
```

The fixture `demo/features/hello/` has `feature.json` but deliberately no `changes.patch` committed; Task 3's test generates one into a temp copy.

- [ ] **Step 1: Write failing tests** in `test/projects.test.ts`

```ts
test("loadProjects skips a project without project.json and a feature without a patch", async () => {
  const { projects, warnings } = await loadProjects(fixturesDir);
  assert.deepEqual(projects.map((p) => p.slug), ["demo"]);
  assert.equal(projects[0]?.features.length, 0);
  assert.ok(warnings.some((w) => w.includes("broken")));
  assert.ok(warnings.some((w) => w.includes("hello")));
});
test("findProject and findFeature throw on unknown slugs", ...);
test("matchesFilters uses any-of for focus and feature minutes for maxMinutes", ...);
```

- [ ] **Step 2: Run** `pnpm test` → FAIL (module not found).

- [ ] **Step 3: Implement `lib/projects.ts`** per the interface.

- [ ] **Step 4: Wire `list` in `index.ts`**: `cr list [-d|--difficulty] [-f|--focus a,b] [--domain] [-m|--max-minutes]` prints a table with columns PROJECT, FEATURE, DIFFICULTY, MINUTES, FOCUS, then `<n> features across <m> projects`, then each warning on stderr prefixed `warn:`. Reuse the padEnd table code pattern from `simple-js/index.ts`. `projectsDir` is `join(import.meta.dirname, "projects")`.

- [ ] **Step 5: Run** `pnpm test && pnpm typecheck && pnpm cr list` → tests PASS; `list` prints the header and `0 features across 0 projects`.

- [ ] **Step 6: Commit** `feat(code-review): project discovery and list command`

---

### Task 3: `prepare`

**Files:**
- Create: `code-review/lib/git.ts`, `code-review/lib/prepare.ts`, `code-review/test/prepare.test.ts`, `code-review/test/helpers.ts`
- Modify: `code-review/index.ts`

**Interfaces:**
- `lib/git.ts`: `git(args: string[], cwd: string): Promise<string>` resolving trimmed stdout, rejecting with an Error whose message is git's stderr. `commitAll(cwd: string, subject: string, body?: string): Promise<void>` runs `git add -A` then `git -c user.name=... -c user.email=... commit -q -m <subject> [-m <body>]`.
- `lib/prepare.ts`:

```ts
export type PrepareOptions = { project: Project; feature?: Feature; outDir: string; install: boolean; force: boolean };
export type PrepareResult = { dir: string; featureBranch?: string; diffStat?: string };
export const workDirFor = (root: string, project: Project, feature?: Feature) =>
  join(root, ".work", feature ? `${project.slug}-${feature.slug}` : project.slug);
export const prepare = (options: PrepareOptions): Promise<PrepareResult>;
```

`prepare`: if `outDir` exists and not `force` → throw `Error("<dir> already exists. Pass --force to replace it.")`; if `force`, `rm -rf` it first. `copyDir(base, outDir)`, `git init -q -b main`, `commitAll(dir, "Initial codebase")`. With a feature: `git checkout -q -b feature/<slug>`, `git apply --index <patchPath>`; on apply failure, remove `outDir` and rethrow. Then `commitAll(dir, meta.title, meta.body)` and `diffStat = git(["diff", "--stat", "main..feature/<slug>"])`. If `install`: `execFile("pnpm", ["install"], { cwd })`.

- `test/helpers.ts`: `withTempFixtures(fn: (dir: string) => Promise<void>)` copies `test/fixtures/projects` into `fs.mkdtemp` and cleans up; `gitEnv` = `{ ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" }` applied to every git call in tests via an exported `setGitEnvForTests()` that `lib/git.ts` honours through a module-level `env` override.

- [ ] **Step 1: Write failing tests** in `test/prepare.test.ts` (all use `install: false`)

```ts
test("prepare creates main with one commit from base", ...)   // git log --oneline has 1 line, src/index.ts exists
test("prepare refuses an existing work dir without force", ...) // rejects with /already exists/
test("prepare with a feature applies the patch on feature/<slug>", async () => {
  // arrange: write a patch by hand into the temp fixture: a unified diff adding a line to src/index.ts
  // produced with git in the test (init temp, commit, edit, git diff) so the format is exact
  // assert: current branch feature/hello, 2 commits, diffStat contains "src/index.ts"
});
test("prepare removes the work dir when the patch does not apply", ...) // patch targets a missing file; dir absent afterwards
test("prepare commits without global git identity", ...)      // runs under gitEnv, succeeds
```

- [ ] **Step 2: Run** `pnpm test` → FAIL.

- [ ] **Step 3: Implement `lib/git.ts` and `lib/prepare.ts`** per the interfaces.

- [ ] **Step 4: Wire `prepare <project> [feature]` in `index.ts`** with `-o, --out <dir>`, `--no-install`, `--force`. On success print: the dir, `main` and the feature branch, the diff stat, and `Answer key: <feature dir>/REVIEW.md` when a feature was given.

- [ ] **Step 5: Run** `pnpm test && pnpm typecheck` → PASS.

- [ ] **Step 6: Commit** `feat(code-review): prepare command`

---

### Task 4: `regen`

**Files:**
- Create: `code-review/lib/regen.ts`, `code-review/test/regen.test.ts`
- Modify: `code-review/index.ts`

**Interfaces:**
- `regen(options: { feature: Feature; fromDir: string }): Promise<{ patchPath: string; filesChanged: number }>`. Runs `git diff --binary main..HEAD` in `fromDir`; if the output is empty throw `Error("No changes between main and HEAD in <dir>")`; else write it to `feature.patchPath` and return the count of `diff --git` headers.

- [ ] **Step 1: Write failing tests**

```ts
test("regen writes main..HEAD as changes.patch", ...)   // prepare base, branch, edit, commitAll, regen → file contains "diff --git a/src/index.ts"
test("regen refuses when HEAD equals main", ...)        // rejects with /No changes/
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Wire** `regen <project> <feature> [--from <dir>]`, default `--from` = `workDirFor(root, project, feature)`. Print the patch path and files changed. **Step 5: Run tests** → PASS.

- [ ] **Step 6: Commit** `feat(code-review): regen command`

---

### Task 5: `check` and `random`

**Files:**
- Create: `code-review/lib/check.ts`, `code-review/test/check.test.ts`
- Modify: `code-review/index.ts`

**Interfaces:**
- `lib/check.ts`:

```ts
export type CheckRow = { project: string; feature: string; applies: boolean; baseTypecheck: boolean; baseTest: boolean; featureTypecheck: boolean; featureTest: boolean; error?: string };
export const checkFeature = (project: Project, feature: Feature, tmpRoot: string): Promise<CheckRow>;
```

`checkFeature`: `prepare` into `join(tmpRoot, project.slug + "-" + feature.slug)` with `install: true`; if prepare throws, return a row with `applies: false` and `error` set, all other flags false. Otherwise run `pnpm run typecheck` and `pnpm run test` on `main` (checkout), then on the feature branch, each flag true when the exit code is 0. `ok` is derived: every flag true. Always remove the temp dir afterwards.

- [ ] **Step 1: Write failing tests** (fixture scripts exit 0; `install: true` on a dependency-free package is fast)

```ts
test("checkFeature reports all green for a clean patch", ...)
test("checkFeature reports applies=false with an error for a broken patch", ...)
test("checkFeature reports featureTest=false when the patch makes test exit 1", ...) // patch rewrites package.json test script to exit 1
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.**

- [ ] **Step 4: Wire `check [project] [feature]`**: rows printed as a table with ✓/✗ per column and the error message on a following indented line; `process.exitCode = 1` if any row is not ok. Temp root is `fs.mkdtemp(join(os.tmpdir(), "cr-check-"))`.

- [ ] **Step 5: Wire `random [filters]`**: same filters as `list`; pick a random (project, feature) pair with `pick`, print `Running: <project>/<feature>` and call `prepare` with default out dir, `install: true`, `force: false`.

- [ ] **Step 6: Run** `pnpm test && pnpm typecheck && pnpm biome check .` → PASS.

- [ ] **Step 7: Commit** `feat(code-review): check and random commands`

---

### Task 6: invoice-service base

**Files (20):**
- Create under `code-review/projects/invoice-service/`: `project.json`, and under `base/`: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `biome.jsonc`, `README.md`, `src/app.ts`, `src/server.ts`, `src/db.ts`, `src/schemas.ts`, `src/auth.ts`, `src/routes/invoices.ts`, `src/services/invoices.ts`, `src/services/totals.ts`, `src/repositories/invoices.ts`, `src/lib/money.ts`, `src/lib/errors.ts`, `test/helpers.ts`, `test/totals.test.ts`, `test/invoices.test.ts`

**Interfaces (the base API, which every feature builds on):**

Domain, all money as integer cents, tax rates in basis points:

```ts
type InvoiceStatus = "draft" | "issued" | "paid" | "void";
type Line = { id: string; description: string; quantity: number; unitPriceCents: number; taxRateBps: number };
type Invoice = { id: string; number: string; customerId: string; status: InvoiceStatus; currency: "USD" | "EUR" | "GBP";
  issuedAt: string | null; dueAt: string | null; paidAt: string | null; lines: Line[];
  subtotalCents: number; taxCents: number; totalCents: number; createdAt: string; updatedAt: string };
```

Tables: `invoices(id TEXT PK, number TEXT UNIQUE, customer_id TEXT, status TEXT, currency TEXT, issued_at, due_at, paid_at, created_at, updated_at)` and `invoice_lines(id TEXT PK, invoice_id TEXT REFERENCES invoices, description, quantity INTEGER, unit_price_cents INTEGER, tax_rate_bps INTEGER, position INTEGER)`. Deliberately no index on `customer_id` (rough edge).

Routes, all under auth (`x-api-key`; env `API_KEY_ADMIN` default `admin-dev-key`, `API_KEY_READONLY` default `readonly-dev-key`; readonly may only GET):
- `POST /invoices` body `{ customerId, currency, dueAt?, lines: LineInput[] }` → 201 Invoice (draft)
- `GET /invoices/:id` → 200 Invoice | 404
- `GET /invoices?customerId&status&limit=20&cursor` → `{ items: Invoice[]; nextCursor: string | null }`, cursor is the last `created_at|id` pair base64url
- `POST /invoices/:id/lines` body LineInput → 200 Invoice (draft only, else 409)
- `DELETE /invoices/:id/lines/:lineId` → 200 Invoice (draft only)
- `POST /invoices/:id/issue` → 200 (draft → issued; sets issuedAt, dueAt default +30 days)
- `POST /invoices/:id/pay` body `{ method: "card" | "bank" }` → 200 (issued → paid; calls `PaymentProvider.charge`, a fake in `services/invoices.ts` that fails when `method === "card"` and total > 1_000_000)
- `POST /invoices/:id/void` → 200 (draft or issued → void)
- `GET /health` → `{ ok: true }` (no auth)

`services/totals.ts`: `computeTotals(lines: Line[]): { subtotalCents, taxCents, totalCents }`, tax computed per line with `Math.round(lineSubtotal * taxRateBps / 10000)`, exported and unit-tested.

`lib/errors.ts`: `class HttpError extends Error { constructor(public statusCode: number, message: string, public code?: string) }` and an `errorHandler` registered in `app.ts`. Rough edge: routes throw `HttpError` for 404/409 but `auth.ts` replies `{ error: "unauthorized" }` directly, so error shapes differ.

`db.ts`: `openDb(path = process.env.DB_PATH ?? ":memory:")` returns `DatabaseSync` after running the `MIGRATIONS: string[]` array in order, with a `schema_version` table.

`app.ts`: `buildApp(options?: { db?: DatabaseSync; clock?: () => Date }): FastifyInstance`. Tests use `buildApp({ clock: () => new Date("2026-01-15T00:00:00Z") })` and `app.inject`.

`package.json` scripts: `dev` (`tsx watch src/server.ts`), `start`, `typecheck`, `test` (`tsx --test test/*.test.ts`), `lint` (`biome check .`), each with `NODE_OPTIONS=--no-warnings=ExperimentalWarning` where node runs. Dependencies: `fastify`. Dev: `typescript`, `tsx`, `@biomejs/biome`, `@types/node`.

Rough edges to leave in and list in `project.json.walkthrough` (exact three): status transitions are enforced in `routes/invoices.ts`, not the service; two error shapes; no index on `customer_id` with the list route doing `ORDER BY created_at DESC, id DESC`. Fourth: `pay` calls the provider before updating status and has no idempotency key.

Tests: `totals.test.ts` (3 cases: zero lines, mixed tax rates, rounding of 1 cent at 7.5%), `invoices.test.ts` (create → issue → pay flow; draft-only line edit returns 409; readonly key cannot POST; list pagination with limit 2 returns a cursor). Deliberately no test for `void` or for a card payment over the provider limit.

- [ ] **Step 1: Write `project.json`** with name, description from the spec, tags `{ domain: "billing", minutes: 45, topics: ["http", "sqlite", "money", "state-machine"] }`, and the four walkthrough lines above.

- [ ] **Step 2: Create the base** per the interface. `pnpm install` inside `base/` to produce the lockfile. README: what the service does, run and test commands, the API table, and the curl for the default keys.

- [ ] **Step 3: Verify** from `base/`: `pnpm typecheck && pnpm lint && pnpm test` pass; `find . -path ./node_modules -prune -o -type f -print | wc -l` ≤ 20; `wc -l src/**/*.ts` between 600 and 1000.

- [ ] **Step 4: Verify through the CLI** from `code-review/`: `pnpm cr list` shows the project with 0 features; `pnpm cr prepare invoice-service --no-install` creates `.work/invoice-service` on `main`.

- [ ] **Step 5: Commit** `feat(code-review): invoice-service base`

---

### Task 7: invoice-service feature `discounts`

**Files:**
- Create: `code-review/projects/invoice-service/features/discounts/feature.json`, `.../discounts/changes.patch`, `.../discounts/REVIEW.md`

**Feature as the PR describes it:** "Add percentage and fixed discounts to invoices". Adds `discount: { type: "percent" | "fixed"; value: number } | null` to invoices (`discount_type`, `discount_value` columns), `PATCH /invoices/:id/discount` to set or clear it, `discountCents` in the response, totals apply the discount before tax. Touches `db.ts`, `schemas.ts`, `routes/invoices.ts`, `services/totals.ts`, `repositories/invoices.ts`, `test/totals.test.ts`.

**Planted issues (write these into REVIEW.md with file:line after authoring):**

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | correctness | Discount is subtracted from `totalCents` after tax, so tax is charged on the undiscounted amount, contradicting the PR body |
| 2 | blocker | correctness | Percent discount computed as `subtotal * (value / 100)` with `Math.floor`, loses a cent on half values and allows `value: 150` to go negative; no validation of range |
| 3 | major | data | Migration adds `discount_type TEXT NOT NULL` without a default; existing rows and the seed fail on a fresh file DB (works in memory tests because the table is empty) |
| 4 | major | correctness | `PATCH /discount` skips the status check, so a paid invoice's totals change after payment |
| 5 | major | tests | New totals test asserts the after-tax figure produced by issue 1 |
| 6 | minor | api-design | Response field is `discount_cents` while every other field is camelCase |
| 7 | nit | style | Leftover `console.log("discount", ...)` in the service |

**Good decisions:** schema validates `type` with an enum; integer cents kept throughout; the PATCH accepts `null` to clear.

**Discussion prompts:** how to version a money calculation change for already-issued invoices; whether discounts belong on lines instead; what a migration test would look like.

- [ ] **Step 1:** `pnpm cr prepare invoice-service --no-install --force`, then in `.work/invoice-service`: `git checkout -b feature/discounts`, `pnpm install`, implement the feature with the plantings, run `pnpm typecheck && pnpm test` (must pass), commit with the PR title.

- [ ] **Step 2:** Write `feature.json` (`tags: { difficulty: "medium", focus: ["correctness", "data", "tests"], minutes: 45 }`, PR body with Motivation / Changes / Testing / Open questions, where an open question asks "should discounts apply before or after tax? I went with after since that matched the invoice totals test" as the distractor).

- [ ] **Step 3:** `pnpm cr regen invoice-service discounts`. Confirm `git diff --stat` shows 3 to 6 files and 150 to 300 lines.

- [ ] **Step 4:** Write `REVIEW.md` in the spec's format with the table above completed with locations, the good decisions, prompts, and scoring notes.

- [ ] **Step 5:** `pnpm cr check invoice-service discounts` → all green.

- [ ] **Step 6: Commit** `feat(code-review): invoice-service discounts feature` (REVIEW.md is ignored; the commit holds feature.json and changes.patch).

---

### Task 8: invoice-service feature `csv-export`

**Files:** `features/csv-export/{feature.json,changes.patch,REVIEW.md}`

**Feature:** "Export invoices as CSV". `GET /invoices/export.csv?customerId&status` streams one row per invoice: number, customerId, status, currency, issuedAt, dueAt, totalCents, lineCount. Touches `routes/invoices.ts`, `repositories/invoices.ts`, a new `src/lib/csv.ts`, `test/invoices.test.ts`, `README.md`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | security | `customerId` and `status` are interpolated into the SQL string in the new repository method |
| 2 | major | security | The route is registered before the auth hook (outside the `register` scope), so no key is required |
| 3 | major | performance | Loads every matching invoice with lines into an array, then `join("\n")`; nothing streams despite the PR body saying it does |
| 4 | major | correctness | Fields are not quoted; a description or customerId containing a comma or quote corrupts the row |
| 5 | minor | api-design | `content-type: text/plain`, no `content-disposition`, and the header row is omitted when there are no results |
| 6 | minor | error-handling | A repository error after the reply has started results in a 200 with a truncated body |
| 7 | nit | correctness | `issuedAt` formatted with `toLocaleDateString()` so output depends on the server locale |

**Good decisions:** reuses list filters; new `csv.ts` is a pure function with its own test; documents the endpoint in the README.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["security", "performance", "api-design"]`, difficulty `medium`, open question "I kept it simple with a string join, happy to stream if we think exports get big".

---

### Task 9: invoice-service feature `payment-reminders`

**Files:** `features/payment-reminders/{feature.json,changes.patch,REVIEW.md}`

**Feature:** "Send overdue payment reminders". Adds `reminder_sent_at` column, a `Mailer` interface with an in-memory fake in `services/invoices.ts`, `POST /invoices/reminders/run` (admin) that finds issued invoices past `dueAt` with no reminder and emails them, returning `{ scanned, sent, failed }`. Touches `db.ts`, `routes/invoices.ts`, `services/invoices.ts`, `repositories/invoices.ts`, `test/invoices.test.ts`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | concurrency | Select-then-update with no condition on `reminder_sent_at IS NULL` in the UPDATE and no lock, so two overlapping runs send duplicates |
| 2 | blocker | error-handling | Mailer failure is caught per invoice, counted in `failed`, but the invoice is still marked `reminder_sent_at`, so it is never retried |
| 3 | major | correctness | Overdue check is `due_at <= today` so reminders go out on the due date itself; PR body says "after the due date" |
| 4 | minor | performance | Customer email looked up per invoice inside the loop (N+1) and the scan has no limit |
| 5 | minor | tests | Test replaces the mailer with a stub and asserts only `sent === 1`; no test for failure or for the second run being a no-op |
| 6 | nit | style | Grace period `3` appears as a magic number in two places |

**Good decisions:** `Mailer` interface injected through `buildApp` options; run endpoint returns a summary; admin-only.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["concurrency", "error-handling"]`, difficulty `medium`, open question "should we run this from a cron inside the service or keep it as an endpoint?".

---

### Task 10: invoice-service feature `soft-delete`

**Files:** `features/soft-delete/{feature.json,changes.patch,REVIEW.md}`

**Feature:** "Soft-delete invoices". Adds `deleted_at`, `DELETE /invoices/:id` (sets it), `POST /invoices/:id/restore`, and hides deleted invoices from list and get. Touches `db.ts`, `routes/invoices.ts`, `repositories/invoices.ts`, `schemas.ts`, `test/invoices.test.ts`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | major | correctness | `findById` in the repository still returns deleted rows, so `issue`, `pay` and `void` work on a deleted invoice while `GET` returns 404 |
| 2 | major | correctness | Paid invoices can be deleted; the PR body says only draft and void |
| 3 | major | api-design | `DELETE` on an already-deleted invoice returns 200 with the body, on a missing one 404, and `restore` on a non-deleted one returns 500 from an unhandled null |
| 4 | minor | security | Readonly key can call `DELETE` because the method check in `auth.ts` was widened to allow it "for the support tool" |
| 5 | minor | data | `deleted_at` is written as `Date.now()` (integer ms) while every other timestamp is ISO text |
| 6 | minor | tests | No test for get-after-delete or for restore |
| 7 | nit | style | Both `isDeleted` boolean and `deletedAt` are added to the response |

**Good decisions:** soft over hard delete with a restore path; list query excludes by default with an `includeDeleted` admin flag; migration is additive with a default.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["api-design", "data", "correctness"]`, difficulty `easy`, open question "I let readonly keys delete because support asked, is that ok?".

---

### Task 11: payment-webhooks base

**Files (20):**
- Create under `code-review/projects/payment-webhooks/`: `project.json`, and under `base/`: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `biome.jsonc`, `README.md`, `src/app.ts`, `src/server.ts`, `src/db.ts`, `src/schemas.ts`, `src/auth.ts`, `src/routes/webhooks.ts`, `src/routes/admin.ts`, `src/services/signature.ts`, `src/services/events.ts`, `src/services/outbox.ts`, `src/lib/providers.ts`, `src/lib/errors.ts`, `test/helpers.ts`, `test/signature.test.ts`, `test/webhooks.test.ts`

**Interfaces:**

One provider, "acme". Webhook `POST /webhooks/acme` with raw JSON body and header `x-acme-signature: t=<unix seconds>,v1=<hex hmac-sha256 of "<t>.<rawBody>" with ACME_WEBHOOK_SECRET>`. Tolerance 300 seconds. Body shape `{ id: string; type: "payment.succeeded" | "payment.failed" | "refund.created"; created: number; data: { paymentId: string; amountCents: number; currency: string; reason?: string } }`.

Tables: `events(id TEXT PK, provider TEXT, external_id TEXT, type TEXT, payload TEXT, status TEXT CHECK(status IN ('received','processed','failed')), error TEXT, received_at TEXT, processed_at TEXT, UNIQUE(provider, external_id))`, `payments(id TEXT PK, provider TEXT, external_id TEXT, status TEXT, amount_cents INTEGER, currency TEXT, refunded_cents INTEGER DEFAULT 0, updated_at TEXT)`, `outbox(id TEXT PK, topic TEXT, payload TEXT, attempts INTEGER DEFAULT 0, next_attempt_at TEXT, delivered_at TEXT, created_at TEXT)`.

Flow: `routes/webhooks.ts` reads the raw body (custom content type parser registered in `app.ts` so the exact bytes are signed), `signature.ts` verifies (`verifyAcmeSignature(header: string, rawBody: string, secret: string, now: () => Date): boolean` using `timingSafeEqual`), `events.ts` `ingest(provider, body)` inserts the event (UNIQUE conflict → 200 `{ duplicate: true }`), then `processEvent(eventId)` applies the type to `payments` and writes an outbox row with topic `payments.<status>`, all in one transaction, marking the event processed or failed. `outbox.ts` exports `drain(publisher: Publisher, limit = 50): Promise<{ delivered, failed }>` with `Publisher = { publish(topic: string, payload: unknown): Promise<void> }` and an in-memory fake; `server.ts` runs `drain` on a 1 second interval.

Admin routes (header `x-admin-key`, env `ADMIN_KEY` default `admin-dev-key`): `GET /admin/events?status` (array), `GET /admin/events/:id`, `GET /admin/payments/:id`, `POST /admin/outbox/drain` (runs `drain` once, returns the counts; used by tests).

Rough edges for `walkthrough`: processing happens inside the webhook request instead of a queue; `events.ts` is one `switch` over types; `payload` stored as JSON text and re-parsed in three places; the outbox worker has no backoff (attempts increment, `next_attempt_at` is always now).

Tests: `signature.test.ts` (valid, wrong secret, stale timestamp, malformed header), `webhooks.test.ts` (succeeded creates a payment and an outbox row, duplicate id returns `duplicate: true` and no second row, bad signature 401, drain delivers through the fake publisher). No test for `refund.created` over the paid amount.

- [ ] **Step 1: `project.json`** with tags `{ domain: "payments", minutes: 45, topics: ["http", "sqlite", "crypto", "idempotency", "queues"] }` and the four walkthrough lines.

- [ ] **Step 2: Create the base** per the interface; `pnpm install` for the lockfile; README with the signing recipe and a `curl` that uses a tiny `node -e` to sign.

- [ ] **Step 3: Verify** `pnpm typecheck && pnpm lint && pnpm test`; file count ≤ 20; source 600 to 1000 lines.

- [ ] **Step 4: Verify via CLI** `pnpm cr prepare payment-webhooks --no-install --force`.

- [ ] **Step 5: Commit** `feat(code-review): payment-webhooks base`

---

### Task 12: payment-webhooks feature `second-provider`

**Feature:** "Support Bolt webhooks". Adds provider "bolt": `POST /webhooks/bolt`, header `x-bolt-signature: <base64 hmac-sha256 of rawBody>` (no timestamp), body `{ event_id, event_type: "charge.succeeded" | "charge.failed" | "charge.refunded", amount: "12.34", currency, charge_id }`, mapped to the acme event shape. Touches `lib/providers.ts`, `services/signature.ts`, `routes/webhooks.ts`, `services/events.ts`, `test/signature.test.ts`, `README.md`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | security | Bolt signature compared with `===` on strings rather than `timingSafeEqual` |
| 2 | blocker | correctness | Unknown `:provider` falls into the `default` branch that uses the acme verifier and secret, so any provider name is accepted if signed with the acme secret |
| 3 | major | correctness | `amount` converted with `Math.round(parseFloat(amount) * 100)` in one place and `Number(amount) * 100` in another, so `"0.29"` becomes 28 cents in the outbox payload |
| 4 | major | security | No replay protection for Bolt; PR body says Bolt "doesn't send timestamps so it's not needed", but the `events` UNIQUE already covers it only if `external_id` is set, and the mapping leaves it `undefined` for `charge.refunded` |
| 5 | minor | api-design | Event processing switch duplicated for bolt types instead of mapping to the canonical types first |
| 6 | minor | tests | The bolt signature test signs with the same helper the implementation uses, so it would pass with any algorithm |
| 7 | nit | style | `BOLT_WEBHOOK_SECRET` read inside the handler with fallback `"changeme"` |

**Good decisions:** `Provider` interface with `verify` and `normalize`; per-provider secrets; README documents both signing schemes.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["security", "correctness"]`, difficulty `medium`.

---

### Task 13: payment-webhooks feature `replay-endpoint`

**Feature:** "Replay a stored event". `POST /admin/events/:id/replay` re-runs `processEvent` for a stored event and records `replayed_at` and `replay_count`. Touches `db.ts`, `routes/admin.ts`, `services/events.ts`, `schemas.ts`, `test/webhooks.test.ts`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | concurrency | Replay re-applies the payment mutation and inserts a new outbox row; replaying `refund.created` doubles `refunded_cents` |
| 2 | major | security | The replay route is added in `app.ts` before the admin auth hook is registered, so it needs no key |
| 3 | major | error-handling | A throw inside replay is caught and the event is still marked `processed` with `error = null` |
| 4 | major | api-design | Returns 200 `{ ok: true }` when the event id does not exist |
| 5 | minor | data | `replayed_at` is declared `TEXT` but written with `Date.now()` |
| 6 | minor | tests | Only the happy path; no test that a second replay is a no-op |
| 7 | nit | style | `replay_count` incremented with a read-modify-write instead of `SET replay_count = replay_count + 1` |

**Good decisions:** reuses `processEvent`; records replay metadata for audit; admin-only intent stated in the PR.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["security", "concurrency"]`, difficulty `medium`.

---

### Task 14: payment-webhooks feature `dead-letter-queue`

**Feature:** "Dead-letter undeliverable outbox messages". After `MAX_ATTEMPTS` failures a row moves to `dead_letters(id, outbox_id, topic, payload, reason, attempts, created_at)`; adds `GET /admin/dead-letters` and `POST /admin/dead-letters/:id/retry`, and a backoff schedule. Touches `db.ts`, `services/outbox.ts`, `routes/admin.ts`, `test/webhooks.test.ts`, `README.md`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | error-handling | `attempts` is incremented in the `try` after a successful publish, so a failing row's count never grows and it is never dead-lettered |
| 2 | major | data | The move is an INSERT into `dead_letters` then a DELETE from `outbox` with no transaction |
| 3 | major | correctness | `retry` copies the row back with its old `attempts`, so it is dead-lettered again on the next failure |
| 4 | minor | performance | `drain` now selects all pending rows with no `LIMIT` and no `next_attempt_at` filter, ignoring the backoff it just added |
| 5 | minor | security | The dead-letter listing returns the full raw payload including the provider's customer fields |
| 6 | minor | tests | Test inserts a row into `dead_letters` directly and checks the listing; nothing exercises the move |
| 7 | nit | style | `MAX_ATTEMPTS` is `5` in `outbox.ts` and `3` in the README |

**Good decisions:** reason stored with the dead letter; exponential schedule defined as data; admin retry endpoint.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["error-handling", "data"]`, difficulty `medium`.

---

### Task 15: payment-webhooks feature `event-filtering`

**Feature:** "Filter and paginate the events listing". `GET /admin/events` gains `type`, `provider`, `from`, `to`, `status`, `limit`, `cursor`, `orderBy`, and returns `{ items, nextCursor }`. Adds an index on `(provider, type)`. Touches `routes/admin.ts`, `services/events.ts`, `schemas.ts`, `db.ts`, `test/webhooks.test.ts`.

| # | Severity | Area | What |
|---|---|---|---|
| 1 | blocker | security | `orderBy` is interpolated into `ORDER BY ${orderBy}` |
| 2 | major | api-design | Response changes from an array to `{ items, nextCursor }` with no version or compatibility path; README still shows the array |
| 3 | major | performance | Pagination uses `OFFSET` derived from the cursor, and `received_at` has no index |
| 4 | minor | correctness | `from` is inclusive and `to` is exclusive without saying so, and both accept strings that parse to `Invalid Date` |
| 5 | minor | correctness | `limit` has a default of 50 but no maximum |
| 6 | minor | tests | The pagination test asserts insertion order without an `ORDER BY` in the query under test |
| 7 | nit | style | Unused import of `HttpError` |

**Good decisions:** query schema with enums for `status` and `provider`; a composite index that matches the common filter; defaults documented in the schema.

- [ ] Steps 1 to 6 as in Task 7 with `focus: ["performance", "api-design"]`, difficulty `easy`.

---

### Task 16: Phase wrap-up

- [ ] **Step 1:** From `code-review/`: `pnpm cr check` → all eight rows green.
- [ ] **Step 2:** `pnpm cr list` shows 8 features across 2 projects; `pnpm cr random --difficulty easy` prepares one of the two easy features.
- [ ] **Step 3:** Confirm no `REVIEW.md` is tracked: `git ls-files | grep REVIEW.md` prints nothing. Confirm no `node_modules` or `.work` tracked.
- [ ] **Step 4:** Update `code-review/README.md` with the authoring loop from the spec (prepare, branch, commit, regen, feature.json, REVIEW.md, check).
- [ ] **Step 5: Commit** `docs(code-review): authoring workflow`
