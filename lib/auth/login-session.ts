import { authenticate, type AuthenticationDependencies } from './authenticate.ts';
import { destinationFor } from './policy.ts';
export type SessionOperations = {
  create: (id: string) => Promise<{ token: string; expiresAt: number }>;
  revoke: (token: string | undefined) => Promise<void>;
};
export async function loginSession(input: { username?: unknown; password?: unknown; redirect?: unknown }, previousToken: string | undefined, dependencies: AuthenticationDependencies & { sessions: SessionOperations }) {
  const user = await authenticate(input.username, input.password, dependencies);
  if (!user) return null;
  await dependencies.sessions.revoke(previousToken);
  const session = await dependencies.sessions.create(user.id);
  return { ...session, destination: destinationFor(user, input.redirect) };
}
