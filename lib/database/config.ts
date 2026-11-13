import { DatabaseError } from './errors.ts';
export type DatabaseEnvironment = Readonly<Record<string, string | undefined>>;
export function isDatabaseAccessEnabled(env: DatabaseEnvironment) {
  return env.DAAM_DB_ACCESS === 'enabled' && env.NEXT_PHASE !== 'phase-production-build';
}
export type DatabaseConfig = {
  host: string; port: number; database: string; charset: string;
  user: string; password: string; connectionLimit: number;
};
export function readDatabaseConfig(env: DatabaseEnvironment): DatabaseConfig {
  // The gate is checked before even accessing credential properties.
  if (!isDatabaseAccessEnabled(env)) throw new DatabaseError('DB_ACCESS_DISABLED');
  const namespacedCredentials = env.DAAM_DB_USER !== undefined || env.DAAM_DB_PASSWORD !== undefined;
  const user = (namespacedCredentials ? env.DAAM_DB_USER : env.DB_USER)?.trim();
  const password = namespacedCredentials ? env.DAAM_DB_PASSWORD : env.DB_PASSWORD;
  const host = env.DAAM_DB_HOST ?? env.DB_HOST ?? '192.168.15.201';
  const port = env.DAAM_DB_PORT ?? env.DB_PORT ?? '3306';
  const database = env.DAAM_DB_NAME ?? env.DB_NAME ?? 'daam';
  const charset = env.DAAM_DB_CHARSET ?? env.DB_CHARSET ?? 'utf8mb4';
  const limit = env.DAAM_DB_POOL_LIMIT ?? env.DB_POOL_LIMIT ?? '2';
  if (!user || user.length > 128 || !password || user.includes('\0') || password.includes('\0') ||
      host !== '192.168.15.201' || port !== '3306' || database !== 'daam' || charset !== 'utf8mb4' || !/^[1-5]$/.test(limit)) {
    throw new DatabaseError('DB_CONFIG_INVALID');
  }
  return { host, port: 3306, database, charset, user, password, connectionLimit: Number(limit) };
}
