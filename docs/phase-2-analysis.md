# Phase 2 — Analysis before implementation

2026-11-04. Source directory: `daam-main สำเนา`. PHP is read only, never executed/imported. The user explicitly authorized replacing SQLite with MySQL for authentication.

## Compatibility gate (passed)

SQLite was opened with `mode=ro`, PRAGMA metadata only. MySQL was inspected in `START TRANSACTION READ ONLY`. No account identities, names, departments, passwords or hashes were included in inspection output.

| Field | SQLite | MySQL | Use |
| --- | --- | --- | --- |
| useraccountID | VARCHAR(100), PK | varchar(100), PK | Login identifier |
| userPassword | TEXT | varchar(255) | PHP password_verify-compatible bcrypt |
| userActive | VARCHAR(10) | varchar(2) | Must equal '1' |
| useraccountType | VARCHAR(50) | varchar(10) | Admin gate |
| useraccountName | TEXT | varchar(255) | Display after authentication |
| userDepartment | TEXT | varchar(255) nullable | Display, not a general role grant |
| userRank | TEXT | varchar(255) nullable | Not needed for authentication |
| userEmail | VARCHAR(150) | absent | Not used by login; not queried |

Both databases have `usertype(useraccountType PK, usertypeName)`. Login does not join that table; the stored type code controls redirect and access. No dedicated permission table was found in the Phase 1 MySQL inventory. All 11 MySQL password values matched bcrypt structure, costs 10–12. No unsupported/empty hash formats were found. Stored values were never printed.

## Observed behavior and matrix

| PHP source | Actual gate / behavior | Phase 2 |
| --- | --- | --- |
| login.php | ID trimmed; userActive='1'; password_verify; regenerate session ID; UT00000001 → admin/main.php, other types → user/main.php; optional validated redirect | /login → /admin or /user; only implemented allowlisted redirect destinations |
| logout.php | session_unset + session_destroy | POST logout revokes server-side session |
| admin/main.php | Selogin=1 AND type exactly UT00000001 | /admin requires live active account of that type |
| user/main.php | Selogin=1 (any type) | /user requires an active authenticated account |
| component/admin_sidebar.php | Lists dashboard, assets, users, QR, approvals, history, CSV, repair, reports, mail for every admitted admin | Same labels, protected placeholder destinations |
| admin/manage_data.php, manage_users.php, approve_items.php | Admin type; ID 'admin' additionally controls all-department scope | Admin-only placeholders; no data/actions migrated |
| admin/print_qrcode.php, manage_repairs.php | Admin type; additional ID/type-based scope checks | Admin-only placeholders |
| admin/import_csv.php → component/admin_header.php | Shared header gate requires authenticated admin | Admin-only placeholder |
| admin/process_import.php | Authenticated admin type | No import endpoint |
| user/history.php, user/request_item.php | Authenticated AND type exactly UT00000002 | Only that type sees/opens history/request placeholders |
| borrow_request.php | Authenticated session; otherwise preserves redirect | Authenticated borrow placeholder; no loan API |
| user/main.php navigation | Dashboard, available assets, borrow, borrowed assets, history, request registration/CSV/history | Type-specific links; no fake counters/data |

Session PHP fields: Selogin, SeUser, Sename, useraccountType, SeType, userDepartment; optional redirect_url. No rate limiter was found in the login handler. A submitted redirect may override the role home in PHP; Next.js restricts this to implemented, authorized destinations and never invokes PHP.

## Inconsistent legacy checks — deferred parts

- admin/main.php considers type, selected account IDs, username/name and empty/central department when computing Super Admin. The included sidebar overwrites the same variable with a narrower rule. Other admin pages use different rules.
- admin/admin_history.php and report_details.php check login only despite their admin labels. settings_mail.php accepts a broader boolean condition than the admin dashboard; its POST handler has another condition.
- These inconsistent data/action permissions are **not migrated or expanded** in Phase 2. The user's explicit instruction requires every /admin destination to reject ordinary users. All corresponding pages are nonfunctional placeholders behind that strict gate. No Super Admin role or cross-department authorization is invented. Exact data/action migration needs a separate user decision before those features are implemented.
- userRank is not used for any Phase 2 permission. Department does not grant admin access.
- No authorized real test account has been supplied. Successful/failed password and role flows will be tested with isolated mock repositories and synthetic credentials, never by trying a real account.
