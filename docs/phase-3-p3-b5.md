# P3-B5 — verified MySQL registry measures

2026-11-05. Live read-only service verification; authenticated browser verification remains pending. No database writes, schema changes, PHP changes, account creation or forged session.

PHP admin API uses control/connectPDO_dev.php, whose source explicitly selects SQLite and adds development approval/visibility fields. BorrowService depends on those fields. Live MySQL metadata from B4 has no equivalent approval/visibility/ownership fields or borrow status. durable_articles.useraccountID is not proven equivalent to created_by or owner_department; it is not used to broaden access.

Two existing widget slots now support explicitly labelled MySQL registry measures when both approval and visibility fields are absent, only for existing allDepartments-authorized Admin identities, never hidden mode or scoped Admins. Total is all rows in durable_articles, deliberately labelled ทะเบียนครุภัณฑ์ MySQL ทั้งหมด instead of claiming approved/visible total. Category chart uses classificationID equality and COUNT(DA_ID), GROUP BY classification ID/name, top six descending. This is a documented alternative measure, not an equivalent approval-filtered formula. An informational banner states its scope. Original full-schema formulas remain unchanged.

Shared lib/db.ts and exact SQL allowlist executed both statements successfully in read-only transaction. Actual total: 4584. Top six: สำนักงาน 2275, การศึกษา 1125, คอมพิวเตอร์ 458, ไฟฟ้าและวิทยุ 332, โฆษณาและเผยแพร่ 303, งานบ้านงานครัว 32. Top-six is not the full category total. Only aggregate nonpersonal data read for this check. No SELECT privilege expansion attempted; write privileges have not been verified.

Pending approval, availability, maintenance under original approval scope, borrowing status, recent activity visibility/scope and sync remain unavailable where required metadata is missing. UI says ยังไม่สามารถคำนวณจาก Schema ปัจจุบันได้. No guessed zero, no substitute ownership joins, no fake pending-return flags. No new asset management/search/pagination workflow introduced beyond existing Dashboard.

Modified application files: lib/dashboard/model.ts, lib/dashboard/read.ts, lib/database/statements.ts, components/admin/dashboard-widgets.tsx. Test: tests/dashboard.test.ts adds global/scoped/hidden/full-schema boundary and real-measure propagation checks. Updated checkpoint docs. No .env.local changes this batch.

Validation: shared live SQL read passed. Test-account credentials not available; actual login/logout and authenticated browser graphs/cards remain unverified. Existing auth/RBAC offline tests cover these behaviors. B4 anonymous HTTP verified Login enabled and streamed Admin redirect. Do not claim logged-in visual verification. Original PHP not executed because its connection code contains auto migration.

TypeScript initially encountered duplicate generated '* 2.ts' files in .next/types. Removed only those generated duplicate files; not an application schema/code problem.

Next: authorized user logs in at http://localhost:3000/login, opens /admin and confirms scope. Global admin should see registry count/category; scoped admin must remain gated until ownership semantics established. Continue per-widget semantic research for remaining formulas, without database modifications. P3-B5 partially complete; no Phase 4.

Final checks: 32 offline tests passed; TypeScript, ESLint, guarded production build and git diff --check passed.

## P3-B5 runtime fix / authenticated verification — 2026-11-05

User reported total/category errors after adding approved statements. Existing DAAM dev server PID 87176 was confirmed by lsof cwd, stopped alone, restarted with npm run dev at 127.0.0.1:3000. No application code/DB edits needed. Likely stale global cached database service retained old SQL allowlist through HMR; restart resolved observed symptoms.
Verified actual already-authenticated Chrome localhost:3000/admin UI: total 4,584 and category chart accessible values 2275/1125/458/332/303/32 visible, no total/category load errors. Existing user session remained valid. Did not perform fresh credential login or logout. Missing-schema widgets remain unavailable, not fabricated. Shared service global cache means SQL allowlist/pool implementation changes require dev server restart. No automatic reconnect task scheduled.
