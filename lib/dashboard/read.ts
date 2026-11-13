import type { Identity } from '../auth/policy.ts';
import { isAdmin } from '../auth/policy.ts';
import { activity, inventoryPlans, availableFrom, bangkokDay, missingColumns, plansFor, type Column, type Dashboard, type ViewMode, type Widget } from './model.ts';
function count(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || (typeof value === 'string' && !/^\d+$/.test(value))) throw new Error('INVALID_AGGREGATE');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error('INVALID_AGGREGATE');
  return parsed;
}
export type ReadQuery = (sql: string, values: string[]) => Promise<Record<string, unknown>[]>;
export async function readWidgets(user: Identity, mode: ViewMode, columns: Column[], query: ReadQuery, now = new Date()): Promise<Dashboard> {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  const result: Omit<Dashboard, 'available'> = { total: { state: 'error' }, borrowed: { state: 'error' }, overdue: { state: 'error' }, pending: { state: 'error' }, maintenance: { state: 'error' }, category: { state: 'error' }, recent: { state: 'error' }, sidebarPending: { state: 'error' }, sidebarOverdue: { state: 'error' }, sync: { state: 'error' }, mode, generatedAt: now.toISOString() };
  const inventory = inventoryPlans(user, mode, columns);
  const plans = plansFor(user, mode, bangkokDay(now)).map(plan => inventory.find(p => p.key === plan.key) ?? plan);
  for (const plan of plans) {
    const missing = missingColumns(plan, columns);
    if (missing.length) { result[plan.key] = { state: 'unmapped', missing }; continue; }
    try {
      const rows = await query(plan.sql, plan.values);
      if (plan.key === 'category') {
        if (rows.length > 6) throw new Error('INVALID_CATEGORY_ROWS');
        result.category = { state: 'ready', value: rows.map(row => {
          if (row.label !== null && typeof row.label !== 'string') throw new Error('INVALID_CATEGORY_LABEL');
          return { label: row.label ?? '', total: count(row.total) };
        }) };
      } else if (plan.key === 'recent') {
        if (rows.length > 5 || new Set(rows.map(row => String(row.id))).size !== rows.length) throw new Error('INVALID_RECENT_ROWS');
        for (const row of rows) {
          if ((typeof row.id !== 'string' && typeof row.id !== 'number') || String(row.id) === '') throw new Error('INVALID_ACTIVITY_ID');
          for (const key of ['DA_Number', 'DA_ListName', 'Name_borrow', 'Date_borrow', 'Date_back', 'Deadline_borrow', 'status']) {
            if (row[key] !== null && typeof row[key] !== 'string') throw new Error('INVALID_ACTIVITY_FIELD');
          }
        }
        result.recent = { state: 'ready', value: rows.map(row => activity(row, bangkokDay(now))) };
      } else if (plan.key === 'sync') {
        if (rows.length > 1 || (rows.length && rows[0].value !== null && typeof rows[0].value !== 'string')) throw new Error('INVALID_SYNC');
        result.sync = rows[0]?.value ? { state: 'ready', value: String(rows[0].value) } : { state: 'unmapped', missing: ['_sync_meta record'] };
      } else {
        if (rows.length !== 1) throw new Error('INVALID_AGGREGATE_ROWS');
        const value = count(rows[0].value);
        result[plan.key] = { state: 'ready', value } as Widget<number>;
      }
    } catch { result[plan.key] = { state: 'error' }; }
  }
  return { ...result, inventoryBasis: inventory.length > 0, available: availableFrom(result.total, result.borrowed, result.maintenance) };
}
