# CONTINUE TOMORROW — DAAM

> ล่าสุด: P3-B4 อนุญาต Live read-only แล้ว; ดู checkpoint ท้ายไฟล์ ซึ่งมีผลเหนือข้อห้าม Offline เก่า

Checkpoint 5 พฤศจิกายน 2026 (Asia/Bangkok). ไม่มี Automation; กลับมาทำต่อเมื่อผู้ใช้สั่งเองเท่านั้น

## ข้อห้ามล่าสุดมีผลเหนือรายงาน/Prompt เก่า

**Codex ห้ามเข้าถึง 192.168.15.201 จริงทุกวิธี** รวม mysql2/mysql CLI, probes, tunnels, API/หน้าเว็บที่ทำ Query จริง และ Browser Automation. ห้ามอ่าน/แก้ .env.local หรือดู Password/Token/Secret จริง. ทำได้เฉพาะ Source analysis, code และ Offline/Mock tests. ผู้ใช้เป็นผู้ทดสอบ MySQL จริงบน macOS เท่านั้น

การทดสอบ Live ที่เคยทำวันที่ 4 พฤศจิกายนเป็นประวัติภายใต้นโยบายเดิม ห้ามทำซ้ำจากคำสั่งในรายงานเก่า

## เป้าหมาย / Phase / Batch

ย้าย PHP Native DAAM ไป Next.js โดยรักษา UI พฤติกรรม และ RBAC, ไม่แก้ Source PHP หรือฐานข้อมูลจริง

Phase 3 — Secure MySQL Integration, Batch **P3-B3** เสร็จในขอบเขต Offline. Phase 4 ยังไม่เริ่ม/ไม่กำหนด. Main Dashboard data parity ยังรอ sanitized metadata + semantic mapping จากผู้ใช้ ห้ามแทนสถิติด้วยข้อมูลปลอมหรือเดาคอลัมน์

อ่าน docs/migration-progress.md ก่อน: มีผลลัพธ์ รายการไฟล์ และข้อจำกัดละเอียด จากนั้นอ่าน AGENTS.md, docs/phase-3-secure-mysql.md, docs/migration-map.md และ docs/permission-matrix.md. รายงาน Phase 1/2/3 เดิมใช้เป็นข้อมูลประวัติเท่านั้นเมื่อขัดกับนโยบายใหม่

## งานที่เสร็จ / Implementation

- Phase 1 /db-preview; Phase 2 Login/session/RBAC; P3-B1 Dashboard UI, Sidebar/Navbar/Footer และ schema dependency gating
- P3-B2 เพิ่ม **lib/db.ts** ตามโครงสร้าง app/ + lib/ ที่ root ไม่สร้าง src/ ซ้ำ
- lib/database/{config,errors,pool,statements}.ts: validated environment, disabled-first access, lazy bounded pool, safe errors, exact SELECT allowlist, parameter checks และ cleanup
- lib/mysql.ts เป็น re-export เข้าระบบใหม่ ไม่เหลือ createConnection path/hardcoded user
- Login/active identity/Preview/Dashboard ใช้ service ใหม่. Disabled ไม่ยืนยัน Session ไม่เปิด Admin แต่แสดงข้อความบน Login และ Preview; form/API Login ปิด. Logout ใช้ filesystem จึงไม่ต้อง MySQL
- START TRANSACTION READ ONLY + ROLLBACK ต่อ lease; destroy เมื่อ setup/cleanup ผิดพลาด, closeDatabasePool drain + end; no browser SQL endpoint, no write API
- Pool สร้างเมื่อมีคำขอที่ผู้ใช้เปิด enabled เท่านั้น; default disabled ก่อนอ่าน Credential properties. Default limit 2 (1–5), fail-fast, timeout 5 วินาที; credentials เปลี่ยนต้อง close/restart
- .env.example ไม่มี Secret และ allowlist .gitignore เฉพาะ Example; .env.local ไม่ถูกตรวจหรือแก้
- Test/Build ตั้ง disabled และ preload tests/offline-network-guard.mjs เพื่อปฏิเสธ TCP/TLS/DNS/fetch ก่อน Network; Build ปิด telemetry

## สถานะฐานข้อมูล / ปัญหาค้าง

เป้าหมาย config: 192.168.15.201:3306, daam, utf8mb4; DB_USER/DB_PASSWORD จาก Environment เท่านั้น. ไม่ทราบ Flag/Credentials จริงของ .env.local เพราะห้ามอ่าน

ค่าเริ่มต้นในโค้ดและ Example: **DAAM_DB_ACCESS=disabled**. ห้าม Codex เปิด enabled. บัญชีเก่า .env.local อาจยังไม่มี DB_USER; ให้ผู้ใช้เพิ่มเอง ไม่ fallback เป็น tiw_dev

Historical missing schema: durable_articles.is_approved/is_visible/owner_department/created_by, borrow_back.status และ _sync_meta. ยังไม่มีข้อมูลใหม่ยืนยัน การวาดกราฟ/สถิติจริงต้องรอ mapping; ไม่เดาว่าคอลัมน์ SQLite มีใน MySQL

สิทธิ์ SELECT-only และ Read-Only transaction บน Server จริงยังไม่ได้ยืนยันใน Batch นี้ ไม่มี live connection success claim. UI/real Login/pool compatibility ให้ผู้ใช้ทดสอบเอง ไม่มีการข้าม Auth หรือสร้างบัญชี/Session ปลอมเพื่อแสดงหน้า

Source เดิมจริงอยู่ daam-main สำเนา ห้ามแก้/Execute; connectPDO.php ที่อ่านแบบกรอง output ยืนยัน Auto Migration userRank/userDepartment. ห้ามเรียก PHP Dashboard เพื่อตรวจหน้าจอ เพราะเสี่ยง Execute Migration (เคยถูก auto-review ปฏิเสธ)

ไม่มี TypeScript/ESLint/Build error ค้าง; เคยแก้ preload require lint issue ด้วย .mjs ไม่ปิด lint rules. Node type-stripping warnings ไม่ทำให้ tests ล้ม. Audit 16 moderate เป็นประวัติ ไม่ได้ query npm audit/network ใหม่

## ผลทดสอบล่าสุด

- test:offline: 26 กลุ่มผ่าน = Auth 8 + Dashboard 8 + Database 10
- lint / tsc / build:offline / diff check: ผ่าน
- ไม่มี dev server/browser/API/live DB test ใน P3-B2
- Tests ใช้ข้อมูลสังเคราะห์และ mock driver; actual server-only module import ถูกทดสอบใน disabled mode พร้อม Network guard ไม่มี pool acquisition

## ไฟล์ที่สร้าง/แก้ล่าสุด

สร้าง: lib/db.ts; lib/database/*; .env.example; tests/database.test.ts; tests/offline-network-guard.mjs; docs/sql/schema-review-read-only.sql; docs/migration-map.md; docs/permission-matrix.md; docs/phase-3-secure-mysql.md

แก้: lib/mysql.ts; lib/auth/{accounts,session}.ts; lib/db-preview.ts; lib/dashboard/{model,server}.ts; app/api/auth/login/route.ts; app/(auth)/login/{page.tsx,login-form.tsx}; package.json; .gitignore; checkpoint สองไฟล์นี้

ยังไม่ Commit. Git มี untracked files หลาย Phase และ PHP ทั้งโฟลเดอร์ อย่า stage/clean/reset แบบรวม ห้ามรายงานเนื้อหา .daam-runtime/ หรือ Secret

## ขั้นตอนถัดไป / คำสั่ง

1. ตรวจ checkpoint, AGENTS.md, Source และ Git Diff โดยไม่อ่าน .env.local หรือ private Session store
2. รอผล Metadata ที่ผู้ใช้รันเองจาก docs/sql/schema-review-read-only.sql และลบข้อมูลอ่อนไหวแล้ว ไม่ Query ไปหาเอง
3. หากข้อมูลเพียงพอ จับคู่ semantics แบบ Offline ตามสูตร/permission เดิม หากไม่พอคง unavailable และระบุสิ่งที่ต้องยืนยัน
4. ภายในขอบเขตที่ระบุ แก้โค้ด/ทดสอบ Offline ได้โดยไม่ขออนุญาตซ้ำ ห้ามเริ่ม Phase 4 เอง
5. หากมีสัญญาณขีดจำกัดจริงให้บันทึกจุดหยุดแล้วรอผู้ใช้ ห้ามประมาณจำนวน Token หรือทำต่ออัตโนมัติหลัง reset

```sh
git status --short
git diff --stat
git diff --check
npm run test:offline
npm run lint
npx tsc --noEmit
npm run build:offline
```

ขั้นตอนผู้ใช้เปิด DB บน macOS อยู่ใน phase-3-secure-mysql.md เท่านั้น: ผู้ใช้เพิ่ม config เอง, เปลี่ยน enabled เอง และ restart dev เอง ห้าม Agent ทำแทนหรือคัด Example ทับไฟล์จริง

## Prompt เดิมที่ผู้ใช้ให้บันทึก (ต้องใช้ร่วมกับข้อห้าม Offline ด้านบน)

"ดำเนินงานย้ายระบบ DAAM จาก PHP Native ไป Next.js ต่อจากครั้งก่อน

อ่าน docs/migration-progress.md และ docs/CONTINUE_TOMORROW\.md ก่อน

ตรวจสอบ Source Code และ Git Diff ปัจจุบัน เพื่อยืนยันสถานะงานจริง

ดำเนินงานต่อจาก Phase และ Batch ล่าสุดที่ยังไม่เสร็จ โดยไม่ทำงานซ้ำโดยไม่จำเป็น

รักษาข้อกำหนดเดิมทั้งหมด โดยเฉพาะการใช้ MySQL แบบ Read-Only และห้ามแก้ไข daam-main

สามารถดำเนินงานด้านการพัฒนาได้โดยไม่ต้องขออนุญาตซ้ำ

หาก Token หรือโควตาใกล้หมดอีก ให้บันทึกความคืบหน้าและหยุดรอผู้ใช้"

ชื่อไฟล์จริงไม่มี backslash: docs/CONTINUE_TOMORROW.md. เมื่อต่อ Prompt ให้ระบุเพิ่มว่า **ทำเฉพาะ Offline ห้ามเชื่อมต่อ MySQL จริง ห้ามอ่าน .env.local และผู้ใช้เปิดการเชื่อมต่อเองเท่านั้น**

ไม่ได้ตรวจพบโควตาใกล้หมดในรอบนี้ ไม่มีตัวเลข Token ที่ยืนยันได้ บันทึกตามจุดจบ Batch และหยุดรอผู้ใช้

## Checkpoint P3-B3 ล่าสุด

อ่าน docs/phase-3-p3-b3.md ก่อนทำต่อ: มี SQL inventory, modified files, schema pending และ manual macOS steps. ปรับ read.ts validation, pool dateStrings, UI pending Schema, เพิ่ม mapping/component tests, ป้องกัน dotenv auto-read ใน offline guard. 31 tests, lint, tsc, build:offline ผ่าน. ไม่มี live DB/browser test และไม่ทราบ .env.local ปัจจุบัน. รอผลผู้ใช้ ไม่เริ่ม Phase4. คำสั่งกลับมาทดสอบ Offline: npm run test:offline; npm run lint; npx tsc --noEmit; npm run build:offline. ห้ามใช้ build/dev/page requests เพื่อต่อฐานข้อมูลจริงจาก Codex.

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

## P4-B3.1 code-edit-only checkpoint
Asset route/catalog updated: bounded server paging/search/sort, PHP readiness/borrowed/damaged predicates, approval/visibility/responsible fields, scoped photo endpoint with realpath containment and raster-only MIME, disabled write actions. Sidebar assets now /admin/manage-data. Shared server SQLite read.ts extracted; Dashboard/catalog use same read-only primitive. No tests/build/lint/SQL/browser/server restart executed per latest instruction. Export not found in source (CSV link is import, not export); not invented. User/QR work not continued this round. Await user testing; changes unverified.

## P4-B3.2 code-edit-only checkpoint
Dedicated UserCatalogPage now supplies header/scope summary, safe fields, role/status badges, filters, allowlisted SQL sorting/direction, scoped count + 25-row server pagination, details, disabled write actions and loading/error/empty states. Uses existing SQLite read service and MySQL session gate. Only exact Admin ID admin sees all departments; other admins scoped in SQL before count/pagination; blank department has 1=0. No SELECT *, hashes, email or unnecessary fields sent. Sidebar users now /admin/manage-users; other menus unchanged. No tests, SQL, DB access, browser or server restart this round. Position/email omitted to minimize personal data and avoid relying on optional schema columns. Await user tests; no success claim.

## P4-B3.3 code-only checkpoint
Added dedicated lib/sqlite/qr.ts: source-exact visible-only QR read, no approval filter; PHP QR has no department SQL predicate after Admin gate (unlike manage_users). Explicit safe columns, parameterized search/category/building, 12/24/48/96 page sizes. scan base configurable DAAM_QR_SCAN_BASE_URL, default PHP localhost:8000/borrow_request.php?asset_id=; rejects credentials/non-http URL. qr-payload.ts matches PHP urlencode. QR client local qrcode M, selected counter/all/clear, generation error, paginated selection reset, normal44x52/gap3 small28x38/gap2.5 large62x76/gap4. Explicit A4 page chunks 4x5/6x6/3x3, body portal prevents Sidebar clipping; no external QR API. Route filters and Sidebar QR connected. No DB reads/tests/browser/build/install/restart this round. Physical scan/print and runtime remain user verification. Selection limited to current page.

Six-module code-only: approvals/history/repairs/mail bounded scoped read pages added via admin-modules.ts and ReadModulePage. Partial: detailed parity/filter/UI pending; mail only safe sender/schedule/active fields, no credentials; source mail admin/admin_test only. No tests or live reads.
Six-module continuation: CSV client preview added (standard template headers + required DA_Number/DA_ListName only; no DB duplicate/reference checks; max2MB/10krows, preview100). Reports source-specific approved inventory status aggregation added; intentionally not Dashboard formula. All six modules Partial: richer per-module UI/filter semantics, complete reports charts/export, CSV alias/mapping inference and mail full safe form pending. No tests/SQL/browser/build/run/install. Sidebar development labels retained because parity incomplete. New files: lib/sqlite/admin-modules.ts, components/admin/{read-module-page,csv-preview}.tsx and six static routes. Await user testing. No writes/secrets/external services.

## Admin UI modernization — code only
All nine management routes receive scoped modern.css via AdminShell pathname flag; Dashboard unaffected by management styling. Added page-meta title map, dynamic navbar title/breadcrumb and existing mobile drawer/collapse preserved. Shared AdminReadOnlyNotice used by asset/user/module pages. Table/filter/card/detail/pagination/focus/mobile styling unified; CSV invalid rows highlighted, module column/detail headings translated. No SQL/auth/RBAC/contracts/QR payload/print rules changed. Sidebar brand updated DAAM. Reports and mail functionality remains Partial per prior checkpoint; no mock additions. Files: components/admin/{page-meta.ts,ui.tsx,admin-shell,admin-navbar,admin-sidebar,catalog-page,user-catalog-page,read-module-page,csv-preview}.tsx (extensions as applicable), admin/layout.tsx and styles/modern.css. No tests/build/browser/DB calls. User should check responsive overflow, drawer/focus, QR print CSS interaction and visual consistency. UI changes unverified, await user testing.

## Original PHP UI restoration — code only
Removed modern.css import and modern route class; no added breadcrumb/theme. Restored source Navbar h5 desktop/h6 mobile structure/buttons and Admin Panel brand. Added php-pages.css containing verbatim inline CSS extracted from authoritative nine PHP pages except QR (existing print rules preserved), scoped per route with @scope; :root variables localized to :scope. Asset/User headers and approvals summary structure moved toward source. Shared ReadOnly notice now Bootstrap alert. No SQL/auth/services/payload/validation changes. No tests/browser/DB/build. NOT pixel-perfect: generic tables/details/filter markup in modules, full modal structures, CSV/report/mail page-specific DOM still need further conversion; CSS alone does not complete migration. QR DOM/print unchanged. User must inspect desktop/mobile CSS @scope support and print rendering.

## Full migration continuation — code-only, still Partial
Added shared native-dialog OriginalDetailModal with source Bootstrap modal header/body/footer, keyboard close; asset/user/approval/history/repairs details use it. Mail safe sender/notification form display added (disabled password empty, no secret read); disabled repair form follows source fields/date/cost/description. CSV mapping now source aliases and positional fallback, mapping visible; no DB duplicate/reference inference added. Reports top10 category quantity/value SQL follows source approved+department predicates; no live execution. Files: original-detail-modal.tsx, mail-settings-view.tsx, read-module-page.tsx, catalog-page.tsx, user-catalog-page.tsx, csv-preview.tsx, reports/page.tsx. All9 still Partial for full source DOM/function parity; remaining report time-series/top lists, reference-based CSV inference, detail history/photos completeness, full original forms/modal layouts, scoped exports and visual review. No tests/build/browser/SQL/DB/server restart. ReadOnly remains enforced. Await user tests; do not claim complete/pixel-perfect.

Manage-data exact-source continuation: dedicated AssetPage + readAssetPage. Added source filter parameter aliases, DB master dropdowns/years and scoped visibility counts, 9-column source table, 10/25/50/100 server pages, column sorting/direction, range summary, name/detail modal trigger, building/room and price. No live reads/tests/build/browser. Remaining: full asset borrow-history/QR detail layout, source-perfect badges/action icons and visual review; no export found. Photo endpoint and writes restrictions retained.

## Manage Users exact-source continuation — code only
UserCatalogPage now matches source header/subtitle/card, 8-column order (ID/name/rank/department/email/role/status/actions), source role/status icons and badge classes, disabled yellow edit and green add buttons. Source connector confirms userRank/userEmail definitions; explicit safe projection added, no passwords. Default10 with10/25/50/100 entries, column sorting and range summary; SQL scoping unchanged. Existing extra filters kept collapsible, query parameters preserved. Source edit_user navigation remains disabled; supplemental read-only detail modal retained, so not exact source behavior. Files user-catalog-page.tsx, catalog.ts. No tests/browser/SQL/DB/build/server operations. Await user visual/runtime review; no pixel-perfect claim.

QR exact-source continuation: source title/subtitle/filter-card, original category_id/building_id/keyword aliases/options/counts and initial no-items-until-filter restored. All filtered page items selected initially as original prints all fetched items; manual current-page selection retained as extension, no cross-page persistence. QR 250px black/white M, margin0 matches qrcodejs no-added-quiet-zone source; source sticker header/category/footer/number/name and preset QR/font/padding values applied. A4 dimensions/gaps preserved; explicit page capacities computed to fit printable area (PHP itemsPerPage comments are estimates, differ from physical grid). Files qr-printer.tsx, qr.ts, print-qrcode/page.tsx. Pending: full source filter/control DOM, scan_base_url editor/border toggle, unrestricted all limit intentionally still bounded pagination; configurable scan base defaults existing localhost8000 source, deployment must configure original origin. No tests/browser/DB/build.

## QR workflow correction — code only
Replaced checkbox/table workflow with Category→Building→Search→Count→editable Scan Base→cutting border→Generate GET form. Initial welcome no asset reads/QR preview until generate=1 plus category. Limits12/24/48/96/all; all read in200-row chunks, no database writes. QR component reuses payload/local qrcode M, no selection/size UI. Explicit3x4 A4 page chunks as latest user mandate, 10/8mm margins, border toggle screen/print, portal hides app controls. IMPORTANT source CSS uses variable44x52mm and auto-fill (4+ columns), conflicting with requested fixed3x4: implemented latest fixed3x4, derived cells from printable194x277mm with4mm gap; not claiming source pixel equality. Base input validated http(s), no credentials/hash; default original origin via configured QR base. All-mode potentially large memory/browser load; chunks not single-source snapshot. Files qr.ts, qr-printer.tsx, print-qrcode/page.tsx. No tests/build/DB/browser/restart. Await user test.

## Approvals source-exact continuation — code only
Dedicated approvals.ts, ApprovalsPage, approvals route replace generic module UI. Pending is_approved=0 only; no visibility predicate. Source SQLite service, explicit safe columns and exact Admin id admin/global vs department/null-owner-created_by scope before COUNT/paging. Added source joins category/building/room/requester fields; no account secrets. Source has Approval Policy Card (retained), 9-column table, pending summary, inline name/brand/detail, requester/location, disabled approve/reject buttons. Source has no detail modal or submitted-date/image in this page, none invented. Default10 with entries/search/sorting server equivalent, errors distinct from true empty; 0 cannot be confirmed without user DB test. No SQL/database/browser/build/tests/server operations. ReadOnly prevents success/rejection/confirm POST flows intentionally. Pending exact badge/visual polish review by user.

## History dedicated migration — code only
New sqlite/history.ts, HistoryPage and history route: source borrower/asset/user joins, due fallback, safe explicit inner projection, 4 scoped KPI aggregates,6-column table,25 default pagination/search/sorting, default COALESCE(timestamp_borrow,Date_borrow) DESC then ID DESC. No extra department/status/date filters. Date helper validates ISO date-only UTC day arithmetic against Bangkok today; Thai timeliness labels, email/rank/affiliation, CLB, last reminder displayed. Source Admin predicate mapped only available identity fields; unused session aliases not invented. No email/write/log actions. Remaining exact source class/color/avatar CRC32 match, email preview/detail dialogs and malformed non-ISO date parity require work/user check. No tests/build/browser/DB/SQL/restart performed. Counts not confirmed, no hardcode. Await user tests.

## History + Approvals functional continuation — code edit only
History: extracted pure history-logic.ts date/status/avatar utilities; fixed missing return date incorrectly falling back to today for lateness, uses validated ISO date arithmetic; source CRC32 UTF8 avatar palette; pending-late labels/row classes; expanded scoped search before pagination. Added source disabled return/approve-return/delete actions and safe notification data dialog + recipient/missing-email/reminded-today UI. Does not send email or claim delivery success; source only supplies last_reminded_at (not full delivery log). Existing stats/count use full scoped records, not page subset. Approvals: source requester ID fallback, owner department no fabricated fallback; department predicate bound and intersected with server scope. Source rejection deletes row, no rejected status invented. Files lib/history-logic.ts, lib/sqlite/history.ts, components/admin/history-page.tsx, lib/sqlite/approvals.ts, components/admin/approvals-page.tsx. Remaining source email letter body/confirmation parity and complete inline row styling need review; no enabled confirmation/write flow due ReadOnly. No tests/build/browser/DB/SQL/server/PHP execution. Counts/date/UI not runtime-verified. Await user testing.

History final presentation fix: only history-page.tsx changed. Raw source id rendered verbatim (PHP prints id directly; removed added B, no stripping). Asset badges separate with source icon/classes; borrower optional rank/affiliation only, no invented fallback; no-email source styling. Source table heading, summary border/icons/timely labels and Thai numbered pagination/disabled states/range wording. Query/date/status/auth logic untouched. No tests/browser/DB/build. Remaining source exact KPI inner alignment/quick-filter controls and letter template not fully migrated; visual review pending.

## Scoped write enablement — code only, PARTIAL
Latest user explicitly authorizes real approval/rejection/History writes. New lib/sqlite/actions.ts opens existing configured SQLite mode=rw (never creates), gated DAAM_DB_ACCESS + separate DAAM_SQLITE_WRITES=enabled; no global read-service guard removed. BEGIN IMMEDIATE locks state/authorization checks + mutation; commit before ok; rollback on error. Approve pending0→approved1/statuss0001; reject pending only, checks borrow/repair refs and refuses unknown declared incoming FK. Return source approveReturn transaction updates history and asset readiness only if no other outstanding loans. Source per-resource department/owner checks server-side; id/role not trusted from client. CSRF trustedOrigin + currentIdentity API app/api/admin/operations; client confirmation/loading/messages/router.refresh wired approval/reject/return only. Other buttons including mail/history delete remain disabled. .env.example write opt-in default disabled; actual env unchanged. No live SQLite/MySQL/write/email/test/build/browser/server operations. SMTP + anti-duplicate delivery workflow NOT implemented; do not enable mail button. Write paths NOT runtime-verified. Remaining: source email provider/config analysis + implementation, historical delete if parity needed, details/confirmation polish, transaction validation fixtures/user tests. Raw related refs/schema types not live queried this round. Files actions.ts, api/admin/operations/route.ts, operation-button.tsx, approvals-page.tsx, history-page.tsx, .env.example. Safe response errors only; no secrets. User must set DAAM_SQLITE_WRITES=enabled themselves to opt in runtime; do not claim whole feature done.

## History email and actions — code only
HistoryEmailDialog centers native top-layer dialog, dark header/backdrop, scroll/focus restoration, preview then explicit confirm. history-email.ts shares escaped HTML across preview/send. Source mailer uses UBU REST Mail API (not direct SMTP), server-only SMTP_USER/PASS, safe sender/active settings read from SQLite. POST history-reminder enforces origin/session/Admin/scoped record, due/recipient/active/state and same-day duplicate checks, preview hash detects changes. File reservation prevents same-day Next.js duplicate attempts sharing .daam-runtime, retains ambiguous sends for manual reconciliation. Provider accepted then SQLite last_reminded_at + restricted JSONL audit (id/recipient/type/time/result/actor); distinguishes partial recording failures. Separate legacy PHP/multiple hosts without shared runtime do not share reservation. Native modal and email layout approximate PHP; full email log browsing and exact PHP letter/cron modal styling not migrated. Existing write opt-in required. History delete operation only for History global Admin, transactional source borrowing cleanup/readiness, rejects declared FK dependencies. Cron displays source schedule information only. No tests, browser, DB, actual mail or cron run. Files history-email.ts, sqlite/{history,history-reminder,actions}.ts, admin/{history-email-dialog,history-page,operation-button}.tsx, API history-reminder/operations routes, .env.example. User runtime verification pending.

## Manage Data multiple categories — code only
Asset page and asset-category-switches.tsx replace single category dropdown with Bootstrap switches, 1/2/3 columns, selection count and Select/Clear All. Debounced 200ms App Router replace preserves filters and resets page without full reload. Repeated filter_category keys survive GET forms and sort/paging links. assets.ts validates IDs against category master; catalog.ts applies bound IN or explicit empty predicate only to assets, retains department/approval/visibility scope and counts with same predicates. All selection removes category restriction. Per-category counts omitted because existing master projection lacks scoped counts. Existing write controls remain read-only; full PHP visual parity requires user review. No tests/build/browser/live DB.

## Database integration and safe activation
PHP Dashboard, Manage Data, Manage Users, QR, Approvals, History, CSV, Repairs, Reports and Mail resolve to the same legacy control/daam_dev.sqlite through connectPDO_dev.php or db.php. Next.js MySQL authentication keeps its lazy server-only mysql2 pool. Database config accepts DAAM_DB_* and legacy DB_*; a namespaced credential pair takes precedence without mixing passwords across pairs. Existing local credentials were present and left in place. Environment example now defaults disabled and omits its former password value. No live connection or runtime verification.
Added scoped asset visibility writes to the existing operations endpoint, with bound input and current approval check inside its transaction. SQLite write opt-in remains separate. Reject and history deletion now blocked in server service and UI pending backup verification. Approval, return, reminder and asset visibility are available for user verification with appropriate configuration. Create/update flows for asset/user/CSV/repair/mail are incomplete and controls remain disabled. No schema migration, synchronization, live writes, email or tests.

## Admin write follow-up
Removed blanket read-only notices from active admin pages and kept disabled controls for unfinished operations. Asset readiness/damaged writes now use the scoped SQLite transaction and reject outstanding loans. Approval and return remain available through the write opt-in. Asset status change does not yet take the optional repair note from PHP. Account/asset CRUD, CSV import, repairs and mail configuration still need implementation. Destructive actions stay disabled pending backup verification. Code edits only.

## Manage Data PHP rebuild
Updated asset-page and category switches, added asset-status-form, asset-extra-detail and scoped asset-detail API, extended the operations route and SQLite transaction, and added opt-in modal variants. Original PHP uses control/daam_dev.sqlite. Filters keep multiple categories with 180ms debounce and expose individually removable active filter badges. Table offers detail, image, status, repair, QR and visibility actions. Status and optional repair note commit together, with approved asset and ownership checks, outstanding-loan guard, and legacy repair ID allocation serialized under BEGIN IMMEDIATE. Sync remains disabled since PHP imports the SQL dump into SQLite and impact is unverified. Editing remains disabled; repair/QR links open search forms, not an exact single-item print. Full legacy detail field/style parity remains unverified. Code edit only, no tests, build, browser or live database.

## Full migration source audit baseline
Current phase: recursive discovery and entry routing. Indexed 17,391 paths, read static markers in 120 first-party PHP files and catalogued 241 PHP review units. Added LEGACY_SOURCE_INVENTORY, FUNCTIONAL_INVENTORY, ROUTE_MAPPING, DATABASE_MAPPING and MIGRATION_PARITY_MATRIX. Static markers are leads, not exhaustive business rules or unique functional coverage. Third-party/generated files grouped separately. No secrets reproduced.
Completed this round (implementation unverified): DAAM-107, app/page.tsx routes the legacy root entry to existing /login. Existing Admin/Auth modules retain earlier partial status. Pending: trace public borrow_request.php, search/detail, user borrow/return/request flows, old handler reachability, JS/AJAX/form dependencies, schema and per-role behavior. Start with public entry and QR borrowing route because generated stickers depend on it. No live DB, tests, browser, build or PHP execution.

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

## Category availability

เพิ่มสถานะปิดหมวดแบบถาวรใน control/disabled-categories.json ที่อยู่ข้าง SQLite ใช้การล็อกไฟล์และ atomic replace โดยไม่แก้สถานะครุภัณฑ์รายชิ้น API อนุญาตเฉพาะ Admin ID admin การอ่าน Next.js และ PHP ต้องชี้ control directory เดียวกัน แก้ PHP ที่ได้รับอนุญาตแล้ว ได้แก่ includes/CategoryAvailability.php, includes/BorrowService.php และ api_search_assets.php โดยกรองค้นหาและ getAsset และตรวจซ้ำก่อนบันทึกคำขอยืม เพิ่มตัวกรอง QR ใน Next.js หน้ารายการ Admin ยังมองเห็นทะเบียนเพื่อบริหารได้ ยังไม่ทดสอบ runtime และยังต้องไล่รายการ PHP หน้าอื่นที่ใช้ SQL ตรงแทน BorrowService การคืนผ่าน QR ของหมวดที่ปิดอาจต้องแยกเส้นทางจาก getAsset ที่กรองรายการ

## Local simulation database

ผู้ใช้เลือก db/daam_dev.sqlite เป็น SQLite ของ Next.js แล้ว อัปเดต DAAM_SQLITE_PATH ใน .env.local เป็น absolute path ของไฟล์นี้ เปิด DAAM_SQLITE_WRITES สำหรับฟังก์ชันบันทึกบนฐานจำลองตามคำสั่งใช้งานก่อนหน้า DAAM_DB_ACCESS เปิดอยู่เดิม ไม่มีการเปิดฐานข้อมูลหรือรัน SQL รอบนี้ MySQL authentication ใช้การตั้งค่าเดิม PHP ยังใช้ฐานเดิมและ CategoryAvailability.php ยังอ่าน policy จาก control จึงยังไม่แชร์สถานะกับ Next.js ที่ย้ายมา db

## SQLite source and category enforcement update

Login account lookup, active-session identity lookup and database preview now use the existing SQLite read service. Removed mysql2 initialization from lib/db.ts. PHP db.php and control/connectPDO_dev.php now point to the project db/daam_dev.sqlite, and PHP category policy points to db/disabled-categories.json. The central Next.js reader creates connection-local TEMP views for durable_articles, borrow_back and repair when categories are disabled, hiding those records before all SQL aggregation, pagination and joins. Persistent database schema and asset statuses are untouched.

Connection read check found 13 tables, 4586 assets and 12 active accounts with bcrypt-compatible hashes. Tested the actual embedded read program against a temporary SQLite copy: disabling a category removes its assets and enabling restores the original counts. Did not change source records or run browser/build tests. PHP search/BorrowService enforces the shared policy, but independent legacy PHP pages with direct SQL still require tracing for complete PHP-wide hiding. Prior admin sessions may need logging in again if account IDs differ between MySQL and SQLite.

## Global CLB visibility

เพิ่ม ClbVisibilitySwitch ที่โหมดการแสดงผล /admin/manage-data และ POST /api/admin/clb-visibility เฉพาะ Admin ส่วนกลาง บันทึก boolean แบบ atomic ใน db/clb-visibility.json ค่าเริ่มต้นเมื่อยังไม่มีไฟล์คือซ่อน ตัวอ่าน SQLite ส่วนกลางกรอง buildingID ที่ขึ้นต้น CLB และประวัติยืม/ซ่อมที่เกี่ยวข้องก่อน query เมื่อเปิดจะให้ CLB ผ่านเงื่อนไข is_visible เดิมใน connection-local TEMP view โดยไม่แก้ค่าฐานข้อมูล หมวดที่ปิดยังคงถูกกรองเสมอ ทดสอบบนสำเนาชั่วคราวพบความต่าง 3567 รายการตรงกับจำนวน CLB ต้นฉบับ ยังไม่ได้ทดสอบ Browser และ PHP legacy ยังไม่อ่าน clb-visibility.json

## Manage Data legacy UI comparison

ตรวจหน้า PHP จริงใน Chrome รวมถึง mobile emulation แล้วคืนหัวข้อและแถวตัวกรอง Dropdown ตามต้นฉบับ ลบการ์ดสรุปที่เพิ่มเอง เก็บการเปิด–ปิดหมวดและ CLB ในแผงพับแยก ปรับสี ขนาดตาราง ช่องค้นหา และปุ่มไอคอนด้วย asset-table.css ที่ใช้ class prefix เฉพาะหน้า ตรวจหน้า Next.js ใน Chrome หลัง reload แล้ว แถบ Search อยู่ขวาและปุ่ม 7 actions อยู่แถวเดียว ยังต่างจาก PHP ใน responsive table ซึ่ง PHP ใช้ DataTables responsive collapse แต่ Next.js ใช้ horizontal scroll และการตั้งค่าพิเศษที่ PHP ไม่มี


## Manage Users — details and editing
- Updated components/admin/user-catalog-page.tsx and added components/admin/user-editor.tsx: centered responsive details dialog and editable account form with save/loading/error states.
- Added app/api/admin/user-edit/route.ts; extended lib/sqlite/actions.ts with parameterized transactional user edits. Rechecks active Admin and exact department inside transaction; only account admin may cross departments. Self role/status/email retained; password optional bcrypt with PHP-compatible hash, passed to worker over stdin.
- New-account creation remains disabled. No database connections, writes, builds, browser checks or tests were performed for this change. User must verify saving with an authorized test account.
- Extended lib/auth/store.ts to revoke existing account sessions after password changes; self password change returns to login.

## Repairs — PHP screenshot alignment
- Replaced app/(workspace)/admin/repairs/page.tsx generic module view with dedicated maintenance page: summary cards, original heading/breadcrumb, search, entries count, sortable table, totals and pagination.
- Added lib/sqlite/repairs.ts using existing SQLite read runner and server Admin checks, department scope aligned with current saveRepair restrictions. No-department Admin fails closed; shared-department assets are not offered unless editable under existing write policy.
- Updated components/admin/repair-form.tsx: centered responsive add/edit dialog, scoped asset dropdown instead of raw DA_ID, Bangkok current date, cost, description, cancel/save/loading/error feedback. Existing save API retained.
- No tests/build/browser/database connections or writes were run. Visual parity and save/edit/delete require user verification; PHP remains untouched.

## Asset-specific repair history from Manage Data
- Changed both repair links in components/admin/asset-page.tsx to /admin/repairs/asset?DAID=<asset ID> instead of text search.
- Added app/(workspace)/admin/repairs/asset/page.tsx and components/admin/asset-repair-entry.tsx: asset specifications, inline add repair, scoped history with edit/delete controls, totals and pagination; matches legacy page_Repair_AddEdit.php structure.
- Extended lib/sqlite/repairs.ts with explicit-field, parameterized asset lookup and server department authorization, reusing current SQLite runner/save endpoint. No PHP modification, DB access, tests/build/browser run. Await user visual and functional verification.

### Repair asset loading follow-up
- Confirmed configured SQLite path points to project db/daam_dev.sqlite; read-only metadata and asset lookup succeeded using existing Python reader. No writes performed. Repair table currently empty.
- Asset-specific readRepairs dropdown now restricted to selected asset; IDs trimmed. Separate asset lookup errors from history loading errors; error state distinguishes DB read failure from asset not found/access denied and displays requested ID.
- No browser/build checks performed. Original reported failure not reproduced in read-only SQL lookup; if it persists obtain exact Next.js URL/account scope and displayed error. Do not claim full functional verification.

## Manage Data — four legacy screenshot references
- Updated asset-page.tsx detail rendering to new asset-detail-content.tsx: photo/placeholder, local QR, labeled asset fields, visibility badge, specification panel, loan records and edit/repair/single QR links.
- Updated asset-status-form.tsx readiness options and damage/repair panel; initial damaged state follows current displayed status. Existing operations endpoint unchanged.
- Updated asset-edit-form.tsx to single-column legacy order, current QR and cancel/save actions. Department/status remain managed by existing controls; full legacy edit controls not newly implemented.
- Added asset-qr-code.tsx, single-asset-qr.tsx and manage-data/qr/page.tsx for authenticated scoped single QR print with local library, own-origin legacy borrow_request payload, print-only label. No external QR API.
- No build/test/browser/DB writes run. Visual parity, QR target routing and print behavior require user verification. Existing legacy-style borrow_request.php payload is retained; destination availability is not asserted.

## Manage Users layout correction
- Added scoped components/admin/user-catalog.css and updated user-catalog-page.tsx: search/input/button grouped on right, stable column widths with horizontal mobile scrolling, legacy table header/spacing, constrained badges/email wrapping, centered dialog presentation and mobile sizing.
- Empty department now displays ไม่ระบุ. Existing user editing, API and department RBAC unchanged; no changes to other pages.
- Source comparison only; no browser/build/tests/database access performed. Await user visual verification.
