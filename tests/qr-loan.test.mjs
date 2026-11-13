import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { parseLoanQr } from '../lib/qr-loan.ts';

const run = promisify(execFile);

test('accepts legacy and Next QR formats without navigating to the QR host', () => {
  assert.equal(parseLoanQr('http://localhost:8000/borrow_request.php?asset_id=A%2B1%2F2'), 'A+1/2');
  assert.equal(parseLoanQr('https://daam.example/user/borrow?asset_id=DT1'), 'DT1');
  assert.equal(parseLoanQr('borrow_request.php?da_id=DT1', true), 'DT1');
  assert.equal(parseLoanQr('?asset_id=A%2B1', true), 'A+1');
  assert.equal(parseLoanQr('สอ.5835-001-003.4/44(2/12)', true), 'สอ.5835-001-003.4/44(2/12)');
  assert.equal(parseLoanQr('javascript:alert(1)', true), null);
  for (const bad of ['invalid', 'https://x.example/login?asset_id=1',
    'https://x.example/user/borrow?asset_id=1&da_id=2', 'https://x.example/user/borrow?asset_id=%00']) {
    assert.equal(parseLoanQr(bad), null);
  }
});

test('SQLite loan worker enforces ownership, transactions and audit on an isolated fixture', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'daam-qr-loan-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const db = join(directory, 'fixture.sqlite');
  const migration = await readFile(new URL('../docs/sql/next-loan-events.sql', import.meta.url), 'utf8');
  const source = await readFile(new URL('../lib/sqlite/actions.ts', import.meta.url), 'utf8');
  const worker = source.split('const program=`')[1].split('`;')[0];
  async function python(code, ...args) {
    const { stdout } = await run('python3', ['-c', code, db, ...args]);
    return stdout;
  }
  await python(`
import sqlite3,sys
c=sqlite3.connect(sys.argv[1])
c.executescript("""
CREATE TABLE useraccount(useraccountID TEXT PRIMARY KEY,useraccountName,useraccountType,userRank,userDepartment,userActive);
INSERT INTO useraccount VALUES ('borrower','Borrower','UT00000002','','dept','1'),('owner','Owner','UT00000002','','dept','1'),('peer','Peer','UT00000002','','dept','1'),('inactive','Inactive','UT00000002','','dept','0');
CREATE TABLE durable_articles(DA_ID TEXT PRIMARY KEY,statusID,is_approved,is_visible,classificationID,buildingID,owner_useraccountID,owner_department,created_by);
INSERT INTO durable_articles VALUES ('A','s0001',1,1,'','PB','owner','dept','peer'),('B','s0002',1,1,'','PB','owner','dept','peer'),('C','s0001',1,0,'','PB','owner','dept','peer');
CREATE TABLE borrow_back(IDborrow_back TEXT PRIMARY KEY,DA_ID,Date_borrow,Name_borrow,Rank_borrow,Belongto_borrow,Detail_borrow,Deadline_borrow,useraccountID_borrow,timestamp_borrow,userEmail,due_date,status,Date_back,timestamp_back,Name_back,Rank_back,Detail_back,useraccountID_back);
""")
c.executescript(sys.argv[2])
`, migration);
  const day = '2026-11-13';
  const fields = { start: day, end: '2026-11-14', department: 'dept', rank: '', email: '', purpose: 'test' };
  const operation = async (action, user, asset = 'A', loan = '', date = day) => {
    const input = { path: db, action, user, asset, loan, fields, day: date, timestamp: date + ' 10:00:00', detail: 'returned in good condition' };
    const { stdout } = await run('python3', ['-c', worker, JSON.stringify(input)]);
    return JSON.parse(stdout);
  };
  const snapshot = async () => JSON.parse(await python(`
import sqlite3,sys,json
c=sqlite3.connect(sys.argv[1])
print(json.dumps({
'available':c.execute("SELECT COUNT(*) FROM durable_articles WHERE DA_ID='A' AND statusID='s0001'").fetchone()[0],
'active':c.execute("SELECT COUNT(*) FROM borrow_back WHERE status IN ('borrowed','pending_return')").fetchone()[0],
'pending':c.execute("SELECT COUNT(*) FROM borrow_back WHERE status='pending_return'").fetchone()[0],
'history':c.execute("SELECT useraccountID_borrow,useraccountID_back,Date_back FROM borrow_back WHERE status='returned' ORDER BY Date_back").fetchall(),
'events':c.execute("SELECT action,borrower_id,actor_id,owner_id,occurred_at FROM next_loan_events ORDER BY event_id").fetchall()
}))
`));

  await python("import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('DROP TABLE next_loan_events'); c.commit()");
  assert.equal((await operation('borrow', 'borrower')).code, 'LOAN_SCHEMA_REQUIRED');
  await python("import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.executescript(sys.argv[2])", migration);
  assert.equal((await operation('borrow', 'inactive')).code, 'FORBIDDEN');
  assert.equal((await operation('borrow', 'borrower', 'B')).code, 'NOT_AVAILABLE');
  assert.equal((await operation('borrow', 'borrower', 'C')).code, 'NOT_AVAILABLE');
  assert.equal((await operation('borrow', 'borrower', 'missing')).code, 'NOT_FOUND');
  const competing = await Promise.all([operation('borrow', 'borrower'), operation('borrow', 'borrower')]);
  assert.equal(competing.filter(result => result.ok).length, 1);
  assert.equal(competing.find(result => !result.ok).code, 'ALREADY_BORROWED');
  const id = competing.find(result => result.ok).id;
  assert.equal((await operation('request-return', 'peer', 'A', id)).code, 'FORBIDDEN');
  assert.equal((await operation('approve-user-return', 'owner', 'A', id)).code, 'STALE');
  const requests = await Promise.all([operation('request-return', 'borrower', 'A', id), operation('request-return', 'borrower', 'A', id)]);
  assert.equal(requests.filter(result => result.status === 'pending_return').length, 1);
  assert.equal(requests.find(result => !result.ok).code, 'STALE');
  assert.deepEqual(await snapshot().then(({ available, active, pending }) => [available, active, pending]), [0, 1, 1]);
  assert.equal((await operation('borrow', 'peer')).code, 'ALREADY_BORROWED');
  assert.equal((await operation('approve-user-return', 'peer', 'A', id)).code, 'FORBIDDEN');
  assert.equal((await operation('approve-user-return', 'borrower', 'A', id)).code, 'FORBIDDEN');
  const accepts = await Promise.all([operation('approve-user-return', 'owner', 'A', id, '2026-11-14'), operation('approve-user-return', 'owner', 'A', id, '2026-11-14')]);
  assert.equal(accepts.filter(result => result.status === 'returned').length, 1);
  assert.equal(accepts.find(result => !result.ok).code, 'STALE');
  const accepted = await snapshot();
  assert.deepEqual([accepted.available, accepted.active, accepted.pending], [1, 0, 0]);
  assert.deepEqual(accepted.history, [['borrower', 'owner', '2026-11-14']]);
  assert.deepEqual(accepted.events.slice(1), [
    ['request-return', 'borrower', 'borrower', 'owner', '2026-11-13 10:00:00'],
    ['approve-user-return', 'borrower', 'owner', 'owner', '2026-11-14 10:00:00'],
  ]);
  const second = await operation('borrow', 'borrower');
  assert.equal(second.status, 'borrowed');
  assert.equal((await operation('owner-direct-return', 'peer', 'A', second.id)).code, 'FORBIDDEN');
  assert.equal((await operation('owner-direct-return', 'owner', 'A', second.id, '2026-11-15')).status, 'returned');
  const direct = await snapshot();
  assert.deepEqual([direct.available, direct.active, direct.pending], [1, 0, 0]);
  assert.deepEqual(direct.events.at(-1), ['owner-direct-return', 'borrower', 'owner', 'owner', '2026-11-15 10:00:00']);
});
