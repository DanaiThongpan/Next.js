import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { requireIdentity } from '@/lib/auth/session';
import { menuFor, permitted, isAdmin, userMenu } from '@/lib/auth/policy';
export async function ProtectedScreen({ area, section, children }: { area: 'admin' | 'user'; section?: string; children?: ReactNode }) {
  // Check in each rendered page, not just a layout or a hidden client menu.
  const user = await requireIdentity(area === 'admin' ? 'admin' : undefined);
  const items = menuFor(user, area);
  const item = section ? items.find(i => i.slug === section) : undefined;
  if (section && !item) {
    const restricted = area === 'user' && userMenu.find(i => i.slug === section);
    if (restricted && !permitted(user, restricted.permission)) redirect('/unauthorized');
    notFound();
  }
  return <div className="container-fluid"><div className="row"><aside className="col-md-3 col-xl-2 daam-sidebar p-3"><h2 className="h5 fw-bold p-2 mb-3">DAAM</h2><nav aria-label="เมนูหลัก"><Link href={`/${area}`} aria-current={!section ? 'page' : undefined}>หน้าแรก (Dashboard)</Link>{items.map(i => <Link key={i.slug} href={`/${area}/${i.slug}`} aria-current={section === i.slug ? 'page' : undefined}>{i.label}</Link>)}</nav><div className="border-top border-secondary mt-4 pt-3"><p className="mb-1 text-break">{user.name}</p><span className="badge bg-primary mb-3">{isAdmin(user) ? 'Admin' : 'User'}</span><form action="/api/auth/logout" method="post"><button className="btn btn-outline-light btn-sm w-100" type="submit">ออกจากระบบ</button></form></div></aside><main className="col-md-9 col-xl-10 p-4 p-lg-5"><h1 className="h3 fw-bold mb-3">{item?.label ?? (area === 'admin' ? 'ศูนย์ควบคุมและบริหารจัดการระบบ' : 'แดชบอร์ดผู้ใช้งาน')}</h1><p className="text-secondary">ยินดีต้อนรับ {user.name} · แผนก: {user.department || 'ไม่ระบุแผนก'}</p>{children ?? <div className="alert alert-info">{item ? 'หน้านี้อยู่ระหว่างการย้ายระบบ ยังไม่เปิดใช้งานใน Phase 2' : 'ระบบเข้าสู่ระบบพร้อมใช้งาน เมนูงานครุภัณฑ์และยืม–คืนอยู่ระหว่างการย้ายระบบ'}</div>}{!item && <div className="row g-3">{items.map(i => <div className="col-sm-6 col-lg-4" key={i.slug}><Link className="card h-100 text-decoration-none shadow-sm" href={`/${area}/${i.slug}`}><div className="card-body"><h2 className="h6">{i.label}</h2><p className="text-secondary small mb-0">อยู่ระหว่างการย้ายระบบ</p></div></Link></div>)}</div>}</main></div></div>;
}
