-- USER-RUN ONLY on macOS using a DBA-provided SELECT-only account.
-- Codex must not execute this file against the live server.
-- Metadata only: no user rows, passwords, hashes, defaults or comments.

SELECT DATABASE() AS database_name, @@character_set_connection AS connection_charset,
       VERSION() AS server_version;

SELECT TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'daam'
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'daam'
  AND TABLE_NAME IN ('useraccount', 'usertype', 'durable_articles', 'borrow_back',
                    'classification', 'status_active', 'building', 'building_classroom',
                    'repair', '_sync_meta')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'daam'
  AND (CONSTRAINT_NAME = 'PRIMARY' OR REFERENCED_TABLE_NAME IS NOT NULL)
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;

SELECT expected.table_name, expected.column_name,
       CASE WHEN actual.COLUMN_NAME IS NULL THEN 'missing' ELSE 'present' END AS column_status
FROM (
  SELECT 'durable_articles' AS table_name, 'is_approved' AS column_name
  UNION ALL SELECT 'durable_articles', 'is_visible'
  UNION ALL SELECT 'durable_articles', 'owner_department'
  UNION ALL SELECT 'durable_articles', 'created_by'
  UNION ALL SELECT 'borrow_back', 'status'
  UNION ALL SELECT '_sync_meta', 'id'
  UNION ALL SELECT '_sync_meta', 'last_synced_at'
) AS expected
LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS actual
  ON actual.TABLE_SCHEMA = 'daam'
 AND actual.TABLE_NAME = expected.table_name
 AND actual.COLUMN_NAME = expected.column_name
ORDER BY expected.table_name, expected.column_name;
