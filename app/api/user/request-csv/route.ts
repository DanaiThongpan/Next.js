import { createHash, randomUUID } from 'node:crypto';
import { currentIdentity } from '@/lib/auth/session';
import { permitted } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { csvColumns } from '@/lib/csv-import-format';
import { readUpload } from '@/lib/csv-upload';
import { submitCsvRequest } from '@/lib/sqlite/actions';
import { parseCsv, validateCsv } from '@/lib/sqlite/csv-import';

const headers = { 'Cache-Control': 'no-store' };
const reply = (data: object, status = 200) => Response.json(data, { headers, status });
const fail = (message: string, status: number) => reply({ message }, status);

export async function GET() {
  const user = await currentIdentity();
  if (!user) return fail('กรุณาเข้าสู่ระบบใหม่', 401);
  if (!permitted(user, 'standard-user')) return fail('บัญชีนี้ไม่มีสิทธิ์ดาวน์โหลดไฟล์', 403);
  const sample = ['0000000000001', 'โต๊ะสำนักงาน, รุ่นตัวอย่าง', '', '', '', '', '1200.00', '', ''];
  return new Response('\uFEFF' + [csvColumns, sample].map(row => row.map(value =>
    '"' + value.replaceAll('"', '""') + '"').join(',')).join('\r\n') + '\r\n', {
    headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template_request_items.csv"' },
  });
}

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return fail('คำขอไม่ถูกต้อง', 403);
  const user = await currentIdentity();
  if (!user) return fail('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
  if (!permitted(user, 'standard-user') || !user.department.trim() || user.department.trim().length > 100) {
    return fail('บัญชีนี้ไม่มีสิทธิ์ส่งคำขอ หรือยังไม่ได้กำหนดสังกัดที่ถูกต้อง', 403);
  }
  const params = new URL(request.url).searchParams;
  const action = params.get('action'), fileName = params.get('filename') ?? '';
  if (action !== 'preview' && action !== 'commit') return fail('คำสั่งไม่ถูกต้อง', 400);
  if (fileName.length > 255 || !/\.csv$/i.test(fileName) || /[\p{Cc}\/\\]/u.test(fileName)) return fail('กรุณาเลือกไฟล์ .csv ที่มีชื่อถูกต้อง', 400);
  if (request.headers.get('content-type') !== 'text/csv') return fail('ชนิดไฟล์ไม่ถูกต้อง', 415);
  let bytes;
  try { bytes = await readUpload(request); }
  catch { return fail('อ่านไฟล์ที่อัปโหลดไม่สำเร็จ', 400); }
  if (!bytes) return fail('ไฟล์ต้องมีขนาดไม่เกิน 5 MB', 413);
  if (!bytes.length) return fail('ไฟล์ CSV ว่าง', 400);
  let parsed;
  try {
    parsed = parseCsv(bytes);
    if (parsed.headers.some((_, i) => !parsed.columns.includes(i))) return fail('พบหัวคอลัมน์ที่ไม่รองรับ กรุณาใช้ไฟล์ต้นแบบและลบคอลัมน์ส่วนเกิน', 400);
  } catch (error) { return fail(error instanceof Error ? error.message : 'รูปแบบ CSV ไม่ถูกต้อง', 400); }
  let preview;
  try { preview = await validateCsv(user, parsed, false, 'user-request'); }
  catch { return fail('ตรวจข้อมูลกับฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่', 503); }
  const token = createHash('sha256').update(JSON.stringify([user.id, user.department, fileName, preview.token])).update(bytes).digest('hex');
  const { rows, issues, total, valid, invalid, duplicates } = preview;
  if (action === 'preview') return reply({
    token, total, valid, invalid, duplicates, rows: rows.slice(0, 100), issues,
    skippedRows: rows.flatMap(({ row, values, duplicate }) => duplicate ? [{ row, number: values[0].slice(0, 150), duplicate }] : []),
  });
  if (request.headers.get('x-csv-preview') !== token) return fail('ไฟล์หรือข้อมูลในระบบเปลี่ยนไป กรุณาตรวจอีกครั้ง', 409);
  if (invalid || !valid) return fail(invalid ? 'กรุณาแก้แถวที่มีข้อผิดพลาดก่อนส่ง' : 'ไม่มีรายการใหม่ให้ส่ง ระบบจะไม่บันทึกรายการซ้ำ', 400);
  const batchId = randomUUID();
  const result = await submitCsvRequest(user, rows, batchId, fileName);
  if (!result.ok) {
    const [code, row] = result.code.split(':');
    const messages: Record<string, string> = {
      WRITES_DISABLED: 'ยังไม่เปิดบันทึกในฐานข้อมูลแยกของ Next.js',
      REQUEST_SCHEMA_REQUIRED: 'ยังไม่ได้เตรียมตารางประวัติคำขอ CSV ในฐานข้อมูลแยก',
      FORBIDDEN: 'บัญชีหรือสังกัดไม่มีสิทธิ์ส่งคำขอ',
      REFERENCE: 'ข้อมูลอ้างอิงเปลี่ยนไป กรุณาตรวจไฟล์อีกครั้ง',
      STALE: 'พบหมายเลขที่ถูกส่งหรือบันทึกระหว่างดำเนินการ กรุณาตรวจไฟล์อีกครั้ง',
      BUSY: 'ระบบกำลังบันทึกคำขออื่น กรุณาตรวจไฟล์อีกครั้งก่อนส่ง',
      RESULT_UNKNOWN: 'ยืนยันผลไม่ได้ กรุณาตรวจประวัติคำขอก่อนส่งอีกครั้ง',
    };
    return fail((row ? 'แถว ' + row + ': ' : '') + (messages[code] ?? 'บันทึกคำขอไม่สำเร็จ'), code === 'FORBIDDEN' ? 403 :
      ['REFERENCE', 'STALE', 'BUSY'].includes(code) ? 409 : 503);
  }
  return reply({ batchId, inserted: result.inserted, skipped: duplicates }, 201);
}
