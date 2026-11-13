import { NextResponse } from 'next/server';
import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { borrowerAccountJoin, borrowerName } from '@/lib/borrower-profile';
import { readSqliteQueries } from '@/lib/sqlite/read';

export async function GET(request:Request) {
 const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
 const user=await currentIdentity();
 if(!user)return reply({message:'กรุณาเข้าสู่ระบบใหม่'},401);
 if(!isAdmin(user))return reply({message:'ไม่มีสิทธิ์เข้าถึง'},403);
 const id=new URL(request.url).searchParams.get('id');
 if(!id?.trim()||id.length>128)return reply({message:'รหัสครุภัณฑ์ไม่ถูกต้อง'},400);
 const scope=user.id==='admin'?'':user.department.trim()?' AND (a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))':' AND 1=0';
 const values=user.id==='admin'||!user.department.trim()?[id]:[id,user.department,user.id];
 const eligible=`a.DA_ID=? AND (a.is_approved=1 OR a.is_approved IS NULL)${scope}`;
 try {
  const [asset,active,history]=await readSqliteQueries([
   {sql:`SELECT a.DA_DetailLocation AS location FROM durable_articles a WHERE ${eligible}`,values},
   {sql:`SELECT ${borrowerName} AS borrower,b.Date_borrow AS borrowed,b.Deadline_borrow AS due FROM borrow_back b JOIN durable_articles a ON b.DA_ID=a.DA_ID ${borrowerAccountJoin} WHERE ${eligible} AND (b.status IN ('borrowed','ยังไม่ส่งคืน','pending_return') OR (b.Date_back IS NULL AND b.status!='returned')) ORDER BY b.Date_borrow DESC,b.IDborrow_back DESC LIMIT 1`,values},
   {sql:`SELECT ${borrowerName} AS borrower,b.Date_borrow AS borrowed,b.Deadline_borrow AS due,b.Date_back AS returned FROM borrow_back b JOIN durable_articles a ON b.DA_ID=a.DA_ID ${borrowerAccountJoin} WHERE ${eligible} ORDER BY b.Date_borrow DESC,b.IDborrow_back DESC LIMIT 5`,values}
  ]);
  if(!asset.length)return reply({message:'ไม่พบครุภัณฑ์ในขอบเขตสิทธิ์'},404);
  return reply({location:asset[0].location,active:active[0]??null,history});
 }catch{return reply({message:'อ่านรายละเอียดครุภัณฑ์ไม่สำเร็จ'},503);}
}
