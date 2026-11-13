import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireIdentity } from '@/lib/auth/session';
import { menuFor } from '@/lib/auth/policy';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
async function Section({ params }: { params: Promise<{ section: string }> }) {
  const user = await requireIdentity('admin');
  const { section } = await params;
  const item = menuFor(user, 'admin').find(item => item.slug === section);
  if (!item) notFound();
  return <AdminShell sidebar={<AdminSidebar user={user} />} year={Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(new Date()))}><h2 className="h3 fw-bold mb-3">{item.label}</h2><div className="alert alert-info">อยู่ระหว่างการพัฒนา — หน้านี้ยังไม่ได้ย้ายระบบ ไม่มีการดำเนินการกับข้อมูลใน Phase 3</div></AdminShell>;
}
export default function Page(props: { params: Promise<{ section: string }> }) { return <Suspense fallback={<p className="p-4">กำลังตรวจสอบสิทธิ์…</p>}><Section {...props} /></Suspense>; }
