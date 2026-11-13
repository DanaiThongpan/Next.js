import { NextResponse, type NextRequest } from 'next/server';
import { trustedOrigin, sessionCookieName, sessionCookieOptions } from '@/lib/auth/origin';
import { loginSession } from '@/lib/auth/login-session';
import { findLoginAccount } from '@/lib/auth/accounts';
import { verifyPassword } from '@/lib/auth/password';
import { sessions, loginAttempt } from '@/lib/auth/runtime';
import { SESSION_SECONDS } from '@/lib/auth/store';

import { isDatabaseAccessEnabled, DATABASE_DISABLED_MESSAGE, DatabaseError } from '@/lib/db';

const failure = 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ';
function error(status: number, message = failure) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  const origin = trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN);
  if (!origin) return error(403, 'ไม่สามารถดำเนินการจากแหล่งที่มานี้ได้');
  if (!isDatabaseAccessEnabled()) return error(503, DATABASE_DISABLED_MESSAGE);
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return error(415);
  // Bound the stream itself; Content-Length is untrusted/optional.
  let body: { username?: unknown; password?: unknown; redirect?: unknown };
  try {
    const reader = request.body?.getReader();
    if (!reader) return error(400);
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16_384) { await reader.cancel(); return error(413); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return error(400);
  } catch { return error(400); }
  try {
    const id = typeof body.username === 'string' ? body.username.trim().slice(0, 100) : '';
    if (!await loginAttempt(id)) return error(429, 'เข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่');
    const cookieName = sessionCookieName(process.env.NODE_ENV);
    const session = await loginSession(body, request.cookies.get(cookieName)?.value, { find: findLoginAccount, verify: verifyPassword, sessions });
    if (!session) return error(401);
    const response = NextResponse.json({ redirect: session.destination }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(cookieName, session.token, { ...sessionCookieOptions(origin.startsWith('https:')), maxAge: SESSION_SECONDS, expires: new Date(session.expiresAt) });
    return response;
  } catch (cause) { return error(503, cause instanceof DatabaseError ? cause.message : 'ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่ภายหลัง'); }
}
