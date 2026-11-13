import 'server-only';

export const MAIL_API_ENDPOINT = 'https://admission.ubu.ac.th/mailsender/api/send-email';

type MailPayload = {
  SMTP_USER: string; SMTP_PASS: string; from: string; to: string; subject: string; html: string;
};
type Delivery = { state: 'accepted' } | { state: 'rejected' | 'uncertain'; message: string };

export async function deliverMail(payload: MailPayload): Promise<Delivery> {
  const signal = AbortSignal.timeout(25000);
  let response: Response;
  try {
    response = await fetch(MAIL_API_ENDPOINT, {
      method: 'POST',
      redirect: 'manual',
      signal,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const cause = error instanceof Error ? error.cause as { code?: string } | undefined : undefined;
    const code = cause?.code ?? '';
    if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'SELF_SIGNED_CERT_IN_CHAIN', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID'].includes(code)) {
      return { state: 'rejected', message: `เชื่อมต่อ UBU Mail API ไม่สำเร็จ (${code})` };
    }
    return { state: 'uncertain', message: signal.aborted
      ? 'UBU Mail API ไม่ตอบกลับภายใน 25 วินาที'
      : 'การเชื่อมต่อ UBU Mail API ขาดก่อนยืนยันผล' };
  }

  const result = await response.json().catch(() => null);
  if (response.ok && result?.status === 'success') return { state: 'accepted' };

  const status = response.status;
  if (status === 401 || status === 403) {
    return { state: 'rejected', message: `UBU Mail API ไม่อนุญาตให้ส่ง (HTTP ${status}) กรุณาตรวจบัญชีผู้ส่งและรหัสผ่านแอป` };
  }
  if (result?.status === 'error' || [400, 404, 405, 413, 415, 422, 429].includes(status)) {
    return { state: 'rejected', message: `UBU Mail API ปฏิเสธการส่ง (HTTP ${status})` };
  }
  return { state: 'uncertain', message: signal.aborted
    ? 'UBU Mail API ส่งข้อมูลตอบกลับไม่ครบภายใน 25 วินาที'
    : `UBU Mail API ตอบกลับโดยไม่มีผลยืนยันการส่ง (HTTP ${status})` };
}
