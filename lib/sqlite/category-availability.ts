import 'server-only';
import { isolatedSqliteWritePath } from './write-path';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { canManageCategoryAvailability, type Identity } from '../auth/policy';
const run = promisify(execFile);
export async function disabledCategories(): Promise<string[]> {
  const source = process.env.DAAM_SQLITE_PATH;
  if (!source) throw new Error('SOURCE_UNAVAILABLE');
  try {
    const value: unknown = JSON.parse(await readFile(join(dirname(source), 'disabled-categories.json'), 'utf8'));
    if (!Array.isArray(value) || value.some(id => typeof id !== 'string')) throw new Error('INVALID_POLICY');
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
export async function setCategoryAvailability(user: Identity, id: string, enabled: boolean) {
  if (!canManageCategoryAvailability(user)) throw new Error('FORBIDDEN');
  const source = await isolatedSqliteWritePath();
  if (!source) throw new Error('WRITES_DISABLED');
  await run('python3', ['-c', `
import sys,json,pathlib,fcntl,sqlite3,os,tempfile
source=pathlib.Path(sys.argv[1]);category=sys.argv[2];enabled=sys.argv[3]=='1'
if not source.is_file(): raise RuntimeError('SOURCE_UNAVAILABLE')
path=source.parent/'disabled-categories.json'
with open(str(path)+'.lock','a') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 c=sqlite3.connect(source.as_uri()+'?mode=rw',uri=True,timeout=5)
 try:
  c.execute('BEGIN IMMEDIATE')
  if not c.execute('SELECT 1 FROM classification WHERE classificationID=?',(category,)).fetchone(): raise RuntimeError('NOT_FOUND')
  ids=json.loads(path.read_text()) if path.exists() else []
  if not isinstance(ids,list) or any(not isinstance(x,str) for x in ids): raise RuntimeError('INVALID_POLICY')
  ids=set(ids)
  if enabled: ids.discard(category)
  else: ids.add(category)
  fd,tmp=tempfile.mkstemp(dir=path.parent,prefix='.categories-')
  with os.fdopen(fd,'w') as f:
   json.dump(sorted(ids),f);f.flush();os.fsync(f.fileno())
  os.replace(tmp,path)
 finally:
  c.rollback();c.close()
`, source, id, enabled ? '1' : '0'], { timeout: 15000 });
}
