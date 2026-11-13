import { Suspense } from 'react';
import Link from 'next/link';
import { requireIdentity } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AssetCreatePanel } from '@/components/asset-create-panel';

async function Content() {
  const user = await requireIdentity('admin');
  return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}>
    <Link href="/admin/manage-data" className="btn btn-outline-secondary mb-3">กลับหน้าจัดการครุภัณฑ์</Link>
    <section className="card shadow-sm"><h1 className="card-header h5">เพิ่มครุภัณฑ์</h1><div className="card-body"><AssetCreatePanel user={user}/></div></section>
  </AdminShell>;
}
export default function Page() {
  return <Suspense fallback={<p>กำลังโหลดฟอร์ม…</p>}><Content/></Suspense>;
}
