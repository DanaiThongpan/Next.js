import Link from 'next/link';
import { Suspense } from 'react';
import { requireIdentity } from '@/lib/auth/session';
import { readSqliteQueries } from '@/lib/sqlite/read';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AssetEditForm } from '@/components/admin/asset-edit-form';

type Props = { searchParams: Promise<{ id?: string | string[] }> };

async function Content({ searchParams }: Props) {
  const user = await requireIdentity('admin');
  const { id } = await searchParams;
  const scope = user.id === 'admin' ? '' : ' AND (owner_department=? OR (owner_department IS NULL AND created_by=?))';
  let form;
  let error = 'ไม่พบครุภัณฑ์ที่มีสิทธิ์แก้ไข';
  if (typeof id === 'string' && id.length > 0 && id.length <= 128 && (user.id === 'admin' || user.department.trim())) {
    try {
      const values = user.id === 'admin' ? [id] : [id, user.department, user.id];
      const [assets, categories, buildings, rooms] = await readSqliteQueries([
        { sql: `SELECT DA_ID,DA_Number,DA_ListName,DA_Brand,DA_Size,DA_DetailLocation,DA_Year,DA_Price,DA_Detail,classificationID,buildingID,classroomID,DA_URLImg,owner_department,statusID FROM durable_articles WHERE DA_ID=? AND (is_approved=1 OR is_approved IS NULL)${scope}`, values },
        { sql: 'SELECT classificationID AS id,classificationName AS label FROM classification ORDER BY label', values: [] },
        { sql: 'SELECT buildingID AS id,buildingName AS label FROM building ORDER BY label', values: [] },
        { sql: 'SELECT classroomID AS id,classroomName AS label,buildingID AS building FROM building_classroom ORDER BY label', values: [] },
      ]);
      if (assets[0]) form = <AssetEditForm asset={assets[0]} categories={categories} buildings={buildings} rooms={rooms}/>;
    } catch { error = 'ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้'; }
  }
  return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}>
    <Link href="/admin/manage-data" className="btn btn-outline-secondary mb-3">กลับหน้าจัดการครุภัณฑ์</Link>
    <section className="card shadow-sm"><h1 className="card-header h5">แก้ไขข้อมูลครุภัณฑ์</h1><div className="card-body">{form ?? <p role="alert">{error}</p>}</div></section>
  </AdminShell>;
}

export default function Page(props: Props) {
  return <Suspense fallback={<p>กำลังโหลดข้อมูลครุภัณฑ์…</p>}><Content {...props}/></Suspense>;
}
