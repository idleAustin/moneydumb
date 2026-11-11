# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal and self-hosted household operators managing multi-account checking, savings, and investment balances alongside recurring bills, credit cards, and installment debts. Users open MoneyDumb during payday runs, weekly bill-clearing sessions, and debt-payoff planning when they need an immediate, trustworthy answer to how much cash is actually safe to spend right now.

## Product Purpose

MoneyDumb turns raw bank balances, paycheck schedules, recurring obligations, and debt liabilities into an actionable monthly execution ledger. Success means a user can reconcile starting balances, clear bills as they post, see true post-obligation safe cash (`Safe Balance`) without mental math, and execute a committed snowball or avalanche debt-payoff plan without overdrawing an account.

## Positioning

Unlike passive expense trackers that categorize money after it is already gone, MoneyDumb centers on forward-looking monthly execution (`This Month`): an interactive sandbox ledger (`sandbox_instances` and `sandbox_items`) that reconciles live account balances against unpaid recurring obligations, upcoming deposit dates, and server-computed amortization schedules (`minimum`, `due_now`, and `payoff_plan` tiers) before money leaves the bank.

## Operating Context

- **Primary workflow (`This Month`):** Two-mode operational workspace pairing `Execute Bills` (burn velocity bar, 8-column account reconciliation matrix, category-grouped fixed bills, and sticky debt tier controls) with `Forecast & Flow` (31-day cash-burn step curve and heatmap, category allocation waterfall, and 3M/6M/12M creditor knock-out horizon).
- **Supporting management workflows:** Dedicated CRUD and `.xlsx` spreadsheet import/export surfaces for `Accounts`, `Income` (sources, routing allocations, bonus events), `Expenses` (recurring bills and categories), `Debts` (snowball/avalanche plans and windfall bonus blueprints), `Envelopes` (monthly spending caps and smart auto-seeding), and `Wants` (discretionary wishlist affordability scoring).
- **Dual-runtime deployment:** Runs locally against SQLite (`moneydumb.db` via `better-sqlite3`) with a clean shutdown control, or in production on Next.js App Router + Neon/Vercel Postgres, with an instant preloaded sandbox mode on the login screen.

## Capabilities and Constraints

- **Authoritative server math:** Payoff amortization schedules (`app/lib/payoff.ts`), bonus allocations, smart envelope seeding, want affordability ratios, income prorations (`weekly * 4.33`, `biweekly * 2.167`, `semimonthly * 2`, `monthly * 1`), and safe-cash totals are computed server-side and scoped strictly to the authenticated `userId`.
- **Non-destructive monthly sandbox:** Checking off bills or overriding payment amounts in `This Month` mutates only the monthly sandbox instance, preserving recurring master templates.
- **Locked operational topology:** `This Month` preserves its two-tab `Execute Bills` and `Forecast & Flow` architecture.

## Brand Commitments

- **Brand system:** `idleAustin` Pure Obsidian (`#0a0a0c` to `#202029`) surface hierarchy with razor-sharp `1px` borders (`#22222a` / `#33333f`) and Electric Lime (`#84cc16`) telemetry accents.
- **Typography:** `Outfit` for headings, `Geist` for interface copy, and `Fira Code` with tabular numerals for currency, dates, and keyboard shortcuts.
- **Iconography:** Geometric `2.0px`-stroke vector icons (`lucide-react`) only; zero emojis and zero icon fonts anywhere in the interface.
- **Voice and tone:** Deadpan, concise, high-competence `idleAustin` microcopy—direct verbs, plain error recovery, zero exclamation points, and persistent telemetry badge `idleAustin (idle, but operational)`.

## Evidence on Hand

- Live Next.js 16 + React 19 application under `app/` with SQLite/Postgres schema parity (`app/lib/schema-sqlite.sql`, `app/lib/schema-postgres.sql`).
- Preloaded 38-obligation benchmark dataset (28 fixed recurring bills across 6 categories + 10 debts) powering instant sandbox evaluation.
- Automated verification suite (`tests/e2e/runner.js`, `tests/e2e/mobile-responsive.test.js`, `tests/verify_math_invariants_empirical.js`, `tests/verify_m6_adversarial.js`).
- No external customer testimonials, third-party bank-plaid sync claims, or commercial pricing tiers exist; never fabricate them.

## Product Principles

1. **Safe cash over raw balance:** Always foreground what remains after upcoming obligations clear, not the illusory bank ledger number.
2. **Operate at payday speed:** Routine bill checkoffs, balance updates, and strategy toggles happen inline in one click or keystroke, reserving modals for multi-field creation or destructive confirmation.
3. **Honest state everywhere:** Distinguish loading, empty, filtered-empty, and failed-fetch states explicitly so a network hiccup never masquerades as zero accounts or zero debt.
4. **Deadpan clarity under financial stress:** Present deficits, overdue bills, and payoff timelines with calm precision—never alarmist hype, gamified confetti, or vague error codes.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum contrast across all dark surfaces (primary text 18.07:1, Electric Lime accent 10.02:1, secondary text 7.80:1 on base obsidian; dark `#1a2e05` ink at 7.42:1 on solid lime buttons).
- Full keyboard operability: visible `2px solid #84cc16` `:focus-visible` outlines, `Cmd/Ctrl+K` command palette, `Escape` dismissal and ARIA dialog semantics on all modals/drawers, keyboard-sortable table headers, and explicit `aria-label` attributes on every icon-only button.
- Mobile-ready ergonomics: minimum `44x44px` touch targets on narrow viewports (`<= 640px`), `16px` (`1rem`) mobile form inputs to prevent forced iOS Safari zoom, pinch-to-zoom preserved, and `env(safe-area-inset-*)` notch/home-indicator clearance.
- Intentional `prefers-reduced-motion` support that neutralizes spatial movement and keyframe loops while preserving crisp color and opacity state feedback.
