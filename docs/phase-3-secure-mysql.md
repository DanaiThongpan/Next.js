# Phase 3 / P3-B2 — controlled MySQL integration (offline)

2026-11-05, Asia/Bangkok. Continues the existing repository and Phase 3. No Phase 4 work.

## Security boundary for this batch

Codex did not connect to 192.168.15.201, run network probes/MySQL clients, invoke DB-backed APIs/pages, use browser automation, create a tunnel, inspect .env.local credentials, or execute legacy PHP. No live connection success is claimed for this batch. Prior reports describe historical tests under the older authorization and must not authorize new access.

All tests use synthetic configuration and injected mock drivers. The test/build preload throws before TCP/TLS/DNS/fetch access. Build scripts also disable Next.js telemetry. The actual mysql2 module is imported for an offline disabled-mode test, but the pool factory is not invoked and no connection is created.

## Connection module

The repository uses root app/ and lib/, so `lib/db.ts` is the connection entry point (not a duplicate src/lib/db.ts). It is server-only and uses mysql2/promise. `lib/mysql.ts` is a compatibility re-export, not an alternate connection path.

- Credentials: DB_USER and DB_PASSWORD from server environment only; no fallback username or PHP password.
- Target: 192.168.15.201:3306, daam, utf8mb4. Non-target configuration is rejected.
- Default DAAM_DB_ACCESS is disabled; only exact enabled permits a runtime read. Unknown/missing values fail closed. NEXT_PHASE=phase-production-build also blocks access.
- Disabled is checked before credential-property access, pool creation, acquisition, callback or application query. Invalid configuration fails before creating a pool.
- Pool is created only at the first allowed read, reused across requests and development module reloads, and never acquired at import time. Default connection limit 2, configurable only 1–5; fail-fast acquisition (no unbounded queue), five-second connection/query timeouts, LOCAL INFILE and multiple statements disabled.
- Each lease starts START TRANSACTION READ ONLY. It always ends its read snapshot with ROLLBACK before release; failure in setup/cleanup destroys the connection. No COMMIT or application write method is exposed.
- closeDatabasePool() drains active readers and calls pool.end(); new readers are rejected while closing. Escaped reader objects cannot query after their callback ends. Credential changes require close/restart rather than silently reusing an authenticated pool.
- Raw driver errors, causes, SQL and credentials are not exposed; callers receive safe fixed messages/codes.

The two transaction-control statements change only connection transaction state, not database data/schema. They are internal service operations, not caller-supplied SQL. DBAs should independently provision a SELECT-only account; no account privileges are checked or changed by Codex.

## Query boundary

`lib/database/statements.ts` contains the exact approved SELECT statement shapes used by Login, active-identity checks, preview, metadata and Dashboard plans. The read facade checks exact statement membership, placeholder count and scalar parameters before calling the driver. Arbitrary SELECTs, extra comments/statements, stored functions/procedures, writes, file/lock operations and any browser-provided SQL are rejected. This is deliberately narrower than allowing every SHOW/DESCRIBE/SELECT statement.

Existing Dashboard visibility/scoping/formulas and Authentication/RBAC rules are preserved. Pooling does not broaden account access. No generic query endpoint is added.

## Disabled UI behavior

The Login page shows exactly:

> การเชื่อมต่อฐานข้อมูลจริงถูกปิดไว้เพื่อความปลอดภัย

Its form is disabled, and its POST handler independently returns 503 with that safe message for allowed-origin requests. Preview also returns that message. Protected routes still require verified identity and redirect to Login when access is off, without rendering protected profile/statistics. Cookie access remains request-time even while disabled so a build-time disabled redirect is not permanently prerendered into enabled production routes. Logout can still revoke a local session without MySQL.

## macOS activation — user only

Codex must leave this procedure to the user. Do not overwrite an existing .env.local by copying a template over it.

1. Ask the DBA for an account with SELECT-only privileges and confirm local LAN access yourself. Do not use this project to GRANT/REVOKE or alter the database.
2. Open .env.local locally yourself. Use .env.example as a reference and add missing settings with DAAM_DB_ACCESS=disabled, DB_USER and DB_PASSWORD. Do not paste the file, credentials, cookies or hashes into chat. Quote/escape values appropriately for Next.js env files (notably # and $).
3. When you choose to permit live runtime access, change only your local configuration to DAAM_DB_ACCESS=enabled yourself and restart the development server with npm run dev. Credentials remain server-only; never use NEXT_PUBLIC_ for them. Tests/builds always override access back to disabled.
4. On your macOS browser, test /login and authorized Admin/User flows. /db-preview remains development + loopback-only. Missing schema semantics must remain unavailable, not guessed.
5. For schema review, run docs/sql/schema-review-read-only.sql yourself using your own MySQL client and SELECT-only account. Review and sanitize metadata results before sharing; no account rows/hashes/defaults/comments are needed. Codex must not run that client or web route on your behalf.
6. To turn access off, set DAAM_DB_ACCESS=disabled yourself and restart the process (which closes existing sockets). The server-side closeDatabasePool export is also available for controlled shutdowns; no HTTP shutdown endpoint was created.

An existing .env.local from Phase 1 may have DB_PASSWORD but no DB_USER. That must be supplied by the user; the hardcoded tiw_dev fallback has been removed. No real .env.local was edited by Codex.

## Offline commands

- npm run test:offline — auth + dashboard + mocked database groups; explicit disabled mode and network-denial preload.
- npm run test:db — pool/gate/allowlist tests only, no real driver acquisition.
- npm run lint
- npx tsc --noEmit
- npm run build:offline — Webpack build with disabled mode plus network-denial preload.
- npm run build — also forces disabled, even if the user's local environment enables access.

Next CLI may list .env.local as a standard environment-file source during build. No file content is printed or inspected by Codex; the explicit process DAAM_DB_ACCESS=disabled takes precedence, and the connection module does not access credential properties while disabled. Tests do not use @next/env or read env files.

## Schema work still pending

No new live schema discovery occurred. Historical missing fields remain listed in docs/migration-map.md. The user-run SQL provides metadata only. Pending user validation: current schema, SELECT-only permissions, real MySQL connection/read-only transaction support, successful account login/pooling, and current live Dashboard mappings. Unit tests do not establish any of those facts.

## Files

Created: lib/db.ts; lib/database/{config,errors,pool,statements}.ts; .env.example; tests/database.test.ts; tests/offline-network-guard.mjs; docs/sql/schema-review-read-only.sql; docs/migration-map.md; docs/permission-matrix.md; this report.

Updated: lib/mysql.ts; lib/auth/accounts.ts and session.ts; lib/db-preview.ts; lib/dashboard/model.ts and server.ts; app/api/auth/login/route.ts; app/(auth)/login/page.tsx and login-form.tsx; package.json; .gitignore; docs/migration-progress.md; docs/CONTINUE_TOMORROW.md.

No changes to legacy PHP, real env secrets, accounts, database schema/data/privileges or business features.

## Latest offline results

- npm run test:offline: **26 groups passed** (8 auth, 8 dashboard, 10 database).
- npm run lint: passed after replacing the CommonJS network preload with an ES module; no lint rules disabled.
- npx tsc --noEmit: passed.
- npm run build:offline: passed under the network-denial preload; /admin and /login remain request-time routes.
- git diff --check: passed.
- No live LAN/MySQL, API/browser, credential inspection, or integration test performed. The real .env.local access flag is intentionally unknown to Codex.
