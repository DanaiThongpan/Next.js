import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export const SESSION_SECONDS = 8 * 60 * 60;
const tokenPattern = /^[a-f0-9]{64}$/;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
function missing(error: unknown) { return (error as NodeJS.ErrnoException).code === 'ENOENT'; }

// Files are outside public and Git. Only a token digest, account ID and expiry persist.
export function sessionStore(directory: string, now = Date.now) {
  const filename = (token: string) => path.join(directory, digest(token) + '.json');
  return {
    async create(accountId: string) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const token = randomBytes(32).toString('hex');
      const expiresAt = now() + SESSION_SECONDS * 1000;
      await writeFile(filename(token), JSON.stringify({ accountId, expiresAt }), { flag: 'wx', mode: 0o600 });
      return { token, expiresAt };
    },
    async read(token: string | undefined): Promise<{ accountId: string; expiresAt: number } | null> {
      if (!token || !tokenPattern.test(token)) return null;
      let raw: string;
      try { raw = await readFile(filename(token), 'utf8'); }
      catch (error) { if (missing(error)) return null; throw error; }
      let record;
      try { record = JSON.parse(raw); } catch { return null; }
      if (typeof record.accountId !== 'string' || !Number.isFinite(record.expiresAt)) return null;
      if (record.expiresAt <= now()) { await this.revoke(token); return null; }
      return { accountId: record.accountId, expiresAt: record.expiresAt };
    },
    async revokeAccount(accountId: string) {
      let entries: string[];
      try { entries = await readdir(directory); } catch (error) { if (missing(error)) return; throw error; }
      for (const entry of entries) {
        if (!/^[a-f0-9]{64}\.json$/.test(entry)) continue;
        const file = path.join(directory, entry);
        let record;
        try { record = JSON.parse(await readFile(file, 'utf8')); } catch { continue; }
        if (record.accountId === accountId) await unlink(file).catch(error => { if (!missing(error)) throw error; });
      }
    },
    async revoke(token: string | undefined) {
      if (!token || !tokenPattern.test(token)) return;
      try { await unlink(filename(token)); } catch (error) { if (!missing(error)) throw error; }
    },
  };
}

// Atomic exclusive file slots make the limit shared across Node workers/restarts.
// Global 60 and per-identifier 5 attempts per fixed 15-minute window.
export async function consumeLoginAttempt(directory: string, id: string, now = Date.now()) {
  const window = Math.floor(now / 900_000);
  const bucket = path.join(directory, String(window));
  await mkdir(bucket, { recursive: true, mode: 0o700 });
  for (const [key, maximum] of [['global', 60], [digest(id.normalize('NFKC').toLowerCase()), 5]] as const) {
    let accepted = false;
    for (let slot = 0; slot < maximum; slot++) {
      try {
        await writeFile(path.join(bucket, `${key}-${slot}`), '', { flag: 'wx', mode: 0o600 });
        accepted = true; break;
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    }
    if (!accepted) return false;
  }
  return true;
}

// Opportunistic bounded cleanup; only this application's generated files/directories.
export async function cleanupRuntime(root: string, now = Date.now()) {
  for (const area of ['sessions', 'limits']) {
    const directory = path.join(root, area);
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if (missing(error)) continue; throw error; }
    for (const entry of entries.slice(0, 1000)) {
      const file = path.join(directory, entry.name);
      if (area === 'sessions' && entry.isFile() && /^[a-f0-9]{64}\.json$/.test(entry.name)) {
        const info = await stat(file).catch(() => null);
        if (info && now - info.mtimeMs > SESSION_SECONDS * 1000) await unlink(file).catch(() => {});
      }
      if (area === 'limits' && entry.isDirectory() && /^\d+$/.test(entry.name) && Number(entry.name) < Math.floor(now / 900_000) - 1) {
        // No recursive delete: remove only matching slot files then an empty directory.
        const { rmdir } = await import('node:fs/promises');
        for (const name of await readdir(file)) if (/^(global|[a-f0-9]{64})-\d+$/.test(name)) await unlink(path.join(file, name)).catch(() => {});
        await rmdir(file).catch(() => {});
      }
    }
  }
}
