import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth/session';
import { permitted } from '@/lib/auth/policy';
import { readCsvReferences } from '@/lib/sqlite/csv-import';
import { isolatedSqliteWritePath } from '@/lib/sqlite/write-path';
import { hasCsvRequestHistory } from '@/lib/sqlite/csv-requests';
import { UserShell } from '../_components/user-shell';
import { RequestCsvForm } from './request-csv-form';

const fields = [
  ['DA_Number', 'จำเป็น · หมายเลขครุภัณฑ์ ตั้งเซลล์เป็นข้อความเพื่อเก็บเลขศูนย์นำหน้า'],
  ['DA_ListName', 'จำเป็น · ชื่อรายการ'],
  ['DA_Brand', 'ยี่ห้อหรือรุ่น'],
  ['classificationID', 'รหัสหรือชื่อหมวดหมู่ เว้นว่างให้ระบบเสนอหมวดหมู่ในตัวอย่าง'],
  ['buildingID', 'รหัสหรือชื่ออาคาร'],
  ['classroomID', 'รหัสหรือชื่อห้อง ต้องระบุอาคารที่ห้องนั้นสังกัด'],
  ['DA_Price', 'ราคาเป็นบาท ตั้งแต่ 0 และทศนิยมไม่เกิน 2 ตำแหน่ง'],
  ['DA_Year', 'ปีงบประมาณ พ.ศ. 4 หลัก เว้นว่างให้ระบบคำนวณจากหมายเลขหรือใช้ปีปัจจุบัน'],
  ['owner_department', 'เว้นว่างเพื่อใช้สังกัดบัญชี หรือกรอกให้ตรงกับสังกัดบัญชี'],
];

async function Content() {
  const user = await requireIdentity();
  if (!permitted(user, 'standard-user')) redirect('/unauthorized');
  const [refs, writePath] = await Promise.all([readCsvReferences().catch(() => null), isolatedSqliteWritePath()]);
  const ready = Boolean(writePath && await hasCsvRequestHistory().catch(() => false));
  return <UserShell user={user} active="request-csv">
    <div className="user-hero"><h1>ส่งคำขอขึ้นทะเบียนครุภัณฑ์ผ่าน CSV</h1>
      <p>ดาวน์โหลดต้นแบบ กรอกข้อมูล ตรวจไฟล์ แล้วส่งให้ผู้ดูแลสังกัดพิจารณา</p></div>
    <div className="user-data-actions mb-3">
      <a href="/api/user/request-csv" download className="btn btn-primary">ดาวน์โหลดต้นแบบ CSV</a>
      <Link href="/user/requests" className="btn btn-outline-secondary">เสนอรายชิ้น</Link>
      <Link href="/user/request-history" className="btn btn-outline-primary">ติดตามคำขอ</Link>
    </div>
    <div className="user-csv-layout">
      <section className="user-panel">
        <header><h2>1. เตรียมไฟล์</h2></header>
        <div className="user-form user-csv-guide">
          <p>สังกัดที่ส่งได้: <strong>{user.department.trim() || 'ยังไม่ได้กำหนด'}</strong></p>
          <p>บันทึกเป็น CSV UTF-8 แล้วตรวจว่าหมายเลขยังมีเลขศูนย์นำหน้าครบ</p>
          <div className="table-responsive"><table className="table table-sm align-middle">
            <caption className="visually-hidden">คำอธิบายคอลัมน์</caption>
            <thead><tr><th scope="col">คอลัมน์</th><th scope="col">วิธีกรอก</th></tr></thead>
            <tbody>{fields.map(([key, label]) => <tr key={key}><th scope="row"><code>{key}</code></th><td>{label}</td></tr>)}</tbody>
          </table></div>
          {refs ? [
            { label: 'รหัสหมวดหมู่', rows: refs.categories },
            { label: 'รหัสอาคาร', rows: refs.buildings },
            { label: 'รหัสห้องตามอาคาร', rows: refs.rooms },
          ].map(({label, rows}) => <details key={label}><summary>{label} ({rows.length})</summary>
            <ul className="user-csv-references">{rows.map(row => <li key={String(row.building ?? '') + ':' + String(row.id)}>
              <code>{row.id}</code> {row.name}{row.building ? ' · อาคาร ' + row.building : ''}
            </li>)}</ul>
          </details>) : <p role="status">โหลดรหัสอ้างอิงไม่สำเร็จ กรุณาลองใหม่</p>}
        </div>
      </section>
      <RequestCsvForm ready={ready} hasDepartment={Boolean(user.department.trim())}/>
    </div>
  </UserShell>;
}

export default function Page() {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดหน้าคำขอ…</p>}><Content/></Suspense>;
}
