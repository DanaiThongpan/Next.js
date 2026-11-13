import 'server-only';
// Compatibility entry point for existing Phase 1/2 imports. No second connection path.
export { withReadOnlyDatabase, closeDatabasePool } from './db';
