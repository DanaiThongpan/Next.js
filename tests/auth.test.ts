import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { verifyPassword, supportedHash } from '../lib/auth/password.ts';
import { authenticate, type LoginRecord } from '../lib/auth/authenticate.ts';
import { sessionStore, SESSION_SECONDS, consumeLoginAttempt } from '../lib/auth/store.ts';
import { isAdmin, homeFor, menuFor, destinationFor, permitted, userMenu } from '../lib/auth/policy.ts';
import { trustedOrigin, sessionCookieName, sessionCookieOptions } from '../lib/auth/origin.ts';
import { loginSession } from '../lib/auth/login-session.ts';
import { resolveSession } from '../lib/auth/resolve-session.ts';
import { execFileSync } from 'node:child_process';

const syntheticPassword = 'synthetic-test-รหัสผ่าน';
const syntheticHash = await bcrypt.hash(syntheticPassword, 4);
const phpCompatibleHash = syntheticHash.replace('$2b$', '$2y$');
const account: LoginRecord = { id: 'fixture-user', name: 'Synthetic fixture', department: 'Test only', type: 'UT00000002', active: '1', passwordHash: phpCompatibleHash };
const dependencies = { find: async (id: string) => id === account.id ? account : null, verify: verifyPassword };

// No MySQL import, connection or real account is used anywhere in this suite.
test('bcrypt accepts PHP 2y and 2a/2b variants; rejects wrong password and unsupported formats', async () => {
  for (const prefix of ['$2y$', '$2b$', '$2a$']) {
    assert.equal(await verifyPassword(syntheticPassword, syntheticHash.replace(/^\$2b\$/, prefix)), true);
  }
  assert.equal(await verifyPassword('incorrect-synthetic-password', phpCompatibleHash), false);
  assert.equal(supportedHash('not-a-bcrypt-hash'), false);
  assert.equal(await verifyPassword('synthetic', 'not-a-bcrypt-hash'), false);
  assert.equal(await verifyPassword('contains\0null', phpCompatibleHash), false);
  const utf8 = 'ก'.repeat(24);
  const longHash = await bcrypt.hash(utf8, 4);
  assert.equal(await verifyPassword(utf8 + 'suffix', longHash), true); // PHP bcrypt's 72-byte behavior.
});

test('authentication trims ID, enforces active status, and returns only safe identity fields', async () => {
  const identity = await authenticate('  fixture-user  ', syntheticPassword, dependencies);
  assert.deepEqual(identity, { id: account.id, name: account.name, department: account.department, type: account.type });
  assert.equal(await authenticate(account.id, 'wrong', dependencies), null);
  assert.equal(await authenticate('unknown-fixture', 'wrong', dependencies), null);
  assert.equal(await authenticate(account.id, syntheticPassword, { ...dependencies, find: async () => ({ ...account, active: '0' }) }), null);
  assert.equal(await authenticate('', syntheticPassword, dependencies), null);
  assert.equal(await authenticate('x'.repeat(101), syntheticPassword, dependencies), null);
  assert.equal(await authenticate(account.id, '', dependencies), null);
});

test('role gate, menus, direct URL authorization and redirects match verified type conditions', () => {
  const admin = { ...account, type: 'UT00000001' };
  const unusual = { ...account, type: 'Other' };
  assert.equal(isAdmin(account), false);
  assert.equal(isAdmin({ ...account, id: 'admin', name: 'administrator', department: '' }), false);
  assert.equal(isAdmin({ ...account, type: 'Super Admin' }), false);
  assert.equal(homeFor(admin), '/admin');
  assert.equal(homeFor(account), '/user');
  assert.equal(homeFor(unusual), '/user');
  assert.equal(permitted(account, 'admin'), false);
  assert.equal(menuFor(account, 'admin').length, 0);
  assert.equal(menuFor(admin, 'admin').length, 9);
  assert.deepEqual(menuFor(account, 'user').map(item => item.slug), [
    'available', 'borrow', 'borrowed', 'history', 'requests', 'request-csv', 'request-history', 'profile',
  ]);
  assert.equal(menuFor(unusual, 'user').length, 3);
  assert.equal(permitted(admin, userMenu.find(m => m.slug === 'history')!.permission), false);
  for (const bad of ['/admin', '//evil.test', '/\\evil.test', 'https://evil.test', '/admin/main.php', '/user/history?next=evil', '/user/%2e%2e/admin', '/user\n']) assert.equal(destinationFor(account, bad), '/user');
  assert.equal(destinationFor(admin, '/admin/assets'), '/admin/assets');
  assert.equal(destinationFor(account, '/user/history'), '/user/history');
  assert.equal(destinationFor(account, '/user/borrow?intent=return'), '/user/borrow?intent=return');
  assert.equal(destinationFor(account, '/user/borrow?asset_id=A%2B1&review=return&loan=B1'), '/user/borrow?asset_id=A%2B1&review=return&loan=B1');
  assert.equal(destinationFor(account, '/user/borrow?intent=return&next=https://evil.test'), '/user');
  assert.equal(destinationFor(unusual, '/user/history'), '/user');
});

test('session rotation, logout, replay rejection, persistence, expiration, and minimal server storage', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'daam-auth-test-'));
  let now = Date.now();
  try {
    const store = sessionStore(directory, () => now);
    const previous = await store.create('previous-fixture');
    const result = await loginSession({ username: account.id, password: syntheticPassword, redirect: '/admin' }, previous.token, { ...dependencies, sessions: store });
    assert.ok(result);
    assert.notEqual(result.token, previous.token);
    assert.equal(result.destination, '/user');
    assert.equal(await store.read(previous.token), null);
    const freshWorker = sessionStore(directory, () => now);
    assert.equal((await freshWorker.read(result.token))?.accountId, account.id);
    const [file] = await readdir(directory);
    assert.notEqual(file.replace('.json', ''), result.token);
    const record = JSON.parse(await readFile(path.join(directory, file), 'utf8'));
    assert.deepEqual(Object.keys(record).sort(), ['accountId', 'expiresAt']);
    assert.equal((await stat(path.join(directory, file))).mode & 0o777, 0o600);
    await freshWorker.revoke(result.token);
    assert.equal(await store.read(result.token), null);
    const expiring = await store.create(account.id);
    now += SESSION_SECONDS * 1000;
    assert.equal(await freshWorker.read(expiring.token), null);
    assert.equal(await store.read('../../unsafe'), null);
    const before = (await readdir(directory)).length;
    assert.equal(await loginSession({ username: account.id, password: 'wrong' }, undefined, { ...dependencies, sessions: store }), null);
    assert.equal((await readdir(directory)).length, before);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('rate limit atomically permits at most five concurrent attempts per normalized account', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'daam-limit-test-'));
  try {
    const outcomes = await Promise.all(Array.from({ length: 9 }, (_, i) => consumeLoginAttempt(directory, i % 2 ? 'FIXTURE' : 'fixture', 100_000)));
    assert.equal(outcomes.filter(Boolean).length, 5);
    assert.equal(await consumeLoginAttempt(directory, 'fixture', 1_000_000), true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('CSRF origin checks and cookie security reject foreign origins and insecure production configuration', () => {
  const headers = new Headers({ host: 'localhost:3000', origin: 'http://localhost:3000' });
  assert.equal(trustedOrigin(headers, 'development'), 'http://localhost:3000');
  assert.equal(trustedOrigin(headers, 'production'), null);
  assert.equal(trustedOrigin(new Headers({ host: 'localhost:3000', origin: 'https://evil.test' }), 'development'), null);
  assert.equal(trustedOrigin(new Headers({ host: 'localhost:3000' }), 'development'), null);
  assert.equal(trustedOrigin(new Headers({ host: 'localhost:3000', origin: 'null' }), 'development'), null);
  assert.equal(trustedOrigin(new Headers({ host: 'localhost:3000', origin: 'http://localhost:3000', 'sec-fetch-site': 'cross-site' }), 'development'), null);
  const https = new Headers({ host: 'example.test', origin: 'https://example.test' });
  assert.equal(trustedOrigin(https, 'production', 'https://example.test'), 'https://example.test');
  assert.equal(sessionCookieOptions(true).secure, true);
  assert.equal(sessionCookieOptions(false).httpOnly, true);
  assert.equal(sessionCookieOptions(false).sameSite, 'lax');
  assert.equal(sessionCookieName('production'), '__Host-daam_session');
});


test('PHP-generated synthetic bcrypt is accepted; PHP verifies a synthetic JavaScript hash', async () => {
  // Standalone PHP expressions only. No legacy PHP file, database or real credential.
  const hash = execFileSync('php', ['-r', '$p = stream_get_contents(STDIN); echo password_hash($p, PASSWORD_BCRYPT, ["cost" => 4]);'], { input: syntheticPassword, encoding: 'utf8' });
  assert.equal(await verifyPassword(syntheticPassword, hash), true);
  assert.equal(await verifyPassword('wrong-fixture', hash), false);
  const verified = execFileSync('php', ['-r', '$x=json_decode(stream_get_contents(STDIN), true); echo password_verify($x["password"], $x["hash"]) ? "verified" : "failed";'], { input: JSON.stringify({ password: syntheticPassword, hash: syntheticHash }), encoding: 'utf8' });
  assert.equal(verified, 'verified');
});

test('live identity resolution rejects logout/expiry and applies current role/deactivation immediately', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'daam-resolution-test-'));
  try {
    const store = sessionStore(directory);
    let live: LoginRecord | null = { ...account, type: 'UT00000001' };
    const dependencies = { read: store.read.bind(store), revoke: store.revoke.bind(store), find: async () => live };
    assert.equal(await resolveSession(undefined, dependencies), null);
    const session = await store.create(account.id);
    assert.equal(isAdmin((await resolveSession(session.token, dependencies))!), true);
    live = { ...account }; // Database role change, with no trusted role in the session.
    assert.equal(isAdmin((await resolveSession(session.token, dependencies))!), false);
    live = null; // Deactivated/missing account.
    assert.equal(await resolveSession(session.token, dependencies), null);
    live = account;
    assert.equal(await resolveSession(session.token, dependencies), null); // Disabled session stays revoked.
  } finally { await rm(directory, { recursive: true, force: true }); }
});
