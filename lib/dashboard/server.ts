import 'server-only';
import { isAdmin, type Identity } from '../auth/policy';
import { type ViewMode, type Dashboard } from './model';
import { readSqliteDashboard } from '../sqlite/dashboard';
export async function readAdminDashboard(user: Identity, mode: ViewMode) {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  try {
    return await readSqliteDashboard(user, mode);
  } catch {
    // Same widget error states, never driver messages/SQL/account details.
    const failure = { state: 'error' as const };
    const result: Dashboard = { total: failure, borrowed: failure, overdue: failure, pending: failure, maintenance: failure, available: failure, category: failure, recent: failure, sidebarPending: failure, sidebarOverdue: failure, sync: failure, mode, generatedAt: new Date().toISOString() };
    return { ...result, connectionError: true as const };
  }
}
