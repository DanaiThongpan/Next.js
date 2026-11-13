import 'bootstrap/dist/css/bootstrap.min.css';
import './auth.css';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="daam-auth">{children}</div>;
}
