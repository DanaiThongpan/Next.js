# Legacy source inventory

Recursive inventory: 17391 files, 165 outside dependency/generated directories, 120 application PHP files inspected for static markers. PHP was not executed.

Third-party/generated files are grouped by type. Findings below are static discovery and require call-flow review before migration. Includes can be dynamic. No configuration values or database records are reproduced.

| File Path | File Type | Purpose/evidence | Dependencies | Database Usage | User Roles | Related Pages | Priority | Notes |
|---|---|---|---|---|---|---|---|---|
| admin/admin/main.php | PHP | redirect | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin/admin_history.php | PHP | Loan history | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../cron_reminder.php, /../db.php, /../includes/BorrowService.php, manual_remind.php, settings_mail.php | SQLite connector marker; SELECT | Admin | /admin/history | Core | Static markers |
| admin/api_dashboard_data.php | PHP | session, redirect, JSON | /../control/connectPDO_dev.php, /../includes/BorrowService.php | SQLite connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| admin/api_toggle_location.php | PHP | session, redirect, JSON | /../control/connectPDO_dev.php | SQLite connector marker; ALTER TABLE, SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/approve_items.php | PHP | Pending requests | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../control/connectPDO_dev.php, /../includes/BorrowService.php, approve_items.php | SQLite connector marker; SELECT | Admin | /admin/approvals | Core | Static markers |
| admin/edit_durable_article.php | PHP | session, redirect, file upload | ../control/connectPDO_dev.php, /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, manage_data.php | SQLite connector marker; SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/edit_user.php | PHP | session, redirect | ../control/connectPDO_dev.php, /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, manage_users.php | SQLite connector marker; SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/import_csv.php | PHP | CSV preparation | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, process_import.php | Trace includes; SELECT | Admin | /admin/csv | Core | Static markers |
| admin/insert_Repair.php | PHP | session | ../control/connectPDO_dev.php | SQLite connector marker; INSERT INTO, SELECT | Session marker | — | Trace callers | Static markers |
| admin/logout.php | PHP | PHP source unit | /../logout.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin/main.php | PHP | Dashboard | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../control/connectPDO_dev.php, admin_history.php, approve_items.php, import_csv.php, manage_data.php, manage_users.php, print_qrcode.php, sync_now.php | SQLite connector marker; SELECT | Admin | /admin | Core | Static markers |
| admin/manage_data.php | PHP | Asset administration | ../control/connectPDO_dev.php, /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, import_csv.php, manage_data.php, manage_users.php, print_qrcode.php, sync_now.php | SQLite connector marker; INSERT INTO, SELECT, UPDATE | Admin | /admin/manage-data | Core | Static markers |
| admin/manage_durable_articles.php | PHP | PHP source unit | /manage_data.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin/manage_repairs.php | PHP | Repair records | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../db.php, main.php, manage_data.php, manage_repairs.php | SQLite connector marker; DELETE FROM, INSERT INTO, SELECT, UPDATE | Admin | /admin/repairs | Core | Static markers |
| admin/manage_users.php | PHP | User administration | ../control/connectPDO_dev.php, ../register.php, /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, manage_data.php | SQLite connector marker; SELECT | Admin | /admin/manage-users | Core | Static markers |
| admin/manual_remind.php | PHP | session, redirect, JSON, mail | /../db.php, /../mailer.php, admin_history.php | SQLite connector marker; SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/oauth_callback.php | PHP | session, redirect, JSON | /../db.php, /../vendor/autoload.php, /oauth_callback.php, settings_mail_oauth.php | SQLite connector marker; SELECT, UPDATE | Session marker | — | Trace callers | Static markers |
| admin/page_EditDurableArticles.php | PHP | redirect | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin/page_Repair_AddEdit.php | PHP | session, redirect, JSON | ../control/connectPDO_dev.php, /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, manage_data.php, page_Repair_AddEdit.php | SQLite connector marker; DELETE FROM, INSERT INTO, SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/print_qr.php | PHP | session, redirect | ../control/connectPDO_dev.php | SQLite connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| admin/print_qrcode.php | PHP | Batch QR | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../control/connectPDO_dev.php, print_qrcode.php | SQLite connector marker; SELECT | Admin | /admin/print-qrcode | Core | Static markers |
| admin/process_import.php | PHP | session, redirect, file upload | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../control/connectPDO_dev.php, import_csv.php, manage_data.php | SQLite connector marker; INSERT INTO, SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/process_mail_settings.php | PHP | session, redirect, JSON, mail | /../db.php, /../mailer.php | SQLite connector marker; INSERT INTO, SELECT, UPDATE | Admin gate marker | — | Trace callers | Static markers |
| admin/report_details.php | PHP | Reports | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../db.php, /../includes/BorrowService.php, admin_history.php, main.php, report_details.php | SQLite connector marker; SELECT | Admin | /admin/reports | Core | Static markers |
| admin/settings_mail.php | PHP | Mail settings | /../component/admin_footer.php, /../component/admin_header.php, /../component/admin_navbar.php, /../component/admin_sidebar.php, /../db.php, admin_history.php, main.php, process_mail_settings.php | SQLite connector marker; INSERT INTO, SELECT | Admin | /admin/mail | Core | Static markers |
| admin/settings_mail_oauth.php | PHP | PHP source unit | /settings_mail.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin/sync_now.php | PHP | session, redirect, JSON | /../sync_database.php | Trace includes; no direct SQL marker | Admin gate marker | — | Trace callers | Static markers |
| admin/update_Repair.php | PHP | session | ../control/connectPDO_dev.php | SQLite connector marker; UPDATE | Session marker | — | Trace callers | Static markers |
| admin/user/history.php | PHP | redirect | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| admin_history.php | PHP | PHP source unit | /admin/admin_history.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| api/sse_dashboard.php | PHP | session, redirect, JSON | /../control/connectPDO_dev.php, /../includes/BorrowService.php | SQLite connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| api_search_assets.php | PHP | session, redirect, JSON | /control/connectPDO_dev.php | SQLite connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| api_toggle_location.php | PHP | PHP source unit | /admin/api_toggle_location.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| borrow_request.php | PHP | QR borrowing entry | /control/connectPDO_dev.php, /includes/BorrowService.php, admin/main.php, borrow_request.php, user/main.php | SQLite connector marker; SELECT | Review required | — | Trace callers | Static markers |
| component/admin_footer.php | PHP | PHP source unit | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| component/admin_header.php | PHP | session, redirect | /../control/connectPDO_dev.php | SQLite connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| component/admin_navbar.php | PHP | PHP source unit | print_qrcode.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| component/admin_sidebar.php | PHP | session | ../logout.php, admin_history.php, approve_items.php, import_csv.php, main.php, manage_data.php, manage_repairs.php, manage_users.php, page_Repair_AddEdit.php, print_qrcode.php, report_details.php, settings_mail.php | Trace includes; SELECT | Session marker | — | Trace callers | Static markers |
| component/nav.php | PHP | session | logout.php, main.php, page_BackDA.php, page_BorrowDA.php, page_Classification.php, page_DataborrowbackDA.php, page_StatusActive.php, page_building.php, page_durable_articles.php, page_useraccount.php | Trace includes; no direct SQL marker | Admin gate marker | — | Trace callers | Static markers |
| control/connectDB.php | PHP | PHP source unit | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| control/connectPDO.php | PHP | PHP source unit | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| control/connectPDO_dev.php | PHP | PHP source unit | — | Trace includes; ALTER TABLE, CREATE TABLE, INSERT INTO, SELECT | Admin gate marker | — | Trace callers | Static markers |
| control/sync_database.php | PHP | PHP source unit | /../sync_database.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| cron_reminder.php | PHP | redirect, mail, CLI | /db.php, /mailer.php | SQLite connector marker; SELECT, UPDATE | Review required | — | Trace callers | Static markers |
| db.php | PHP | PHP source unit | — | Trace includes; ALTER TABLE, CREATE TABLE, INSERT INTO, SELECT, UPDATE | Review required | — | Trace callers | Static markers |
| includes/BorrowService.php | PHP | PHP source unit | — | Trace includes; DELETE FROM, INSERT INTO, SELECT, UPDATE | Review required | — | Trace callers | Static markers |
| index.php | PHP | Entry into login | /login.php | Trace includes; no direct SQL marker | Public | / | Core | Static markers |
| legacy/Update_BorrowDA.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/del_Building.php | PHP | session | ../control/connectDB.php | MySQL connector marker; DELETE FROM, SELECT | Session marker | — | Trace callers | Static markers |
| legacy/del_Classification.php | PHP | session | ../control/connectDB.php | MySQL connector marker; DELETE FROM, SELECT | Session marker | — | Trace callers | Static markers |
| legacy/del_Classroom.php | PHP | session | ../control/connectDB.php | MySQL connector marker; DELETE FROM | Session marker | — | Trace callers | Static markers |
| legacy/del_StatusActive.php | PHP | session | ../control/connectDB.php | MySQL connector marker; DELETE FROM, SELECT | Session marker | — | Trace callers | Static markers |
| legacy/index.php | PHP | session | login.php, register.php | Trace includes; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/insert_BorrowDA.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/insert_Building.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/insert_Classification.php | PHP | session | ../control/connectDB.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/insert_Classroom.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/insert_DurableArticles.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/insert_Repair.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/insert_StatusActive.php | PHP | session | ../control/connectDB.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/insert_UserAccount.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadBuilding.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadClassification.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadClassroom.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadDashboard_CountDA.php | PHP | session, JSON | ../control/connectPDO.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/loadListClassification.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadListStatusActive.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadStatus_Active.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableBorrow_DataDA.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableBorrow_forBack.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableBuilding.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableClassroom.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableDataBorrowBackDA.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableDurableArticles.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableDurableArticlesBySelect.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/loadTableUserAccount.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| legacy/loadTypeUser.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; SELECT | Review required | — | Trace callers | Static markers |
| legacy/login.php | PHP | session | ../control/connectDB.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/logout.php | PHP | session | — | Trace includes; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/main.php | PHP | session | ../component/nav.php, ../control/connectDB.php, loadDashboard_CountDA.php | MySQL connector marker; SELECT | Admin gate marker | — | Trace callers | Static markers |
| legacy/page_BackDA.php | PHP | session | ../component/nav.php, ../control/connectDB.php, Update_BorrowDA.php, loadTableBorrow_forBack.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_BorrowDA.php | PHP | session | ../component/nav.php, ../control/connectDB.php, insert_BorrowDA.php, loadTableBorrow_DataDA.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_Classification.php | PHP | session | ../component/nav.php, ../control/connectDB.php, del_Classification.php, insert_Classification.php, loadListClassification.php, update_Classification.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_Classroom.php | PHP | session | ../component/nav.php, ../control/connectDB.php, del_Classroom.php, loadTableClassroom.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/page_DataborrowbackDA.php | PHP | session | ../component/nav.php, ../control/connectDB.php, loadTableDataBorrowBackDA.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_DisActiveUseraccount.php | PHP | PHP source unit | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Review required | — | Trace callers | Static markers |
| legacy/page_EditDurableArticles.php | PHP | session | ../component/nav.php, ../control/connectDB.php, loadClassroom.php, page_durable_articles.php, update_DurableArticles.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/page_Edituseraccount.php | PHP | session | ../component/nav.php, ../control/connectDB.php, page_useraccount.php, update_UserAccount.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/page_Repair_AddEdit.php | PHP | session | ../component/nav.php, ../control/connectDB.php, insert_Repair.php, page_durable_articles.php, update_Repair.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/page_StatusActive.php | PHP | session | ../component/nav.php, ../control/connectDB.php, del_StatusActive.php, insert_StatusActive.php, loadListStatusActive.php, update_StatusActive.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_building.php | PHP | session | ../component/nav.php, ../control/connectDB.php, del_Building.php, insert_Building.php, loadTableBuilding.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/page_durable_articles.php | PHP | session | ../component/nav.php, ../control/connectDB.php, insert_DurableArticles.php, loadBuilding.php, loadClassification.php, loadClassroom.php, loadStatus_Active.php, loadTableDurableArticles.php, loadTableDurableArticlesBySelect.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/page_useraccount.php | PHP | session | ../component/nav.php, ../control/connectDB.php, insert_UserAccount.php, loadTableUserAccount.php, loadTypeUser.php | MySQL connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| legacy/test.php | PHP | PHP source unit | q_db.php | SQLite connector marker; no direct SQL marker | Review required | — | Trace callers | Static markers |
| legacy/update_Building.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_Classification.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_Classroom.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_DurableArticles.php | PHP | session, file upload | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_Repair.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_StatusActive.php | PHP | session | ../control/connectDB.php | MySQL connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| legacy/update_UserAccount.php | PHP | PHP source unit | control/connectPDO.php | MySQL connector marker; UPDATE | Review required | — | Trace callers | Static markers |
| login.php | PHP | Login | /control/connectPDO_dev.php, register.php | SQLite connector marker; SELECT | Public | /login | Core | Static markers |
| logout.php | PHP | Logout | — | Trace includes; no direct SQL marker | Session | /api/auth/logout | Core | Static markers |
| mail_config.php | PHP | mail | — | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| mailer.php | PHP | JSON, mail | /db.php | SQLite connector marker; SELECT | Review required | — | Trace callers | Static markers |
| manual_remind.php | PHP | PHP source unit | /admin/manual_remind.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| migrate_data.php | PHP | PHP source unit | admin/manage_data.php | Trace includes; SELECT | Review required | — | Trace callers | Static markers |
| process_mail_settings.php | PHP | PHP source unit | /admin/process_mail_settings.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| refactor.php | PHP | PHP source unit | index_v2.php, refactor.php, register.php, register_process.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| register.php | PHP | session | control/connectPDO_dev.php, index.php, register_process.php | SQLite connector marker; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| register_process.php | PHP | session, redirect | control/connectPDO_dev.php | SQLite connector marker; INSERT INTO | Session marker | — | Trace callers | Static markers |
| report_details.php | PHP | PHP source unit | /admin/report_details.php | Trace includes; no direct SQL marker | Review required | — | Trace callers | Static markers |
| sync_database.php | PHP | session, redirect, JSON, CLI | — | Trace includes; CREATE TABLE, INSERT INTO, SELECT | Admin gate marker | — | Trace callers | Static markers |
| user/borrow_action.php | PHP | session, redirect | ../borrow_request.php | Trace includes; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| user/borrow_form.php | PHP | session, redirect | ../borrow_request.php | Trace includes; no direct SQL marker | Session marker | — | Trace callers | Static markers |
| user/history.php | PHP | session, redirect, JSON | ../borrow_request.php, ../logout.php, /../control/connectPDO_dev.php, history.php, main.php, request_item.php | SQLite connector marker; SELECT | Session marker | — | Trace callers | Static markers |
| user/main.php | PHP | User landing | ../borrow_request.php, ../logout.php, /../control/connectPDO_dev.php, history.php, main.php, request_item.php | SQLite connector marker; SELECT | User | /user | Core | Static markers |
| user/process_request_csv.php | PHP | session, redirect, file upload | /../control/connectPDO_dev.php | SQLite connector marker; INSERT INTO, SELECT | Session marker | — | Trace callers | Static markers |
| user/request_item.php | PHP | session, redirect | ../logout.php, /../control/connectPDO_dev.php, history.php, main.php, process_request_csv.php, request_item.php | SQLite connector marker; INSERT INTO, SELECT | Session marker | — | Trace callers | Static markers |
| user/return_form.php | PHP | session, redirect | ../control/connectPDO_dev.php, /../includes/BorrowService.php, main.php | SQLite connector marker; SELECT | Session marker | — | Trace callers | Static markers |

## Assets, configuration and other files

| Type | Project files | Third-party/generated |
|---|---:|---:|
| (none) | 2 | 625 |
| .0 | 0 | 1 |
| .1 | 0 | 1 |
| .12 | 0 | 2 |
| .a | 0 | 2 |
| .a99 | 0 | 2 |
| .ani | 0 | 1 |
| .apache | 0 | 3 |
| .apache2 | 0 | 1 |
| .arff | 0 | 16 |
| .avif | 0 | 1 |
| .b99 | 0 | 2 |
| .bak_4517 | 1 | 0 |
| .bsd | 0 | 3 |
| .build | 0 | 5 |
| .bz2 | 0 | 4 |
| .c | 0 | 9 |
| .cfg | 0 | 3 |
| .cpp | 0 | 1 |
| .csh | 0 | 1 |
| .css | 3 | 8 |
| .csv | 2 | 30 |
| .dat | 0 | 26 |
| .db | 2 | 0 |
| .dylib | 0 | 28 |
| .exe | 0 | 6 |
| .f | 0 | 20 |
| .f90 | 0 | 49 |
| .fish | 0 | 1 |
| .fits | 0 | 1 |
| .gz | 0 | 2 |
| .h | 0 | 93 |
| .hash | 0 | 8 |
| .history | 1 | 0 |
| .html | 0 | 34 |
| .ico | 0 | 3 |
| .ini | 0 | 4 |
| .jpeg | 1 | 6 |
| .jpg | 11 | 5 |
| .js | 1 | 210 |
| .json | 0 | 25 |
| .log | 1 | 0 |
| .map | 0 | 1 |
| .markdown-it | 0 | 1 |
| .mat | 0 | 110 |
| .md | 3 | 154 |
| .mit | 0 | 1 |
| .mod | 0 | 1 |
| .nc | 0 | 3 |
| .npy | 0 | 10 |
| .npz | 0 | 22 |
| .pem | 0 | 3 |
| .php | 120 | 4 |
| .pkl | 0 | 2 |
| .png | 4 | 44 |
| .prisma | 0 | 2 |
| .prompt | 0 | 1 |
| .ps1 | 0 | 1 |
| .pxd | 0 | 24 |
| .pxi | 0 | 1 |
| .py | 0 | 7136 |
| .pyc | 0 | 7136 |
| .pyf | 0 | 5 |
| .pyi | 0 | 230 |
| .pyx | 0 | 16 |
| .rst | 0 | 4 |
| .sav | 0 | 47 |
| .scm | 0 | 63 |
| .scss | 0 | 1 |
| .sh | 0 | 3 |
| .so | 0 | 339 |
| .sql | 3 | 0 |
| .sqlite | 2 | 0 |
| .sqlite-shm | 1 | 0 |
| .sqlite-wal | 1 | 0 |
| .svg | 0 | 29 |
| .template | 0 | 1 |
| .txt | 2 | 429 |
| .typed | 0 | 85 |
| .wav | 0 | 23 |
| .webp | 0 | 1 |
| .woff2 | 0 | 14 |
| .yaml | 4 | 36 |
| .yml | 0 | 1 |

## First-party non-PHP paths

- .DS_Store
- .aider.chat.history.md
- .aider.input.history
- .aider.tags.cache.v4/cache.db
- .continue/agents/new-config-1.yaml
- .continue/agents/new-config-2.yaml
- .continue/agents/new-config-3.yaml
- .continue/agents/new-config.yaml
- .continue/rules/new-rule.md
- .gitignore
- README.md
- admin/template_durable_articles.csv
- admin_cookies.txt
- control/daam.sql
- control/daam.sql.bak_4517
- control/daam_dev.sqlite
- control/daam_dev.sqlite-shm
- control/daam_dev.sqlite-wal
- cookies.txt
- css/admin_dashboard.css
- css/admin_responsive.css
- css/style.css
- daam_dev.sqlite
- debug_board.png
- img/Suppliesarticles.png
- img/noimg.jpg
- inventory.db
- js/qrcode.min.js
- logs/sent_emails.log
- schema_update.sql
- schema_update2.sql
- screenshot.png
- upload_imgBuilding/acb7.jpeg
- upload_imgBuilding/istockphoto-1459568052-612x612.jpg
- upload_imgBuilding/istockphoto-480268748-612x612.jpg
- upload_imgBuildingClassroom/firewatch.png
- upload_imgBuildingClassroom/istockphoto-1026834704-612x612.jpg
- upload_imgBuildingClassroom/istockphoto-480268748-612x612.jpg
- upload_imgDA/439437368_963987018583001_3763662881945897394_n.jpg
- upload_imgDA/439714031_1904274010010422_6881032947921484685_n.jpg
- upload_imgDA/Marshall-Emberton.jpg
- upload_imgDA/images.jpg
- upload_imgDA/ดาวน์โหลด (1).jpg
- upload_imgDA/ดาวน์โหลด.jpg
- user/template_request_items.csv
