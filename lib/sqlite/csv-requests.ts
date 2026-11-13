import 'server-only';
import { readSqliteQueries } from './read';

export async function hasCsvRequestHistory() {
  const [rows] = await readSqliteQueries([{
    sql: "SELECT 1 FROM main.sqlite_master WHERE type='table' AND name='next_csv_request_items'",
    values: [],
  }]);
  return rows.length > 0;
}
