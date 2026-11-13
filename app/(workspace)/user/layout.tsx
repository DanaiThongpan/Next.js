import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fontsource/sarabun/400.css';
import '@fontsource/sarabun/600.css';
import '@fontsource/sarabun/700.css';
import './user-dashboard.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="daam-user">{children}</div>;
}
