import 'server-only';
import { isolatedSqliteWritePath } from './write-path';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { canManageCategoryAvailability, type Identity } from '../auth/policy';

export async function readClbVisibility() {
  const source = process.env.DAAM_SQLITE_PATH;
  if (!source) throw new Error('SOURCE_UNAVAILABLE');
  try {
    const value: unknown = JSON.parse(await readFile(join(dirname(source), 'clb-visibility.json'), 'utf8'));
    if (typeof value !== 'boolean') throw new Error('INVALID_POLICY');
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function saveClbVisibility(user: Identity, enabled: boolean) {
  if (!canManageCategoryAvailability(user)) throw new Error('FORBIDDEN');
  const source = await isolatedSqliteWritePath();
  if (!source) throw new Error('WRITES_DISABLED');
  await promisify(execFile)('python3', ['-c', `
import pathlib,sys,json,tempfile,os,fcntl
source=pathlib.Path(sys.argv[1])
if not source.is_file(): raise RuntimeError('SOURCE_UNAVAILABLE')
path=source.parent/'clb-visibility.json'
with open(str(path)+'.lock','a') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 fd,tmp=tempfile.mkstemp(dir=path.parent,prefix='.clb-')
 try:
  with os.fdopen(fd,'w') as f:
   json.dump(sys.argv[2]=='1',f);f.flush();os.fsync(f.fileno())
  os.replace(tmp,path)
 finally:
  if os.path.exists(tmp): os.unlink(tmp)
`, source, enabled ? '1' : '0'], { timeout: 10000 });
}
