import { redirect } from 'next/navigation';

export default function Home() {
  // Legacy index.php delegates to the login entry point.
  redirect('/login');
}
