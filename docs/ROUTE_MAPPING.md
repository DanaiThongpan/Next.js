# Route mapping

The mappings below identify entry points supported by static source review. Remaining PHP paths are discovery candidates, including includes that may not be routes.

| Legacy URL | Next.js URL | Purpose | Role | Parameters/forms/API | Status |
|---|---|---|---|---|---|
| /admin/admin_history.php | /admin/history | Loan history | Admin | action, id | Partial / review required |
| /admin/approve_items.php | /admin/approvals | Pending requests | Admin | action, da_id | Partial / review required |
| /admin/import_csv.php | /admin/csv | CSV preparation | Admin | Trace includes/forms | Partial / review required |
| /admin/main.php | /admin | Dashboard | Admin | view_mode | Partial / review required |
| /admin/manage_data.php | /admin/manage-data | Asset administration | Admin | action, da_id, filter_building, filter_category, filter_status, filter_visibility, filter_year, id, is_visible, repair_note, repair_price, status_id | Partial / review required |
| /admin/manage_repairs.php | /admin/repairs | Repair records | Admin | DAID, action, da_id, repairID, repair_Date, repair_Hisory, repair_Price | Partial / review required |
| /admin/manage_users.php | /admin/manage-users | User administration | Admin | Trace includes/forms | Partial / review required |
| /admin/print_qrcode.php | /admin/print-qrcode | Batch QR | Admin | building_id, category_id, keyword, limit, scan_base_url, show_border | Partial / review required |
| /admin/report_details.php | /admin/reports | Reports | Admin | action, borrow_id, end_date, id, start_date | Partial / review required |
| /admin/settings_mail.php | /admin/mail | Mail settings | Admin | Trace includes/forms | Partial / review required |
| /borrow_request.php | — | QR borrowing entry | Review required | action, asset_id, belongto_borrow, da_id, date_borrow, deadline_borrow, detail_back, detail_borrow, name_borrow, rank_borrow, userEmail | NOT_STARTED |
| /index.php | / | Entry into login | Public | Trace includes/forms | IMPLEMENTED_UNVERIFIED |
| /login.php | /login | Login | Public | login, password, redirect, username | Partial / review required |
| /logout.php | /api/auth/logout | Logout | Session | Trace includes/forms | Partial / review required |
| /user/main.php | /user | User landing | User | Trace includes/forms | Partial / review required |

## Current Next.js entry points

- /login
- /admin/[section]
- /admin/approvals
- /admin/csv
- /admin/history
- /admin/mail
- /admin/manage-data
- /admin/manage-users
- /admin
- /admin/print-qrcode
- /admin/repairs
- /admin/reports
- /dashboard
- /unauthorized
- /user/[section]
- /user
- /db-preview
- /
- /admin/manage-data/photo
- /api/admin/asset-detail
- /api/admin/history-reminder
- /api/admin/operations
- /api/auth/login
- /api/auth/logout
