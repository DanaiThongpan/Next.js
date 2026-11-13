import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { findLoginAccount } from '@/lib/auth/accounts';
import { trustedOrigin, sessionCookieName, sessionCookieOptions } from '@/lib/auth/origin';
import { verifyPassword } from '@/lib/auth/password';
import { permitted } from '@/lib/auth/policy';
import { loginAttempt, sessions } from '@/lib/auth/runtime';
import { currentIdentity } from '@/lib/auth/session';
import { saveOwnAccount } from '@/lib/sqlite/actions';
import { isolatedSqliteWritePath } from '@/lib/sqlite/write-path';

const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (message: string, status: number, field?: string) => reply({ ok: false, message, field }, status);
const allowed = (body: Record<string, unknown>, keys: string[]) =>
  Object.keys(body).every(key => keys.includes(key)) && keys.every(key => typeof body[key] === 'string');
const clean = (value: string) => !/[\u0000-\u001f\u007f]/.test(value);

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, raw = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        return null;
      }
      raw += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(raw + decoder.decode());
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function writeError(code: string) {
  if (code === 'WRITES_DISABLED') return fail('ยังไม่เปิดการบันทึกในฐานข้อมูลแยกของ Next.js', 503);
  if (code === 'FORBIDDEN') return fail('บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลส่วนตัว', 403);
  if (code === 'BUSY') return fail('ระบบกำลังบันทึกรายการอื่น กรุณาลองใหม่', 409);
  if (code === 'STALE') return fail('ข้อมูลบัญชีเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่และลองอีกครั้ง', 409);
  if (code === 'EMAIL_IN_USE') return fail('อีเมลนี้มีบัญชีอื่นใช้อยู่', 409, 'email');
  if (code === 'RESULT_UNKNOWN') return fail('ยืนยันผลการบันทึกไม่ได้ กรุณาโหลดหน้าใหม่เพื่อตรวจสอบ', 503);
  return fail('บันทึกข้อมูลไม่สำเร็จ', 503);
}

export async function PATCH(request: Request) {
  const origin = trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN);
  if (!origin) return fail('คำขอไม่ถูกต้อง', 403);
  const user = await currentIdentity();
  if (!user) return fail('กรุณาเข้าสู่ระบบใหม่', 401);
  if (!permitted(user, 'standard-user')) return writeError('FORBIDDEN');
  const body = await readBody(request);
  if (!body) return fail('ข้อมูลที่ส่งไม่ถูกต้อง', 400);

  try {
    if (body.action === 'profile') {
      if (!allowed(body, ['action', 'name', 'email', 'previousName', 'previousEmail'])) return fail('พบฟิลด์ที่แก้ไขไม่ได้หรือข้อมูลไม่ครบ', 400);
      const name = (body.name as string).trim();
      const email = (body.email as string).trim();
      if (!name || name.length > 150 || !clean(name)) return fail('กรอกชื่อ–นามสกุล 1–150 ตัวอักษร', 400, 'name');
      if (email.length > 150 || (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) || !clean(email)) return fail('กรอกอีเมลที่ถูกต้อง ความยาวไม่เกิน 150 ตัวอักษร', 400, 'email');
      const result = await saveOwnAccount(user, {
        action: 'self-profile', name, email, previousName: body.previousName as string, previousEmail: body.previousEmail as string,
      });
      if (!result.ok) return writeError(result.code);
      return reply({ ok: true, name, email });
    }

    if (body.action !== 'password' || !allowed(body, ['action', 'currentPassword', 'newPassword', 'confirmation'])) {
      return fail('คำขอเปลี่ยนรหัสผ่านไม่ถูกต้อง', 400);
    }
    const current = body.currentPassword as string;
    const next = body.newPassword as string;
    if (!current || current.includes('\0') || Buffer.byteLength(current) > 4096) return fail('กรอกรหัสผ่านปัจจุบัน', 400, 'currentPassword');
    if (next.length < 8 || Buffer.byteLength(next) > 72 || !next.trim() || next.includes('\0') || next === current) {
      return fail('ใช้รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร ไม่เกิน 72 ไบต์ และต่างจากรหัสปัจจุบัน', 400, 'newPassword');
    }
    if (body.confirmation !== next) return fail('รหัสผ่านที่ยืนยันไม่ตรงกัน', 400, 'confirmation');
    if (!await isolatedSqliteWritePath()) return writeError('WRITES_DISABLED');
    if (!await loginAttempt(`profile-password:${user.id}`)) return fail('ลองหลายครั้งเกินไป กรุณารอแล้วลองใหม่', 429);
    const account = await findLoginAccount(user.id);
    if (!account || account.type !== 'UT00000002') return writeError('FORBIDDEN');
    if (!await verifyPassword(current, account.passwordHash)) return fail('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400, 'currentPassword');

    const result = await saveOwnAccount(user, {
      action: 'self-password', previousHash: account.passwordHash, passwordHash: await bcrypt.hash(next, 12),
    });
    if (!result.ok) return writeError(result.code);
    const revoked = await sessions.revokeAccount(user.id).then(() => true, () => false);
    const response = reply({ ok: true, reauthenticate: true, message: revoked
      ? 'เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่'
      : 'เปลี่ยนรหัสผ่านแล้ว แต่ยกเลิกเซสชันอื่นได้ไม่ครบ กรุณาเข้าสู่ระบบใหม่' });
    response.cookies.set(sessionCookieName(process.env.NODE_ENV), '', {
      ...sessionCookieOptions(origin.startsWith('https:')), maxAge: 0, expires: new Date(0),
    });
    return response;
  } catch {
    return fail('ดำเนินการไม่สำเร็จ กรุณาลองใหม่', 503);
  }
}
