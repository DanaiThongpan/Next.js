import 'server-only';
import path from 'node:path';
import { sessionStore, consumeLoginAttempt, cleanupRuntime } from './store';

const root = path.join(process.cwd(), '.daam-runtime');
export const sessions = sessionStore(path.join(root, 'sessions'));
let lastCleanup = 0;
export async function loginAttempt(id: string) {
  if (Date.now() - lastCleanup > 900_000) {
    lastCleanup = Date.now();
    await cleanupRuntime(root);
  }
  return consumeLoginAttempt(path.join(root, 'limits'), id);
}
