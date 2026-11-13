'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return <Link className={`nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} href={href} prefetch={false} onClick={event => event.currentTarget.closest<HTMLDialogElement>('dialog')?.close()}>{children}</Link>;
}
