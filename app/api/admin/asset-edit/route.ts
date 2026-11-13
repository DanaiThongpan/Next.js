import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { unlink, writeFile } from 'node:fs/promises';
import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { assetFields } from '@/lib/sqlite/asset-edit-fields';
import { isolatedPhotoWriteRoot, isolatedSqliteWritePath } from '@/lib/sqlite/write-path';
import { readSqliteQueries } from '@/lib/sqlite/read';
import { saveAssetEdit } from '@/lib/sqlite/actions';

function imageExtension(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) return 'gif';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
}

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return new Response(null, { status: 403 });
  const user = await currentIdentity();
  if (!user) return new Response(null, { status: 401 });
  if (!isAdmin(user)) return new Response(null, { status: 403 });
  const source = await isolatedSqliteWritePath();
  if (!source) return new Response(null, { status: 409 });
  const limit = 5 * 1024 * 1024;
  const length = Number(request.headers.get('content-length'));
  if (!length || length > limit + 65536) return new Response(null, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return new Response(null, { status: 400 }); }
  const id = form.get('id');
  if (typeof id !== 'string' || !id || id.length > 128) return new Response(null, { status: 400 });
  const fields: Record<string, string> = {};
  for (const key of Object.keys(assetFields)) {
    const value = form.get(key);
    if (typeof value !== 'string' || value.length > 2000 || value.includes('\0')) return new Response(null, { status: 400 });
    fields[key] = value.trim();
  }
  if (!fields.DA_Number || !fields.DA_ListName || !/^\d{1,9}(\.\d{1,2})?$/.test(fields.DA_Price || '0')) return new Response(null, { status: 400 });
  fields.DA_Price ||= '0';
  if (user.id !== 'admin' && !user.department.trim()) return new Response(null, { status: 403 });
  try {
    const scope = user.id === 'admin' ? '' : ' AND (owner_department=? OR (owner_department IS NULL AND created_by=?))';
    const values = user.id === 'admin' ? [id] : [id, user.department, user.id];
    const [rows] = await readSqliteQueries([{ sql: `SELECT DA_ID FROM durable_articles WHERE DA_ID=? AND (is_approved=1 OR is_approved IS NULL)${scope}`, values }]);
    if (!rows.length) return new Response(null, { status: 404 });
  } catch { return new Response(null, { status: 503 }); }
  const upload = form.get('image');
  let image: string | null = null;
  let target: string | undefined;
  if (upload instanceof File && upload.size) {
    if (upload.size > limit) return new Response(null, { status: 413 });
    const bytes = Buffer.from(await upload.arrayBuffer());
    const extension = imageExtension(bytes);
    if (!extension) return new Response(null, { status: 415 });
    image = `DA_${randomUUID()}.${extension}`;
    try {
      const root = await isolatedPhotoWriteRoot(source);
      target = resolve(root, image);
      await writeFile(target, bytes, { flag: 'wx', mode: 0o644 });
    } catch { return new Response(null, { status: 503 }); }
  }
  const result = await saveAssetEdit(user, id, fields, image);
  if (!result.ok && target && result.code !== 'DATABASE_ERROR') await unlink(target).catch(() => {});
  return Response.json(result, { status: result.ok ? 200 : result.code === 'FORBIDDEN' ? 403 : 409 });
}
