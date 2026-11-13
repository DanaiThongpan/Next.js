import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/admin/icon';
import { hasOwnedAssets } from '@/lib/sqlite/borrow';
import { menuFor, permitted, type Identity } from '@/lib/auth/policy';

const icons: Record<string, string> = {
  home: 'house', available: 'magnifying-glass', borrowed: 'hand-holding-hand',
  'scan-borrow': 'qrcode', 'scan-return': 'qrcode', 'owner-returns': 'clipboard-check', history: 'clock-rotate-left', requests: 'file-circle-plus',
  'request-csv': 'file-csv', 'request-history': 'list-check', profile: 'circle-user',
};

export async function UserShell({ user, active, children }: { user: Identity; active: string; children: ReactNode }) {
  const ownProfile = permitted(user, 'standard-user');
  const owner = await hasOwnedAssets(user).catch(() => false);
  const items = [
    { slug: 'home', label: 'ภาพรวม' },
    { slug: 'scan-borrow', label: 'สแกน QR ยืมครุภัณฑ์', href: '/user/borrow?intent=borrow' },
    { slug: 'scan-return', label: 'สแกน QR คืนครุภัณฑ์', href: '/user/borrow?intent=return' },
    ...menuFor(user, 'user').filter(item => item.slug !== 'borrow'),
    ...(owner ? [{ slug: 'owner-returns', label: 'รายการรอรับคืน', href: '/user/borrow?review=return' }] : []),
  ];
  const groups = [
    { label: 'ยืม–คืน', slugs: ['home', 'scan-borrow', 'scan-return', 'borrowed', 'owner-returns', 'history'] },
    { label: 'ครุภัณฑ์', slugs: ['available', 'requests', 'request-csv', 'request-history'] },
    { label: 'บัญชี', slugs: ['profile'] },
  ];
  const activeLabel = items.find(item => item.slug === active)?.label;
  const navigation = <nav className="user-nav" aria-label="เมนูผู้ใช้">
    {groups.map(group => {
      const entries = group.slugs.map(slug => items.find(item => item.slug === slug)).filter(item => item !== undefined);
      if (!entries.length) return null;
      return <div className="user-nav-group" key={group.label}>
        <h2>{group.label}</h2>
        <ul>{entries.map(item => <li key={item.slug}>
          <Link href={('href' in item && item.href) || (item.slug === 'home' ? '/user' : `/user/${item.slug}`)}
            aria-current={active === item.slug ? 'page' : undefined}>
            <span className="user-nav-icon"><Icon name={icons[item.slug]}/></span>
            <span>{item.label}</span>
          </Link>
        </li>)}</ul>
      </div>;
    })}
  </nav>;

  return <div className="user-shell">
    <a className="user-skip" href="#user-content">ข้ามไปยังเนื้อหา</a>
    <header className="user-top">
      <Link href="/user" className="user-brand"><span><Icon name="boxes-stacked"/></span><div><strong>DAAM</strong><small>ระบบบริหารจัดการครุภัณฑ์</small></div></Link>
      <details className="user-account">
        <summary><Icon name="circle-user"/><span>{user.name}</span><Icon name="chevron-down"/></summary>
        <div className="user-account-body">
          <strong>{user.name}</strong><small>{user.department || 'ไม่ระบุแผนก'}</small>
          {ownProfile && <Link href="/user/profile" className="btn btn-outline-primary w-100 mb-2">ข้อมูลส่วนตัว</Link>}
          <form action="/api/auth/logout" method="post"><button type="submit" className="btn btn-outline-secondary w-100"><Icon name="right-from-bracket" className="me-2"/>ออกจากระบบ</button></form>
        </div>
      </details>
    </header>
    <aside className="user-sidebar">{navigation}</aside>
    <details className="user-mobile-nav" key={active}>
      <summary>
        <span className="user-mobile-nav-label"><Icon name="bars"/> เมนู</span>
        {activeLabel && <span className="user-mobile-current">{activeLabel}</span>}
        <Icon name="chevron-down" className="user-mobile-chevron"/>
      </summary>
      {navigation}
    </details>
    <main id="user-content" className="user-main" tabIndex={-1}>{children}</main>
  </div>;
}
