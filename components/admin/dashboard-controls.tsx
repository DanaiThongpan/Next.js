'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Icon } from './icon';
export function DashboardRefresh({ retry = false }: { retry?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} aria-busy={pending} className={`btn btn-sm ${retry ? 'btn-danger' : 'btn-outline-secondary'} rounded-pill px-3 shadow-sm`} onClick={() => startTransition(() => router.refresh())}><Icon name="arrows-rotate" className={`me-1 ${pending ? 'fa-spin' : ''}`} />{pending ? 'กำลังโหลด…' : retry ? 'ลองใหม่อีกครั้ง (Retry)' : 'รีเฟรชข้อมูล'}</button>;
}
