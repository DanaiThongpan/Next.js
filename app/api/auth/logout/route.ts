import { NextResponse, type NextRequest } from 'next/server';
import { sessions } from '@/lib/auth/runtime';
import { trustedOrigin, sessionCookieName, sessionCookieOptions } from '@/lib/auth/origin';
export async function POST(request: NextRequest) {
  const origin = trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN);
  if (!origin) return new NextResponse('Forbidden', { status: 403 });
  const name = sessionCookieName(process.env.NODE_ENV);
  try { await sessions.revoke(request.cookies.get(name)?.value); }
  catch { return new NextResponse('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่', { status: 503 }); }
  const response = NextResponse.redirect(new URL('/login', origin), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set(name, '', { ...sessionCookieOptions(origin.startsWith('https:')), maxAge: 0, expires: new Date(0) });
  return response;
}
