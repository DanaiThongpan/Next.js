# Missing and different functions

| ID | ฟังก์ชัน | PHP Source | Next.js Target | พฤติกรรมเดิม | ปัจจุบัน | สิ่งที่ต้องแก้ | Priority | Dependencies |
|---|---|---|---|---|---|---|---|---|
| CMP-002 | เข้าสู่ระบบ | `login.php` | `/login` | ตรวจ account ที่ active ใน SQLite และ PHP session | MySQL identity, bcrypt และ server session | ตรวจ call flow และปิดช่องว่างของ เข้าสู่ระบบ ตาม Source | P0 | Account mapping |
| CMP-003 | ออกจากระบบ | `logout.php` | `/api/auth/logout` | PHP session destruction | POST, origin validation และ revoke session | ตรวจ call flow และปิดช่องว่างของ ออกจากระบบ ตาม Source | P0 | Auth cookies |
| CMP-004 | ส่งต่อหลัง Login | `login.php` | `/login` | รองรับ redirect ไปปลายทาง QR | จำกัดปลายทาง allowlist และไม่มี route QR borrow | ตรวจ call flow และปิดช่องว่างของ ส่งต่อหลัง Login ตาม Source | P0 | Safe return URL |
| CMP-005 | ลงทะเบียน | `register_process.php` | `/register` | สร้างบัญชี SQLite หลัง validation | ไม่มีหน้าและ API | ตรวจ call flow และปิดช่องว่างของ ลงทะเบียน ตาม Source | P1 | Identity source and role policy |
| CMP-006 | เปิดครุภัณฑ์จาก QR | `borrow_request.php` | `/borrow_request.php` | Login แล้วเปิดรายการตาม asset_id | QR ยังชี้ PHP | ตรวจ call flow และปิดช่องว่างของ เปิดครุภัณฑ์จาก QR ตาม Source | P1 | Login return target, asset lookup |
| CMP-007 | ค้นหาครุภัณฑ์ผู้ใช้ | `api_search_assets.php` | `/user/available` | ค้น SQLite ตามเงื่อนไขใน handler | เมนู placeholder | ตรวจ call flow และปิดช่องว่างของ ค้นหาครุภัณฑ์ผู้ใช้ ตาม Source | P1 | Visibility, scoped read API |
| CMP-008 | ผู้ใช้ส่งคำขอยืม | `user/borrow_action.php` | `/user/borrow` | BorrowService จัดการรายการยืมและสถานะ | placeholder | ตรวจ call flow และปิดช่องว่างของ ผู้ใช้ส่งคำขอยืม ตาม Source | P1 | Transaction, validation, ownership |
| CMP-009 | ผู้ใช้แจ้งคืน | `user/return_form.php` | `/user/borrowed` | ส่งคำขอคืนสำหรับรายการยืม | placeholder | ตรวจ call flow และปิดช่องว่างของ ผู้ใช้แจ้งคืน ตาม Source | P1 | Ownership, pending return transition |
| CMP-010 | รายการและประวัติผู้ใช้ | `user/history.php` | `/user/history` | แสดงรายการยืมของผู้ใช้ | placeholder | ตรวจ call flow และปิดช่องว่างของ รายการและประวัติผู้ใช้ ตาม Source | P1 | Identity join, pagination |
| CMP-011 | เสนอขึ้นทะเบียน | `user/request_item.php` | `/user/requests` | รับข้อมูลคำขอครุภัณฑ์ | placeholder | ตรวจ call flow และปิดช่องว่างของ เสนอขึ้นทะเบียน ตาม Source | P1 | Pending asset schema, file validation |
| CMP-012 | เสนอขึ้นทะเบียน CSV | `user/process_request_csv.php` | `/user/request-csv` | ประมวลผล CSV คำขอผู้ใช้ | placeholder | ตรวจ call flow และปิดช่องว่างของ เสนอขึ้นทะเบียน CSV ตาม Source | P2 | CSV validation, user scoping |
| CMP-013 | หน้าหลักผู้ใช้ | `user/main.php` | `/user` | หน้าหลักผู้ใช้และกลุ่มรายการยืม | ProtectedScreen เมนูและโครงหน้าพื้นฐาน | ตรวจ call flow และปิดช่องว่างของ หน้าหลักผู้ใช้ ตาม Source | P1 | User catalog and borrow flows |
| CMP-015 | รายการครุภัณฑ์ Admin | `admin/manage_data.php` | `/admin/manage-data` | ตัวกรองหมวดหมู่เดี่ยวและ DataTables | หลายหมวดหมู่ตามที่อนุมัติ, SQL paging/sort | ตรวจ call flow และปิดช่องว่างของ รายการครุภัณฑ์ Admin ตาม Source | P2 | Filter and count parity |
| CMP-016 | รายละเอียดครุภัณฑ์ | `admin/manage_data.php` | `/api/admin/asset-detail` | AJAX รายละเอียดและประวัติ 5 รายการ | scope เพิ่ม, detail และ history บางฟิลด์ | ตรวจ call flow และปิดช่องว่างของ รายละเอียดครุภัณฑ์ ตาม Source | P1 | Full modal fields and joins |
| CMP-017 | รูปครุภัณฑ์ | `admin/manage_data.php` | `/admin/manage-data/photo` | แสดงรูปตาม legacy path | scope และ raster MIME allowlist | ตรวจ call flow และปิดช่องว่างของ รูปครุภัณฑ์ ตาม Source | P2 | Authorized path variants, missing image |
| CMP-018 | แก้ไขครุภัณฑ์ | `admin/edit_durable_article.php` | `/admin/manage-data` | ฟอร์มอัปเดตครุภัณฑ์และไฟล์ | ปุ่มแก้ไข disabled | ตรวจ call flow และปิดช่องว่างของ แก้ไขครุภัณฑ์ ตาม Source | P1 | Validation, ownership, safe upload |
| CMP-021 | รายการผู้ใช้ Admin | `admin/manage_users.php` | `/admin/manage-users` | ตารางตามหน่วยงานและ DataTables | server paging, detail modal, disabled editing | ตรวจ call flow และปิดช่องว่างของ รายการผู้ใช้ Admin ตาม Source | P1 | Scoped SQL and account data parity |
| CMP-022 | แก้ไขบัญชีและสิทธิ์ | `admin/edit_user.php` | `/admin/manage-users` | ฟอร์มแก้ไข useraccount | disabled | ตรวจ call flow และปิดช่องว่างของ แก้ไขบัญชีและสิทธิ์ ตาม Source | P1 | MySQL/SQLite identity source decision |
| CMP-025 | ปฏิเสธคำขอ | `includes/BorrowService.php` | `/api/admin/operations` | ลบรายการ pending | บล็อกที่ service จนยืนยัน backup | ตรวจ call flow และปิดช่องว่างของ ปฏิเสธคำขอ ตาม Source | P1 | Backup and related records |
| CMP-026 | History Admin | `admin/admin_history.php` | `/admin/history` | ตาราง 6 คอลัมน์, quick filters, กฎวัน | SQL paging, KPI และ UI หลัก | ตรวจ call flow และปิดช่องว่างของ History Admin ตาม Source | P2 | Quick filters, date and role edge cases |
| CMP-028 | ลบประวัติ | `includes/BorrowService.php` | `/api/admin/operations` | ลบและคืนสถานะตามเงื่อนไข | บล็อกจนยืนยัน backup | ตรวจ call flow และปิดช่องว่างของ ลบประวัติ ตาม Source | P1 | Backup and related records |
| CMP-029 | อีเมลแจ้งเตือน | `admin/manual_remind.php` | `/api/admin/history-reminder` | legacy REST provider และเวลาใน SQLite | shared preview, provider เดิม, lock และ JSONL audit | ตรวจ call flow และปิดช่องว่างของ อีเมลแจ้งเตือน ตาม Source | P0 | Provider verification, cross-host dedupe |
| CMP-030 | เตรียม CSV | `admin/import_csv.php` | `/admin/csv` | แบบฟอร์มและ lookup reference data | preview กับ aliases/required fields | ตรวจ call flow และปิดช่องว่างของ เตรียม CSV ตาม Source | P2 | Resolve reference IDs and numeric values |
| CMP-031 | นำเข้า CSV จริง | `admin/process_import.php` | `/admin/csv` | บันทึกและปรับรายการใน transaction | ปุ่มนำเข้าปิด | ตรวจ call flow และปิดช่องว่างของ นำเข้า CSV จริง ตาม Source | P1 | Duplicate, ownership, transaction |
| CMP-032 | รายการซ่อม | `admin/manage_repairs.php` | `/admin/repairs` | ตารางและรายละเอียดตาม scope | generic table, filters, detail | ตรวจ call flow และปิดช่องว่างของ รายการซ่อม ตาม Source | P1 | Scope parity and targeted asset lookup |
| CMP-033 | เพิ่ม/แก้ไข/ลบงานซ่อม | `admin/manage_repairs.php` | `/admin/repairs` | ฟอร์มและ handlers เขียน repair | ฟอร์มปิด | ตรวจ call flow และปิดช่องว่างของ เพิ่ม/แก้ไข/ลบงานซ่อม ตาม Source | P1 | Related asset validation, backup for delete |
| CMP-034 | รายงานสถานะ/ประเภท | `admin/report_details.php` | `/admin/reports` | สรุปสถานะและประเภทพร้อมกราฟ | สรุปและตารางบางส่วน | ตรวจ call flow และปิดช่องว่างของ รายงานสถานะ/ประเภท ตาม Source | P2 | Compare formulas and scope |
| CMP-035 | รายงานช่วงเวลาและอันดับ | `admin/report_details.php` | `/admin/reports` | ชุดรายงานยืมคืนและอันดับ | ยังไม่มีชุดเทียบเท่า | ตรวจ call flow และปิดช่องว่างของ รายงานช่วงเวลาและอันดับ ตาม Source | P2 | Date window, aggregation, chart data |
| CMP-036 | พิมพ์ QR แบบกลุ่ม | `admin/print_qrcode.php` | `/admin/print-qrcode` | ฟอร์มสร้าง QR และ grid auto-fill | ฟอร์มและ grid 3×4 ตามคำขอ | ตรวจ call flow และปิดช่องว่างของ พิมพ์ QR แบบกลุ่ม ตาม Source | P2 | Print measurement and scan roundtrip |
| CMP-037 | พิมพ์ QR รายชิ้น | `admin/print_qr.php` | `/admin/print-qrcode` | ปลายทางพิมพ์รายชิ้น | ลิงก์เปิดฟอร์มค้นหาชุด | ตรวจ call flow และปิดช่องว่างของ พิมพ์ QR รายชิ้น ตาม Source | P2 | Exact ID lookup |
| CMP-038 | ตั้งค่าอีเมล | `admin/settings_mail.php` | `/admin/mail` | แสดงและแก้ไขค่าผู้ส่งและแจ้งเตือน | อ่าน safe fields และ disabled form | ตรวจ call flow และปิดช่องว่างของ ตั้งค่าอีเมล ตาม Source | P1 | Scoped write, secret isolation |
| CMP-039 | Cron แจ้งเตือน | `cron_reminder.php` | `/admin/history` | CLI ประมวลผลแจ้งเตือน | แสดงตัวอย่างคำสั่งเท่านั้น | ตรวจ call flow และปิดช่องว่างของ Cron แจ้งเตือน ตาม Source | P2 | Scheduler authorization, duplicate protection |
| CMP-040 | ซิงค์ SQL dump | `sync_database.php` | `/admin/manage-data` | นำ dump เข้า SQLite | ปุ่มซิงค์ปิดตามข้อกำหนด | ตรวจ call flow และปิดช่องว่างของ ซิงค์ SQL dump ตาม Source | P0 | Separate approval, backup, impact review |
| CMP-041 | ตั้งค่าสถานที่ | `admin/api_toggle_location.php` | `—` | endpoint เปลี่ยนสถานะสถานที่ | ไม่มี route เทียบเท่า | ตรวจ call flow และปิดช่องว่างของ ตั้งค่าสถานที่ ตาม Source | P1 | Schema and exact permissions |
| CMP-042 | OAuth อีเมล | `admin/settings_mail_oauth.php` | `—` | หน้า OAuth และ callback แยก | ไม่มี route เทียบเท่า | ตรวจ call flow และปิดช่องว่างของ OAuth อีเมล ตาม Source | P1 | Provider and token storage review |

## ลำดับแก้และไฟล์ที่เกี่ยวข้อง

| Priority | งาน | ไฟล์ Next.js ที่ต้องแก้หรือเพิ่ม | Dependencies |
|---|---|---|---|
| P0 | ตรวจความสอดคล้องของบัญชีและการกลับจาก QR | lib/auth/session.ts, lib/auth/policy.ts, app/api/auth/login/route.ts | ยืนยัน identity mapping ระหว่าง SQLite กับ MySQL และปลายทางที่อนุญาต |
| P0 | ตรวจเงื่อนไขก่อนเปิดเขียนและป้องกันส่งเตือนซ้ำ | lib/sqlite/actions.ts, lib/sqlite/history-reminder.ts, app/api/admin/operations/route.ts | สำรองข้อมูล, กฎสิทธิ์รายรายการ, fixture แยก, สถานะตอบกลับจาก provider |
| P1 | ย้ายคำขอยืม คืน ประวัติ และเสนอขึ้นทะเบียน | app/(workspace)/user/[section]/page.tsx, components/protected-screen.tsx, เพิ่มบริการตามแต่ละ action | BorrowService, การอ่านรายการตามเจ้าของ, transaction และสถานะคืน |
| P1 | ย้ายฟอร์มแก้ไขและซ่อม | components/admin/asset-page.tsx, user-catalog-page.tsx, read-module-page.tsx, lib/sqlite/actions.ts | สัญญาฟิลด์, scoped lookup, file handling, account source |
| P2 | ปิดช่องว่างรายงาน, CSV, QR และรูปภาพ | app/(workspace)/admin/reports/page.tsx, components/admin/csv-preview.tsx, lib/sqlite/qr.ts, app/(workspace)/admin/manage-data/photo/route.ts | กฎ PHP สำหรับช่วงวันที่, mapping CSV, payload และขนาดพิมพ์ |
| P3 | ตรวจความตรงของหน้าและอุปกรณ์ | app/(workspace)/admin/styles/, components/admin/ | เปรียบเทียบ Browser หลังได้รับอนุญาต ด้วยบัญชีและข้อมูลขอบเขตเดียวกัน |

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

### Advanced Analytics & Reports

`/admin/reports` มี 3 แท็บและ 5 กราฟจาก SQLite ครอบคลุมสถานะและมูลค่าครุภัณฑ์ แนวโน้มยืม–คืน ตารางเกินกำหนด และอันดับครุภัณฑ์/ผู้ยืม ช่วงวันที่มีผลกับแนวโน้มเท่านั้น รองรับ CSV รายการเกินกำหนดและพิมพ์ PDF การจัดการจากตารางเกินกำหนดเชื่อมไป History ขอบเขตข้อมูลยึดรหัสบัญชีและแผนกจาก session แผนกว่างได้ผลลัพธ์ว่างสำหรับผู้ที่ไม่มีสิทธิ์ทั่วระบบ สถานะ IMPLEMENTED_UNVERIFIED ตรวจซอร์สเท่านั้น
