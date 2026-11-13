import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { csvTemplate } from '@/lib/csv-import-format';
import { readUpload } from '@/lib/csv-upload';
import { importAssets } from '@/lib/sqlite/actions';
import { parseCsv, validateCsv } from '@/lib/sqlite/csv-import';

const privateHeaders = { 'Cache-Control': 'no-store' };
const fail = (message: string, status: number) => Response.json({ message }, { status, headers: privateHeaders });

export async function GET() {
  const user = await currentIdentity();
  if (!user || !isAdmin(user)) return fail('กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน', user ? 403 : 401);
  return new Response(csvTemplate(), { headers: {
    ...privateHeaders,
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="template_durable_articles.csv"',
  } });
}

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return fail('คำขอไม่ถูกต้อง', 403);
  const user = await currentIdentity();
  if (!user || !isAdmin(user)) return fail('กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน', user ? 403 : 401);

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  if (action !== 'preview' && action !== 'commit') return fail('ไม่รู้จักคำสั่งนำเข้า', 400);
  if (!/\.csv$/i.test(searchParams.get('filename') ?? '')) return fail('กรุณาเลือกไฟล์ .csv', 400);
  let bytes;
  try { bytes = await readUpload(request); }
  catch { return fail('อ่านไฟล์ที่อัปโหลดไม่สำเร็จ', 400); }
  if (!bytes) return fail('ไฟล์ต้องมีขนาดไม่เกิน 5 MB', 413);
  if (!bytes.length) return fail('ไฟล์ CSV ว่าง', 400);

  let parsed;
  try { parsed = parseCsv(bytes); }
  catch (error) { return fail(error instanceof Error ? error.message : 'รูปแบบ CSV ไม่ถูกต้อง', 400); }
  let preview;
  try { preview = await validateCsv(user, parsed); }
  catch { return fail('ตรวจข้อมูลกับฐานข้อมูลไม่สำเร็จ', 503); }
  if (action === 'preview') {
    const { rows, ...summary } = preview;
    return Response.json({
      ...summary,
      headers: parsed.headers,
      ignoredHeaders: parsed.headers.filter((_, index) => !parsed.columns.includes(index)),
      rows: rows.slice(0, 100),
      skippedRows: rows.flatMap(({ row, values, duplicate }) => duplicate ? [{ row, number: values[0], duplicate }] : []),
    }, { headers: privateHeaders });
  }
  if (preview.invalid) return Response.json({
    message: 'ไฟล์ยังมีข้อผิดพลาด จึงยังไม่ได้นำเข้า',
    issues: preview.issues, invalid: preview.invalid, valid: preview.valid,
    duplicates: preview.duplicates, inserted: preview.inserted,
  }, { status: 400, headers: privateHeaders });
  if (request.headers.get('x-csv-preview') !== preview.token) return fail('ข้อมูลเปลี่ยนไป กรุณาตรวจไฟล์อีกครั้งก่อนยืนยัน', 409);

  if (!preview.inserted) return fail('ไม่มีรายการใหม่ให้บันทึก ระบบจะข้ามรายการซ้ำทั้งหมด', 400);

  const result = await importAssets(user, preview.rows);
  if (!result.ok) {
    const [code, row, field] = result.code.split(':');
    const messages: Record<string, string> = {
      WRITES_DISABLED: 'ระบบยังไม่ได้เปิดการเขียนฐานข้อมูล',
      FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์นำเข้ารายการในสังกัดที่ระบุ',
      STALE: 'ข้อมูลเปลี่ยนไประหว่างนำเข้า กรุณาตรวจไฟล์อีกครั้ง',
      REFERENCE: 'ข้อมูลอ้างอิงเปลี่ยนไป กรุณาตรวจไฟล์อีกครั้ง',
      DUPLICATE: 'พบหมายเลขครุภัณฑ์ซ้ำ',
      RESULT_UNKNOWN: 'ยืนยันผลการนำเข้าไม่ได้ กรุณาตรวจรายการในคลังก่อนลองใหม่',
    };
    const message = messages[code] ?? 'บันทึกข้อมูลไม่สำเร็จ ระบบยกเลิกการนำเข้าชุดนี้';
    return fail(row ? `แถว ${row} (${field}) — ${message}` : message, code === 'FORBIDDEN' ? 403 : 409);
  }
  return Response.json({
    inserted: result.inserted, skipped: preview.duplicates,
    message: 'บันทึกข้อมูลนำเข้าเรียบร้อยแล้ว',
  }, { headers: privateHeaders });
}
