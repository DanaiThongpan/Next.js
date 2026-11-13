import 'server-only';
import { readSqliteQueries } from '../sqlite/read';
import type { Identity } from './policy';
import type { LoginRecord } from './authenticate';
import { LOGIN_ACCOUNT_SQL, ACTIVE_IDENTITY_SQL } from '../database/statements';

function identity(row: Record<string,string|number|null>): Identity {
  return { id: String(row.id), name: String(row.name ?? ''), type: String(row.type ?? ''), department: String(row.department ?? '') };
}
export async function findLoginAccount(id: string): Promise<LoginRecord | null> {
  const [rows] = await readSqliteQueries([{sql: LOGIN_ACCOUNT_SQL, values:[id]}]);
  const row=rows[0];
  return row ? {...identity(row),active:String(row.active),passwordHash:String(row.passwordHash ?? '')} : null;
}
export async function findActiveIdentity(id: string): Promise<Identity | null> {
  const [rows] = await readSqliteQueries([{sql: ACTIVE_IDENTITY_SQL,values:[id]}]);
  return rows[0] ? identity(rows[0]) : null;
}

export async function findOwnProfile(id: string) {
  const [rows] = await readSqliteQueries([{
    sql: "SELECT useraccountID AS id,useraccountName AS name,userEmail AS email,userDepartment AS department,useraccountType AS role,userActive AS active FROM useraccount WHERE useraccountID=? AND userActive='1' AND useraccountType='UT00000002' LIMIT 1",
    values: [id],
  }]);
  const row = rows[0];
  return row ? {
    id: String(row.id), name: String(row.name ?? ''), email: String(row.email ?? ''),
    department: String(row.department ?? ''), role: String(row.role), active: String(row.active),
  } : null;
}
