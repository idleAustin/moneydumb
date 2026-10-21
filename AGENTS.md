## Code Organization

### File size

| File type | Golden target | Soft limit | Action threshold |
|-----------|---------------|------------|------------------|
| Source files | 200-400 lines | 400-600 lines (split if mixing responsibilities) | 600+ lines: propose a split by responsibility before adding code. |
| Test files | 200-600 lines | 600-800 lines (split if covering multiple areas) | 800+ lines: avoid exceeding 800 lines; propose a split by domain area before adding more tests. |

Exceptions: generated code, large config/data files, and test fixtures are exempt.

Never split tightly coupled code just to meet a line count. Cohesion takes priority over size.

### Structure

- Give each file one responsibility that can be described in a single sentence.
- Organize by feature, with clear module boundaries.
- Extract shared logic (business logic, utilities, data access, UI components) only when it is used in more than one place or obscures a file's main logic.
- Do not add wrapper layers, barrel files, or single-function files without a concrete need.
- Use descriptive file names. Start each new file with a short header comment stating its purpose.

### Refactoring

- Preserve existing behavior.
- Do not combine refactors and feature changes in the same change.
- Run relevant tests and builds before and after, and report any failures.
- Update imports and references in the same change that moves code.


## Project Rules

### Done criteria

- Finish a change green on `npm run typecheck`, `npm run lint`, `npm run knip`, and `npm run test:unit`.

### Docs to read first

- Read `../.boilerplate/01.Foundation/01.Start-Here.md` and `../.boilerplate/03.Setup/00.Project-Bootstrap-Pipeline.md` before changing project infrastructure or scripts.
- Read `../.boilerplate/02.Design/STYLEGUIDE.md` before changing dashboard UI or CSS.
- Read `app/lib/db.ts`, `app/lib/schema-sqlite.sql`, and `app/lib/schema-postgres.sql` before changing queries or schema.

### Database & dual-engine parity

- `app/lib/db.ts` provides unified `sql` and `query()` helpers backed by local SQLite (`moneydumb.db` via `better-sqlite3`) in development and Vercel/Neon Postgres in production.
- A schema change must update both `app/lib/schema-sqlite.sql` and `app/lib/schema-postgres.sql` (and `scripts/migrate-to-neon.mjs` when columns or tables change) in the same change.
- Keep SQL statements in `app/api/**` and `app/lib/**` compatible with both SQLite and Postgres.

### Domain & financial integrity

- Scope every query and mutation to the authenticated `userId` from `getAuthUserId()` (`app/lib/auth.ts`). Never trust a client-supplied `user_id`.
- Compute authoritative debt payoff schedules, `calculated_payment` values (`app/lib/payoff.ts`), bonus plan allocations (`/api/debts/bonus-plans/[id]/generate`), smart envelope budgets (`/api/envelopes/smart`), want affordability analysis (`/api/wants/[id]/analyze`), monthly income prorations (`weekly * 4.33`, `biweekly * 2.167`, `semimonthly * 2`, `monthly * 1`), and net cash flow totals on the server.
- Treat any change to payoff amortization formulas, payment strategy rules (`minimum`, `due_now`, `payoff_plan`), or cash-flow projection math as a breaking change (`type!:`).

### Secrets

- Doppler project `money-dumb`, configs `dev`, `stg`, `prd`. Store environment variables in Doppler rather than `.env*` files.
- Always pass `--no-check-version` on every `doppler` command (`doppler --no-check-version secrets --only-names`). Leave `doppler configure --json` unrun in subagents because it prints the CLI token.

### Commits and releases

- Use conventional commits, because they drive versioning. `fix:` and `perf:` ship a patch, `feat:` ships a minor, and `type!:` ships a major when merged to `main`. `chore:`, `docs:`, `test:`, and `ci:` do not release.
- `main` is protected: CI ("Lint, Typecheck & Tests") and Snyk must pass.

### Fixed ports and paths

- Local Next.js dev server runs at `/` on `http://localhost:3000` (`npm run dev`).
- Production serves at `/` (`BASE_URL=/`).

### Local state

- `.next/`, `*.db*`, `backups/`, `.kennel-hub/`, and `../.boilerplate/` are gitignored local state. Leave them out of commits.

### Oversized files

- Keep all source files within the 200–400 line golden threshold (under 600 lines) and all test files within the 200–600 line golden threshold (under 800 lines).
- Legacy files currently exceeding 600 lines (`app/dashboard/this-month/page.tsx`, `app/dashboard/debts/page.tsx`, `app/dashboard/prototype/page.tsx`, `app/dashboard/income/page.tsx`, `app/dashboard/page.tsx`, `app/dashboard/expenses/page.tsx`) require a proposed split via `refactoring` before adding new features to them.

### Subagents

- Custom agents live in `.agents/agents/`. The roster and file ownership are in `docs/agents.md`.
- Delegate by ownership. Work that crosses a boundary goes back through the parent agent.
- Propose a refactor first and keep it separate from feature changes.

### Vocabulary

- **Safe Balance / Net Cash Flow:** Liquid cash coverage after subtracting recurring expenses and scheduled debt payments from monthly income/assets (`monthlyIncome - monthlyExpenses - monthlyDebtPayments`).
- **Account (Bank):** User asset account (`checking`, `savings`, `investment`) in `accounts` holding a current `balance`.
- **Income Source / Allocation / Event:** Recurring paycheck rule (`income_sources`), percentage/fixed routing rule to accounts (`income_allocations`), and recorded or bonus deposit (`income_events`).
- **Expense & Category:** Recurring monthly bills (`is_recurring = 1`, `due_day_of_month`) and one-off charges in `expenses`, grouped by `expense_categories`.
- **Debt & Committed Payoff Plan:** Liability in `debts` (`balance`, `interest_rate`, `minimum_payment`, `amount_due_immediately`, `payment_strategy`: `minimum` | `due_now` | `payoff_plan`) paired with the user's active `snowball` (`balance ASC`) or `avalanche` (`interest_rate DESC`) `committed_payoff_plan`.
- **Envelope & Smart Envelope:** Monthly category spending cap (`budgeted_amount`, `spent_amount`, `month`, `year` in `envelopes`), its `envelope_transactions`, and auto-seeded budgets from recurring category totals (`/api/envelopes/smart`).
- **Want:** Prioritized discretionary wish-list item (`wants`) evaluated against monthly discretionary cash flow (`months_to_save`, `cost_as_percent_of_income`).
- **Bonus Plan:** Windfall distribution blueprint (`bonus_plans` and `bonus_plan_allocations`) linked to a bonus `income_event`.
- **Sandbox Instance (`This Month`):** Interactive monthly workspace (`sandbox_instances` and `sandbox_items`) tracking paid status (`is_paid`) and `amount_override` values without mutating recurring master records.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
