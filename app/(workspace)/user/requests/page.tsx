import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth/session';
import { permitted } from '@/lib/auth/policy';
import { AssetCreatePanel } from '@/components/asset-create-panel';
import { UserShell } from '../_components/user-shell';

async function Content() {
  const user = await requireIdentity();
  if (!permitted(user, 'standard-user')) redirect('/unauthorized');
  return <UserShell user={user} active="requests">
    <div className="user-hero"><h1>เสนอขึ้นทะเบียนครุภัณฑ์</h1><p>กรอกข้อมูลครุภัณฑ์เพื่อส่งให้ผู้ดูแลตรวจสอบ</p></div>
    <div className="user-data-actions mb-3">
      <Link href="/user/request-history" className="btn btn-outline-primary">ติดตามคำขอ</Link>
      <Link href="/user/request-csv" className="btn btn-outline-secondary">เสนอหลายรายการด้วย CSV</Link>
    </div>
    <section className="user-panel"><div className="user-form"><AssetCreatePanel user={user}/></div></section>
  </UserShell>;
}

export default function Page() {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดฟอร์ม…</p>}><Content/></Suspense>;
}
