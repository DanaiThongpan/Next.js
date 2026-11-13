export type Identity = { id: string; name: string; type: string; department: string };
export type MenuItem = { slug: string; label: string; permission: 'admin' | 'authenticated' | 'standard-user' };
export function isAdmin(user: Identity) { return user.type === 'UT00000001'; }
export function homeFor(user: Identity) { return isAdmin(user) ? '/admin' : '/user'; }
export function permitted(user: Identity, permission: MenuItem['permission']) {
  return permission === 'authenticated' || (permission === 'admin' ? isAdmin(user) : user.type === 'UT00000002');
}
export function canUseUserPanel(user: Identity) {
  return isAdmin(user) || permitted(user, 'standard-user');
}
export const adminMenu: MenuItem[] = [
  { slug: 'assets', label: 'จัดการครุภัณฑ์', permission: 'admin' },
  { slug: 'users', label: 'จัดการข้อมูลผู้ใช้', permission: 'admin' },
  { slug: 'qr', label: 'พิมพ์ QR Code (A4)', permission: 'admin' },
  { slug: 'approvals', label: 'อนุมัติคำขอขึ้นทะเบียน', permission: 'admin' },
  { slug: 'history', label: 'ประวัติการยืม-คืน', permission: 'admin' },
  { slug: 'csv', label: 'นำเข้าข้อมูล (CSV)', permission: 'admin' },
  { slug: 'repairs', label: 'บันทึกการซ่อม', permission: 'admin' },
  { slug: 'reports', label: 'รายงานและสถิติ', permission: 'admin' },
  { slug: 'mail', label: 'ตั้งค่าอีเมลแจ้งเตือน', permission: 'admin' },
];
export const userMenu: MenuItem[] = [
  { slug: 'available', label: 'ครุภัณฑ์พร้อมใช้งาน', permission: 'authenticated' },
  { slug: 'borrow', label: 'ยืม-คืนครุภัณฑ์', permission: 'authenticated' },
  { slug: 'borrowed', label: 'รายการที่กำลังยืม', permission: 'authenticated' },
  { slug: 'history', label: 'ประวัติการยืม-คืน', permission: 'standard-user' },
  { slug: 'requests', label: 'เสนอขึ้นทะเบียนครุภัณฑ์', permission: 'standard-user' },
  { slug: 'request-csv', label: 'เสนอขึ้นทะเบียนด้วย CSV', permission: 'standard-user' },
  { slug: 'request-history', label: 'ประวัติคำขอขึ้นทะเบียน', permission: 'standard-user' },
  { slug: 'profile', label: 'ข้อมูลส่วนตัว', permission: 'standard-user' },
];
export function menuFor(user: Identity, area: 'admin' | 'user') {
  return (area === 'admin' ? adminMenu : userMenu).filter(item => permitted(user, item.permission));
}
// Only known destinations and the QR asset identifier may survive sign-in.
export function destinationFor(user: Identity, requested: unknown) {
  const destinations = ['/user', '/dashboard', ...menuFor(user, 'user').map(m => `/user/${m.slug}`)];
  if (isAdmin(user)) destinations.push('/admin', ...menuFor(user, 'admin').map(m => `/admin/${m.slug}`));
  if (typeof requested === 'string' && requested.startsWith('/user/borrow?') && requested.length <= 2000) {
    const params = new URLSearchParams(requested.slice('/user/borrow?'.length));
    const asset = params.get('asset_id');
    const review = params.get('review');
    const intent = params.get('intent');
    const loan = params.get('loan');
    const validKeys = [...params.keys()].every(key =>
      ['asset_id', 'review', 'intent', 'loan'].includes(key) && params.getAll(key).length === 1);
    if (validKeys && (asset === null || (asset.length > 0 && asset.length <= 150 && !asset.includes('\0'))) &&
      (review === null || review === 'return') && (intent === null || intent === 'borrow' || intent === 'return') &&
      (loan === null || (asset && /^[a-zA-Z0-9_-]{1,50}$/.test(loan)))) {
      return '/user/borrow?' + params;
    }
  }
  return typeof requested === 'string' && destinations.includes(requested) ? requested : homeFor(user);
}

export function canManageCategoryAvailability(user: Identity) {
  return isAdmin(user) && ['admin', 'admin_test', 'administrator'].includes(user.id.toLowerCase());
}
