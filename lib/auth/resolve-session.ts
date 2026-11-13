import type { Identity } from './policy.ts';
export async function resolveSession(token: string | undefined, dependencies: {
  read: (token: string | undefined) => Promise<{ accountId: string; expiresAt: number } | null>;
  revoke: (token: string | undefined) => Promise<void>;
  find: (id: string) => Promise<Identity | null>;
}): Promise<Identity | null> {
  const stored = await dependencies.read(token);
  if (!stored) return null;
  const user = await dependencies.find(stored.accountId);
  if (!user) await dependencies.revoke(token);
  return user;
}
