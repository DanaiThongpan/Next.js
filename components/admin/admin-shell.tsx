'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { adminPageTitles } from './page-meta';
import { AdminNavbar } from './admin-navbar';
import { Icon } from './icon';
function subscribeViewport(listener: () => void) {
  const query = window.matchMedia('(min-width: 992px)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
export function AdminShell({ sidebar, children, year }: { sidebar: React.ReactNode; children: React.ReactNode; year: number }) {
  const pathname=usePathname();
  const page=adminPageTitles[pathname] ? pathname.split('/').pop() : ''; 
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const desktop = useSyncExternalStore(subscribeViewport, () => window.matchMedia('(min-width: 992px)').matches, () => true);
  function toggle() {
    if (window.matchMedia('(min-width: 992px)').matches) {
      setCollapsed(value => { const next = !value; try { localStorage.setItem('daam_sidebar_collapsed', next ? '1' : '0'); } catch {} return next; });
    } else { dialog.current?.showModal(); setMobileOpen(true); }
  }
  useEffect(() => {
    // Initialize via an external browser event to keep server/client initial markup equal.
    const restore = () => { try { setCollapsed(localStorage.getItem('daam_sidebar_collapsed') === '1'); } catch {} };
    const frame = requestAnimationFrame(restore);
    window.addEventListener('storage', restore);
    const resize = () => { if (window.matchMedia('(min-width: 992px)').matches) dialog.current?.close(); };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('storage', restore); window.removeEventListener('resize', resize); };
  }, []);
  return <div id="app-layout" className={`${collapsed ? 'sidebar-collapsed' : ''} ${page ? `php-page-${page}` : ''}`}>
    <aside id="sidebar">{sidebar}</aside>
    <dialog ref={dialog} id="admin-navigation" className="admin-mobile-drawer" aria-label="เมนูนำทาง Admin" onClose={() => setMobileOpen(false)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}><div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary"><h2 className="h5 text-white mb-0"><Icon name="screwdriver-wrench" className="text-warning me-2" />Admin Panel</h2><button className="btn btn-sm btn-outline-light" onClick={() => dialog.current?.close()} aria-label="ปิดเมนู"><Icon name="xmark" /></button></div><div className="drawer-content">{sidebar}</div></dialog>
    <div id="main-wrapper"><AdminNavbar toggle={toggle} expanded={desktop ? !collapsed : mobileOpen} /><main id="main-content"><div className="container-fluid px-0 px-md-1 flex-grow-1">{children}</div><footer id="app-footer" className="mt-4"><div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2"><div>© {year} <strong>ระบบบริหารจัดการครุภัณฑ์ (Asset Management System)</strong></div><div className="text-secondary small">Enterprise Responsive Layout • Version 2.5</div></div></footer></main></div>
  </div>;
}
