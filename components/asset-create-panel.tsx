import { isAdmin, type Identity } from '@/lib/auth/policy';
import { readCsvReferences } from '@/lib/sqlite/csv-import';
import { isolatedSqliteWritePath } from '@/lib/sqlite/write-path';
import { AssetCreateForm } from './asset-create-form';

export async function AssetCreatePanel({ user }: { user: Identity }) {
  let refs;
  try { refs = await readCsvReferences(); }
  catch { return <p className="alert alert-danger" role="alert">ไม่สามารถโหลดหมวดหมู่ อาคาร และห้องได้</p>; }
  const normalize = (rows: typeof refs.categories) => rows.map(row => ({
    id: String(row.id), name: String(row.name ?? ''), building: String(row.building ?? ''),
  }));
  const allDepartments = isAdmin(user) && user.id === 'admin';
  const writable = Boolean(await isolatedSqliteWritePath());
  return <AssetCreateForm writable={writable} categories={normalize(refs.categories)} buildings={normalize(refs.buildings)}
    rooms={normalize(refs.rooms)} allDepartments={allDepartments} pending={!isAdmin(user)}
    department={user.department.trim() || (allDepartments ? 'ส่วนกลาง' : '')}/>;
}
