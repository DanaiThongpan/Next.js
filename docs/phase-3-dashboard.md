# DAAM Phase 3 — Admin Dashboard migration

2026-11-04 (Asia/Bangkok). URL: http://localhost:3000/admin. UI migration and schema-aware read-only data layer completed. **Live main-widget data parity is blocked by missing MySQL schema semantics**, described below. No Phase 4 work started.

## Sources inspected

Actual source directory: `daam-main สำเนา` (the requested `daam-main` directory is not present).

- `admin/main.php`: UI markup, inline CSS, refresh/retry, urgency alerts, charts, drill-down, count-up and sync code.
- `admin/api_dashboard_data.php`: Admin gate, department/all-department scope, view mode, BorrowService call.
- `includes/BorrowService.php::getDashboardData`: all dashboard queries, formulas and activity status flags. Other write methods in that file are not ported or invoked.
- `component/admin_header.php`, `admin_sidebar.php`, `admin_navbar.php`, `admin_footer.php`: authentication, brand, profile SVG, menus/icons/order, mobile/desktop navigation, footer and dependency loading.
- `css/admin_responsive.css`, `css/admin_dashboard.css`: original dimensions/colors/cards/table layout and responsive breakpoints.
- SQLite metadata via a read-only connection and MySQL metadata via a read-only transaction; no PHP connection/migration code was executed.

See `phase-3-analysis.md` for the pre-implementation inventory and mapping decisions.

## UI migrated

- Sidebar: original 260px desktop width and 280px mobile drawer, slate background, menu order and original Font Awesome 6.4 icons; active item follows URL. Brand remains screwdriver/wrench + Admin Panel. Profile avatar SVG is copied from the original source.
- Navbar: fixed white header, hamburger/title and QR shortcut. Profile/logout remain in the bottom sidebar card.
- Dashboard: original pale background and four blue/amber/red/green summary cards, two chart panels, recent-activity table and five quick-action links in the original grid positions.
- Fonts: Sarabun and Prompt, bundled locally with Fontsource instead of runtime Google/CDN requests. Chart.js is also bundled locally.
- Chart implementation: original doughnut colors, 70% cutout, raw tooltip totals and 3.5% minimum visual slices; top-six category bar configuration; chart instances destroyed on cleanup. Charts are rendered only with successful mapped data, never placeholder values.
- Refresh and retry perform a new server render/query with Phase 2 authorization. View mode accepts only normal/all/hidden; other input defaults to normal.
- Mobile: one-column cards, responsive chart panels/table overflow, modal drawer with focus containment, Escape/close button, and menu-close on navigation. Desktop collapsed state persists only a UI preference in localStorage; no auth token is stored there.
- Footer: original Asset Management System / Enterprise Responsive Layout / Version 2.5 wording.
- Unmigrated menus lead only to clearly marked development placeholders. Assets, loans, user management, mail, CSV and sync functionality are not implemented.

## Data mapping and live limitations

The connection remains `192.168.15.201:3306`, database `daam`, account `tiw_dev`, password only from `.env.local`. Reuses `withReadOnlyDatabase` from Phases 1/2. Only INFORMATION_SCHEMA metadata and fixed parameterized SELECTs run, inside START TRANSACTION READ ONLY. No SQL endpoint, write operation, migration or privilege change was added.

| Widget | Original formula retained | Live status |
| --- | --- | --- |
| Total assets | Approved=1 or NULL; selected visibility; department scope | Unmapped: missing approval/visibility/scope fields |
| Borrowed | COUNT(*) joined borrow records; not returned; empty return date or pending_return; visibility/scope | Unmapped: missing status/visibility/scope |
| Overdue | Borrowed conditions plus Deadline_borrow < Bangkok current day | Unmapped: same missing fields |
| Pending registration | is_approved=0; visibility/scope | Unmapped |
| Maintenance | s0002 or other non-s0001/s0003 status, approved; visibility/scope | Unmapped |
| Available/doughnut | max(0, total - borrowed - maintenance); status distribution | Unmapped; no substitute zero/chart |
| Categories | Approved assets, visibility/scope, category JOIN, descending COUNT, LIMIT 6 | Unmapped |
| Recent activity | Original scoped JOIN, descending borrow ID, LIMIT 5, original returned/pending/overdue flags | Unmapped: status/visibility/scope |
| Sidebar pending badge | Global is_approved=0 (distinct original sidebar formula) | Unmapped |
| Sidebar overdue badge | Global empty Date_back AND Deadline_borrow < today (distinct original sidebar formula) | Schema-compatible SELECT retained; displays positive counts only, as PHP did |
| Last sync | _sync_meta.last_synced_at | Unmapped: table absent |

Confirmed missing MySQL fields: `durable_articles.is_approved`, `is_visible`, `owner_department`, `created_by`; `borrow_back.status`; and `_sync_meta` table. These exist in the SQLite metadata inspected. Existing `useraccountID`, `buildingID` or `Date_back` do not establish equivalent semantics and are not used to guess replacements. The live main cards, chart panels and recent table therefore display **“ยังไม่สามารถเชื่อมโยงข้อมูลได้”**. This is an explicit data limitation, not completed statistics migration.

No unconditional total is substituted for approved/visible/department-scoped counts. Missing-data, real-zero, empty-result and query-error states are distinct. Query exceptions produce generic errors without SQL/credentials/personal data. No recent borrower rows were read because their dependency gate failed.

## Authorization

Phase 2 is reused, not replaced. Every Admin page calls requireIdentity('admin') before querying/rendering; the server data entry point independently rejects any non-UT00000001 identity. Anonymous redirects to /login, ordinary users to /unauthorized. Build does not read account/dashboard rows.

The original JSON API's all-department predicate is ported specifically for dashboard reads, after the strict Admin gate: admin/admin_test ID (case-insensitive), administrator display name (case-insensitive), empty/'0'/ส่วนกลาง department. Legacy session aliases absent from the migrated login confer no rights. Sidebar Super Admin badge and disabled sync-button visibility keep their narrower original exact-ID rule. No general role or account privilege changed.

## Differences and intentionally disabled behavior

- Main statistics cannot be made equivalent until a reviewed read-only mapping for the missing semantics exists. No schema changes were attempted.
- Runtime libraries/fonts are local assets; jQuery, DataTables and SweetAlert are not loaded for this dashboard. Necessary interactions use React/native dialog/Chart.js.
- Sync is disabled and labeled because its original action writes/imports SQLite. No sync endpoint or legacy API call exists.
- Unmigrated drill-down destinations are placeholders; they do not apply functional inventory/loan filters.
- Actual valid numeric counts render directly rather than the original count-up animation; no numeric animation is applied to unknown data. New-row flash animation is not implemented because real recent-activity data is unmapped.
- Loading waits inside a Suspense boundary without exposing a Dashboard to unauthenticated users. Individual data errors retain visible widget error states.
- Sidebar items include a small “อยู่ระหว่างการพัฒนา” status. The schema-gap notice is an additional required migration status, not an invented statistic.
- Original PHP screen was **not** inspected live. Automatic approval review rejected the request to localhost:8000/admin/main.php because requesting PHP could run its auto-migration connector. No retry/workaround was attempted. Visual work used source/CSS/assets only.

## Logout issue found during real testing

The user reported Logout not working while switching test accounts. Phase 2's no-referrer response policy can make native POST forms send Origin:null, which the CSRF check correctly rejects. Auth/workspace response policy now uses `same-origin`; the isolated DB preview retains no-referrer. Missing/null/foreign origins remain rejected; the allowlist and CSRF validation were not loosened.

HTTP checks: same-origin logout 303 to /login with cookie expiry; null Origin logout 403. User reloaded and confirmed Logout worked, then personally logged in as a normal test User. Its live User screen was observed. No password/cookie was extracted or entered by the agent.

## Tests and verification

- Actual authorized Admin session in Chrome: dashboard rendered; font/icon assets, card grid, navbar, sidebar, profile and disabled sync state observed.
- Desktop Sidebar collapsed correctly and was restored. QR/assets links remain nonfunctional placeholder navigation. User-provided account sessions were used; no test account/session was manufactured.
- Chrome responsive device toolbar at **390×844**: one-column cards, fitted navbar and mobile drawer with close control/menu/profile observed. Temporary emulation and DevTools were restored/closed afterward.
- Refresh interaction: server render returned the schema-gap dashboard without a fabricated number.
- Anonymous HTTP GET /admin: Next.js streaming redirect to /login, no Admin profile in response.
- Authorized normal User in Chrome: direct /admin request visibly redirected to **/unauthorized**, showing “ไม่มีสิทธิ์เข้าถึงหน้านี้”.
- `npm run test:dashboard`: 8 groups passed (role rejection before queries; legacy scope; live-schema-shaped mismatch; read-only formula/query plans and limits; available math; activity status flags; chart arc/date math; independent errors/no leak).
- `npm run test:auth`: 8 existing groups passed, including explicit null-Origin rejection. Synthetic fixtures are isolated tests and are never displayed as live data.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` (Webpack): passed.
- Initial TypeScript check hit stale Next-generated route types immediately after adding the layout; regeneration through Next build resolved it. No source type check was disabled.
- Browser console inspected: HMR/React development messages and a smooth-scroll attribute warning, no application exception observed. Added data-scroll-behavior="smooth" to the root html to address that Bootstrap/Next warning. No real chart with mapped data could be visually tested because live schema dependencies are missing.
- npm reports 16 moderate audit findings already recorded in previous phases; no broad dependency upgrade was attempted.

## Files created/updated for Phase 3

Created:

- `lib/dashboard/model.ts`, `read.ts`, `server.ts`
- `components/admin/admin-shell.tsx`, `admin-navbar.tsx`, `admin-sidebar.tsx`, `admin-nav-link.tsx`, `dashboard-widgets.tsx`, `dashboard-chart.tsx`, `dashboard-controls.tsx`, `icon.tsx`
- `app/(workspace)/admin/layout.tsx`
- `app/(workspace)/admin/styles/admin_responsive.css`, `admin_dashboard.css` (scoped copies), `migration.css`
- `public/admin/avatar.svg` (copied original inline SVG)
- `tests/dashboard.test.ts`, `docs/phase-3-analysis.md`, this report

Updated:

- `app/(workspace)/admin/page.tsx`: replace Phase 2 dashboard placeholder with guarded dashboard.
- `app/(workspace)/admin/[section]/page.tsx`: keep placeholders under shared admin shell and server gate.
- `app/layout.tsx`: smooth-scroll integration attribute.
- `proxy.ts`: same-origin referrer policy fixes native Logout while preserving strict Origin checks.
- `tests/auth.test.ts`: reject Origin:null explicitly.
- `package.json`, lockfile: Chart.js, Font Awesome 6.4, local fonts, dashboard test command.

All PHP source files and MySQL data/schema/accounts/permissions remain unchanged.

References: Chart.js integration https://www.chartjs.org/docs/latest/getting-started/integration.html ; Fontsource https://fontsource.org/fonts/sarabun/install ; native-form Origin behavior https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy .
