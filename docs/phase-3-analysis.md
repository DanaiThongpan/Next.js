# Phase 3 — source analysis before implementation

2026-11-04. Actual legacy source directory is `daam-main สำเนา`. Read only; no PHP was executed, included or imported.

Reviewed `admin/main.php`, `admin/api_dashboard_data.php`, `includes/BorrowService.php::getDashboardData`, `component/admin_{header,sidebar,navbar,footer}.php`, `css/admin_{responsive,dashboard}.css`, inline JavaScript/styles, the Phase 2 session/policy code, and SQLite/MySQL metadata.

## Original structure

260px slate desktop sidebar with independently scrollable menu and fixed bottom profile/logout; 280px mobile drawer below 992px. White fixed navbar contains hamburger/title and QR shortcut. Content scrolls independently on pale gray background; sticky footer shows Asset Management System, Enterprise Responsive Layout, Version 2.5. Sarabun/Prompt fonts, Font Awesome 6.4 icons; brand is screwdriver/wrench icon + Admin Panel, not an image logo. Profile avatar is inline SVG. No bundled local font/logo asset was found for this dashboard.

Four cards: total approved assets by visibility; currently borrowed records; overdue records; pending registrations. Doughnut: available/borrowed/maintenance, with original 3.5% minimum visual arc and raw tooltip values. Category bar: top six categories by approved asset count. Recent activities: five records ordered by borrow ID descending. Five quick links: approvals, QR, CSV, assets, users. Urgent alerts appear for positive pending/overdue counts. Refresh/retry and view_mode are read-only interactions; database sync is a write operation and must remain disabled. The actual main script does initial/manual fetch, not an active SSE subscription.

Admin menu order/icons: house dashboard, boxes-stacked assets, users-gear users, qrcode, clipboard-check approvals, clock-rotate-left history, file-csv imports, wrench repairs, chart-pie reports, envelope-circle-check mail. Other pages remain clearly labeled development placeholders.

## Authentication and scope

Reuse Phase 2 live account/session checks. Type exactly UT00000001 is required for every Admin page; anonymous redirects to /login, ordinary users to /unauthorized. No auth bypass/test login mode.

Dashboard JSON API computes all-department scope only after the Admin gate: type 'Super Admin', lowercased ID admin/admin_test, session username admin, lowercased display name administrator, empty department (PHP empty also includes '0'), or department ส่วนกลาง. Migrated login never creates legacy username/department_id/department_name aliases; use the verified current ID/name/type/department fields. Sidebar badge separately uses exact ID admin or type Super Admin. These are distinct original display/data-scope rules, not grants to enter Admin. Port this dashboard-specific API predicate without changing Phase 2's role gate.

## Actual schema mismatch

SQLite was opened using mode=ro and metadata only. MySQL inspection used START TRANSACTION READ ONLY and INFORMATION_SCHEMA, no personal records.

Missing in live MySQL:
- durable_articles.is_approved, is_visible, owner_department, created_by
- borrow_back.status
- _sync_meta table

Existing common columns include asset/status/category IDs, asset names/numbers, borrow IDs and borrow/return/deadline dates; column existence alone cannot establish approval, visibility or department semantics. The normal-mode original formulas all need at least one missing column. Do not substitute unconditional counts, infer ownership from useraccountID/building, or infer status only from Date_back. Show “ยังไม่สามารถเชื่อมโยงข้อมูลได้” per dependent widget. No mock zeros or made-up charts.

The sidebar's original overdue badge has a separate, global formula using only Date_back and Deadline_borrow and is schema-compatible; keep that formula distinct from the main overdue widget (which also requires status/visibility/department scope). Pending sidebar badge needs is_approved and is unavailable. _sync_meta timestamp cannot be mapped; sync operation stays disabled.

## Original visual inspection limitation

An attempt to access localhost:8000/admin/main.php was rejected by automatic approval review because requesting PHP could execute a connector with auto-migrations. No workaround or retry was attempted. The PHP screen was not inspected live; implementation is based on source/CSS/assets. Existing PHP remains untouched.
