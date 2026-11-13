import { dashboardReadStatements, METADATA_SQL, INVENTORY_TOTAL_SQL, INVENTORY_CATEGORY_SQL } from '../dashboard/model.ts';
import { DatabaseError } from './errors.ts';

export const LOGIN_ACCOUNT_SQL = "SELECT useraccountID AS id, useraccountName AS name, useraccountType AS type, userDepartment AS department, userActive AS active, userPassword AS passwordHash FROM useraccount WHERE useraccountID = ? AND userActive = '1' LIMIT 1";
export const ACTIVE_IDENTITY_SQL = "SELECT useraccountID AS id, useraccountName AS name, useraccountType AS type, userDepartment AS department, userActive AS active FROM useraccount WHERE useraccountID = ? AND userActive = '1' LIMIT 1";
export const PREVIEW_TABLES_SQL = "SELECT TABLE_NAME AS tableName, TABLE_TYPE AS tableType FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'daam' ORDER BY TABLE_NAME";
export const PREVIEW_COLUMNS_SQL = "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, DATA_TYPE AS dataType, COLUMN_KEY AS columnKey, IS_NULLABLE AS nullable FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'daam' ORDER BY TABLE_NAME, ORDINAL_POSITION";
export const PREVIEW_RELATIONS_SQL = "SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS referencedTable, REFERENCED_COLUMN_NAME AS referencedColumn FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'daam' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, ORDINAL_POSITION";
export const PREVIEW_SAMPLE_SQL = 'SELECT DA_ID, DA_Price FROM daam.durable_articles ORDER BY DA_ID LIMIT 10';

// Exact SQL allowlist, not a permissive startsWith('SELECT') filter. No comments,
// custom functions, file operations, lock clauses or arbitrary SELECTs can be appended.
const approved = new Set([INVENTORY_TOTAL_SQL, INVENTORY_CATEGORY_SQL, LOGIN_ACCOUNT_SQL, ACTIVE_IDENTITY_SQL, PREVIEW_TABLES_SQL, PREVIEW_COLUMNS_SQL, PREVIEW_RELATIONS_SQL, PREVIEW_SAMPLE_SQL, METADATA_SQL, ...dashboardReadStatements()]);
export function assertApprovedRead(sql: string, values: readonly unknown[]) {
  if (!approved.has(sql) || values.length !== (sql.match(/\?/g)?.length ?? 0) || values.some(value => value !== null && !['string', 'number', 'boolean'].includes(typeof value)) || values.some(value => typeof value === 'number' && !Number.isFinite(value))) {
    throw new DatabaseError('DB_QUERY_REJECTED');
  }
}
