import { requireIdentity } from '@/lib/auth/session';
import { readCatalog } from '@/lib/sqlite/catalog';
import { readFile, realpath } from 'node:fs/promises';
import { basename, dirname, resolve, sep, extname } from 'node:path';
export async function GET(request:Request) {
 const user=await requireIdentity('admin');
 const id=new URL(request.url).searchParams.get('id')??'';
 try {
  const data=await readCatalog(user,'assets',{id,visibility:'all'});
  const row=data.rows.find(r=>String(r.id)===id);
  if(!row?.image) return new Response(null,{status:404});
  const source=process.env.DAAM_SQLITE_PATH;
  if(!source) return new Response(null,{status:404});
  const root=await realpath(resolve(dirname(source),'../upload_imgDA'));
  const file=await realpath(resolve(root,basename(String(row.image).replaceAll('\\','/'))));
  if(!file.startsWith(root+sep)) return new Response(null,{status:404});
  const mime:Record<string,string>={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif'};
  const type=mime[extname(file).toLowerCase()];if(!type)return new Response(null,{status:404});
  return new Response(await readFile(file),{headers:{'Content-Type':type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 } catch{return new Response(null,{status:404});}
}
