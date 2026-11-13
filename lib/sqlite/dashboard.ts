import 'server-only';
import { readSqliteQueries } from './read';
import { isAbsolute } from 'node:path';
import { isAdmin, type Identity } from '../auth/policy.ts';
import { plansFor, type ViewMode, type Column } from '../dashboard/model.ts';
import { readWidgets } from '../dashboard/read.ts';
export async function readSqliteDashboard(user: Identity, mode: ViewMode) {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.DAAM_DB_ACCESS !== 'enabled') throw new Error('SOURCE_DISABLED');
  const path = process.env.DAAM_SQLITE_PATH;
  if (!path || !isAbsolute(path)) throw new Error('SOURCE_UNAVAILABLE');
  const now = new Date();
  const { bangkokDay } = await import('../dashboard/model.ts');
  const plans = plansFor(user, mode, bangkokDay(now));
  try {
    const tables = ['durable_articles','borrow_back','classification','_sync_meta'];
    const metadata = tables.map(table => `SELECT '${table}' AS tableName, name AS columnName FROM pragma_table_info('${table}')`).join(' UNION ALL ');
    const [rawColumns] = await readSqliteQueries([{sql:metadata,values:[]}]);
    const columns = rawColumns as unknown as Column[];
    return await readWidgets(user, mode, columns, async sql => {
      const plan=plans.find(p=>p.sql===sql);
      if(!plan) throw new Error('READ_FAILED');
      const statement=plan.key==='sync' ? "SELECT strftime('%d/%m/%Y %H:%M',last_synced_at) AS value FROM _sync_meta ORDER BY id DESC LIMIT 1" : sql;
      const [rows]=await readSqliteQueries([{sql:statement,values:plan.values}]);
      return rows;
    }, now);
  } catch { throw new Error('SOURCE_UNAVAILABLE'); }
}
