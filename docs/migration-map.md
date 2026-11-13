# DAAM mapping — Phase 3 / P3-B2

Updated 2026-11-05. This batch is offline only. The live MySQL server was not contacted. MySQL details below are historical evidence recorded on 2026-11-04, not a fresh schema guarantee.

| Feature | Original source/schema | Next.js source | Mapping status |
| --- | --- | --- | --- |
| Connection | control/connectPDO.php, connectDB.php have schema-changing startup code | lib/db.ts + lib/database/* | No PHP execution/import. Lazy guarded pool; credentials from environment only |
| Login ID, active status, bcrypt, type/name/department | login.php; useraccount fields recorded in Phase 2 | lib/auth/accounts.ts; lib/database/statements.ts | Same fixed parameterized reads and DTO, with access gate |
| Session/RBAC | PHP session and per-page checks | lib/auth/session.ts, policy.ts, store.ts | Preserved; database-disabled cannot validate a session and fails closed |
| Metadata/sample preview | INFORMATION_SCHEMA; reviewed asset ID/price columns | lib/db-preview.ts | Existing allowlist; blocked by default before connection |
| Dashboard totals/status/category/recent | BorrowService::getDashboardData; SQLite extended fields | lib/dashboard/model.ts, read.ts, server.ts | Conditional on exact schema dependencies; no unconditional-count fallback |
| Sidebar overdue | separate Date_back + Deadline_borrow global count | lib/dashboard/model.ts | Separate formula retained; must not substitute for main overdue metric |
| Sync metadata | SQLite _sync_meta | lib/dashboard/model.ts | Historical MySQL inventory lacks it; no guessed source |

Known unresolved semantic fields (historical): durable_articles.is_approved, is_visible, owner_department, created_by; borrow_back.status; _sync_meta. Source/SQLite names do not establish an equivalent field in MySQL. Keep unmapped widgets unavailable until the user supplies reviewed sanitized metadata and an explicit semantic mapping. Do not add columns, infer ownership from useraccountID/buildingID, infer approval from statusID, or replace workflow status with return-date heuristics.

The source inspected in this batch is the existing local `daam-main สำเนา/control/connectPDO.php`; it contains MySQL PDO code and ALTER TABLE for userRank/userDepartment. Credential/DSN assignments were not displayed. The file was never executed or modified. No second src/ tree was created: the existing repository uses root app/ and lib/, so the new connection entry point is lib/db.ts.

User-run schema review: docs/sql/schema-review-read-only.sql. Review the result locally and remove sensitive data before sharing. It selects metadata only and intentionally excludes account rows, password/hash values, column defaults and comments. Codex must not run it remotely or test local web routes which may query the live database.
