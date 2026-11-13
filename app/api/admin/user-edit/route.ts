import bcrypt from 'bcryptjs';
import { sessions } from '@/lib/auth/runtime';
import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { saveUserEdit } from '@/lib/sqlite/actions';

export async function POST(request: Request) {
 if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return Response.json({ok:false},{status:403});
 const user=await currentIdentity();
 if(!user||!isAdmin(user))return Response.json({ok:false},{status:user?403:401});
 if(Number(request.headers.get('content-length')||0)>16384)return Response.json({ok:false},{status:413});
 let body: Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>16384)throw new Error();body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw new Error();}catch{return Response.json({ok:false},{status:400});}
 const fields:Record<string,string>={};
 for(const key of ['id','name','rank','department','email','role','active','password']){
  const value=body[key];if(typeof value!=='string'||value.length>500||value.includes('\0'))return Response.json({ok:false},{status:400});
  fields[key]=key==='password'?value:value.trim();
 }
 if(!fields.id||!fields.name||!['UT00000001','UT00000002'].includes(fields.role)||!['0','1'].includes(fields.active)||(fields.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))||(fields.password&&(fields.password.length<8||Buffer.byteLength(fields.password)>72)))return Response.json({ok:false,code:'VALIDATION'},{status:400});
 try{
  const hash=fields.password?await bcrypt.hash(fields.password,12):null;
  delete fields.password;
  const result=await saveUserEdit(user,fields.id,fields,hash);
  if(result.ok&&hash)await sessions.revokeAccount(fields.id);
  return Response.json({...result,reauthenticate:result.ok&&Boolean(hash)&&fields.id===user.id},{status:result.ok?200:result.code==='FORBIDDEN'?403:409});
 }catch{return Response.json({ok:false},{status:503});}
}
