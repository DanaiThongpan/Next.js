export function trustedOrigin(headers: Headers, mode: string | undefined, configured?: string): string | null {
  const origin = headers.get('origin');
  if (!origin || headers.get('sec-fetch-site') === 'cross-site') return null;
  const allowed = configured ? [configured] : mode === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3000', 'https://127.0.0.1:3000'] : [];
  if (!allowed.includes(origin)) return null;
  try {
    const url = new URL(origin);
    if (url.port === '8000' || url.origin !== origin || url.host !== headers.get('host') || (mode === 'production' && url.protocol !== 'https:')) return null;
    return origin;
  } catch { return null; }
}
export function sessionCookieOptions(secure: boolean) {
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };
}
export function sessionCookieName(mode: string | undefined) {
  return mode === 'production' ? '__Host-daam_session' : 'daam_session';
}
