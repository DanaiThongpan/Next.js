import { currentIdentity } from '@/lib/auth/session';
import { trustedOrigin } from '@/lib/auth/origin';
import { canManageCategoryAvailability } from '@/lib/auth/policy';
import { saveClbVisibility } from '@/lib/sqlite/clb-visibility';
export async function POST(request: Request) {
  if (!trustedOrigin(request.headers, process.env.NODE_ENV, process.env.APP_ORIGIN)) return new Response(null, { status: 403 });
  const user = await currentIdentity();
  if (!user) return new Response(null, { status: 401 });
  if (!canManageCategoryAvailability(user)) return new Response(null, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (typeof body?.enabled !== 'boolean') return new Response(null, { status: 400 });
  try {
    await saveClbVisibility(user, body.enabled);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ ok: false }, { status: 409 }); }
}
