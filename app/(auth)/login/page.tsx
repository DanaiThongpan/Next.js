import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { currentIdentity } from '@/lib/auth/session';
import { destinationFor } from '@/lib/auth/policy';
import LoginForm from './login-form';
import { isDatabaseAccessEnabled, DATABASE_DISABLED_MESSAGE } from '@/lib/db';
export const metadata = { title: 'เข้าสู่ระบบ - ระบบจัดการครุภัณฑ์', robots: { index: false, follow: false } };
async function Login({ searchParams }: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  const params = await searchParams;
  const requested = typeof params.redirect === 'string' ? params.redirect : '';
  const enabled = isDatabaseAccessEnabled();
  const user = await currentIdentity();
  if (user) redirect(destinationFor(user, requested));
  return <div className="card login-card"><div className="login-header"><div className="app-icon" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11 11 7l8 4-8 4-8-4v11l8 4 8-4V11M11 15v11M19 17l7-4 7 4-7 4-7-4v11l7 4 7-4V17M26 21v11" /></svg></div><h1 className="h4 fw-bold mb-1">ระบบจัดการครุภัณฑ์</h1><p className="mb-0 text-white-50 small">กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p></div><div className="card-body p-4"><>{!enabled && <div className="alert alert-warning small" role="status">{DATABASE_DISABLED_MESSAGE}</div>}<LoginForm destination={requested} disabled={!enabled} /></></div></div>;
}
export default function Page(props: { searchParams: Promise<{ redirect?: string | string[] }> }) {
  return <Suspense fallback={<p>กำลังตรวจสอบ Session…</p>}><Login {...props} /></Suspense>;
}
