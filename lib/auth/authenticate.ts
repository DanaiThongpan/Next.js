import type { Identity } from './policy.ts';
export type LoginRecord = Identity & { active: string; passwordHash: string };
export type AuthenticationDependencies = {
  find: (id: string) => Promise<LoginRecord | null>;
  verify: (password: string, hash: unknown) => Promise<boolean>;
};
export async function authenticate(id: unknown, password: unknown, dependencies: AuthenticationDependencies): Promise<Identity | null> {
  if (typeof id !== 'string' || typeof password !== 'string' || !id.trim() || id.trim().length > 100 || !password || password.includes('\0') || Buffer.byteLength(password) > 4096) return null;
  const record = await dependencies.find(id.trim());
  const active = record?.active === '1';
  const valid = await dependencies.verify(password, active ? record?.passwordHash : null);
  if (!record || !active || !valid) return null;
  // Explicit DTO: never spread a database row containing passwordHash into session/UI.
  return { id: record.id, name: record.name, type: record.type, department: record.department };
}
