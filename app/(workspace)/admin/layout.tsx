import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/sarabun/400.css';
import '@fontsource/sarabun/600.css';
import '@fontsource/sarabun/700.css';
import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/700.css';
import './styles/admin_responsive.css';
import './styles/admin_dashboard.css';
import './styles/migration.css';
import './styles/php-pages.css';
export default function Layout({ children }: { children: React.ReactNode }) { return <section className="daam-admin">{children}</section>; }
