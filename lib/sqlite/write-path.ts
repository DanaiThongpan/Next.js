import 'server-only';
import { lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const isolatedRuntime = () => resolve('.daam-runtime');

async function isPrivateFile(path: string, optional = false) {
  try {
    const info = await lstat(path);
    return info.isFile() && info.nlink === 1;
  } catch (error) {
    return optional && (error as NodeJS.ErrnoException).code === 'ENOENT';
  }
}

/** Only a separately provisioned SQLite file under the Next.js runtime may be written. */
export async function isolatedSqliteWritePath() {
  if (process.env.DAAM_DB_ACCESS !== 'enabled' || process.env.DAAM_SQLITE_WRITES !== 'enabled' ||
      process.env.NEXT_PHASE === 'phase-production-build') return null;

  const source = process.env.DAAM_SQLITE_PATH;
  const dataRoot = join(isolatedRuntime(), 'data');
  if (!source || !isAbsolute(source) || dirname(resolve(source)) !== dataRoot) return null;
  const file = resolve(source);
  try {
    if (await realpath(dataRoot) !== dataRoot || await realpath(file) !== file || !await isPrivateFile(file)) return null;
    const neighbors = [
      ...['-wal', '-shm', '-journal'].map(suffix => file + suffix),
      ...['clb-visibility.json', 'disabled-categories.json'].flatMap(name => [join(dataRoot, name), join(dataRoot, name + '.lock')]),
    ];
    if (!(await Promise.all(neighbors.map(path => isPrivateFile(path, true)))).every(Boolean)) return null;
    return file;
  } catch {
    return null;
  }
}

export async function isolatedPhotoWriteRoot(source: string) {
  const root = join(isolatedRuntime(), 'upload_imgDA');
  if (dirname(source) !== join(isolatedRuntime(), 'data') || await realpath(root) !== root) {
    throw new Error('WRITES_DISABLED');
  }
  return root;
}
