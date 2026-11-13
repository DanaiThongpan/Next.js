# P3-B3 — Admin Dashboard MySQL data integration

5 November 2026. Completed code/offline verification only; live data parity awaits user schema review. No live database connection, HTTP/browser request, or .env.local inspection/edit in this batch. No changes to original PHP; no migration or write SQL. Phase 4 not started.

## Source and existing integration

Reviewed original admin/main.php, admin/api_dashboard_data.php, includes/BorrowService.php getDashboardData, component/admin_sidebar.php in `daam-main สำเนา`. Original layout/assets and P3-B1/B2 integration are retained; no claim of viewing the live PHP screen. Existing server route requires UT00000001 before reading data, uses shared lib/db.ts pool and exact allowlist, and Suspense/refresh loading states. No new database connector or SQL endpoint.

The existing query plans conditionally supply four cards (total, borrowed, overdue, pending), available/borrowed/maintenance doughnut, top-six category bar, five recent activities, sidebar badges, and sync timestamp. Missing dependency columns suppress only affected reads. Production contains no mock fallback. Sync action and non-dashboard business pages remain disabled/placeholders.

## Changes

- lib/dashboard/read.ts: validate aggregate values (including numeric strings), safe integer/nonnegative constraints; reject null/boolean/object/unsafe counts instead of manufacturing zero. Validate category labels/counts, row limits, recent identifiers/fields/duplicates, sync shape. Sanitize errors per widget.
- lib/database/pool.ts: dateStrings=true preserves MySQL date fields as text; avoids timezone-shifting DATE values and matches PHP date comparisons. Same existing read-only pool.
- components/admin/dashboard-widgets.tsx: explicit pending Schema message and metadata-script reference; retained original card/table/chart layout.
- tests/dashboard.test.ts: complete-schema successful mock mapping with parameter assertions; invalid aggregate and empty-result cases.
- tests/dashboard-components.test.mjs: render actual DashboardWidgets with React server renderer; stub Chart.js boundary/Next Link/controls only. Check actual counts, escaped text, chart inputs, schema gaps, empty/error distinction. Does not claim visual canvas/browser verification.
- tests/database.test.ts: verify dateStrings option alongside pool safety.
- tests/offline-network-guard.mjs: additionally intercept dotenv file reads before bytes are read, preventing Next automatic secret-file loading during offline checks. TCP/TLS/DNS/fetch remain denied.
- package.json: test:components included in test:offline.

## SQL inventory (exact statements in lib/dashboard/model.ts)

All application statements are SELECTs; generated fixed shapes are checked by lib/database/statements.ts. Values for day, department and account ID are bound parameters; no user-supplied identifiers.

| Widget | Read/formula |
| --- | --- |
| Metadata | INFORMATION_SCHEMA.COLUMNS joined TABLES, daam base tables only, four fixed table names |
| Total | COUNT durable_articles; is_approved=1 OR NULL; visibility and department scope |
| Borrowed | COUNT borrow_back INNER JOIN assets; status != returned; no return date OR pending_return; visibility/scope |
| Overdue | Borrowed predicate plus Deadline_borrow < bound Bangkok day |
| Pending | COUNT assets is_approved=0; visibility/scope |
| Maintenance | Original s0002 or nonempty status excluding s0001/s0003; approved; visibility/scope |
| Available | max(0,total-borrowed-maintenance), only with all three successful reads |
| Category | classification join approved assets; visibility/scope; GROUP BY classification ID/name; total DESC LIMIT 6 |
| Recent | borrow_back join assets (global LEFT, scoped INNER); visibility/scope; IDborrow_back DESC LIMIT 5 |
| Sidebar pending | Global assets is_approved=0, intentionally separate formula |
| Sidebar overdue | Global blank/null Date_back and Deadline_borrow < bound day, original separate formula |
| Sync label | DATE_FORMAT(last_synced_at) from _sync_meta ORDER BY id DESC LIMIT 1; no synchronization operation |

Visibility: normal 1/NULL, hidden 0, all no predicate. Scoped admins: owner department, shared ส่วนกลาง, or null owner + created_by account. Global predicate follows verified PHP after strict Admin type check. No COUNT DISTINCT substitution.

## Schema pending user confirmation

No current schema was queried. Historical metadata from November 4 lacked durable_articles.is_approved/is_visible/owner_department/created_by, borrow_back.status and _sync_meta. Historical results are not current verification. Each plan lists all dependencies in model.ts; no alternate mapping is assumed. User-only metadata script: docs/sql/schema-review-read-only.sql. Do not run from Codex. Review semantic meanings before changing mapping; do not create columns to satisfy UI.

## Offline verification

31 tests pass: auth 8, dashboard mapping 10, database 10, rendered component 3. ESLint, tsc --noEmit and guarded Next webpack production build pass. Network denied and dotenv reads hidden during checks. Node experimental strip-types/module-format notices remain non-failing. No live Login/account, network, MySQL, desktop/mobile/browser, or actual Chart.js canvas integration test in this batch.

## Manual macOS testing — user only

1. Review metadata script; run its read-only metadata statements yourself with an authorized SELECT-only account. Share sanitized table/column/type/key metadata only, no rows/passwords/hashes/tokens. Do not run original PHP connection/migration files.
2. Edit .env.local yourself: DAAM_DB_ACCESS=disabled first. Start `npm run dev`; open http://localhost:3000/login. Expect “การเชื่อมต่อฐานข้อมูลจริงถูกปิดไว้เพื่อความปลอดภัย”; anonymous /admin redirects to /login. Disabled mode deliberately does not bypass authentication to show Admin.
3. Configure credentials privately and DAAM_DB_ACCESS=enabled yourself; restart dev server. Use authorized Admin account at /login, then /admin. Only your runtime performs SELECTs inside read-only transactions. Verify numbers against the documented original predicates for the same date/scope/visibility. Missing columns must show pending Schema rather than guessed counts. Check both charts, recent five, refresh/loading, empty/error states, browser console, desktop/mobile sidebar.
4. Logout; verify session is invalid. Authorized ordinary User entering /admin must be denied; anonymous must redirect to /login. Never bypass authentication for rendering.
5. Return DAAM_DB_ACCESS=disabled and restart when finished. Report sanitized failures/schema findings. Never send .env.local or passwords.

Stop here; awaiting user manual test results. No Phase 4.
