# money-dumb // Financial Command Center

Personal finance, liquidity, and monthly cash-flow command center built on the `idleAustin` design system. Designed to answer one core question: **"Am I safe to spend?"**

---

## Core Capabilities

- **This Month Execution Workspace (`/dashboard/this-month`)**:
  - **Execute Bills**: 8-column account safe-balance reconciliation matrix, inbound capital scheduler, and side-by-side recurring bills + debt obligations ledger.
  - **Forecast & Flow**: 31-day cash-burn step curve & heatmap tiles, 8-column category allocation waterfall, and 3M/6M/12M creditor knock-out payoff projection.
- **Debt Payoff Engine (`/dashboard/debts`)**: Server-side Snowball (`balance ASC`) and Avalanche (`interest_rate DESC`) amortization schedules (`app/lib/payoff.ts`) with committed payoff plan tracking and bonus windfall allocation.
- **Accounts, Income, Expenses, Envelopes & Wants**: Full CRUD telemetry with dual-engine SQLite (local) and Postgres (production) parity.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Standalone Build) + React 19 + TypeScript
- **Design System**: `idleAustin` Pure Obsidian (`--as-*` CSS custom properties, `Outfit` / `Geist` / `Fira Code`, `lucide-react`)
- **Database**: Dual-engine query layer (`app/lib/db.ts`) — `better-sqlite3` in local development (`moneydumb.db`) and `@vercel/postgres` / `@neondatabase/serverless` in production
- **Secrets Management**: Doppler (`money-dumb` project across `dev`, `stg`, `prd`)
- **CI/CD & Security**: GitHub Actions (`.github/workflows/ci.yml`, `.github/workflows/snyk.yml`), Gitleaks, Snyk SCA/SAST/Container, Knip, and automated Conventional Commit releases (`scripts/version.mjs`)

---

## Local Development

### 1. Link Doppler (`dev`)

```bash
doppler --no-check-version setup --project money-dumb --config dev
```

### 2. Install & Run

```bash
npm install
doppler --no-check-version run -- npm run dev
# Or run ./run-local.sh
```

The local server starts at `http://localhost:3000` and automatically initializes/migrates `moneydumb.db` from `app/lib/schema-sqlite.sql`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run typecheck` | Run TypeScript compiler validation (`tsc --noEmit`) |
| `npm run knip` | Detect unused files, exports, and dependencies |
| `npm run lint` | Run ESLint across the codebase |
| `npm run test:unit` | Run mathematical invariant and adversarial verification suites |
| `npm run test:e2e` | Run opaque-box E2E design system & build verification suite |
| `npm test` | Run both `test:unit` and `test:e2e` |
| `npm run build` | Run typecheck and compile Next.js standalone production bundle |
| `npm run version:next` | Preview next semantic version from Conventional Commits |
| `python3 scripts/01.git.py` | Interactive Conventional Commit & release-note preview CLI |

---

## Docker Containerization

Build and run the multi-stage non-root (`USER node`) production image locally:

```bash
docker build -t money-dumb .
doppler --no-check-version run -- docker run --rm -p 8080:8080 money-dumb
```
