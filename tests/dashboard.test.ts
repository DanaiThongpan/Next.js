import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plansFor, missingColumns, allDepartments, viewMode, availableFrom, activity, visualSlices, bangkokDay, type Column } from '../lib/dashboard/model.ts';
import { readWidgets } from '../lib/dashboard/read.ts';
const admin = { id: 'fixture-admin', name: 'Test fixture', type: 'UT00000001', department: 'Test department' };
const globalAdmin = { ...admin, id: 'admin' };
const ordinary = { ...admin, type: 'UT00000002' };
const today = '2026-11-04';
function allColumns(user = admin, mode: 'normal' | 'all' | 'hidden' = 'normal'): Column[] {
  return [...new Set(plansFor(user, mode, today).flatMap(p => p.requires))].map(value => { const [tableName, columnName] = value.split('.'); return { tableName, columnName }; });
}

test('ordinary users cannot construct or execute admin reads, including ID/name-based privilege lookalikes', async () => {
  assert.throws(() => plansFor(ordinary, 'normal', today), /FORBIDDEN/);
  assert.equal(allDepartments({ ...ordinary, id: 'admin', name: 'administrator', department: '' }), false);
  let queries = 0;
  await assert.rejects(readWidgets(ordinary, 'normal', [], async () => { queries++; return []; }), /FORBIDDEN/);
  assert.equal(queries, 0);
});

test('dashboard-specific API scope follows original effective conditions without granting Admin type', () => {
  assert.equal(allDepartments(admin), false);
  for (const user of [globalAdmin, { ...admin, id: 'ADMIN_TEST' }, { ...admin, name: 'Administrator' }, { ...admin, department: '' }, { ...admin, department: '0' }, { ...admin, department: 'ส่วนกลาง' }]) assert.equal(allDepartments(user), true);
  const scoped = plansFor(admin, 'normal', today).find(p => p.key === 'total')!;
  assert.match(scoped.sql, /owner_department = \?/);
  assert.deepEqual(scoped.values, [admin.department, admin.id]);
  assert.doesNotMatch(scoped.sql, new RegExp(admin.department));
  assert.doesNotMatch(plansFor(globalAdmin, 'normal', today).find(p => p.key === 'total')!.sql, /owner_department/);
});

test('live MySQL-shaped mismatch suppresses dependent widgets rather than querying broader totals', async () => {
  const missing = new Set(['durable_articles.is_approved', 'durable_articles.is_visible', 'durable_articles.owner_department', 'durable_articles.created_by', 'borrow_back.status', '_sync_meta.id', '_sync_meta.last_synced_at']);
  const columns = allColumns().filter(c => !missing.has(`${c.tableName}.${c.columnName}`));
  const queries: string[] = [];
  const data = await readWidgets(admin, 'normal', columns, async sql => { queries.push(sql); return [{ value: 0 }]; });
  for (const key of ['total', 'borrowed', 'overdue', 'pending', 'maintenance', 'available', 'category', 'recent', 'sidebarPending', 'sync'] as const) assert.equal(data[key].state, 'unmapped');
  assert.equal(queries.length, 1);
  assert.match(queries[0], /^SELECT COUNT\(\*\) AS value FROM borrow_back WHERE/);
  assert.deepEqual(data.sidebarOverdue, { state: 'ready', value: 0 }); // Actual zero from a successful read, not a placeholder.
});

test('read-only query plans retain visibility, approval, COUNT-not-DISTINCT, top-six and last-five formulas', () => {
  for (const mode of ['normal', 'all', 'hidden'] as const) {
    const plans = plansFor(admin, mode, today);
    for (const plan of plans) {
      assert.match(plan.sql, /^SELECT /);
      assert.doesNotMatch(plan.sql, /;|\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|CALL|OUTFILE)\b/i);
      assert.equal(missingColumns(plan, allColumns(admin, mode)).length, 0);
    }
    const total = plans.find(p => p.key === 'total')!;
    assert.match(total.sql, /is_approved = 1 OR is_approved IS NULL/);
    assert.equal(total.sql.includes('is_visible'), mode !== 'all');
    if (mode === 'hidden') assert.match(total.sql, /is_visible = 0/);
    const borrowed = plans.find(p => p.key === 'borrowed')!;
    assert.match(borrowed.sql, /COUNT\(\*\)/);
    assert.doesNotMatch(borrowed.sql, /DISTINCT/);
    assert.match(borrowed.sql, /b.status != 'returned'/);
    assert.match(borrowed.sql, /b.status = 'pending_return'/);
    assert.match(plans.find(p => p.key === 'category')!.sql, /ORDER BY total DESC LIMIT 6$/);
    assert.match(plans.find(p => p.key === 'recent')!.sql, /ORDER BY b.IDborrow_back DESC LIMIT 5$/);
    assert.deepEqual(plans.find(p => p.key === 'overdue')!.values, [today, admin.department, admin.id]);
  }
  assert.equal(viewMode('all; DROP'), 'normal');
  assert.equal(viewMode(['hidden']), 'normal');
  assert.equal(viewMode('hidden'), 'hidden');
});

test('available calculation clamps zero and propagates missing/error states', () => {
  assert.deepEqual(availableFrom({ state: 'ready', value: 100 }, { state: 'ready', value: 7 }, { state: 'ready', value: 3 }), { state: 'ready', value: 90 });
  assert.deepEqual(availableFrom({ state: 'ready', value: 1 }, { state: 'ready', value: 7 }, { state: 'ready', value: 3 }), { state: 'ready', value: 0 });
  assert.equal(availableFrom({ state: 'unmapped', missing: ['column'] }, { state: 'ready', value: 7 }, { state: 'ready', value: 3 }).state, 'unmapped');
  assert.equal(availableFrom({ state: 'error' }, { state: 'ready', value: 7 }, { state: 'ready', value: 3 }).state, 'error');
});

test('activity status priority matches returned/pending/overdue PHP flags and preserves text for React escaping', () => {
  const row = { id: 1, DA_Number: '<test>', DA_ListName: 'Fixture', Name_borrow: 'Synthetic', Date_borrow: today, Date_back: '', Deadline_borrow: '2026-10-01', status: 'borrowed' };
  assert.equal(activity(row, today).overdue, true);
  assert.equal(activity({ ...row, status: 'returned' }, today).returned, true);
  assert.equal(activity({ ...row, status: 'returned' }, today).overdue, false);
  const pending = activity({ ...row, Date_back: today, status: 'pending_return' }, today);
  assert.equal(pending.returned, false);
  assert.equal(pending.pendingReturn, true);
  assert.equal(activity(row, today).number, '<test>');
});

test('visual arcs preserve raw inputs and minimum small slices; dates use Bangkok', () => {
  const raw = [998, 1, 1];
  visualSlices(raw).forEach((value, i) => assert.ok(Math.abs(value - [930, 35, 35][i]) < 1e-9));
  assert.deepEqual(raw, [998, 1, 1]);
  assert.deepEqual(visualSlices([0, 0, 0]), [0, 0, 0]);
  assert.deepEqual(visualSlices([1, 0, 0]), [1, 0, 0]);
  assert.equal(bangkokDay(new Date('2026-11-03T18:00:00Z')), '2026-11-04');
});

test('query failures do not become zero or leak database messages; independent widgets can succeed', async () => {
  const data = await readWidgets(globalAdmin, 'normal', allColumns(globalAdmin), async sql => {
    if (sql.includes('classificationName')) return [{ label: 'Synthetic category', total: 8 }];
    throw new Error('PRIVATE_DRIVER_MESSAGE');
  });
  assert.equal(data.total.state, 'error');
  assert.equal(data.available.state, 'error');
  assert.deepEqual(data.category, { state: 'ready', value: [{ label: 'Synthetic category', total: 8 }] });
  assert.equal(JSON.stringify(data).includes('PRIVATE_DRIVER_MESSAGE'), false);
});

test('complete schema maps successful mock reads into all dashboard widgets', async () => {
  const plans = plansFor(admin, 'normal', today);
  const calls: string[] = [];
  const data = await readWidgets(admin, 'normal', allColumns(), async (sql, values) => {
    const plan = plans.find(p => p.sql === sql)!;
    assert.deepEqual(values, plan.values);
    calls.push(plan.key);
    if (plan.key === 'category') return [{ label: 'Fixture category', total: '20' }];
    if (plan.key === 'recent') return [{ id: 'fixture-1', DA_Number: 'fixture-number', DA_ListName: 'Fixture asset', Name_borrow: 'Fixture borrower', Date_borrow: today, Date_back: null, Deadline_borrow: '2026-11-03', status: 'borrowed' }];
    if (plan.key === 'sync') return [{ value: '04/11/2026 12:00' }];
    return [{ value: plan.key === 'total' ? '20' : '2' }];
  }, new Date('2026-11-04T05:00:00Z'));
  assert.equal(calls.length, 10);
  for (const widget of [data.total, data.borrowed, data.overdue, data.pending, data.maintenance, data.available, data.category, data.recent, data.sidebarPending, data.sidebarOverdue, data.sync]) assert.equal(widget.state, 'ready');
  assert.deepEqual(data.available, { state: 'ready', value: 16 });
  assert.equal(data.recent.state === 'ready' && data.recent.value[0].overdue, true);
});

test('invalid driver results never become fabricated zero counts or chart values', async () => {
  for (const value of [null, undefined, '', true, {}, -1, 'NaN', '1.5', Number.MAX_SAFE_INTEGER + 1]) {
    const data = await readWidgets(admin, 'normal', allColumns(), async () => [{ value, label: 'Fixture', total: value }]);
    assert.equal(data.total.state, 'error');
    assert.equal(data.category.state, 'error');
    assert.equal(data.available.state, 'error');
  }
  const data = await readWidgets(admin, 'normal', allColumns(), async () => []);
  assert.equal(data.total.state, 'error');
  assert.deepEqual(data.category, { state: 'ready', value: [] });
  assert.deepEqual(data.recent, { state: 'ready', value: [] });
});

test('MySQL inventory fallback is explicitly scoped and never widens department or hidden reads', async () => {
  const columns = allColumns(globalAdmin).filter(c => !['is_approved', 'is_visible'].includes(c.columnName));
  const { inventoryPlans, INVENTORY_TOTAL_SQL } = await import('../lib/dashboard/model.ts');
  assert.equal(inventoryPlans(admin, 'normal', columns).length, 0);
  assert.equal(inventoryPlans(globalAdmin, 'hidden', columns).length, 0);
  assert.equal(inventoryPlans(globalAdmin, 'normal', allColumns(globalAdmin)).length, 0);
  assert.equal(inventoryPlans(globalAdmin, 'normal', columns)[0].sql, INVENTORY_TOTAL_SQL);
  const data = await readWidgets(globalAdmin, 'normal', columns, async sql => sql === INVENTORY_TOTAL_SQL ? [{ value: 42 }] : []);
  assert.equal(data.inventoryBasis, true);
  assert.deepEqual(data.total, { state: 'ready', value: 42 });
  assert.equal(data.pending.state, 'unmapped');
  assert.notEqual(data.available.state, 'ready');
});
