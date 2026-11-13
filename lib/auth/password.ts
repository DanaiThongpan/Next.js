import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

export function supportedHash(hash: unknown): hash is string {
  return typeof hash === 'string' && /^\$2[aby]\$(0[4-9]|1[0-6])\$[./A-Za-z0-9]{53}$/.test(hash);
}
// Synthetic dummy only; never a real account hash. Equal work for unknown/inactive users.
const dummy = bcrypt.hash(randomBytes(32).toString('hex'), 12);
export async function verifyPassword(password: string, hash: unknown) {
  if (!password || password.includes('\0') || Buffer.byteLength(password) > 4096) return false;
  const usable = supportedHash(hash);
  const matches = await bcrypt.compare(password, usable ? hash : await dummy);
  return usable && matches;
}
