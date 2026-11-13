import { sendTestMail } from '@/lib/sqlite/mail-test';
import { isAdmin } from '@/lib/auth/policy';
import { currentIdentity } from '@/lib/auth/session';
import { trustedOrigin } from '@/lib/auth/origin';
import { saveMailSettings, setMailStatus } from '@/lib/sqlite/actions';

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const validEmail = (value: FormDataEntryValue | null): value is string =>
  typeof value === 'string' && value.length <= 254 && emailPattern.test(value);
const validName = (value: FormDataEntryValue | null): value is string =>
  typeof value === 'string' && Boolean(value.trim()) && value.length <= 120 && !/[\r\n]/.test(value);

const frequencies = new Map([['none', 0], ['daily', 1], ['alternate', 2], ['weekly', 7]]);

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) {
    return new Response(null, { status: 403 });
  }
  const user = await currentIdentity();
  if (!user) return new Response(null, { status: 401 });
  let form;
  try { form = await request.formData(); } catch { return new Response(null, { status: 400 }); }
  if (form.get('action') === 'reveal-password') {
    const headers = { 'Cache-Control': 'no-store' };
    if (!isAdmin(user) || !['admin', 'admin_test'].includes(user.id)) {
      return new Response(null, { status: 403, headers });
    }
    const password = process.env.SMTP_PASS;
    if (!password) return new Response(null, { status: 404, headers });
    return Response.json({ password }, { headers });
  }
  const name = form.get('name');
  const email = form.get('email');
  if (form.get('action') === 'status') {
    const active = form.get('active');
    const previous = form.get('previous');
    if ((active !== '0' && active !== '1') || (previous !== '0' && previous !== '1') || active === previous) {
      return Response.json({ ok: false, code: 'INVALID_INPUT' }, { status: 400 });
    }
    const result = await setMailStatus(user, Number(active), Number(previous));
    return Response.json(result, { status: result.ok ? 200 : result.code === 'FORBIDDEN' ? 403 : 409 });
  }
  if (form.get('action') === 'test') {
    if (!isAdmin(user) || !['admin', 'admin_test'].includes(user.id)) {
      return Response.json({ ok: false, message: 'บัญชีนี้ไม่มีสิทธิ์ส่งอีเมลทดสอบ' }, { status: 403 });
    }
    const recipient = form.get('recipient');
    if (!validEmail(recipient)) {
      return Response.json({ ok: false, message: 'กรุณาระบุอีเมลผู้รับที่ถูกต้อง' }, { status: 400 });
    }
    if (!validName(name) || !validEmail(email)) {
      return Response.json({ ok: false, message: 'กรุณาตรวจสอบชื่อและอีเมลผู้ส่งก่อนทดสอบ' }, { status: 400 });
    }
    const password = form.get('smtpPassword');
    if (password !== null && (typeof password !== 'string' || !password.trim() || password.length > 512)) {
      return Response.json({ ok: false, message: 'กรุณาตรวจสอบรหัสผ่านแอปที่กรอก' }, { status: 400 });
    }
    const result = await sendTestMail(user, recipient, name.trim(), email, password ?? undefined);
    return Response.json(result, { status: result.ok ? 200 : 409, headers: { 'Cache-Control': 'no-store' } });
  }
  const frequency = form.get('frequency');
  const active = form.get('active');
  const days = typeof frequency === 'string' && frequency !== 'custom'
    ? frequencies.get(frequency)
    : Number(form.get('days'));
  if (!validName(name) || !validEmail(email)
    || typeof frequency !== 'string' || days === undefined || !Number.isInteger(days)
    || (frequency === 'custom' && (days < 1 || days > 90))
    || (active !== '0' && active !== '1')) {
    return Response.json({ ok: false, code: 'INVALID_INPUT' }, { status: 400 });
  }
  const result = await saveMailSettings(user, [name.trim(), email, frequency, days, Number(active)]);
  const status = result.ok ? 200 : result.code === 'FORBIDDEN' ? 403 : 409;
  return Response.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
}
