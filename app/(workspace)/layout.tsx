import 'bootstrap/dist/css/bootstrap.min.css';
import './workspace.css';
export const metadata = { title: 'DAAM · ระบบจัดการครุภัณฑ์', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <div className="daam-workspace">{children}</div>; }
