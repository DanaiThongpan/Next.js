import { readDatabaseConfig, type DatabaseConfig, type DatabaseEnvironment } from './config.ts';
import { DatabaseError } from './errors.ts';
import { assertApprovedRead } from './statements.ts';
export type ReadValue = string | number | boolean | null;
export type StatementOptions = { sql: string; timeout?: number };
export type DriverConnection = {
  query: (options: StatementOptions, values: ReadValue[]) => Promise<unknown>;
  execute: (options: StatementOptions, values: ReadValue[]) => Promise<unknown>;
  release: () => void; destroy: () => void;
};
export type DriverPool = { getConnection: () => Promise<DriverConnection>; end: () => Promise<void> };
export type PoolOptions = DatabaseConfig & {
  waitForConnections: false; queueLimit: number; connectTimeout: number; maxIdle: number; idleTimeout: number;
  dateStrings: true; multipleStatements: false; flags: string[]; enableKeepAlive: true;
};
export interface DatabaseReader {
  query<T extends Record<string, unknown>[]>(options: StatementOptions | string, values?: ReadValue[]): Promise<[T, unknown]>;
  execute<T extends Record<string, unknown>[]>(options: StatementOptions | string, values?: ReadValue[]): Promise<[T, unknown]>;
}

// Pure factory for mocked tests. It neither imports mysql2 nor creates a pool/socket.
export function createReadDatabase(environment: () => DatabaseEnvironment, createPool: (options: PoolOptions) => DriverPool) {
  let pool: DriverPool | undefined;
  let closing: Promise<void> | undefined;
  let active = 0;
  let drained: (() => void) | undefined;
  let connectionKey: string | undefined;

  async function withReadOnlyDatabase<T>(read: (db: DatabaseReader) => Promise<T>): Promise<T> {
    const config = readDatabaseConfig(environment());
    if (closing) throw new DatabaseError('DB_CLOSING');
    // Reconfiguration must explicitly close the existing pool first. Never silently
    // reuse an authenticated pool with changed credentials or another target.
    const key = JSON.stringify(config);
    if (pool && connectionKey !== key) throw new DatabaseError('DB_CONFIG_INVALID');
    let connection: DriverConnection | undefined;
    let reusable = false;
    active++;
    try {
      if (!pool) {
        pool = createPool({ ...config, waitForConnections: false, queueLimit: 0, connectTimeout: 5000,
          maxIdle: config.connectionLimit, idleTimeout: 60_000, dateStrings: true, multipleStatements: false, flags: ['-LOCAL_FILES'], enableKeepAlive: true });
        connectionKey = key;
      }
      // Recheck immediately before acquisition as well as before each statement.
      readDatabaseConfig(environment());
      connection = await pool.getConnection();
      readDatabaseConfig(environment());
      await connection.query({ sql: 'START TRANSACTION READ ONLY', timeout: 5000 }, []);
      const lease = connection;
      let live = true;
      const inFlight = new Set<Promise<unknown>>();
      const run = async <Rows extends Record<string, unknown>[]>(kind: 'query' | 'execute', options: StatementOptions | string, values: ReadValue[] = []): Promise<[Rows, unknown]> => {
        if (!live) throw new DatabaseError('DB_QUERY_REJECTED');
        if (JSON.stringify(readDatabaseConfig(environment())) !== key) throw new DatabaseError('DB_CONFIG_INVALID');
        const sql = typeof options === 'string' ? options : options.sql;
        assertApprovedRead(sql, values);
        const timeout = typeof options === 'string' ? 5000 : Math.min(options.timeout ?? 5000, 5000);
        if (!Number.isFinite(timeout) || timeout <= 0) throw new DatabaseError('DB_QUERY_REJECTED');
        const operation = lease[kind]({ sql, timeout }, values);
        inFlight.add(operation);
        try {
          const result = await operation;
          if (!Array.isArray(result) || !Array.isArray(result[0])) throw new DatabaseError('DB_UNAVAILABLE');
          return result as [Rows, unknown];
        } finally { inFlight.delete(operation); }
      };
      try {
        return await read({ query: (options, values) => run('query', options, values), execute: (options, values) => run('execute', options, values) });
      } finally {
        live = false;
        await Promise.allSettled([...inFlight]);
        // Transaction control only: never COMMIT. End the read snapshot before
        // releasing a pooled connection; failed cleanup destroys the connection.
        await lease.query({ sql: 'ROLLBACK', timeout: 5000 }, []);
        reusable = true;
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      // Do not retain cause, raw driver code/message, SQL, or connection config.
      throw new DatabaseError('DB_UNAVAILABLE');
    } finally {
      let cleanupFailed = false;
      try {
        if (connection) {
          try { if (reusable) connection.release(); else connection.destroy(); }
          catch { cleanupFailed = true; try { connection.destroy(); } catch {} }
        }
      } finally {
        active--;
        if (!active) drained?.();
      }
      if (cleanupFailed) throw new DatabaseError('DB_UNAVAILABLE');
    }
  }
  function closeDatabasePool(): Promise<void> {
    if (closing) return closing;
    if (!pool && !active) return Promise.resolve();
    closing = Promise.resolve().then(async () => {
      if (active) await new Promise<void>(resolve => { drained = resolve; });
      const old = pool;
      pool = undefined; connectionKey = undefined;
      try { await old?.end(); }
      catch { throw new DatabaseError('DB_UNAVAILABLE'); }
    }).finally(() => { closing = undefined; drained = undefined; });
    return closing;
  }
  return { withReadOnlyDatabase, closeDatabasePool };
}
