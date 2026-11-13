# DAAM Migration Progress

> ล่าสุด: P3-B4 อนุญาต Live read-only แล้ว; ดู checkpoint ท้ายไฟล์ ซึ่งมีผลเหนือข้อห้าม Offline เก่า

อัปเดต: 5 พฤศจิกายน 2026 (Asia/Bangkok)

## ข้อกำหนดล่าสุด — มีผลเหนือคำสั่ง/รายงานเก่า

**Codex ทำงาน Offline เท่านั้น ห้ามเชื่อมต่อ 192.168.15.201 ไม่ว่ากรณีใด ๆ** ห้าม mysql/mysql2 จริง, curl/nc/ping/SSH/tunnel, DB-backed API/page, Browser Automation ที่ทำให้ Query จริง และห้ามอ่านหรือแก้ .env.local/Password จริง การทดสอบระบบจริงให้ผู้ใช้ทำเองบน macOS เท่านั้น

ไม่มีการเชื่อมต่อจริงหรือดู Credentials ใน Batch ล่าสุด คำบอกว่าเคยเชื่อมต่อสำเร็จในรายงานวันที่ 4 พฤศจิกายนเป็นประวัติเท่านั้น ไม่ใช่หลักฐานสถานะปัจจุบันและไม่ใช่การอนุญาตให้ลองใหม่ ห้ามรันสคริปต์ตรวจ LAN/MySQL จาก Batch เก่า

## สถานะ

- Phase: **3 — Admin Dashboard / Secure MySQL Integration**
- Batch ล่าสุด: **P3-B3 — Dashboard mapping validation + offline component verification**
- P3-B3 เสร็จในขอบเขตโค้ด/Offline; **Dashboard data parity ยังไม่ครบ** เพราะ Schema/ความหมายข้อมูลที่ขาดยังต้องยืนยันจากผล Metadata ที่ผู้ใช้รันเอง
- ยังไม่เริ่ม Phase 4 และไม่กำหนดฟีเจอร์ใหม่เอง
- โค้ดและรายงานบันทึกแล้ว ยังไม่มี Commit จาก Agent
- ไม่ได้หยุดเพราะตรวจพบ Token/โควตาหมด ไม่มีข้อมูลยืนยันจำนวนที่เหลือ ห้ามประมาณตัวเลข
- ไม่มี Automation/Session ใหม่/การสลับโมเดลเพื่อกลับมาทำเอง รอผู้ใช้สั่งต่อ

## เป้าหมายและข้อบังคับ

ย้าย DAAM จาก PHP Native ไป Next.js โดยรักษา UI พฤติกรรม และสิทธิ์จาก Source จริง ใช้ App Router, TypeScript, Bootstrap 5.3 และ mysql2/promise ฝั่ง Server

- ฐานข้อมูล Read-Only: ไม่แก้ข้อมูล Schema สิทธิ์บัญชี Password หรือสร้างบัญชี ไม่ทำ Migration/Schema Push
- Source เดิมจริงอยู่ `daam-main สำเนา`; ห้ามแก้ทั้งชื่อนี้และ `daam-main` หากมีภายหลัง
- connectDB.php/connectPDO.php/connectPDO_dev.php มีหรืออาจมี Auto Migration ห้าม Execute/Include/Import
- ห้ามใช้ SQLite ใน Next.js Login; การเปิด SQLite แบบ mode=ro ในประวัติใช้ Metadata เท่านั้น ไม่ต้องทำซ้ำโดยไม่จำเป็น
- ห้ามข้อมูลจำลองปะปนกับข้อมูลจริง; Mock อยู่ใน tests เท่านั้น ไม่มี production mock-auth mode
- อ่าน AGENTS.md และคู่มือ Next.js ที่ node_modules/next/dist/docs ก่อนแก้โค้ดที่เกี่ยวข้อง
- อนุญาตแก้โค้ดและทดสอบ Offline ภายในขอบเขตได้โดยไม่ขออนุญาตซ้ำ ข้อห้าม Network ล่าสุดยังคงเด็ดขาด

## งานเดิมที่เสร็จ

### Phase 1 / ประวัติวันที่ 4 พฤศจิกายน

/db-preview มี Metadata และตัวอย่างรหัส/ราคาครุภัณฑ์ไม่เกิน 10 รายการ ภายใต้ development/loopback checks. ประวัติพบ 9 ตารางและไม่มี FK ที่ประกาศจริง; ปัจจุบันยังไม่ตรวจใหม่

### Phase 2

/login ใช้ useraccountID, userActive='1', PHP-compatible bcrypt. UT00000001 เข้า /admin; ประเภทอื่นไป /user; User history/request placeholders จำกัด UT00000002 ตาม Source. Session นอก MySQL เก็บ account ID + expiry และใช้ opaque HttpOnly Cookie; revalidate ผู้ใช้ฝั่ง Server, rotation, revoke/logout, expiry 8 ชั่วโมง, Origin checks และ throttling

### P3-B1

/admin ใช้ CSS/โครงหน้าเดิมแบบ scoped: Sidebar 260px, mobile drawer 280px, Navbar/Footer, Card 4 ใบ, กราฟ 2 Panel, recent table และ Quick Actions. เมนูอื่นเป็น Placeholder, sync ปิด. มี schema dependency gate ไม่ตัดเงื่อนไขนับ/แผนกเอง. แก้ Logout ด้วย Referrer-Policy same-origin โดยยังปฏิเสธ null/foreign Origin. ประวัติผู้ใช้ทดสอบ Admin/User และมือถือเองใน Chrome แล้ว

## สิ่งที่ทำใน P3-B2

- `lib/db.ts` เป็น server-only entry point ตามโครงสร้าง root lib/ ที่มีอยู่ ไม่สร้าง src/ แยกใหม่
- `lib/mysql.ts` เป็น compatibility re-export ไม่มีช่องเชื่อมต่อแยก
- `lib/database/config.ts`: DAAM_DB_ACCESS ต้องตรง enabled เท่านั้น; ค่าไม่กำหนด/ค่าอื่นเป็น disabled. ตรวจ gate ก่อน Credential properties; production-build phase ถูกปิดด้วย
- Credentials ทั้ง DB_USER/DB_PASSWORD มาจาก Environment เท่านั้น ไม่มี hardcoded username fallback; Host 192.168.15.201:3306 / daam / utf8mb4 ถูกตรวจให้ตรงเป้าหมาย
- Pool lazy ไม่สร้างที่ import, ใช้ซ้ำข้าม request/HMR; default limit 2, รับ 1–5, acquire fail-fast, timeout 5 วินาที, ปิด multiple statements/LOCAL INFILE
- Read facade รับเฉพาะ exact SELECT shapes ใน allowlist + parameter count/scalar check ไม่รับ arbitrary SELECT/SQL จาก Browser
- แต่ละ lease เริ่ม START TRANSACTION READ ONLY และ ROLLBACK ก่อน release; setup/cleanup ล้มเหลว destroy connection. ไม่เปิด COMMIT/write methods
- closeDatabasePool() drain readers แล้วปิด Pool; ห้ามใช้ reader ที่หลุดออกจาก callback หรือเปิด lease ใหม่ระหว่าง closing. เปลี่ยน Credentials ต้อง close/restart
- Login และ Preview แสดง “การเชื่อมต่อฐานข้อมูลจริงถูกปิดไว้เพื่อความปลอดภัย” เมื่อ disabled; Login form/API ปิด; protected routes ยัง redirect ไป Login เพราะยืนยันตัวตนไม่ได้ ไม่มี bypass
- Cookie access ยังเป็น request-time เพื่อไม่ให้ build-time disabled state ถูก prerender ค้างถาวร. Logout ไม่ต้องใช้ฐานข้อมูลจึงยัง revoke local session ได้
- .env.example ไม่มีข้อมูลลับและ .gitignore ยกเว้นเฉพาะ example; .env.local ไม่ถูกอ่านหรือแก้โดย Agent
- Tests/Build มี explicit disabled flag และ network-denial ES-module preload; Build ปิด telemetry. ไม่เพิ่ม Dependencies ใน Batch นี้
- สร้าง docs/sql/schema-review-read-only.sql สำหรับผู้ใช้รัน Metadata เอง ไม่อ่าน user rows/hash/defaults/comments

## สถานะฐานข้อมูลและปัญหาค้าง

ไม่ตรวจ Live connection, สิทธิ์ SELECT-only, Hash หรือ Schema ใหม่ใน Batch นี้ ค่า DAAM_DB_ACCESS จริงใน .env.local ไม่ทราบเพราะห้ามตรวจ

ค่าเริ่มต้นในโค้ด/Example คือ disabled. ผู้ใช้ต้องกำหนด DB_USER เพิ่มเองหาก .env.local เก่ามีเฉพาะ DB_PASSWORD และเป็นผู้เปิด enabled บน macOS เมื่อพร้อม ห้าม Agent เปิดให้

Historical missing fields: durable_articles.is_approved/is_visible/owner_department/created_by, borrow_back.status, ตาราง _sync_meta. ห้ามเดาว่า Schema ปัจจุบันเหมือนเดิม แต่ต้องคง unavailable จนได้รับ Metadata และ mapping ที่ยืนยันได้ ห้ามใช้ useraccountID/buildingID/Date_back เดาความหมายทดแทน

Sidebar overdue มีสูตร global แยกจาก Card overdue; ไม่สลับใช้แทนกัน. นิยาม Super Admin ใน PHP แตกต่างกันบางไฟล์ จึงคงเฉพาะ dashboard API scope หลัง strict Admin gate ไม่ขยายเป็นสิทธิ์ทั่วไป

รายงานเก่าที่บอกใช้ connection รายครั้ง/Username hardcoded ถูกแทนที่ด้วย P3-B2. ข้อจำกัด UI/ฟีเจอร์ที่ยังไม่ย้ายในรายงาน P3-B1 ยังมีผล

ไม่มี TypeScript/ESLint/Build error ค้าง. npm audit findings 16 moderate เป็นผลในประวัติ ไม่ได้ตรวจ audit ผ่าน Network ในรอบนี้. Node test runner มีคำเตือน experimental type stripping/module type แต่ Tests ผ่าน

## ผลทดสอบล่าสุด — Offline ทั้งหมด

- npm run test:offline: **26 กลุ่มผ่าน** (Auth 8, Dashboard 8, Database 10)
- tests/database.test.ts: 10 กลุ่มผ่านภายใน test:offline รวม gate ก่อน credentials/pool, import safety, allowlist, bounded/reused pool, read-only setup/cleanup, sanitized errors, reconfiguration, closing/expired lease
- npm run lint: ผ่าน (เปลี่ยน preload เป็น .mjs ไม่ปิดกฎ lint)
- npx tsc --noEmit: ผ่าน
- npm run build:offline: ผ่านภายใต้ network-denial preload; /admin และ /login ยังคง dynamic/request-time
- git diff --check: ผ่าน
- **ไม่มี Integration Test / Browser/API / LAN หรือ MySQL จริงใน Batch นี้** ต้องให้ผู้ใช้ยืนยันเอง

## ไฟล์ล่าสุด

สร้าง: lib/db.ts, lib/database/{config,errors,pool,statements}.ts, .env.example, tests/database.test.ts, tests/offline-network-guard.mjs, docs/sql/schema-review-read-only.sql, docs/migration-map.md, docs/permission-matrix.md, docs/phase-3-secure-mysql.md

แก้: lib/mysql.ts, lib/auth/accounts.ts, lib/auth/session.ts, lib/db-preview.ts, lib/dashboard/model.ts, lib/dashboard/server.ts, app/api/auth/login/route.ts, app/(auth)/login/page.tsx, app/(auth)/login/login-form.tsx, package.json, .gitignore, checkpoint สองไฟล์นี้

ไฟล์ Phase เก่ายังอยู่: app/db-preview, app/(workspace) และ components/admin, lib/auth, tests/auth.test.ts, tests/dashboard.test.ts, public/admin/avatar.svg, proxy.ts และรายงาน Phase 1–3

Git มี tracked modifications และ untracked files จากหลาย Phase รวม Source PHP เดิมทั้งโฟลเดอร์ ห้าม git add . / clean / reset แบบรวม ห้าม Commit PHP/Secret โดยไม่ตรวจขอบเขต

## ทำต่ออย่างไร

1. อ่านไฟล์นี้, CONTINUE_TOMORROW.md, AGENTS.md และ phase-3-secure-mysql.md ก่อน ตรวจ Source/Git Diff จริง
2. ทำเฉพาะ Offline. ห้ามลองเชื่อมต่อเพื่อยืนยัน แม้ถูกข้อผิดพลาด/Schema ค้าง
3. รอผู้ใช้ทดสอบบน macOS และส่ง Metadata ที่ลบข้อมูลอ่อนไหวแล้ว ตาม docs/sql/schema-review-read-only.sql
4. หากไม่มีข้อมูล mapping ให้คง unavailable ไม่ทำ Migration/Query กว้างขึ้น/ข้อมูลจำลอง
5. ใช้ test:offline, lint, tsc และ build:offline เมื่อเปลี่ยนโค้ด ห้ามรัน dev/หน้า/API เพื่อทดสอบฐานข้อมูลโดย Agent
6. หากพบสัญญาณ Token/Usage limit จริง จบงานย่อยอย่างปลอดภัยถ้าทำได้ บันทึก checkpoint ทั้งสองแล้วหยุดรอผู้ใช้ ห้ามสมมติจำนวน/ตั้ง Automation/เปิด Session ใหม่/เปลี่ยนโมเดลเพื่อหลีกเลี่ยง

คำสั่ง Offline ที่ปลอดภัยจาก root:

```sh
git status --short
git diff --stat
git diff --check
npm run test:offline
npm run lint
npx tsc --noEmit
npm run build:offline
```

ขั้นตอนเปิดใช้งานบน macOS อยู่ใน docs/phase-3-secure-mysql.md สำหรับผู้ใช้ทำเองเท่านั้น อย่าคัดลอก .env.example ทับ .env.local ที่มีอยู่

## P3-B3 — 5 พฤศจิกายน 2026

ตรวจ Source PHP และใช้ shared service/RBAC เดิม ไม่สร้าง connection ซ้ำ. เพิ่ม validation ผล MySQL ให้ counts/category/recent/sync ไม่แสดงค่าผิดรูปแบบเป็นศูนย์, dateStrings ใน pool, ข้อความรอตรวจ Schema. เพิ่ม complete-schema mock mapping และทดสอบ render DashboardWidgets จริง (mock chart boundary). Offline guard ซ่อนไฟล์ dotenv ก่อนอ่าน bytes และปิด Network. ไม่แตะ .env.local ไม่ต่อ MySQL ไม่เปิดเว็บจริง ไม่แก้ PHP.

ผล: 31 tests ผ่าน (auth8/dashboard10/database10/components3), ESLint, TypeScript, build:offline และ diff check ผ่าน. รายละเอียดไฟล์/SQL/Schema/ขั้นตอน macOS: docs/phase-3-p3-b3.md. ข้อมูลจริงและภาพ Browser ยังรอผู้ใช้ทดสอบเอง; Schema เดิมที่ขาดยังห้ามเดาหรือสร้างทดแทน. หยุดรอผลผู้ใช้ ไม่มี Phase4.

## P3-B4 checkpoint — 2026-11-05 (ยังไม่เสร็จ)

คำสั่ง P3-B4 ใหม่อนุญาต Live LAN read-only และใช้ credentials ใน environment แล้ว มีผลเหนือข้อห้าม Offline ของ B2/B3. ห้าม DB writes, migrations, แก้ PHP, เปิดเผย secrets หรือ bypass auth เช่นเดิม.
ตรวจ @next/env development: shell DAAM_DB_ACCESS unset; effective DAAM_DB_ACCESS และ DB_USER unset; password present (ไม่แสดงค่า). เพิ่มเฉพาะ nonsecret settings ที่ขาดใน .env.local: access enabled, user tiw_dev, target host/port/database/charset/pool limit ตามคำสั่ง. Password เดิมไม่แก้. Production default ยัง disabled.
Live test: sandbox EPERM; retry ด้วย approved escalation สำเร็จ: MySQL authentication, SELECT 1=1, DATABASE()=daam, charset=utf8mb4 ภายใน START TRANSACTION READ ONLY แล้ว ROLLBACK/close. ไม่มี writes.
ยังค้าง: ตรวจ server เก่า/restart, schema metadata, shared pool live tests, authorized Login credentials/session, browser Admin/UI, mapping และ lint/TS/build สำหรับ B4. ยังไม่ได้ทดสอบ Login จริงหรืออ้างว่า Dashboard ใช้ได้. ไม่มี test account password จัดเตรียมในการสนทนานี้.
ไฟล์แก้ล่าสุด: .env.local (nonsecret settings only), docs/migration-progress.md, docs/CONTINUE_TOMORROW.md. หยุดที่ checkpoint ตามข้อจำกัดงบ context ของรอบนี้; ไม่ตั้ง automation.
คำสั่งต่อ: “ดำเนิน P3-B4 ต่อจาก checkpoint อ่าน docs ทั้งสอง ตรวจ Git diff แล้ว restart local server และตรวจ schema ผ่าน shared read-only service; ใช้ credentials จาก env โดยไม่แสดงค่า; ทดสอบ Login เฉพาะบัญชีที่ได้รับอนุญาต; ห้ามแก้ฐานข้อมูลหรือ PHP”

## P3-B4 live schema checkpoint (2026-11-05)

Shared lib/db.ts pool อ่าน PREVIEW_COLUMNS_SQL สำเร็จใน read-only transaction; credentials presence/access enabled ยืนยันโดยไม่เผยค่า. ตารางจริง 9 ตาราง: borrow_back, building, building_classroom, classification, durable_articles, repair, status_active, useraccount, usertype. durable_articles มี DA_ID, DA_ListName, DA_Number, statusID, classificationID, useraccountID และข้อมูลสถานที่/ราคา แต่ไม่มี is_approved/is_visible/owner_department/created_by. borrow_back ไม่มี status. ไม่มี _sync_meta หรือ department table. ยังห้ามแทน created_by ด้วย useraccountID โดยไม่มีหลักฐานความหมาย. Schema gating จึงยังจำเป็น; ยังไม่สามารถอ้างจำนวนรวมตรงสูตร PHP ได้.
HTTP localhost:3000/login ตอบ 200 และไม่มี disabled message แล้ว; environment ถูกต้อง ไม่ต้อง restart โดยไม่มีเหตุผล. /admin anonymous เป็น streaming HTTP 200 จึงต้องตรวจ NEXT_REDIRECT marker ไม่ใช่ status อย่างเดียว. ไม่ได้ login ด้วยบัญชีจริง ไม่มี credentials ทดสอบ; ไม่สร้าง session ปลอม.
งานค้าง: ตรวจ semantic mapping จาก PHP ต่อ, ข้อมูลจริงของ dashboard ที่มี scope/approval ไม่สามารถแทนสูตรด้วย global count, browser authenticated UI และ quality checks ของ B4. ไม่มีโค้ด application แก้ในรอบนี้. ยังไม่เสร็จ P3-B4.

## P3-B5 checkpoint — 2026-11-05

อ่าน docs/phase-3-p3-b5.md: เพิ่มการ์ดทะเบียน MySQL ทั้งหมดและกราฟประเภทใน slots เดิม พร้อม provenance banner; ใช้เฉพาะ Admin ที่ allDepartments ผ่าน และไม่ใช่ hidden mode เมื่อ schema ไม่มี approval/visibility. ไม่เดา ownership หรือ approval. Live shared read-only SQL ยืนยัน 4584 records และ top-six categories. UI authenticated ยังไม่ได้ตรวจเพราะไม่มี test credentials; no fake session. สถิติอื่นยัง gated ตามข้อจำกัดจริง.
ไฟล์แก้: lib/dashboard/model.ts, read.ts, lib/database/statements.ts, components/admin/dashboard-widgets.tsx, tests/dashboard.test.ts และ docs/phase-3-p3-b5.md. Offline tests 32 ผ่าน, TypeScript/ESLint/build:offline ผ่าน; build ไม่ต่อ DB. ลบเฉพาะ .next/types generated '* 2.ts' ที่ซ้ำเพื่อแก้ TypeScript. ไม่แก้ PHP/env/DB.
งานค้าง: authorized browser Login/Admin verification และ semantic mapping สำหรับ widgets ที่ยังไม่มีข้อมูลรองรับ. P3-B5 ยังไม่ครบทุก widget. กลับมาสั่ง “ดำเนิน P3-B5 ต่อจาก checkpoint ตรวจ authenticated UI และ mapping ที่เหลือ โดยไม่เปลี่ยน DB/PHP หรือเดาข้อมูล”. หยุด ณ checkpoint ไม่ตั้ง automation/Phase4.

## P3-B5 runtime fix / authenticated verification — 2026-11-05

User reported total/category errors after adding approved statements. Existing DAAM dev server PID 87176 was confirmed by lsof cwd, stopped alone, restarted with npm run dev at 127.0.0.1:3000. No application code/DB edits needed. Likely stale global cached database service retained old SQL allowlist through HMR; restart resolved observed symptoms.
Verified actual already-authenticated Chrome localhost:3000/admin UI: total 4,584 and category chart accessible values 2275/1125/458/332/303/32 visible, no total/category load errors. Existing user session remained valid. Did not perform fresh credential login or logout. Missing-schema widgets remain unavailable, not fabricated. Shared service global cache means SQL allowlist/pool implementation changes require dev server restart. No automatic reconnect task scheduled.

## Phase 4 / P4-B1 checkpoint — 2026-11-05

Phase4 authorized; latest PHP root /Users/imac-ES7/Downloads/daam-main. Four requested source files exist and match project copies byte-for-byte. Source audit docs/phase-4-source-audit.md. SQLite control/daam_dev.sqlite opened read-only: total4586, hidden3567, approved+visible1019, sync2026-10-29 06:35:15. MySQL4584 is different dataset: no substituting raw registry count for PHP normal count. No app routes migrated yet; no PHP/DB modifications.
Next: read remaining full source dependencies; implement safe source selection and Dashboard semantics, read-only manage-data/manage-users routes with exact per-page RBAC, QR payload/A4 and navigation. User management super-admin only exact id admin, unlike Dashboard predicate. Tests pending for Phase4. Files this batch: docs/phase-4-source-audit.md and checkpoint docs only.
Stopped at research checkpoint for turn budget; do not start session/automation. Resume prompt: “ดำเนิน Phase4 จาก P4-B1 อ่าน docs/phase-4-source-audit.md และ checkpoint แล้วพัฒนา routes และ Dashboard ตามแหล่งข้อมูลจริง ห้ามแก้ PHP หรือฐานข้อมูล และห้ามใช้ MySQL4584 แทน SQLite normal1019”.

## P4-B2 implementation checkpoint — 2026-11-05

Dashboard migrated to actual SQLite source. New lib/sqlite/dashboard.ts server-only service uses python3 child process without shell, configured absolute DAAM_SQLITE_PATH, Path.is_file then URI mode=ro, PRAGMA query_only=ON, single read transaction/rollback/close. Plans are generated internally by plansFor after Admin check, bound parameters, no public SQL interface. Sync SQL translated to SQLite strftime. Disabled/build gate blocks opening source. 10s timeout/2MiB output cap, sanitized errors. Existing MySQL authentication untouched. lib/dashboard/server.ts now uses this service. .env.local nonsecret DAAM_SQLITE_PATH set to authoritative Downloads/daam-main/control/daam_dev.sqlite; password untouched. Requires python3 on deployment host.

Actual existing authenticated Chrome /admin verified: normal1019, borrowed1, overdue0, pending0, available1017, maintenance1, category chart populated, recent5 rendered, sync29/10/2026 06:35. No fake sessions, no hardcode, no PHP/SQLite/MySQL writes. Fresh login/logout not performed.

TypeScript and ESLint passed; offline tests/build run (see last tool outcomes). Added disabled/nonadmin SQLite service regression to tests/database.test.ts. Original 32 tests plus new1.

Remaining REQUIRED work: full asset/manage_data dependency analysis and implementation of /admin/manage-data, /admin/manage-users, /admin/print-qrcode; shared reusable SQLite service extraction; exact scopes per PHP, list/detail/filter/pagination/export/photo behavior, QR payload/presets/local encoder/A4, navigation and tests. Do not mark Phase4 complete. Current menus remain placeholders intentionally. Need broader fixture read-only tests (file missing, query_only/no writes, schema isolation) for new SQLite service.

Resume: “ดำเนิน P4-B2 ต่อจาก Dashboard ที่ใช้งานจริงแล้ว อ่าน checkpoint และ lib/sqlite/dashboard.ts แล้วสร้างอีก3หน้าและทดสอบให้ครบ ไม่ทำ Dashboard ซ้ำ ไม่แก้ PHP/DB”. Stopped at safe checkpoint for context budget; no automation/new session.
