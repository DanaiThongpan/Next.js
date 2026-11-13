import { currentIdentity } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/policy';
import { trustedOrigin } from '@/lib/auth/origin';
import { saveRepair } from '@/lib/sqlite/actions';

export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return new Response(null, { status: 403 });
  const user = await currentIdentity();
  if (!user) return new Response(null, { status: 401 });
  if (!isAdmin(user)) return new Response(null, { status: 403 });
  let form;
  try { form = await request.formData(); } catch { return new Response(null, { status: 400 }); }
  const id = form.get('id');
  const asset = form.get('asset');
  const description = form.get('description');
  const price = form.get('cost');
  const date = form.get('date');
  if (typeof id !== 'string' || id.length > 128 || typeof asset !== 'string' || !asset.trim() || asset.length > 128
    || typeof description !== 'string' || !description.trim() || description.length > 2000
    || typeof price !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(price)
    || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) {
    return Response.json({ ok: false, code: 'INVALID_INPUT' }, { status: 400 });
  }
  const result = await saveRepair(user, [id, asset.trim(), description.trim(), Number(price), date]);
  return Response.json(result, { status: result.ok ? 200 : result.code === 'FORBIDDEN' ? 403 : 409 });
}
