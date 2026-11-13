# PHP :8000 vs Next.js :3000

ตรวจ Source เท่านั้น ทั้งสอง URL เป็นจุดอ้างอิง ไม่มีการเข้าหน้าเว็บจริงหรือเชื่อมฐานข้อมูล

| ID | ระบบ/หน้า | PHP :8000 | Next.js :3000 | UI | Functions | Database | Status |
|---|---|---|---|---|---|---|---|
| CMP-001 | จุดเข้าระบบ | `index.php` | `/` | ตรวจ markup เท่านั้น | include login.php → redirect /login | Session / ไม่มี query ที่จุดเข้า | UNVERIFIED |
| CMP-002 | เข้าสู่ระบบ | `login.php` | `/login` | ตรวจ markup เท่านั้น | ตรวจ account ที่ active ใน SQLite และ PHP session → MySQL identity, bcrypt และ server session | PHP SQLite → Next.js MySQL | DIFFERENT |
| CMP-003 | ออกจากระบบ | `logout.php` | `/api/auth/logout` | ตรวจ markup เท่านั้น | PHP session destruction → POST, origin validation และ revoke session | Session / ไม่มี query ที่จุดเข้า | DIFFERENT |
| CMP-004 | ส่งต่อหลัง Login | `login.php` | `/login` | ตรวจ markup เท่านั้น | รองรับ redirect ไปปลายทาง QR → จำกัดปลายทาง allowlist และไม่มี route QR borrow | PHP SQLite → Next.js MySQL | DIFFERENT |
| CMP-005 | ลงทะเบียน | `register_process.php` | `/register` | ยังไม่มีหน้าเทียบเท่า | สร้างบัญชี SQLite หลัง validation → ไม่มีหน้าและ API | ดู Database mapping และ Source | MISSING |
| CMP-006 | เปิดครุภัณฑ์จาก QR | `borrow_request.php` | `/borrow_request.php` | ยังไม่มีหน้าเทียบเท่า | Login แล้วเปิดรายการตาม asset_id → QR ยังชี้ PHP | ดู Database mapping และ Source | MISSING |
| CMP-007 | ค้นหาครุภัณฑ์ผู้ใช้ | `api_search_assets.php` | `/user/available` | ยังไม่มีหน้าเทียบเท่า | ค้น SQLite ตามเงื่อนไขใน handler → เมนู placeholder | ดู Database mapping และ Source | MISSING |
| CMP-008 | ผู้ใช้ส่งคำขอยืม | `user/borrow_action.php` | `/user/borrow` | ยังไม่มีหน้าเทียบเท่า | BorrowService จัดการรายการยืมและสถานะ → placeholder | ดู Database mapping และ Source | MISSING |
| CMP-009 | ผู้ใช้แจ้งคืน | `user/return_form.php` | `/user/borrowed` | ยังไม่มีหน้าเทียบเท่า | ส่งคำขอคืนสำหรับรายการยืม → placeholder | ดู Database mapping และ Source | MISSING |
| CMP-010 | รายการและประวัติผู้ใช้ | `user/history.php` | `/user/history` | ยังไม่มีหน้าเทียบเท่า | แสดงรายการยืมของผู้ใช้ → placeholder | ดู Database mapping และ Source | MISSING |
| CMP-011 | เสนอขึ้นทะเบียน | `user/request_item.php` | `/user/requests` | ยังไม่มีหน้าเทียบเท่า | รับข้อมูลคำขอครุภัณฑ์ → placeholder | ดู Database mapping และ Source | MISSING |
| CMP-012 | เสนอขึ้นทะเบียน CSV | `user/process_request_csv.php` | `/user/request-csv` | ยังไม่มีหน้าเทียบเท่า | ประมวลผล CSV คำขอผู้ใช้ → placeholder | ดู Database mapping และ Source | MISSING |
| CMP-013 | หน้าหลักผู้ใช้ | `user/main.php` | `/user` | ตรวจ markup เท่านั้น | หน้าหลักผู้ใช้และกลุ่มรายการยืม → ProtectedScreen เมนูและโครงหน้าพื้นฐาน | ดู Database mapping และ Source | PARTIAL |
| CMP-014 | Dashboard Admin | `admin/api_dashboard_data.php` | `/admin` | ตรวจ markup เท่านั้น | สูตรและข้อมูล scoped widgets ผ่าน PHP → SQLite server reads, cards, charts, recent table | ดู Database mapping และ Source | UNVERIFIED |
| CMP-015 | รายการครุภัณฑ์ Admin | `admin/manage_data.php` | `/admin/manage-data` | ตรวจ markup เท่านั้น | ตัวกรองหมวดหมู่เดี่ยวและ DataTables → หลายหมวดหมู่ตามที่อนุมัติ, SQL paging/sort | ดู Database mapping และ Source | DIFFERENT |
| CMP-016 | รายละเอียดครุภัณฑ์ | `admin/manage_data.php` | `/api/admin/asset-detail` | ตรวจ markup เท่านั้น | AJAX รายละเอียดและประวัติ 5 รายการ → scope เพิ่ม, detail และ history บางฟิลด์ | ดู Database mapping และ Source | PARTIAL |
| CMP-017 | รูปครุภัณฑ์ | `admin/manage_data.php` | `/admin/manage-data/photo` | ตรวจ markup เท่านั้น | แสดงรูปตาม legacy path → scope และ raster MIME allowlist | ดู Database mapping และ Source | PARTIAL |
| CMP-018 | แก้ไขครุภัณฑ์ | `admin/edit_durable_article.php` | `/admin/manage-data` | ยังไม่มีหน้าเทียบเท่า | ฟอร์มอัปเดตครุภัณฑ์และไฟล์ → ปุ่มแก้ไข disabled | ดู Database mapping และ Source | MISSING |
| CMP-019 | ซ่อน/แสดงครุภัณฑ์ | `admin/manage_data.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | อัปเดต is_visible → transaction และ scoped ownership | ดู Database mapping และ Source | UNVERIFIED |
| CMP-020 | เปลี่ยนสถานะและบันทึกซ่อม | `admin/manage_data.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | s0001/s0002 และ repair เมื่อมี note → transaction และ guard ยืมค้าง | ดู Database mapping และ Source | UNVERIFIED |
| CMP-021 | รายการผู้ใช้ Admin | `admin/manage_users.php` | `/admin/manage-users` | ตรวจ markup เท่านั้น | ตารางตามหน่วยงานและ DataTables → server paging, detail modal, disabled editing | ดู Database mapping และ Source | PARTIAL |
| CMP-022 | แก้ไขบัญชีและสิทธิ์ | `admin/edit_user.php` | `/admin/manage-users` | ยังไม่มีหน้าเทียบเท่า | ฟอร์มแก้ไข useraccount → disabled | ดู Database mapping และ Source | MISSING |
| CMP-023 | รายการรออนุมัติ | `admin/approve_items.php` | `/admin/approvals` | ตรวจ markup เท่านั้น | is_approved=0, scope, joins → server pagination และ pending cards | ดู Database mapping และ Source | UNVERIFIED |
| CMP-024 | อนุมัติคำขอ | `includes/BorrowService.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | อนุมัติและตั้ง s0001 → transaction, state and scope guard | ดู Database mapping และ Source | UNVERIFIED |
| CMP-025 | ปฏิเสธคำขอ | `includes/BorrowService.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | ลบรายการ pending → บล็อกที่ service จนยืนยัน backup | ดู Database mapping และ Source | DIFFERENT |
| CMP-026 | History Admin | `admin/admin_history.php` | `/admin/history` | ตรวจ markup เท่านั้น | ตาราง 6 คอลัมน์, quick filters, กฎวัน → SQL paging, KPI และ UI หลัก | ดู Database mapping และ Source | PARTIAL |
| CMP-027 | Admin รับคืน | `includes/BorrowService.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | อัปเดตการคืนและสถานะครุภัณฑ์ → SQLite transaction | ดู Database mapping และ Source | UNVERIFIED |
| CMP-028 | ลบประวัติ | `includes/BorrowService.php` | `/api/admin/operations` | ตรวจ markup เท่านั้น | ลบและคืนสถานะตามเงื่อนไข → บล็อกจนยืนยัน backup | ดู Database mapping และ Source | DIFFERENT |
| CMP-029 | อีเมลแจ้งเตือน | `admin/manual_remind.php` | `/api/admin/history-reminder` | ตรวจ markup เท่านั้น | legacy REST provider และเวลาใน SQLite → shared preview, provider เดิม, lock และ JSONL audit | ดู Database mapping และ Source | DIFFERENT |
| CMP-030 | เตรียม CSV | `admin/import_csv.php` | `/admin/csv` | ตรวจ markup เท่านั้น | แบบฟอร์มและ lookup reference data → preview กับ aliases/required fields | ดู Database mapping และ Source | PARTIAL |
| CMP-031 | นำเข้า CSV จริง | `admin/process_import.php` | `/admin/csv` | ยังไม่มีหน้าเทียบเท่า | บันทึกและปรับรายการใน transaction → ปุ่มนำเข้าปิด | ดู Database mapping และ Source | MISSING |
| CMP-032 | รายการซ่อม | `admin/manage_repairs.php` | `/admin/repairs` | ตรวจ markup เท่านั้น | ตารางและรายละเอียดตาม scope → generic table, filters, detail | ดู Database mapping และ Source | PARTIAL |
| CMP-033 | เพิ่ม/แก้ไข/ลบงานซ่อม | `admin/manage_repairs.php` | `/admin/repairs` | ยังไม่มีหน้าเทียบเท่า | ฟอร์มและ handlers เขียน repair → ฟอร์มปิด | ดู Database mapping และ Source | MISSING |
| CMP-034 | รายงานสถานะ/ประเภท | `admin/report_details.php` | `/admin/reports` | ตรวจ markup เท่านั้น | สรุปสถานะและประเภทพร้อมกราฟ → สรุปและตารางบางส่วน | ดู Database mapping และ Source | PARTIAL |
| CMP-035 | รายงานช่วงเวลาและอันดับ | `admin/report_details.php` | `/admin/reports` | ยังไม่มีหน้าเทียบเท่า | ชุดรายงานยืมคืนและอันดับ → ยังไม่มีชุดเทียบเท่า | ดู Database mapping และ Source | MISSING |
| CMP-036 | พิมพ์ QR แบบกลุ่ม | `admin/print_qrcode.php` | `/admin/print-qrcode` | ตรวจ markup เท่านั้น | ฟอร์มสร้าง QR และ grid auto-fill → ฟอร์มและ grid 3×4 ตามคำขอ | ดู Database mapping และ Source | DIFFERENT |
| CMP-037 | พิมพ์ QR รายชิ้น | `admin/print_qr.php` | `/admin/print-qrcode` | ตรวจ markup เท่านั้น | ปลายทางพิมพ์รายชิ้น → ลิงก์เปิดฟอร์มค้นหาชุด | ดู Database mapping และ Source | PARTIAL |
| CMP-038 | ตั้งค่าอีเมล | `admin/settings_mail.php` | `/admin/mail` | ตรวจ markup เท่านั้น | แสดงและแก้ไขค่าผู้ส่งและแจ้งเตือน → อ่าน safe fields และ disabled form | ดู Database mapping และ Source | PARTIAL |
| CMP-039 | Cron แจ้งเตือน | `cron_reminder.php` | `/admin/history` | ยังไม่มีหน้าเทียบเท่า | CLI ประมวลผลแจ้งเตือน → แสดงตัวอย่างคำสั่งเท่านั้น | ดู Database mapping และ Source | MISSING |
| CMP-040 | ซิงค์ SQL dump | `sync_database.php` | `/admin/manage-data` | ตรวจ markup เท่านั้น | นำ dump เข้า SQLite → ปุ่มซิงค์ปิดตามข้อกำหนด | ดู Database mapping และ Source | DIFFERENT |
| CMP-041 | ตั้งค่าสถานที่ | `admin/api_toggle_location.php` | `—` | ยังไม่มีหน้าเทียบเท่า | endpoint เปลี่ยนสถานะสถานที่ → ไม่มี route เทียบเท่า | ดู Database mapping และ Source | MISSING |
| CMP-042 | OAuth อีเมล | `admin/settings_mail_oauth.php` | `—` | ยังไม่มีหน้าเทียบเท่า | หน้า OAuth และ callback แยก → ไม่มี route เทียบเท่า | ดู Database mapping และ Source | MISSING |

## หลักฐานแยกตามไฟล์ PHP

เครื่องหมายจากเนื้อหาไฟล์ ไม่ใช่หลักฐานว่าทุกไฟล์เป็น URL ที่เปิดใช้จริง รวมไฟล์ include และรุ่นเก่าไว้เพื่อไล่ caller ต่อ

| Path | Source markers |
|---|---|
| admin/admin/main.php | Redirect |
| admin/admin_history.php | View, Modal, JS/AJAX, Table, Paging, Session, Read, Redirect |
| admin/api_dashboard_data.php | Session, Read |
| admin/api_toggle_location.php | JS/AJAX, Paging, Session, Read, Write |
| admin/approve_items.php | View, Form, JS/AJAX, Table, Paging, Session, Read, Redirect |
| admin/edit_durable_article.php | View, Form, JS/AJAX, Session, Read, Write, Upload, Redirect |
| admin/edit_user.php | View, Form, JS/AJAX, Session, Read, Write, Redirect |
| admin/import_csv.php | View, Form, JS/AJAX, Table, Paging, Read |
| admin/insert_Repair.php | Session, Read, Write |
| admin/logout.php | Inspect as include/handler |
| admin/main.php | View, JS/AJAX, Table, Paging, Session, Read, Redirect |
| admin/manage_data.php | View, Form, Modal, JS/AJAX, Table, Paging, Session, Read, Write, Redirect |
| admin/manage_durable_articles.php | Inspect as include/handler |
| admin/manage_repairs.php | View, Form, Modal, JS/AJAX, Table, Paging, Session, Read, Write, Redirect |
| admin/manage_users.php | View, JS/AJAX, Table, Paging, Session, Read, Redirect |
| admin/manual_remind.php | View, JS/AJAX, Table, Paging, Session, Read, Write, Redirect |
| admin/oauth_callback.php | View, JS/AJAX, Paging, Session, Read, Write, Redirect |
| admin/page_EditDurableArticles.php | Redirect |
| admin/page_Repair_AddEdit.php | View, Form, JS/AJAX, Table, Paging, Session, Read, Write, Redirect |
| admin/print_qr.php | View, JS/AJAX, Session, Read, Print, Redirect |
| admin/print_qrcode.php | View, Form, JS/AJAX, Paging, Session, Read, Print, Redirect |
| admin/process_import.php | View, JS/AJAX, Table, Session, Read, Write, Upload, Redirect |
| admin/process_mail_settings.php | View, Table, Session, Read, Write |
| admin/report_details.php | View, Form, JS/AJAX, Table, Paging, Session, Read, Print, Redirect |
| admin/settings_mail.php | View, Form, JS/AJAX, Paging, Session, Read, Write, Redirect |
| admin/settings_mail_oauth.php | Inspect as include/handler |
| admin/sync_now.php | Session |
| admin/update_Repair.php | Session, Write |
| admin/user/history.php | Redirect |
| admin_history.php | Inspect as include/handler |
| api/sse_dashboard.php | Session, Read |
| api_search_assets.php | Paging, Session, Read |
| api_toggle_location.php | Inspect as include/handler |
| borrow_request.php | View, Form, Modal, JS/AJAX, Paging, Session, Read, Redirect |
| component/admin_footer.php | JS/AJAX, Paging |
| component/admin_header.php | View, JS/AJAX, Paging, Session, Read, Redirect |
| component/admin_navbar.php | View |
| component/admin_sidebar.php | View, Session, Read |
| component/nav.php | Session |
| control/connectDB.php | Inspect as include/handler |
| control/connectPDO.php | Inspect as include/handler |
| control/connectPDO_dev.php | Read, Write |
| control/sync_database.php | Inspect as include/handler |
| cron_reminder.php | JS/AJAX, Paging, Read, Write |
| db.php | JS/AJAX, Read, Write |
| includes/BorrowService.php | JS/AJAX, Paging, Read, Write |
| index.php | Inspect as include/handler |
| legacy/Update_BorrowDA.php | Session |
| legacy/del_Building.php | Session, Read, Write |
| legacy/del_Classification.php | Session, Read, Write |
| legacy/del_Classroom.php | Session, Write |
| legacy/del_StatusActive.php | Session, Read, Write |
| legacy/index.php | View, Form, JS/AJAX, Session |
| legacy/insert_BorrowDA.php | Session, Write |
| legacy/insert_Building.php | Session, Write, Upload |
| legacy/insert_Classification.php | Session, Read, Write |
| legacy/insert_Classroom.php | Session, Read, Write, Upload |
| legacy/insert_DurableArticles.php | Session, Read, Write, Upload |
| legacy/insert_Repair.php | Session, Write |
| legacy/insert_StatusActive.php | Session, Read, Write |
| legacy/insert_UserAccount.php | Read, Write |
| legacy/loadBuilding.php | Read |
| legacy/loadClassification.php | Read |
| legacy/loadClassroom.php | Read |
| legacy/loadDashboard_CountDA.php | JS/AJAX, Session, Read |
| legacy/loadListClassification.php | Read |
| legacy/loadListStatusActive.php | Read |
| legacy/loadStatus_Active.php | Read |
| legacy/loadTableBorrow_DataDA.php | View, Modal, Table, Read |
| legacy/loadTableBorrow_forBack.php | View, Modal, Table, Read |
| legacy/loadTableBuilding.php | View, Table, Read |
| legacy/loadTableClassroom.php | View, Table, Read |
| legacy/loadTableDataBorrowBackDA.php | View, Table, Read |
| legacy/loadTableDurableArticles.php | View, Table, Read |
| legacy/loadTableDurableArticlesBySelect.php | View, Table, Read |
| legacy/loadTableUserAccount.php | View, Table, Read |
| legacy/loadTypeUser.php | Read |
| legacy/login.php | View, JS/AJAX, Session, Read |
| legacy/logout.php | View, JS/AJAX, Session |
| legacy/main.php | View, Modal, JS/AJAX, Table, Paging, Session, Read |
| legacy/page_BackDA.php | View, Modal, JS/AJAX, Table, Paging, Session |
| legacy/page_BorrowDA.php | View, Modal, JS/AJAX, Table, Paging, Session |
| legacy/page_Classification.php | View, JS/AJAX, Paging, Session |
| legacy/page_Classroom.php | View, Form, Modal, JS/AJAX, Table, Paging, Session, Read |
| legacy/page_DataborrowbackDA.php | View, JS/AJAX, Table, Paging, Session |
| legacy/page_DisActiveUseraccount.php | Inspect as include/handler |
| legacy/page_EditDurableArticles.php | View, Form, JS/AJAX, Paging, Session, Read |
| legacy/page_Edituseraccount.php | View, JS/AJAX, Paging, Session, Read |
| legacy/page_Repair_AddEdit.php | View, JS/AJAX, Table, Paging, Session, Read |
| legacy/page_StatusActive.php | View, JS/AJAX, Paging, Session |
| legacy/page_building.php | View, Form, Modal, JS/AJAX, Table, Paging, Session |
| legacy/page_durable_articles.php | View, Form, Modal, JS/AJAX, Table, Paging, Session, Read |
| legacy/page_useraccount.php | View, Modal, JS/AJAX, Table, Paging, Session, Read |
| legacy/test.php | View, Form, JS/AJAX, Table |
| legacy/update_Building.php | Session, Upload |
| legacy/update_Classification.php | Session |
| legacy/update_Classroom.php | Session, Upload |
| legacy/update_DurableArticles.php | Session, Upload |
| legacy/update_Repair.php | Session |
| legacy/update_StatusActive.php | Session |
| legacy/update_UserAccount.php | Write |
| login.php | View, Form, JS/AJAX, Paging, Session, Read, Redirect |
| logout.php | Session, Redirect |
| mail_config.php | Inspect as include/handler |
| mailer.php | View, JS/AJAX, Table, Paging, Read |
| manual_remind.php | Inspect as include/handler |
| migrate_data.php | View, Read, Write |
| process_mail_settings.php | Inspect as include/handler |
| refactor.php | Inspect as include/handler |
| register.php | View, Form, JS/AJAX, Session |
| register_process.php | Session, Write, Redirect |
| report_details.php | Inspect as include/handler |
| sync_database.php | JS/AJAX, Paging, Session, Read, Write |
| user/borrow_action.php | Session, Redirect |
| user/borrow_form.php | Session, Redirect |
| user/history.php | View, Modal, JS/AJAX, Table, Paging, Session, Read, Redirect |
| user/main.php | View, JS/AJAX, Table, Paging, Session, Read, Redirect |
| user/process_request_csv.php | Session, Read, Write, Upload, Redirect |
| user/request_item.php | View, Form, JS/AJAX, Table, Paging, Session, Read, Write, Redirect |
| user/return_form.php | View, Form, JS/AJAX, Session, Read, Redirect |

## Next.js page และ route handlers

- `app/(auth)/login/page.tsx` → `/login`
- `app/(workspace)/admin/[section]/page.tsx` → `/admin/[section]`
- `app/(workspace)/admin/approvals/page.tsx` → `/admin/approvals`
- `app/(workspace)/admin/csv/page.tsx` → `/admin/csv`
- `app/(workspace)/admin/history/page.tsx` → `/admin/history`
- `app/(workspace)/admin/mail/page.tsx` → `/admin/mail`
- `app/(workspace)/admin/manage-data/page.tsx` → `/admin/manage-data`
- `app/(workspace)/admin/manage-data/photo/route.ts` → `/admin/manage-data/photo`
- `app/(workspace)/admin/manage-users/page.tsx` → `/admin/manage-users`
- `app/(workspace)/admin/page.tsx` → `/admin`
- `app/(workspace)/admin/print-qrcode/page.tsx` → `/admin/print-qrcode`
- `app/(workspace)/admin/repairs/page.tsx` → `/admin/repairs`
- `app/(workspace)/admin/reports/page.tsx` → `/admin/reports`
- `app/(workspace)/dashboard/page.tsx` → `/dashboard`
- `app/(workspace)/unauthorized/page.tsx` → `/unauthorized`
- `app/(workspace)/user/[section]/page.tsx` → `/user/[section]`
- `app/(workspace)/user/page.tsx` → `/user`
- `app/api/admin/asset-detail/route.ts` → `/api/admin/asset-detail`
- `app/api/admin/history-reminder/route.ts` → `/api/admin/history-reminder`
- `app/api/admin/operations/route.ts` → `/api/admin/operations`
- `app/api/auth/login/route.ts` → `/api/auth/login`
- `app/api/auth/logout/route.ts` → `/api/auth/logout`
- `app/db-preview/page.tsx` → `/db-preview`
- `app/page.tsx` → `/`

Dynamic user sections ใช้ ProtectedScreen และยังต้องแยกแต่ละ slug ตามเมนูใน lib/auth/policy.ts. Dynamic admin sections มี aliases/placeholder ที่ต้องเทียบกับปลายทางจริง.

## เงื่อนไขข้อมูลและข้อจำกัดการยืนยัน

- PHP Login และกลุ่ม Admin ที่ตรวจพบใช้ SQLite ผ่าน connectPDO_dev.php หรือ db.php ส่วน Next.js Login ใช้ MySQL. Account และสิทธิ์อาจต่างกันแม้ชื่อบัญชีตรงกัน.
- Asset list ใช้ approved/visibility/department scope. Pending approvals ใช้ is_approved=0 และ scope โดยไม่มีเงื่อนไขซ่อนรายการ. History ใช้ LEFT JOIN และ scope ตามกฎ History.
- Next.js SQLite writes ใช้ BEGIN IMMEDIATE และ opt-in. Rejection/delete ถูกบล็อก. Provider email acceptance และการบันทึก timestamp เป็นคนละขั้นตอน.
- UI, responsiveness, modal, form validation, routing, query results, errors และ file/print behavior ยังต้องตรวจ runtime. รายการหลักด้านบนยังไม่ครอบคลุมแต่ละ handler และทุก branch ของ PHP 120 ไฟล์.

## รายการตรวจต่อหน้าเพื่อยืนยัน parity

| กลุ่มหน้า | หลักฐานที่ต้องเทียบเพิ่มเติม |
|---|---|
| Entry, Login, Logout | Layout และฟอร์ม, required fields, valid/invalid credentials, active flag, role redirect, session expiry, CSRF, error response, mobile |
| Admin Dashboard | Sidebar/Header, widgets, charts, filters, null/status counts, recent rows, scope, loading/errors, responsive |
| Assets / Users / Approvals | ตาราง, ปุ่ม, modal, form, search/filter/sort/paging, scoped detail, authorization, validation, write response, error/empty, รูปและ download |
| User dashboard / borrow / return / requests | เส้นทาง QR และ login continuation, forms, ownership, status transitions, file input, validation, history, mobile |
| History / Repairs / Reports | Date and status rules, summary, sort/paging, quick filters, modal/action, transactional updates, charts, print/export |
| QR / CSV / Mail | Filter and preview, print dimensions, decode payload, input/file validation, provider result, timestamp/audit, secret isolation, error and responsive |

อ้างอิงรายละเอียด query และตารางเพิ่มเติมใน DATABASE_MAPPING.md และระดับฟังก์ชันเดิมใน FUNCTIONAL_INVENTORY.md. ตารางนี้เป็น checklist สำหรับรายการที่ยังไม่ยืนยัน ไม่ใช่ผลทดสอบ.

## Admin 10-page migration checkpoint

แก้ Dashboard ให้เมนูลัดชี้ไปที่ `/admin/manage-data`, `/admin/manage-users` และ `/admin/print-qrcode` โดยตรง และให้ลิงก์สถานะพร้อมใช้งาน/ชำรุดส่งตัวกรองที่ Asset Catalog รองรับ ดูสถานะและช่องว่างต่อหน้าใน [ADMIN_10_PAGE_MIGRATION.md](ADMIN_10_PAGE_MIGRATION.md) ขั้นถัดไปคือเทียบฟอร์มแก้ไขครุภัณฑ์และการอัปโหลดกับ PHP โดยตรวจ scope ก่อนเปิดการเขียนเพิ่ม รอบนี้ตรวจจากโค้ดเท่านั้น

### Mail settings follow-up

`/admin/mail` บันทึกชื่อและอีเมลผู้ส่ง ความถี่ และสถานะไปยังแถวเดิมใน SQLite ผ่าน `POST /api/admin/mail` โดยตรวจ Origin, Admin ID และ opt-in สำหรับ SQLite write ใช้ transaction และแจ้งสำเร็จหลัง commit สถานะ IMPLEMENTED_UNVERIFIED เฉพาะค่าที่ไม่ใช่ข้อมูลลับ ส่วน SMTP host/port/encryption, การเปลี่ยนข้อมูลรับรอง, การส่งทดสอบ และกรณีไม่มีแถวตั้งค่ายังไม่ครบ งานของโมดูลอื่นยังอยู่ตาม checkpoint เดิม

### Repairs follow-up

เพิ่มฟอร์มสร้างและแก้ไขงานซ่อมผ่าน POST /api/admin/repairs โดยตรวจสิทธิ์ทั้งครุภัณฑ์เดิมและใหม่ จัดสรรรหัสใน BEGIN IMMEDIATE และไม่เปลี่ยนสถานะครุภัณฑ์ สถานะเฉพาะส่วนนี้ IMPLEMENTED_UNVERIFIED ยังขาดตัวเลือกครุภัณฑ์แบบ PHP และการลบ งานโมดูลอื่นอยู่ตามรายการค้างเดิม

เพิ่มปุ่มแก้ไขงานซ่อมจากแถวพร้อมกรอกค่าเดิม และส่งออก CSV/พิมพ์ PDF สำหรับชุดสรุปรายงานปัจจุบันตาม scope ที่อ่านฝั่ง Server สถานะ IMPLEMENTED_UNVERIFIED ยังขาดชุดรายงานละเอียดและตัวกรอง รวมถึงงานค้างตามรายการเดิม

### งานที่เปลี่ยนในรอบล่าสุด

- Manage Data เชื่อมฟอร์มแก้ไขข้อมูลและเปลี่ยนรูปกับ SQLite โดยตรวจสิทธิ์ก่อนอัปโหลดและใน transaction รูปเดิมยังอยู่ การแก้สถานะใช้ปุ่มเดิม ส่วนการย้ายหน่วยงานยังไม่รองรับ
- CSV บันทึกรายการใหม่สูงสุด 100 แถวต่อครั้ง ตรวจข้อมูลซ้ำและรหัสอ้างอิงใน transaction การอัปเดตรายการซ้ำ การอนุมานรหัสจากชื่อ และไฟล์รายงานข้อผิดพลาดยังค้าง
- Repairs เพิ่มการลบจากแถวพร้อมยืนยันและตรวจสิทธิ์ ระบบปฏิเสธการลบหากพบ foreign key อ้างถึงตารางซ่อมหรือ trigger บนตาราง ตัวค้นหาครุภัณฑ์สำหรับเพิ่มรายการยังค้าง
- Reports เพิ่มช่วงวันที่และสรุปยืมคืนรายวันหรือรายเดือนตามขอบเขตเดิม CSV ยังส่งออกชุดสรุปสถานะและหมวดหมู่
- Mail รองรับบันทึกค่าทั่วไปเมื่อยังไม่มีแถวตั้งค่า ข้อมูล SMTP และการส่งทดสอบยังค้าง
- History เพิ่มตัวกรองวันที่ยืมในผลค้นหา ตัวเลขสรุปยังคำนวณจากข้อมูลทั้งหมดตามสิทธิ์
- QR เชื่อมการพิมพ์รายชิ้นจากทะเบียนด้วยรหัสครุภัณฑ์ ปลายทางยืมของ Next.js ยังไม่ครบ
- Dashboard ส่ง visibility mode ไปกับลิงก์ทะเบียนและลิงก์สถานะ
- Manage Users ยังต้องยืนยันการจับคู่บัญชีและแหล่งเขียนระหว่าง MySQL กับ SQLite การปฏิเสธคำขอและลบประวัติยืมยังติดเงื่อนไขข้อมูลสำรอง

สถานะส่วนที่เพิ่มเป็น IMPLEMENTED_UNVERIFIED ตรวจเฉพาะซอร์สตามข้อกำหนด CODE EDIT ONLY
