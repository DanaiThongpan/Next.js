import { readFile, realpath, stat } from 'node:fs/promises';
import { basename, extname, resolve, sep } from 'node:path';
import { canUseUserPanel } from '@/lib/auth/policy';
import { currentIdentity } from '@/lib/auth/session';
import { readSqliteQueries } from '@/lib/sqlite/read';
import { visibleApprovedAsset } from '@/lib/sqlite/borrow';
import { isolatedPhotoWriteRoot } from '@/lib/sqlite/write-path';

const mime: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
};
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const unavailable = (status: number) => new Response(null, { status, headers });

export async function GET(request: Request) {
  const user = await currentIdentity();
  if (!user) return unavailable(401);
  if (!canUseUserPanel(user)) return unavailable(403);
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id || id.length > 150 || id.includes('\0')) return unavailable(404);
  const source = process.env.DAAM_SQLITE_PATH;
  if (!source) return unavailable(404);
  try {
    const root = await isolatedPhotoWriteRoot(source);
    const [rows] = await readSqliteQueries([{
      sql: `SELECT a.DA_URLImg AS image FROM durable_articles a WHERE a.DA_ID=? AND ${visibleApprovedAsset}`,
      values: [id],
    }]);
    const image = rows[0]?.image;
    if (typeof image !== 'string' || !image.trim()) return unavailable(404);
    const name = basename(image.replaceAll('\\', '/'));
    const file = await realpath(resolve(root, name));
    const type = mime[extname(file).toLowerCase()];
    if (!file.startsWith(root + sep) || !type) return unavailable(404);
    const info = await stat(file);
    if (!info.isFile() || info.nlink !== 1 || info.size > 10 * 1024 * 1024) return unavailable(404);
    return new Response(new Uint8Array(await readFile(file)), { headers: { ...headers, 'Content-Type': type } });
  } catch {
    return unavailable(404);
  }
}
