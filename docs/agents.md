# Subagents

Project subagents live in [`.agents/agents/`](../.agents/agents/), one markdown file per agent. The primary agent delegates to them with `invoke_subagent`. This page is the only place the roster is listed.

## Roster

| Agent | Use it for | Mode |
|-------|------------|------|
| `database` | SQLite & Postgres schemas, `app/lib/db.ts` query layer, Neon migrations | writes |
| `backend` | Next.js API routes (`app/api/**`), session auth, server actions, debt payoff math | writes |
| `frontend` | Next.js pages, dashboard components, hooks, static assets, and stylesheets | writes |
| `styleguide` | Brand and design-token audit of UI and CSS | report only |
| `refactoring` | Splitting oversized or mixed-responsibility files | writes, two phases |
| `domain-integrity` | Gate for changes to payoff math, cash-flow projections, user scoping, and dual-DB parity | report only |
| `tester` | Unit and browser tests | writes tests only |
| `security-reviewer` | Session auth, password hashing, user isolation, headers, secrets | report only |
| `mobile` | Capacitor iOS and Android wrapper | writes |

All agents use `model: inherit`, `mainAgent: false` and the default `sandbox` command policy. They run only as delegates of the primary agent.

## File ownership

Write-capable agents edit only the paths they own. Work that crosses a boundary returns to the parent agent, which sequences it.

| Agent | Owns |
|-------|------|
| `database` | `app/lib/db.ts`, `app/lib/schema-sqlite.sql`, `app/lib/schema-postgres.sql`, `scripts/migrate-to-neon.mjs` |
| `backend` | `app/api/**/route.ts`, `app/lib/auth.ts`, `app/lib/actions.ts`, `app/lib/payoff.ts` |
| `frontend` | `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/register/**`, `app/dashboard/**/*.tsx`, `app/dashboard/hooks/**/*.ts`, `app/dashboard/*.css`, `public/**`, `next.config.ts`, `postcss.config.mjs` |
| `tester` | `**/*.test.ts`, `**/*.test.tsx`, `tests/**`, `playwright.config.ts` |
| `mobile` | `capacitor.config.ts`, `app/platform/**`, `ios/`, `android/` |
| `refactoring` | Only the files the parent names, plus their importers |
| `styleguide`, `domain-integrity`, `security-reviewer` | None. They report only. |

## Cross-layer sequence

For a feature that spans layers, the parent runs agents in this order and checks each result before the next:

1. `database` for the SQLite/Postgres schemas and `app/lib/db.ts` layer.
2. `backend` for Next.js API routes, server actions, or `app/lib/payoff.ts` logic.
3. `frontend` for the Next.js pages, components, and styles.
4. `tester` for unit and browser tests.
5. `domain-integrity` and `security-reviewer` as gates when financial math, user scoping, auth, or secrets changed.
6. `styleguide` after UI changes.

Run refactors on their own, never inside a feature change.

## Adding an agent

1. Create `.agents/agents/<name>.md`. The `name` must match the filename and avoid the built-in names `research`, `browser`, `self` and `image-generator`.
2. Set `name` and `description` in the YAML frontmatter. The description decides when the parent delegates, so state when to use the agent and when not to.
3. List only exact tool names in `tools`. A misspelled tool name can make a subagent hang.
4. Start the body with the files the agent owns and the docs it must read first, because subagents start with a clean context.
5. Point to `AGENTS.md` for shared rules and add only role-specific ones.
6. Add the agent to the tables above. Keep ownership paths from overlapping.
7. Leave a `README.md` out of `.agents/agents/`, because it could be parsed as an agent.
