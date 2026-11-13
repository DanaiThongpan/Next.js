# Phase 4 / P4-B1 — source provenance audit

2026-11-05. Phase 4 explicitly authorized. Latest authoritative PHP root: /Users/imac-ES7/Downloads/daam-main. All four target files exist and SHA256 match the project copy daam-main สำเนา/admin: main.php, manage_data.php, manage_users.php, print_qrcode.php. No original PHP edited/executed.

Verified source references connectPDO_dev.php (SQLite) for Dashboard, user management and QR printing; inspect full manage_data dependency chain next. Source connector points to control/daam_dev.sqlite and contains auto migrations: NEVER EXECUTE. Root daam_dev.sqlite also exists but is not the connector target.

Authorized SQLite mode=ro + PRAGMA query_only=ON aggregate reads succeeded after sandbox escalation. Durable articles total=4586; hidden is_visible=0 count=3567; approved (is_approved=1 OR NULL) AND visible (is_visible=1 OR NULL) count=1019. Latest _sync_meta.last_synced_at=2026-10-29 06:35:15. These are observations, never constants for application code. Earlier live MySQL total=4584 belongs to a different dataset lacking these flags. Do not merge datasets or claim MySQL raw total is PHP active total.

Remaining source analysis: all include/AJAX chains, asset permissions/filters/export/detail/photo behavior, complete Dashboard predicates and SQLite-to-runtime access design. User instruction permits local SQLite read-only inspection; determine runtime source selection explicitly and preserve MySQL authentication. No automatic data import/sync or DB mutations.

User management source: strict UT00000001 gate; ONLY exact account ID admin sees all departments. Other Admins see only matching userDepartment; blank department yields no users. Do NOT reuse Dashboard allDepartments predicate for this page. Original SELECT * includes hashes: new service must select safe fields explicitly and paginate.

QR source: local qrcode.min.js, error correction M; scan URL built from scanBaseUrl + urlencode(DA_Number), inspect exact base before implementation. A4 210x297mm with 10mm vertical/8mm horizontal margins. Default sticker 44x52mm gap3mm; small 28x38 gap2.5mm; large preset exists. Inspect exact JS/layout and encode locally; do not use external QR endpoint.

No new routes implemented yet. Existing Dashboard raw MySQL measure remains explicitly labelled, not equivalent to PHP active count. Pending routes: /admin/manage-data, /admin/manage-users, /admin/print-qrcode. Keep existing menus marked development until implemented and tested. No fresh Phase4 lint/build or authenticated browser tests claimed.

Next batch: finish source read, implement source-safe Dashboard and paginated read-only services/routes, QR payload/print rendering, navigation; test scope/security/pagination/QR and live user-authorized browser; run TS/lint/tests/offline build. Never create fake sessions or write MySQL/SQLite/PHP.
