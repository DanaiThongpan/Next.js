# DAAM Phase 2 — MySQL Login and Role-Based Access

Completed 2026-11-04 (Asia/Bangkok). Phase 3 is not started.

## Open and run

- Login: http://localhost:3000/login
- Admin home: `/admin`; User home: `/user`; role redirect: `/dashboard`; denied access: `/unauthorized`.
- `npm run dev` binds only to 127.0.0.1:3000. The Phase 1 `/db-preview` remains development/loopback-only.
- Set `DB_PASSWORD` directly in ignored `.env.local`; do not paste it into chat. Other database parameters remain fixed server-side, exactly as Phase 1.
- `npm run test:auth`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- The test suite uses Node 22's TypeScript stripping and requires a local PHP CLI for one isolated interoperability test. Application runtime never executes PHP.

## Compatibility and actual columns

See `phase-2-analysis.md` for the full SQLite/MySQL comparison, source-file inventory and permission matrix captured before implementation.

The original `login.php` uses SQLite through `control/connectPDO_dev.php`. The user explicitly authorized using its behavior against real MySQL instead. SQLite was opened in read-only mode for schema inspection only; no Next.js authentication code uses SQLite.

MySQL `useraccount` has all needed fields: `useraccountID` (primary key), `userPassword`, `userActive`, `useraccountType`, `useraccountName`, `userDepartment`. Both databases also have `usertype(useraccountType, usertypeName)`. Login uses the actual type code in `useraccount` rather than trusting a client role or a translated label. `userRank` and `userEmail` are not queried. SQLite's extra email column is not required by login.

A read-only, aggregate-only MySQL inspection confirmed 11 bcrypt-formatted password values, costs 10–12. No password/hash values or user identities were printed. The implementation accepts bcrypt `$2a$`, `$2b$`, `$2y$` via bcryptjs (costs 4–16), rejects other formats, and has no plaintext/MD5/SHA fallback or rehash writes. bcrypt's existing 72-byte truncation behavior is preserved for compatibility. NUL-containing or excessively large inputs fail closed.

Login is a parameterized SELECT with `useraccountID = ? AND userActive = '1' LIMIT 1`. Session checks use a separate SELECT excluding the hash. The connection factory is shared with Phase 1, starts `START TRANSACTION READ ONLY`, disables multi-statements/LOCAL INFILE, and destroys the connection without committing. No legacy PHP API or migration is invoked.

References: https://github.com/dcodeIO/bcrypt.js and https://nextjs.org/docs/app/guides/authentication.

## Implemented permissions

| Identity / condition | Destination | Visible navigation / server access |
| --- | --- | --- |
| No valid unexpired session or no longer active | `/login` | Protected pages render no account data |
| Active, type exactly UT00000001 | `/admin` | Admin dashboard and nine admin placeholder menus |
| Active, any other type | `/user` | User dashboard; authenticated asset/borrow placeholders |
| Active, type exactly UT00000002 | `/user` | Additionally history, registration request, CSV request and request-history placeholders |
| Authenticated ordinary user requesting any `/admin` URL | `/unauthorized` | No admin screen or menu |
| Type other than UT00000002 requesting restricted user history/request URL | `/unauthorized` | Hidden from menus and denied server-side |

Admin users can open `/user` as allowed by the original user dashboard gate; its type-UT00000002-only pages remain unavailable. Every actual protected page checks session/current identity itself; protection does not rely on layouts being rerendered or on client menu visibility.

All business pages are explicit migration placeholders, with no counters, fabricated data, mutation forms, PHP links or operational APIs. Inconsistent legacy Super Admin/department conditions are documented but confer no new permissions. The user's explicit requirement that ordinary users cannot access Admin supersedes overly broad login-only checks found in a few PHP files. Their data/action behavior is deferred, not guessed.

Safe redirects accept only exact implemented destinations that the current identity can access. External URLs, arbitrary paths, PHP routes, query strings and unauthorized destinations fall back to the user's home.

## Sessions, CSRF and limits

- Opaque 256-bit cryptographically random token in an HttpOnly, SameSite=Lax, path=/ cookie. Secure is set for HTTPS.
- Production uses `__Host-daam_session` and requires `APP_ORIGIN=https://your-host` with the exact request Host. No production login is accepted without that explicit HTTPS origin configuration. Development allows localhost/127.0.0.1 on port 3000; HTTPS development can also use `APP_ORIGIN` explicitly.
- Tokens are stored only as SHA-256 filenames outside public/Git, under `.daam-runtime/sessions`. Server records contain only account ID and absolute expiry, never password/hash, user name, department or role. Directories/files use 0700/0600 on creation.
- Expiration is fixed at eight hours and enforced on the server as well as the cookie. Every page resolves the current active account/type from MySQL; role changes and deactivation are applied without trusting a stale session role.
- Successful login revokes the prior token and issues an unrelated random token. Failed login creates no session. POST logout deletes the server record and expires the cookie; replaying a revoked token fails.
- Strict allowed Origin + matching Host + cross-site rejection protect both POST endpoints; login additionally requires JSON. Request streams are bounded to 16 KiB. No GET logout endpoint or browser token storage is used.
- Atomic filesystem slots enforce five attempts per normalized identifier and 60 total per fixed 15-minute window, shared across local workers/restarts. A dummy bcrypt comparison is used for missing/inactive accounts. Generic errors do not disclose account existence.
- Old session/limiter files are cleaned opportunistically, with bounded iteration. Authentication responses and workspace routes use no-store, noindex, no-referrer, frame-denial and nosniff headers.

This file store is suitable for the current local/single-host Node setup with a persistent private filesystem. Multiple hosts/serverless need a shared revocable store outside DAAM MySQL and an explicitly reviewed deployment configuration. Do not expose the development server publicly. No session secret is required because the cookie is an unguessable opaque lookup token rather than a signed client-side identity.

## Validation results

- Live MySQL LAN authentication and read-only schema/hash-format inspection: passed. No existing account login attempts were made.
- Eight isolated automated test groups: passed. Includes correct/wrong passwords, unknown/inactive accounts, minimal DTO, admin/user/unrecognized-type permissions, menu restrictions, redirect allowlist, session rotation, logout replay, expiry, fresh role resolution/deactivation, cross-worker file persistence, concurrent throttling, Origin checks and cookie flags.
- PHP interoperability: synthetic password hashed using a standalone PHP expression was verified by bcryptjs; a synthetic JavaScript hash was verified with PHP `password_verify`. The test did not execute/include any legacy file, open a database or print a hash/password.
- Browser: login renders the blue gradient header, box icon, Thai labels and responsive Bootstrap card. Direct navigation to `/admin` with no session returns to `/login`.
- Live HTTP: `/login` loads; `/admin` and `/user` without session contain the Next.js streaming redirect to `/login`; foreign-origin POST login returns 403 without a database lookup.
- TypeScript and ESLint: passed.
- Production build: passed with Webpack, including the new routes. Build does not query account rows.
- Successful/failed real-account login, real-account post-login browser navigation and real-account browser logout remain untested: no authorized test account was supplied. Their workflows are covered by isolated mock repositories and actual filesystem-session tests; no mock auth mode exists in production.
- SSO and self-registration remain disabled, because no working SSO flow was found and account creation is prohibited in this phase.

## Created/updated Next.js files

Created:

- `lib/mysql.ts` (shared read-only connection)
- `lib/auth/{accounts,authenticate,login-session,origin,password,policy,resolve-session,runtime,session,store}.ts`
- `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- `app/(auth)/layout.tsx`, `auth.css`, `login/page.tsx`, `login/login-form.tsx`
- `app/(workspace)/layout.tsx`, `workspace.css`, `admin/page.tsx`, `admin/[section]/page.tsx`, `user/page.tsx`, `user/[section]/page.tsx`, `dashboard/page.tsx`, `unauthorized/page.tsx`
- `components/protected-screen.tsx`, `tests/auth.test.ts`
- `docs/phase-2-analysis.md`, this report

Updated from Phase 1: `lib/db-preview.ts` (reuse shared connection), `proxy.ts` (private response headers for auth/workspace, keeping preview restrictions), `app/layout.tsx` (Thai language), `package.json`/lock (bcryptjs + auth test script), `tsconfig.json` (test TS imports), `.gitignore` (private runtime storage).

No files under the legacy directory, MySQL data/schema/privileges, account passwords or account roles were changed.
