import { NextResponse,type NextRequest } from 'next/server';
import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { performAdminOperation,type AdminOperation } from '@/lib/sqlite/actions';
export async function POST(request:NextRequest){
 if(!trustedOrigin(request.headers,process.env.NODE_ENV,process.env.APP_ORIGIN))return NextResponse.json({ok:false,code:'FORBIDDEN'},{status:403});
 const user=await currentIdentity();if(!user)return NextResponse.json({ok:false,code:'SESSION_EXPIRED'},{status:401});if(!isAdmin(user))return NextResponse.json({ok:false,code:'FORBIDDEN'},{status:403});
 let body;try{body=await request.json();}catch{return NextResponse.json({ok:false,code:'INVALID_INPUT'},{status:400});}
 if(!body||!['approve','reject','return','delete-borrow','show-asset','hide-asset','asset-ready','asset-damaged','delete-repair'].includes(body.action)||typeof body.id!=='string'||!body.id.trim()||body.id.length>128||/[\x00-\x1f]/.test(body.id))return NextResponse.json({ok:false,code:'INVALID_INPUT'},{status:400});
 const note=body.repairNote??'';
 const price=body.repairPrice??0;
 if(typeof note!=='string'||note.length>2000||typeof price!=='number'||!Number.isFinite(price)||price<0||price>999999999||Math.abs(price*100-Math.round(price*100))>0.0001||((note.trim()||price)&&body.action!=='asset-damaged')||(price>0&&!note.trim())) return NextResponse.json({ok:false,code:'INVALID_INPUT'},{status:400});
 const reason=body.rejectReason??'';
 if(typeof reason!=='string'||reason.length>1000||reason.includes('\0')||(body.action==='reject'?!reason.trim():Boolean(reason))) {
  return NextResponse.json({ok:false,code:'INVALID_INPUT'},{status:400});
 }
 const result=await performAdminOperation(user,body.action as AdminOperation,body.id,note.trim(),price,reason.trim());return NextResponse.json(result,{status:result.ok?200:result.code==='FORBIDDEN'?403:result.code==='NOT_FOUND'?404:result.code==='DATABASE_ERROR'?503:409,headers:{'Cache-Control':'no-store'}});
}
