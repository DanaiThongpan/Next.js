import { currentIdentity } from '@/lib/auth/session';
import { trustedOrigin } from '@/lib/auth/origin';
import { canUseUserPanel } from '@/lib/auth/policy';
import { bangkokDay } from '@/lib/dashboard/model';
import { validateBorrowDates } from '@/lib/borrow-rules';
import { saveLoan, type LoanOperation } from '@/lib/sqlite/actions';
import { searchBorrowAssets } from '@/lib/sqlite/borrow';

const reply = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const error = (message: string, status: number) => reply({ ok: false, message }, status);

export async function GET(request: Request) {
  const user = await currentIdentity();
  if (!user) return error('กรุณาเข้าสู่ระบบ', 401);
  if (!canUseUserPanel(user)) return error('ไม่มีสิทธิ์ค้นหาครุภัณฑ์', 403);
  const keyword = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (keyword.length < 2 || keyword.length > 150) return reply({ ok: true, rows: [] });
  try { return reply({ ok: true, rows: await searchBorrowAssets(keyword) }); }
  catch { return error('ค้นหาครุภัณฑ์ไม่สำเร็จ', 503); }
}

async function parseBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let raw = '', size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return null; }
      raw += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(raw + decoder.decode());
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null;
  } catch { return null; }
  finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return error('คำขอไม่ถูกต้อง', 403);
  const user = await currentIdentity();
  if (!user) return error('กรุณาเข้าสู่ระบบใหม่', 401);
  if (!canUseUserPanel(user)) return error('ไม่มีสิทธิ์ทำรายการ', 403);
  const body = await parseBody(request);
  if (!body) return error('ข้อมูลที่ส่งไม่ถูกต้อง', 400);
  const action = body.action;
  const keys = action === 'borrow' ? ['action','asset','start','end','department','rank','email','purpose'] :
    ['action','asset','loan','detail'];
  if (Object.keys(body).some(key => !keys.includes(key)) || keys.some(key => typeof body[key] !== 'string')) {
    return error('พบข้อมูลที่ไม่รองรับหรือข้อมูลไม่ครบ', 400);
  }
  const get = (key: string) => (body[key] as string).trim();
  const asset = get('asset');
  if (!asset || asset.length > 150 || asset.includes('\0')) return error('รหัสครุภัณฑ์ไม่ถูกต้อง', 400);
  const now = new Date();
  let operation: LoanOperation;
  if (action === 'borrow') {
    const fields = { start: get('start'), end: get('end'), department: get('department'),
      rank: get('rank'), email: get('email'), purpose: get('purpose') || 'ใช้งานทั่วไป' };
    const invalid = validateBorrowDates(fields.start, fields.end, bangkokDay(now));
    if (invalid) return error(invalid, 400);
    if (Object.values(fields).some(value => value.includes('\0')) || fields.rank.length > 255 ||
      fields.department.length > 255 || fields.purpose.length > 1000 || fields.email.length > 150 ||
      (fields.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email))) return error('ตรวจสอบอีเมลหรือความยาวของข้อมูล', 400);
    operation = { action, asset, fields };
  } else if (action === 'request-return' || action === 'approve-user-return' || action === 'owner-direct-return') {
    const loan = get('loan'), detail = get('detail') || 'ส่งคืนตามกำหนด';
    if (!loan || loan.length > 50 || detail.length > 1000 || loan.includes('\0') || detail.includes('\0')) return error('ข้อมูลการคืนไม่ถูกต้อง', 400);
    operation = { action, asset, loan, detail };
  } else return error('ไม่รองรับการทำรายการนี้', 400);
  const result = await saveLoan(user, operation, now);
  if (!result.ok) {
    switch (result.code) {
      case 'LOAN_SCHEMA_REQUIRED': return error('ผู้ดูแลต้องเตรียมตารางประวัติการยืม–คืนในฐานข้อมูลแยกก่อน', 503);
      case 'WRITES_DISABLED': return error('ยังไม่เปิดการบันทึกในฐานข้อมูลแยกของ Next.js', 503);
      case 'FORBIDDEN': return error('บัญชีนี้ไม่มีสิทธิ์ดำเนินการกับรายการนี้', 403);
      case 'NOT_FOUND': return error('ไม่พบครุภัณฑ์หรือรายการยืม', 404);
      case 'ALREADY_BORROWED': return error('ครุภัณฑ์นี้ถูกยืมหรือรอรับคืนอยู่', 409);
      case 'NOT_AVAILABLE': return error('ครุภัณฑ์นี้ไม่พร้อมให้ยืม', 409);
      case 'BUSY': return error('ระบบกำลังบันทึกรายการอื่น กรุณาลองใหม่', 409);
      case 'STALE': return error('สถานะรายการเปลี่ยนแล้ว กรุณาโหลดหน้าใหม่', 409);
      default: return error('ยืนยันผลการบันทึกไม่ได้ กรุณาตรวจรายการก่อนลองอีกครั้ง', 503);
    }
  }
  return reply(result, action === 'borrow' ? 201 : 200);
}
