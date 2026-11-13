import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth/session';
import { homeFor } from '@/lib/auth/policy';
async function Dashboard() { return redirect(homeFor(await requireIdentity())); }
export default function Page() { return <Suspense fallback={<p>กำลังตรวจสอบสิทธิ์…</p>}><Dashboard /></Suspense>; }
