# Database mapping

This is a static map from connector and operation source. Existing database files and services require runtime verification in a separately authorized round.

| Module | Legacy connection and tables | Read and write behavior | Next.js data access | Known risks |
|---|---|---|---|---|
| Login | Trace login.php and its PDO include separately from the admin pages | Lookup account, verify hash, enforce active status | lib/db.ts, server-only mysql2 pool | PHP and MySQL account datasets can differ |
| Dashboard | connectPDO_dev.php, durable_articles, borrow_back, classification, _sync_meta | Scoped counts, recent rows, sync timestamp | lib/sqlite/dashboard.ts | SQLite visibility and approval fields are required |
| Manage Data | connectPDO_dev.php, durable_articles, building, building_classroom, classification, status_active, borrow_back, repair | Scoped asset reads; transactional status and optional repair record; visibility writes | lib/sqlite/assets.ts, catalog.ts, actions.ts | CRUD and external photo paths still require audit |
| Manage Users | connectPDO_dev.php, useraccount | ID admin global scope; department scope otherwise | lib/sqlite/catalog.ts | Login is on a separate MySQL data source; do not assume SQLite edits change login |
| Approvals | connectPDO_dev.php, durable_articles, joins to location/category/creator | Pending is is_approved=0; approval sets 1 and s0001; rejection deletes | lib/sqlite/approvals.ts, actions.ts | Deletion blocked until backup is verified |
| History | db.php, borrow_back, durable_articles, useraccount | Borrow ID lookup, return transition, asset status transaction, reminder timestamp | lib/sqlite/history.ts, actions.ts, history-reminder.ts | Mail delivery and SQLite commit are separate; destructive deletion disabled |
| CSV | process_import.php via connectPDO_dev.php | CSV mapping and transactional import/update | Browser preview only | No import write path yet |
| Repairs | db.php, repair, durable_articles | Read repair history, create/update/delete with legacy repair ID | lib/sqlite/admin-modules.ts, asset-status operation | Standalone repair CRUD pending |
| QR | connectPDO_dev.php, durable_articles, classification, building | Read only; visible assets, QR encodes asset number | lib/sqlite/qr.ts | Original QR target borrow_request.php remains legacy |
| Reports | db.php, durable_articles, borrow_back, repair, classification | Scoped aggregations | reports route and SQLite read service | Time-series/report coverage partial |
| Mail | db.php, system_settings, borrow_back; mailer.php | Settings and UBU REST Mail API, last_reminded_at and file log | SQLite settings reads, History reminder route | Configuration edits pending; credentials server only |
| Sync | sync_database.php, control/daam.sql and control/daam_dev.sqlite | Imports dump into working SQLite; may alter schema/data | No sync action enabled | Requires separate authorization and impact review |
| Older legacy handlers | control/connectDB.php / connectPDO.php references | Trace actual callers and mutations | Pending | Do not equate legacy MySQL tables with enriched SQLite |

Both db.php and connectPDO_dev.php resolve to control/daam_dev.sqlite and contain automatic schema behavior. SQLite serves application data for the mapped Admin modules, even though the connector filename mentions development. MySQL remains the authentication source for Next.js. Confirm PK/FK and column contracts from sanitized schema definitions before further writes. Do not run connector files or replay the SQL dump as an audit step.
