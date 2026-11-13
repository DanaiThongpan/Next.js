# DAAM Phase 1 — Real MySQL Read-Only Preview

Verified 2026-11-04 (Asia/Bangkok). Phase 1 only.

## Run

1. Set `DB_PASSWORD` directly in the ignored `.env.local` file. Quote values containing `#`. Never send the password in chat, commit it, or copy the PHP password.
2. Run `npm run dev` (binds to `127.0.0.1`).
3. Open http://localhost:3000/db-preview.

Connection settings are fixed server-side: 192.168.15.201:3306, database daam, account tiw_dev. No SQLite, legacy PHP execution, migration, write endpoint, arbitrary SQL, or caller-selected identifiers are used.

The legacy directory present on this machine is `daam-main สำเนา`, rather than `daam-main`. Its files were read only and were not modified. `control/connectDB.php` contains automatic schema changes and must never be executed or imported.

## Verified live schema

| Table | Primary key | Purpose |
| --- | --- | --- |
| borrow_back | IDborrow_back | Borrow/return records (metadata only) |
| building | buildingID | Buildings |
| building_classroom | classroomID | Rooms |
| classification | classificationID | Asset classification |
| durable_articles | DA_ID | Assets |
| repair | repairID | Repairs |
| status_active | statusID | Asset status |
| useraccount | useraccountID | Users (metadata only; no rows read) |
| usertype | useraccountType | User types (metadata only) |

All nine objects are BASE TABLEs. Full column names, types, nullable flags and primary keys are shown in the preview from INFORMATION_SCHEMA; column defaults and comments are intentionally not fetched.

No declared foreign keys were found. Logical relationships supported by the legacy code and corresponding live column names include:

- durable_articles.classificationID → classification.classificationID
- durable_articles.statusID → status_active.statusID
- durable_articles.buildingID → building.buildingID
- durable_articles.classroomID → building_classroom.classroomID
- building_classroom.buildingID → building.buildingID
- borrow_back.DA_ID / repair.DA_ID → durable_articles.DA_ID
- durable_articles.useraccountID and borrow_back.useraccountID_borrow/useraccountID_back → useraccount.useraccountID
- useraccount.useraccountType → usertype.useraccountType

These are inferred application relationships, not database-enforced constraints. The PHP copy also mentions `borrowing`, but that table is absent from the nine tables visible to this account in the live database. No borrower or user rows were read.

## Sample policy

Only `durable_articles.DA_ID` and `DA_Price` are selected, with a fixed `ORDER BY DA_ID LIMIT 10`. The table must be a base table with the expected primary key and column types. Returned identifiers must match `DT` plus ten digits and prices must be numeric; unexpected values are suppressed. Free text, account identifiers, descriptions, locations, images and user data are excluded. If the schema does not match, only metadata is shown.

## Read-only and local access

- mysql2/promise is imported through a `server-only` module.
- Each request starts `START TRANSACTION READ ONLY` before any metadata/sample query; unsupported servers fail closed. Disconnect ends the transaction without committing anything.
- All SQL is fixed in source. Multiple statements and LOCAL INFILE are disabled. Queries have a five-second timeout.
- No raw driver error, SQL packet, password or connection object is logged or returned.
- Preview requires development mode and a loopback Host; non-loopback forwarding headers are denied. Proxy and Server Component both check access.
- Loopback binding is the network boundary. Keep the server private; do not expose it through a reverse proxy or tunnel or override the binding.
- Responses use no-store/noindex. No data queries occur during production build.
- SELECT-only account privileges have not been independently confirmed. No privilege changes were made; a DBA can verify/provision SELECT-only access. The application additionally enforces a read-only transaction.

MySQL transaction behavior: https://dev.mysql.com/doc/refman/8.4/en/innodb-performance-ro-txn.html

## Validation

- LAN TCP 3306: reachable.
- Initial authentication failed; after the user updated `.env.local`, real authentication succeeded.
- Real read-only transaction, table/column/key metadata, foreign-key metadata: passed.
- Real asset samples: 10 safe records from durable_articles.
- Browser: rendered live connection success, nine table summaries, ten asset rows and no-FK message.
- HTTP: loopback request 200; non-loopback Host 403. Authentication failure message was also verified.
- Access guard: nine assertions passed, including production and forwarded-request rejection.
- `npm run lint`: passed after excluding the legacy directory.
- `npx tsc --noEmit`: passed.
- Next.js build: passed using Webpack; `npm run build` now uses `next build --webpack`.
- Turbopack build encountered an internal port-binding EPERM during CSS processing in this environment, including an escalated attempt. Webpack completed successfully.
- Google font fetching failed in the isolated network. The root layout now uses the existing system font stack without remote font downloads.
- npm install reported 16 moderate audit findings. No automatic dependency upgrades outside Phase 1 were performed.

## Files

Created: `app/db-preview/page.tsx`, `lib/db-preview.ts`, `lib/preview-access.ts`, `proxy.ts`, this report, and ignored `.env.local` when absent.

Updated: `package.json`, `package-lock.json`, `app/layout.tsx`, `eslint.config.mjs`, `tsconfig.json`. Next.js itself appended its feedback instructions to `AGENTS.md` during development.

No real database data/schema/privileges and no legacy files were changed. Phase 2 has not started.
