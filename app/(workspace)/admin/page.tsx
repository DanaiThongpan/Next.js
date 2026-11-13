import { Suspense } from 'react';
import { requireIdentity } from '@/lib/auth/session';
import { viewMode } from '@/lib/dashboard/model';
import { readAdminDashboard } from '@/lib/dashboard/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { DashboardWidgets } from '@/components/admin/dashboard-widgets';
export const metadata = { title: 'ศูนย์ควบคุมและบริหารจัดการระบบ (Command Center) - Admin System' };
async function Dashboard({ searchParams }: { searchParams: Promise<{ view_mode?: string | string[] }> }) {
  const user = await requireIdentity('admin');
  const params = await searchParams;
  const data = await readAdminDashboard(user, viewMode(params.view_mode));
  return <AdminShell sidebar={<AdminSidebar user={user} data={data} />} year={Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(new Date()))}><DashboardWidgets data={data} connectionError={'connectionError' in data} showSync={user.id === 'admin'} /></AdminShell>;
}
export default function Page(props: { searchParams: Promise<{ view_mode?: string | string[] }> }) { return <Suspense fallback={<p className="p-4">กำลังตรวจสอบสิทธิ์และโหลด Dashboard…</p>}><Dashboard {...props} /></Suspense>; }
