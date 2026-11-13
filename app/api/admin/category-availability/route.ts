import { canManageCategoryAvailability } from '@/lib/auth/policy';
import { currentIdentity } from '@/lib/auth/session';
import { trustedOrigin } from '@/lib/auth/origin';
import { setCategoryAvailability } from '@/lib/sqlite/category-availability';
export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return Response.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
  const user = await currentIdentity();
  if (!user) return Response.json({ ok: false, code: 'SESSION_EXPIRED' }, { status: 401 });
  if (!canManageCategoryAvailability(user)) return Response.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (!body || typeof body.id !== 'string' || !body.id || body.id.length > 128 || typeof body.enabled !== 'boolean') return new Response(null, { status: 400 });
  try {
    await setCategoryAvailability(user, body.id, body.enabled);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const code = ['FORBIDDEN', 'WRITES_DISABLED', 'SOURCE_UNAVAILABLE'].includes(message) ? message : 'SAVE_FAILED';
    return Response.json({ ok: false, code }, { status: code === 'FORBIDDEN' ? 403 : 409 });
  }
}
