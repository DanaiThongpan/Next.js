# DAAM Admin migration

สถานะจากการอ่านโค้ดและแก้ไขแบบ offline ต้องตรวจระบบจริงก่อนยืนยันความเทียบเท่า PHP

| Page | PHP Source | Next.js Route | UI | API | Database | RBAC | Status |
|---|---|---|---|---|---|---|---|
| Dashboard | admin/main.php | /admin | แก้ปลายทางเมนูลัดและตัวกรองสถานะ | Server Component | SQLite dashboard service | Admin และ scope ตาม widget | IMPLEMENTED_UNVERIFIED |
| Assets | admin/manage_data.php | /admin/manage-data | ตารางและรายละเอียด มีช่องว่างหน้าแก้ไข | Asset detail, photo, operations | SQLite | Admin และ scope ตามเจ้าของ | IMPLEMENTING |
| Users | admin/manage_users.php | /admin/manage-users | ตารางและรายละเอียด | Catalog ฝั่ง Server | SQLite สำหรับรายการ, MySQL สำหรับ Login | เฉพาะ admin เห็นทุกหน่วยงาน | BLOCKED |
| QR | admin/print_qrcode.php | /admin/print-qrcode | ฟอร์ม batch และ A4 | สร้าง QR ภายในแอป | SQLite | Admin และ scope ของ QR catalog | IMPLEMENTED_UNVERIFIED |
| Approvals | admin/approve_items.php | /admin/approvals | รายการ pending และปุ่มดำเนินการ | Operations | SQLite | ตรวจ scope ตอนอ่านและตอนดำเนินการ | IMPLEMENTING |
| History | admin/admin_history.php | /admin/history | ตาราง สรุป และประวัติแจ้งเตือน | Operations, history-reminder | SQLite และระบบแจ้งเตือน | Admin และ scope ของรายการ | IMPLEMENTING |
| CSV | admin/import_csv.php | /admin/csv | Preview | ยังขาด commit | SQLite reference data | Admin | IMPLEMENTING |
| Repairs | admin/manage_repairs.php | /admin/repairs | รายการและรายละเอียด | ยังขาด CRUD | SQLite | Admin และ scope ของรายการ | IMPLEMENTING |
| Reports | admin/report_details.php | /admin/reports | สรุปสถานะและหมวดหมู่ | Server Component | SQLite | Admin และ scope ของรายงาน | IMPLEMENTING |
| Mail | admin/settings_mail.php | /admin/mail | แสดงค่าที่อนุญาต | ยังขาดการบันทึก | SQLite | Admin | IMPLEMENTING |

## งานค้าง

- Dashboard ยังต้องเทียบผลลัพธ์ของ SQLite กับ PHP รวมถึง visibility mode เมื่อกดเข้าโมดูลอื่น
- การเขียนบัญชีต้องยืนยันแหล่งบัญชีหลักและการจับคู่ SQLite กับ MySQL ก่อนเปิดใช้
- งานถัดไปอยู่ที่ Manage Data โดยต้องเทียบหน้าแก้ไขและการอัปโหลดกับ PHP รวมถึงทบทวนการปฏิเสธและการลบที่ต้องมีแผนกู้คืน
- CSV commit, Repair CRUD, รายงานช่วงเวลาและ Export, การบันทึกค่าอีเมลและการป้องกัน secret ยังไม่ครบ

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
