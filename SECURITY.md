# Security Policy

## Reporting a vulnerability

Report vulnerabilities privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue or pull request for a security problem.

Include the affected route or file, steps to reproduce, and the impact you observed. Reports are handled on a best-effort basis.

## Supported versions

Only the latest release from `main` receives security fixes.

## What is protected

| Area | Control |
|------|---------|
| User sessions | HMAC-SHA256 signed HTTP-only session cookie (`session`, verified in constant time with `SESSION_SECRET`) with `secure: true` in production and `sameSite: 'lax'`. |
| Passwords | Salted `bcryptjs` hashes stored in `users.password_hash`. |
| Multi-tenant isolation | Every API route (`app/api/**`) and server action (`app/lib/actions.ts`) scopes queries and mutations to the authenticated `userId` from `getAuthUserId()`. Client-supplied `user_id` values are never trusted. |
| Financial calculations | Payoff amortization schedules (`app/lib/payoff.ts`), bonus plan allocations, smart envelope budgets, want affordability metrics, and net cash flow totals are computed strictly on the server. |
| Parameterized SQL | All queries in `app/lib/db.ts` (`sql` tagged template and `query()`) use parameterized placeholders (`$1, $2` in Postgres, `?` in SQLite). |
| Response headers | `next.config.ts` disables `X-Powered-By` and sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| Container runtime | Multi-stage `node:22-alpine` `Dockerfile` drops root privileges and runs as `USER node`. |

## Known limitations

- **Spreadsheet parsing (`xlsx@0.18.5`)**: `xlsx@0.18.5` is the final release published to the public npm registry and carries two unpatched advisories (`SNYK-JS-XLSX-6252523` and `SNYK-JS-XLSX-5457926`, tracked in `.snyk`). Spreadsheet import in `ExcelUpload.tsx` runs client-side in the user's browser, and `/api/report` only serializes server-queried rows for the authenticated user.

## Secrets

Secrets and database connection strings are stored in Doppler (`money-dumb` project across `dev`, `stg`, `prd`) and never committed to git. `.gitignore` excludes `.env*` (except `.env.example`), key files, and local SQLite `.db*` state. Only `DOPPLER_TOKEN` and `DOPPLER_TOKEN_STG` are stored in GitHub Repository Secrets.

## Automated scanning

Gitleaks and Snyk (Open Source SCA, Snyk Code SAST, and Snyk Container) run on every push and pull request to `main` and weekly on Mondays. See [`.github/workflows/snyk.yml`](.github/workflows/snyk.yml).
