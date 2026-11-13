import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReadDatabase, type DriverConnection, type DriverPool, type PoolOptions, type DatabaseReader } from '../lib/database/pool.ts';
import { readDatabaseConfig, isDatabaseAccessEnabled, type DatabaseEnvironment } from '../lib/database/config.ts';
import { DatabaseError, DATABASE_DISABLED_MESSAGE } from '../lib/database/errors.ts';
import { LOGIN_ACCOUNT_SQL, ACTIVE_IDENTITY_SQL, assertApprovedRead } from '../lib/database/statements.ts';
import { plansFor } from '../lib/dashboard/model.ts';
import { withReadOnlyDatabase, closeDatabasePool } from '../lib/db.ts';
import { readPreview } from '../lib/db-preview.ts';

// Synthetic configuration used only with the injected in-memory driver below.
// No @next/env, .env.local, actual database account or socket is used by this file.
const enabled = { DAAM_DB_ACCESS: 'enabled', DB_USER: 'synthetic-unit-account', DB_PASSWORD: 'synthetic-unit-value' };
function fixture(initial: DatabaseEnvironment = enabled) {
  let env = initial;
  const events: string[] = [];
  const options: PoolOptions[] = [];
  const connection: DriverConnection = {
    query: async ({ sql }) => { events.push(sql); return [[], []]; },
    execute: async ({ sql }, values) => { events.push(sql); return [[{ id: values[0] }], []]; },
    release: () => { events.push('release'); }, destroy: () => { events.push('destroy'); },
  };
  const pool: DriverPool = {
    getConnection: async () => { events.push('acquire'); return connection; },
    end: async () => { events.push('end'); },
  };
  const service = createReadDatabase(() => env, config => { options.push(config); return pool; });
  return { service, events, options, connection, pool, setEnvironment(value: DatabaseEnvironment) { env = value; } };
}
const hasCode = (code: string) => (error: unknown) => error instanceof DatabaseError && error.code === code;

test('default/invalid/disabled access rejects before credentials, pool factory or callback', async () => {
  for (const access of [undefined, '', 'disabled', 'ENABLED', 'true']) {
    let credentialReads = 0, factoryCalls = 0, callbacks = 0;
    const env = new Proxy({ DAAM_DB_ACCESS: access }, { get(target, key: string) {
      if (key.startsWith('DB_')) { credentialReads++; throw new Error('CREDENTIAL_PROPERTIES_MUST_NOT_BE_ACCESSED'); }
      return target[key as keyof typeof target];
    } });
    const service = createReadDatabase(() => env, () => { factoryCalls++; throw new Error('MUST_NOT_CREATE'); });
    assert.equal(isDatabaseAccessEnabled(env), false);
    await assert.rejects(service.withReadOnlyDatabase(async () => { callbacks++; }), hasCode('DB_ACCESS_DISABLED'));
    await service.closeDatabasePool();
    assert.deepEqual([credentialReads, factoryCalls, callbacks], [0, 0, 0]);
  }
});

test('server module import/default-disabled service and preview are safe under network-denial preload', async () => {
  assert.equal(process.env.DAAM_DB_ACCESS, 'disabled');
  let callbacks = 0;
  await assert.rejects(withReadOnlyDatabase(async () => { callbacks++; }), hasCode('DB_ACCESS_DISABLED'));
  assert.equal(callbacks, 0);
  assert.deepEqual(await readPreview(), { ok: false, error: DATABASE_DISABLED_MESSAGE });
  await closeDatabasePool();
});

test('configuration validates required credentials, fixed target, charset and bounded pool without leaking values', () => {
  assert.throws(() => readDatabaseConfig({ ...enabled, NEXT_PHASE: 'phase-production-build' }), hasCode('DB_ACCESS_DISABLED'));
  for (const override of [{ DB_USER: '' }, { DB_PASSWORD: '' }, { DB_HOST: 'other.invalid' }, { DB_PORT: '3307' }, { DB_NAME: 'other' }, { DB_CHARSET: 'latin1' }, { DB_POOL_LIMIT: '0' }, { DB_POOL_LIMIT: '6' }, { DB_POOL_LIMIT: '2.5' }]) {
    try { readDatabaseConfig({ ...enabled, ...override }); assert.fail('must reject invalid config'); }
    catch (error) {
      assert.ok(hasCode('DB_CONFIG_INVALID')(error));
      assert.equal(String(error).includes(enabled.DB_PASSWORD), false);
      assert.equal(String(error).includes(enabled.DB_USER), false);
    }
  }
  assert.equal(readDatabaseConfig(enabled).connectionLimit, 2);
});

test('pool is lazy/reused/bounded; each lease starts read-only and rolls back before release; close recreates cleanly', async () => {
  const f = fixture();
  assert.equal(f.options.length, 0);
  await f.service.withReadOnlyDatabase(async db => {
    const [rows] = await db.execute(LOGIN_ACCOUNT_SQL, ['fixture']);
    assert.deepEqual(rows, [{ id: 'fixture' }]);
  });
  await f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture']));
  assert.equal(f.options.length, 1);
  assert.equal(f.options[0].charset, 'utf8mb4');
  assert.equal(f.options[0].dateStrings, true); // Preserve MySQL date-only values without timezone conversion.
  assert.equal(f.options[0].multipleStatements, false);
  assert.equal(f.options[0].waitForConnections, false);
  assert.equal(f.options[0].connectTimeout, 5000);
  assert.deepEqual(f.options[0].flags, ['-LOCAL_FILES']);
  assert.deepEqual(f.events, ['acquire', 'START TRANSACTION READ ONLY', LOGIN_ACCOUNT_SQL, 'ROLLBACK', 'release', 'acquire', 'START TRANSACTION READ ONLY', ACTIVE_IDENTITY_SQL, 'ROLLBACK', 'release']);
  await f.service.closeDatabasePool();
  assert.equal(f.events.at(-1), 'end');
  await f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture']));
  assert.equal(f.options.length, 2);
  await f.service.closeDatabasePool();
});

test('read service rejects write SQL, arbitrary SELECTs, executable comments and file/lock operations before the driver', async () => {
  const f = fixture();
  const blocked = [
    'INSERT INTO x VALUES (1)', 'UPDATE x SET y=1', 'DELETE FROM x', 'ALTER TABLE x ADD y INT',
    'DROP TABLE x', 'CREATE TABLE x (id INT)', 'TRUNCATE x', 'REPLACE INTO x VALUES(1)',
    'CALL unsafe()', 'LOAD DATA LOCAL INFILE x', 'SHOW GRANTS', 'SELECT * FROM useraccount',
    'SELECT dangerous_function()', 'SELECT 1 INTO OUTFILE \'file\'', 'SELECT 1 FOR UPDATE',
    '/*! SELECT dangerous_function() */', ACTIVE_IDENTITY_SQL + '; DELETE FROM x', ACTIVE_IDENTITY_SQL + ' -- suffix',
  ];
  for (const sql of blocked) {
    await assert.rejects(f.service.withReadOnlyDatabase(db => db.execute(sql, [])), hasCode('DB_QUERY_REJECTED'));
    assert.equal(f.events.includes(sql), false);
  }
  assert.throws(() => assertApprovedRead(ACTIVE_IDENTITY_SQL, []), hasCode('DB_QUERY_REJECTED'));
  assert.throws(() => assertApprovedRead(ACTIVE_IDENTITY_SQL, [{}]), hasCode('DB_QUERY_REJECTED'));
  assert.throws(() => assertApprovedRead(ACTIVE_IDENTITY_SQL, [NaN]), hasCode('DB_QUERY_REJECTED'));
  await f.service.closeDatabasePool();
});

test('every existing dashboard visibility/scope plan is allowlisted with bound values', () => {
  for (const id of ['admin', 'fixture-department-admin']) for (const mode of ['normal', 'all', 'hidden'] as const) {
    const plans = plansFor({ id, name: 'Fixture', department: 'Fixture department', type: 'UT00000001' }, mode, '2026-11-05');
    for (const plan of plans) assert.doesNotThrow(() => assertApprovedRead(plan.sql, plan.values));
  }
});

test('failed read-only setup/rollback destroys connections; raw driver errors never escape', async () => {
  for (const stage of ['acquire', 'begin', 'read', 'rollback'] as const) {
    const f = fixture();
    const raw = new Error('PRIVATE_DRIVER_DETAIL:' + enabled.DB_PASSWORD);
    const original = f.connection.query;
    if (stage === 'acquire') f.pool.getConnection = async () => { throw raw; };
    f.connection.query = async (options, values) => {
      if (stage === 'begin' && options.sql === 'START TRANSACTION READ ONLY' || stage === 'rollback' && options.sql === 'ROLLBACK') throw raw;
      return original(options, values);
    };
    if (stage === 'read') f.connection.execute = async () => { throw raw; };
    await assert.rejects(f.service.withReadOnlyDatabase(db => db.execute(ACTIVE_IDENTITY_SQL, ['fixture'])), error => {
      assert.ok(hasCode('DB_UNAVAILABLE')(error));
      assert.equal(String(error).includes(enabled.DB_PASSWORD), false);
      assert.equal((error as Error).cause, undefined);
      return true;
    });
    if (stage === 'begin' || stage === 'rollback') assert.ok(f.events.includes('destroy'));
    if (stage === 'read') assert.deepEqual(f.events.slice(-2), ['ROLLBACK', 'release']);
    await f.service.closeDatabasePool();
  }
});

test('disabling access or changing credentials blocks further reads even on an existing pool/lease', async () => {
  const f = fixture();
  await f.service.withReadOnlyDatabase(async db => {
    f.setEnvironment({ DAAM_DB_ACCESS: 'disabled' });
    await assert.rejects(db.query(ACTIVE_IDENTITY_SQL, ['fixture']), hasCode('DB_ACCESS_DISABLED'));
  });
  const previous = f.events.length;
  await assert.rejects(f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture'])), hasCode('DB_ACCESS_DISABLED'));
  assert.equal(f.events.length, previous);
  f.setEnvironment({ ...enabled, DB_PASSWORD: 'different-synthetic-only' });
  await assert.rejects(f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture'])), hasCode('DB_CONFIG_INVALID'));
  await f.service.closeDatabasePool();
});

test('close drains active readers, rejects new acquisitions during closing and invalidates escaped readers', async () => {
  const f = fixture();
  let finish!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  let escaped: DatabaseReader | undefined;
  const read = f.service.withReadOnlyDatabase(async db => {
    escaped = db; entered();
    await new Promise<void>(resolve => { finish = resolve; });
  });
  await started;
  const closing = f.service.closeDatabasePool();
  assert.equal(f.events.includes('end'), false);
  await assert.rejects(f.service.withReadOnlyDatabase(async () => {}), hasCode('DB_CLOSING'));
  finish(); await read; await closing;
  assert.deepEqual(f.events.slice(-3), ['ROLLBACK', 'release', 'end']);
  await assert.rejects(escaped!.query(ACTIVE_IDENTITY_SQL, ['fixture']), hasCode('DB_QUERY_REJECTED'));
});


test('release/shutdown failures remain sanitized and do not leave the lifecycle permanently closing', async () => {
  const f = fixture();
  f.connection.release = () => { throw new Error('PRIVATE_CLEANUP_DETAIL:' + enabled.DB_PASSWORD); };
  await assert.rejects(f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture'])), hasCode('DB_UNAVAILABLE'));
  assert.equal(f.events.at(-1), 'destroy');
  f.pool.end = () => { throw new Error('PRIVATE_END_DETAIL:' + enabled.DB_PASSWORD); };
  await assert.rejects(f.service.closeDatabasePool(), error => {
    assert.ok(hasCode('DB_UNAVAILABLE')(error));
    assert.equal(String(error).includes(enabled.DB_PASSWORD), false);
    return true;
  });
  f.connection.release = () => { f.events.push('release'); };
  f.pool.end = async () => { f.events.push('end'); };
  await f.service.withReadOnlyDatabase(db => db.query(ACTIVE_IDENTITY_SQL, ['fixture']));
  await f.service.closeDatabasePool();
});

test('SQLite dashboard rejects nonadmin and disabled access before opening a source', async () => {
  const { readSqliteDashboard } = await import('../lib/sqlite/dashboard.ts');
  await assert.rejects(readSqliteDashboard({ id: 'fixture', name: 'Fixture', type: 'UT00000002', department: '' }, 'normal'), /FORBIDDEN/);
  await assert.rejects(readSqliteDashboard({ id: 'fixture', name: 'Fixture', type: 'UT00000001', department: '' }, 'normal'), /SOURCE_DISABLED/);
});
