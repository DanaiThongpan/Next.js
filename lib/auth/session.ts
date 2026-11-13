import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessions } from './runtime';
import { findActiveIdentity } from './accounts';
import { sessionCookieName } from './origin';
import { isAdmin } from './policy';
import { resolveSession } from './resolve-session';
import { isDatabaseAccessEnabled } from '../db';

export async function currentIdentity() {
  // Keep authentication request-time even when access is disabled at build time.
  const cookieStore = await cookies();
  if (!isDatabaseAccessEnabled()) return null;
  const token = cookieStore.get(sessionCookieName(process.env.NODE_ENV))?.value;
  try {
    return await resolveSession(token, { read: sessions.read.bind(sessions), revoke: sessions.revoke.bind(sessions), find: findActiveIdentity });
  } catch {
    // Fail closed on store/database failure. Never surface driver errors or account data.
    return null;
  }
}
export async function requireIdentity(area?: 'admin') {
  const user = await currentIdentity();
  if (!user) redirect('/login');
  if (area === 'admin' && !isAdmin(user)) redirect('/unauthorized');
  return user;
}
