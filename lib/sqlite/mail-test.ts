import 'server-only';
import { readAdminModule } from './admin-modules';
import type { Identity } from '../auth/policy';

import { deliverMail } from './mail-delivery';
export { MAIL_API_ENDPOINT } from './mail-delivery';

export async function sendTestMail(user: Identity, recipient: string, senderName: string, senderEmail: string, testPassword?: string) {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = testPassword ?? process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    return { ok: false, message: 'ยังไม่ได้ตั้งค่า SMTP บนเซิร์ฟเวอร์' };
  }
  try {
    const { rows } = await readAdminModule(user, 'mail', {});
    const settings = rows[0];
    if (Number(settings?.is_active) !== 1) {
      return { ok: false, message: 'ระบบอีเมลปิดใช้งานอยู่' };
    }
    const from = `${senderName} ${senderEmail}`;
    const result = await deliverMail({
      SMTP_USER: smtpUser, SMTP_PASS: smtpPass, from, to: recipient,
      subject: '[ทดสอบ] ระบบอีเมลแจ้งเตือนครุภัณฑ์',
      html: '<p>ข้อความทดสอบจากระบบบริหารจัดการครุภัณฑ์</p>',
    });
    if (result.state === 'accepted') return { ok: true, message: 'ระบบอีเมลรับข้อความทดสอบแล้ว' };
    return { ok: false, message: result.message };
  } catch {
    return { ok: false, message: 'ยืนยันผลการส่งไม่ได้ กรุณาตรวจสอบกล่องอีเมลก่อนลองใหม่' };
  }
}
