import { NextResponse } from 'next/server';
import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { historyReminder } from '@/lib/sqlite/history-reminder';

export async function POST(request: Request) {
  const reply = (body: object, status = 200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if (!trustedOrigin(request.headers,process.env.NODE_ENV,process.env.APP_ORIGIN)) return reply({message:'ไม่ได้รับอนุญาต'},403);
  const user = await currentIdentity();
  if (!user) return reply({message:'กรุณาเข้าสู่ระบบใหม่'},401);
  if (!isAdmin(user)) return reply({message:'ไม่ได้รับอนุญาต'},403);
  let body;
  try { body=await request.json(); } catch { return reply({message:'ข้อมูลไม่ถูกต้อง'},400); }
  if (typeof body?.id!=='string'||!body.id||body.id.length>128||!['preview','send'].includes(body.action)) return reply({message:'ข้อมูลไม่ถูกต้อง'},400);
  try { return reply(await historyReminder(user,body.id,body.action,body.previewToken,body.confirmUncertain===true)); }
  catch { return reply({message:'ไม่สามารถดำเนินการได้ กรุณาตรวจประวัติก่อนลองอีกครั้ง'},503); }
}
