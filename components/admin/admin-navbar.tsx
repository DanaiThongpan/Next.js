'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminPageTitles } from './page-meta';
import { Icon } from './icon';
export function AdminNavbar({ toggle, expanded }: { toggle: () => void; expanded: boolean }) {
  const title=adminPageTitles[usePathname()];
  const pageTitle=title??'ศูนย์ควบคุมและบริหารจัดการระบบ (Command Center)';
  return <header id="top-navbar" className="d-flex align-items-center justify-content-between flex-shrink-0"><div className="d-flex align-items-center"><button className="btn btn-light border me-2 rounded-3 text-secondary shadow-xs" type="button" title="เปิด/ปิด เมนูนำทาง (Toggle Sidebar)" aria-label="Toggle Navigation" aria-expanded={expanded} aria-controls="admin-navigation" onClick={toggle}><Icon name="bars" className="fs-5" /></button><div><h5 className="fw-bold mb-0 text-dark d-none d-sm-block">{pageTitle}</h5><h6 className="fw-bold mb-0 text-dark d-block d-sm-none text-truncate" style={{maxWidth:180}}>{pageTitle}</h6></div></div><div className="d-flex align-items-center gap-2"><Link href={title?'/admin/print-qrcode':'/admin/qr'} className="btn btn-outline-primary btn-sm rounded-pill d-none d-md-inline-flex align-items-center shadow-xs" title="พิมพ์สติกเกอร์ QR Code"><Icon name="qrcode" className="me-1" />พิมพ์ QR Code</Link></div></header>;
}
