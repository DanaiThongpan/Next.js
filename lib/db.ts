import 'server-only';
import { isDatabaseAccessEnabled as enabled } from './database/config';
import { DatabaseError } from './database/errors';
export function isDatabaseAccessEnabled() { return enabled(process.env); }
// Retained compatibility exports refuse the former MySQL interface.
export async function withReadOnlyDatabase<T>(_read: unknown): Promise<T> {
  throw new DatabaseError('DB_CONFIG_INVALID');
}
export async function closeDatabasePool() {}
export { DATABASE_DISABLED_MESSAGE, DatabaseError } from './database/errors';
