import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { canUseUserPanel, permitted, userMenu } from '@/lib/auth/policy';
import { requireIdentity } from '@/lib/auth/session';

const dashboardSections: Record<string, string> = {
  available: 'available', borrowed: 'borrowed', history: 'history', 'request-history': 'requests',
};

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Section({ params, searchParams }: Props) {
  const { section } = await params;
  const item = userMenu.find(entry => entry.slug === section);
  if (!item || !Object.hasOwn(dashboardSections, section)) notFound();
  const user = await requireIdentity();
  if (!canUseUserPanel(user) || !permitted(user, item.permission)) redirect('/unauthorized');
  const view = dashboardSections[section];
  const filters = await searchParams;
  const target = new URLSearchParams({ view });
  const keys = view === 'available' ? ['q', 'category', 'building', 'page'] :
    view === 'borrowed' ? ['status', 'length', 'page'] : ['q', 'status', 'page'];
  for (const key of keys) {
    const value = filters[key];
    if (typeof value === 'string') target.set(key, value.slice(0, 120));
  }
  const anchor = view === 'history' || view === 'requests' ? '#detail-section' : '';
  return redirect('/user?' + target + anchor);
}

export default function Page(props: Props) {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดหน้า…</p>}><Section {...props}/></Suspense>;
}
