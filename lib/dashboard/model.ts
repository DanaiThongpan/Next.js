import { borrowerAccountJoin, borrowerName } from '../borrower-profile.ts';
import { isAdmin, type Identity } from '../auth/policy.ts';
export type ViewMode = 'normal' | 'all' | 'hidden';
export type Metric = 'total' | 'borrowed' | 'overdue' | 'pending' | 'maintenance' | 'category' | 'recent' | 'sidebarPending' | 'sidebarOverdue' | 'sync';
export type Column = { tableName: string; columnName: string };
export type Widget<T> = { state: 'ready'; value: T } | { state: 'unmapped'; missing: string[] } | { state: 'error' };
export type Recent = { id: string; number: string; name: string; borrower: string; date: string; returned: boolean; pendingReturn: boolean; overdue: boolean };
export type Category = { label: string; total: number };
export type Dashboard = {
  total: Widget<number>; borrowed: Widget<number>; overdue: Widget<number>; pending: Widget<number>;
  maintenance: Widget<number>; available: Widget<number>; category: Widget<Category[]>;
  recent: Widget<Recent[]>; sidebarPending: Widget<number>; sidebarOverdue: Widget<number>;
  sync: Widget<string>; inventoryBasis?: boolean; mode: ViewMode; generatedAt: string;
};
export const METADATA_SQL = "SELECT c.TABLE_NAME AS tableName, c.COLUMN_NAME AS columnName FROM INFORMATION_SCHEMA.COLUMNS c INNER JOIN INFORMATION_SCHEMA.TABLES t ON c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME WHERE c.TABLE_SCHEMA = 'daam' AND c.TABLE_NAME IN ('durable_articles', 'borrow_back', 'classification', '_sync_meta') AND t.TABLE_TYPE = 'BASE TABLE'";
export function viewMode(value: unknown): ViewMode { return value === 'all' || value === 'hidden' ? value : 'normal'; }
export function bangkokDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function allDepartments(user: Identity) {
  // Exact effective predicate from api_dashboard_data.php; does not grant Admin entry.
  if (!isAdmin(user)) return false;
  return ['admin', 'admin_test'].includes(user.id.toLowerCase()) || user.name.toLowerCase() === 'administrator' || ['', '0', 'ส่วนกลาง'].includes(user.department);
}
export type Plan = { key: Metric; sql: string; values: string[]; requires: string[] };
export function plansFor(user: Identity, mode: ViewMode, today: string): Plan[] {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  return buildPlans(allDepartments(user), user.department, user.id, mode, today);
}
function buildPlans(global: boolean, department: string, id: string, mode: ViewMode, today: string): Plan[] {
  const visibility = (alias: string) => mode === 'all' ? '' : mode === 'hidden' ? ` AND ${alias}is_visible = 0` : ` AND (${alias}is_visible = 1 OR ${alias}is_visible IS NULL)`;
  const scope = (alias: string) => global ? '' : ` AND (${alias}owner_department = ? OR ${alias}owner_department = 'ส่วนกลาง' OR (${alias}owner_department IS NULL AND ${alias}created_by = ?))`;
  const scopeValues = global ? [] : [department, id];
  const deps = (alias: string, names: string[]) => names.map(n => `${alias}.${n}`);
  const assetBase = [...(mode === 'all' ? [] : ['durable_articles.is_visible']), ...(global ? [] : deps('durable_articles', ['owner_department', 'created_by']))];
  const approved = "(is_approved = 1 OR is_approved IS NULL)";
  const borrowed = "b.status != 'returned' AND (b.Date_back IS NULL OR b.Date_back = '' OR b.status = 'pending_return')";
  const borrowDeps = [...assetBase, ...deps('borrow_back', ['DA_ID', 'status', 'Date_back']), 'durable_articles.DA_ID'];
  return [
    { key: 'total', sql: `SELECT COUNT(*) AS value FROM durable_articles WHERE ${approved}${visibility('')}${scope('')}`, values: scopeValues, requires: [...assetBase, 'durable_articles.is_approved'] },
    { key: 'borrowed', sql: `SELECT COUNT(*) AS value FROM borrow_back b INNER JOIN durable_articles da ON b.DA_ID = da.DA_ID WHERE (${borrowed})${visibility('da.')}${scope('da.')}`, values: scopeValues, requires: borrowDeps },
    { key: 'overdue', sql: `SELECT COUNT(*) AS value FROM borrow_back b INNER JOIN durable_articles da ON b.DA_ID = da.DA_ID WHERE ${borrowed} AND b.Deadline_borrow < ?${visibility('da.')}${scope('da.')}`, values: [today, ...scopeValues], requires: [...borrowDeps, 'borrow_back.Deadline_borrow'] },
    { key: 'pending', sql: `SELECT COUNT(*) AS value FROM durable_articles WHERE is_approved = 0${visibility('')}${scope('')}`, values: scopeValues, requires: [...assetBase, 'durable_articles.is_approved'] },
    { key: 'maintenance', sql: `SELECT COUNT(*) AS value FROM durable_articles WHERE (statusID = 's0002' OR (statusID != 's0001' AND statusID != 's0003' AND statusID IS NOT NULL AND statusID != '')) AND ${approved}${visibility('')}${scope('')}`, values: scopeValues, requires: [...assetBase, ...deps('durable_articles', ['is_approved', 'statusID'])] },
    { key: 'category', sql: `SELECT c.classificationName AS label, COUNT(da.DA_ID) AS total FROM classification c INNER JOIN durable_articles da ON c.classificationID = da.classificationID AND (da.is_approved = 1 OR da.is_approved IS NULL)${visibility('da.')}${scope('da.')} GROUP BY c.classificationID, c.classificationName ORDER BY total DESC LIMIT 6`, values: scopeValues, requires: [...assetBase, ...deps('durable_articles', ['DA_ID', 'classificationID', 'is_approved']), ...deps('classification', ['classificationID', 'classificationName'])] },
    { key: 'recent', sql: `SELECT b.IDborrow_back AS id, b.DA_ID, b.Date_borrow, b.Deadline_borrow, b.Date_back, b.status, ${borrowerName} AS Name_borrow, da.DA_Number, da.DA_ListName FROM borrow_back b ${global ? 'LEFT' : 'INNER'} JOIN durable_articles da ON b.DA_ID = da.DA_ID ${borrowerAccountJoin} WHERE 1=1${visibility('da.')}${scope('da.')} ORDER BY b.IDborrow_back DESC LIMIT 5`, values: scopeValues, requires: [...assetBase, ...deps('borrow_back', ['IDborrow_back', 'DA_ID', 'Date_borrow', 'Deadline_borrow', 'Date_back', 'status', 'Name_borrow', 'useraccountID_borrow']), ...deps('useraccount', ['useraccountID', 'useraccountName']), ...deps('durable_articles', ['DA_ID', 'DA_Number', 'DA_ListName'])] },
    // Sidebar badges intentionally retain their distinct original global formulas.
    { key: 'sidebarPending', sql: 'SELECT COUNT(*) AS value FROM durable_articles WHERE is_approved = 0', values: [], requires: ['durable_articles.is_approved'] },
    { key: 'sidebarOverdue', sql: "SELECT COUNT(*) AS value FROM borrow_back WHERE (Date_back IS NULL OR Date_back = '') AND Deadline_borrow < ?", values: [today], requires: deps('borrow_back', ['Date_back', 'Deadline_borrow']) },
    { key: 'sync', sql: "SELECT DATE_FORMAT(last_synced_at, '%d/%m/%Y %H:%i') AS value FROM _sync_meta ORDER BY id DESC LIMIT 1", values: [], requires: deps('_sync_meta', ['id', 'last_synced_at']) },
  ];
}
export function missingColumns(plan: Plan, columns: Column[]) {
  const found = new Set(columns.map(c => `${c.tableName}.${c.columnName}`));
  return plan.requires.filter(c => !found.has(c));
}
export function availableFrom(total: Widget<number>, borrowed: Widget<number>, maintenance: Widget<number>): Widget<number> {
  if (total.state === 'ready' && borrowed.state === 'ready' && maintenance.state === 'ready') return { state: 'ready', value: Math.max(0, total.value - borrowed.value - maintenance.value) };
  const parts = [total, borrowed, maintenance];
  if (parts.some(p => p.state === 'error')) return { state: 'error' };
  return { state: 'unmapped', missing: [...new Set(parts.flatMap(p => p.state === 'unmapped' ? p.missing : []))] };
}
export function activity(row: Record<string, unknown>, today: string): Recent {
  // PHP empty('0') is true; preserve its date/status classification behavior.
  const nonempty = (v: unknown) => v !== null && v !== undefined && v !== '' && v !== '0';
  const returned = row.status === 'returned' || (nonempty(row.Date_back) && row.status !== 'pending_return');
  return { id: String(row.id), number: String(row.DA_Number ?? '-'), name: String(row.DA_ListName ?? 'ไม่ระบุชื่อ'), borrower: String(row.Name_borrow ?? 'ไม่ระบุ'), date: String(row.Date_borrow ?? '-'), returned, pendingReturn: row.status === 'pending_return', overdue: !returned && nonempty(row.Deadline_borrow) && String(row.Deadline_borrow) < today };
}
export function visualSlices(raw: number[], minimum = .035) {
  const total = raw.reduce((a, b) => a + b, 0);
  if (!total || raw.filter(v => v > 0).length <= 1) return [...raw];
  let allocated = 0, remaining = 0;
  const small = raw.map(v => { if (v <= 0) return false; if (v / total < minimum) { allocated += minimum; return true; } remaining += v; return false; });
  return raw.map((v, i) => v <= 0 ? 0 : small[i] ? minimum * total : v / remaining * Math.max(.1, 1 - allocated) * total);
}

// Only these static statement shapes are accepted by the shared database service.
export function dashboardReadStatements(): string[] {
  return (['normal', 'all', 'hidden'] as const).flatMap(mode => [true, false].flatMap(global => buildPlans(global, '', '', mode, '').map(plan => plan.sql)));
}

// MySQL registry totals are a distinct, explicitly labelled measure: no approval
// or visibility state exists in this schema. Never broaden a department admin.
export const INVENTORY_TOTAL_SQL = 'SELECT COUNT(*) AS value FROM durable_articles';
export const INVENTORY_CATEGORY_SQL = 'SELECT c.classificationName AS label, COUNT(da.DA_ID) AS total FROM classification c INNER JOIN durable_articles da ON c.classificationID = da.classificationID GROUP BY c.classificationID, c.classificationName ORDER BY total DESC LIMIT 6';
export function inventoryPlans(user: Identity, mode: ViewMode, columns: Column[]): Plan[] {
  if (!allDepartments(user) || mode === 'hidden') return [];
  const names = new Set(columns.map(c => `${c.tableName}.${c.columnName}`));
  if (names.has('durable_articles.is_approved') || names.has('durable_articles.is_visible')) return [];
  return [
    { key: 'total', sql: INVENTORY_TOTAL_SQL, values: [], requires: ['durable_articles.DA_ID'] },
    { key: 'category', sql: INVENTORY_CATEGORY_SQL, values: [], requires: ['durable_articles.DA_ID', 'durable_articles.classificationID', 'classification.classificationID', 'classification.classificationName'] },
  ];
}
