import { trustedOrigin } from '@/lib/auth/origin';
import { isAdmin } from '@/lib/auth/policy';
import { currentIdentity } from '@/lib/auth/session';
import { assetDetailLimits, assetFieldLimits, csvColumns } from '@/lib/csv-import-format';
import { createAsset } from '@/lib/sqlite/actions';
import { validateCsv } from '@/lib/sqlite/csv-import';

const fail = (message: string, status: number) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('EMPTY');
  const bytes = new Uint8Array(16_384);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > bytes.length) {
        await reader.cancel();
        throw new Error('TOO_LARGE');
      }
      bytes.set(value, length);
      length += value.length;
    }
  } finally {
    reader.releaseLock();
  }
  const result: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length)));
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('INVALID');
  return result as Record<string, unknown>;
}

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return fail('คำขอไม่ถูกต้อง', 403);
  const user = await currentIdentity();
  if (!user) return fail('กรุณาเข้าสู่ระบบ', 401);
  if (!isAdmin(user) && user.type !== 'UT00000002') return fail('บัญชีนี้ไม่มีสิทธิ์เพิ่มครุภัณฑ์', 403);

  let body;
  try { body = await readBody(request); }
  catch { return fail('ข้อมูลฟอร์มไม่ถูกต้องหรือมีขนาดใหญ่เกินไป', 400); }
  if (Object.keys(body).some(key => !csvColumns.some(field => field === key) && !Object.hasOwn(assetDetailLimits, key))) {
    return fail('พบฟิลด์ที่ไม่รองรับ', 400);
  }
  const details: Record<string, string | null> = {};
  const values: string[] = [];
  for (const [field, limit] of [...csvColumns.map((field, index) => [field, assetFieldLimits[index]] as const), ...Object.entries(assetDetailLimits)]) {
    const raw = body[field];
    if (raw !== undefined && typeof raw !== 'string') return fail(`ชนิดข้อมูลไม่ถูกต้อง: ${field}`, 400);
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value.length > limit || value.includes('\u0000')) return fail(`ข้อมูลไม่ถูกต้องหรือยาวเกินกำหนด: ${field}`, 400);
    if (Object.hasOwn(assetDetailLimits, field)) details[field] = value || null;
    else values.push(value);
  }
  if (!values[0] || !values[1]) return fail('กรุณาระบุหมายเลขและชื่อครุภัณฑ์', 400);
  let validation;
  try {
    validation = await validateCsv(user, { rows: [{ row: 1, values }], columns: csvColumns.map((_, index) => index), width: csvColumns.length }, true, isAdmin(user) ? 'admin' : 'user-request');
  } catch { return fail('ตรวจสอบข้อมูลอ้างอิงไม่สำเร็จ', 503); }
  const [row] = validation.rows;
  if (validation.invalid) {
    const issue = validation.issues[0];
    return fail(issue?.message ?? 'ข้อมูลไม่ถูกต้อง', issue?.field === 'owner_department' ? 403 : 400);
  }
  if (row.duplicate) return fail('หมายเลขครุภัณฑ์นี้มีอยู่แล้ว', 409);
  const result = await createAsset(user, row, details);
  if (!result.ok) {
    switch (result.code.split(':')[0]) {
      case 'FORBIDDEN': return fail('บัญชีนี้ไม่มีสิทธิ์เพิ่มครุภัณฑ์ในแผนกที่ระบุ', 403);
      case 'BUSY': return fail('ระบบกำลังบันทึกรายการอื่น กรุณาลองใหม่', 409);
      case 'DUPLICATE': return fail('หมายเลขครุภัณฑ์นี้มีอยู่แล้ว', 409);
      case 'REFERENCE': return fail('ข้อมูลหมวดหมู่ อาคาร หรือห้องเปลี่ยนไป กรุณาโหลดฟอร์มใหม่', 409);
      case 'WRITES_DISABLED': return fail('ระบบยังไม่ได้เปิดการบันทึกครุภัณฑ์', 503);
      case 'RESULT_UNKNOWN': return fail('ยืนยันผลการบันทึกไม่ได้ กรุณาตรวจสอบหมายเลขครุภัณฑ์ก่อนส่งอีกครั้ง', 503);
      default: return fail('บันทึกข้อมูลครุภัณฑ์ไม่สำเร็จ', 500);
    }
  }
  return Response.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
