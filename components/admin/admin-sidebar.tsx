import Image from 'next/image';
import Link from 'next/link';
import { isAdmin, menuFor, type Identity } from '@/lib/auth/policy';
import { bangkokDay, plansFor, type Dashboard } from '@/lib/dashboard/model';
import { readSqliteQueries } from '@/lib/sqlite/read';
import { Icon } from './icon';
import { AdminNavLink } from './admin-nav-link';
const icons: Record<string, string> = { assets: 'boxes-stacked', users: 'users-gear', qr: 'qrcode', approvals: 'clipboard-check', history: 'clock-rotate-left', csv: 'file-csv', repairs: 'wrench', reports: 'chart-pie', mail: 'envelope-circle-check' };
type SidebarBadges = Pick<Dashboard, 'sidebarPending' | 'sidebarOverdue'>;

async function readSidebarBadges(user: Identity): Promise<SidebarBadges> {
  const plans = plansFor(user, 'normal', bangkokDay()).filter(
    plan => plan.key === 'sidebarPending' || plan.key === 'sidebarOverdue',
  );
  const badges: SidebarBadges = {
    sidebarPending: { state: 'error' },
    sidebarOverdue: { state: 'error' },
  };
  try {
    const rows = await readSqliteQueries(plans);
    plans.forEach(({ key }, index) => {
      if (key !== 'sidebarPending' && key !== 'sidebarOverdue') return;
      const value = rows[index]?.[0]?.value;
      if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
        badges[key] = { state: 'ready', value };
      }
    });
  } catch {
    // Keep navigation available if the database cannot supply badge counts.
  }
  return badges;
}

export async function AdminSidebar({ user, data }: { user: Identity; data?: SidebarBadges }) {
  if (!isAdmin(user)) return null;
  const badges = data ?? await readSidebarBadges(user);
  const superBadge = user.id === 'admin'; // Original sidebar rule; not the data-scope rule.
  return <>
    <Link href="/admin" className="sidebar-brand flex-shrink-0"><Icon name="screwdriver-wrench" className="text-warning me-2 fs-5" /><span>Admin Panel</span></Link>
    <nav className="sidebar-menu-scroll" aria-label="เมนู Admin"><ul className="sidebar-nav"><li className="nav-header">เมนูหลัก</li><li><AdminNavLink href="/admin"><span className="nav-left"><Icon name="house" />หน้าแรก (Dashboard)</span></AdminNavLink></li>{menuFor(user, 'admin').map(item => {
      const badge = item.slug === 'approvals' ? badges.sidebarPending : item.slug === 'history' ? badges.sidebarOverdue : undefined;
      return <li key={item.slug}><AdminNavLink href={item.slug === 'assets' ? '/admin/manage-data' : item.slug === 'users' ? '/admin/manage-users' : item.slug === 'qr' ? '/admin/print-qrcode' : `/admin/${item.slug}`}><span><span className="nav-left" title={badge ? badge.state === 'ready' ? `รายการแจ้งเตือนตามสูตรแถบเมนู: ${badge.value}` : badge.state === 'unmapped' ? 'ยังไม่สามารถเชื่อมโยงข้อมูลได้' : 'ไม่สามารถโหลดรายการแจ้งเตือนได้' : undefined}><Icon name={icons[item.slug]} />{item.label}</span>{!['assets','users','qr'].includes(item.slug) && <small className="migration-menu-label">อยู่ระหว่างการพัฒนา</small>}</span>{badge?.state === 'ready' && badge.value > 0 && <span className="badge bg-danger rounded-pill">{badge.value.toLocaleString('th-TH')}</span>}</AdminNavLink></li>;
    })}</ul></nav>
    <div className="sidebar-bottom-profile mt-auto py-3"><div className="sidebar-user-card px-3 py-2 mx-3"><div className="d-flex align-items-center justify-content-between"><div className="avatar-circle me-2"><Image src="/admin/avatar.svg" width={38} height={38} alt="" /><span className="user-status-dot" /></div><div className="flex-grow-1 overflow-hidden me-2"><div className="user-display-name text-truncate" title={user.name}>{user.name}</div><span className={superBadge ? 'badge-super-admin' : 'badge-admin'}>{superBadge ? 'Super Admin' : 'Admin'}</span></div><form action="/api/auth/logout" method="post"><button className="btn-sidebar-power" type="submit" title="ออกจากระบบ" aria-label="ออกจากระบบ"><Icon name="power-off" /></button></form></div></div></div>
  </>;
}
