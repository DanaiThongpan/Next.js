import { Suspense } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { readPreview } from '@/lib/db-preview';
import { allowPreview } from '@/lib/preview-access';
import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = { title: 'DAAM · Database Preview', robots: { index: false, follow: false } };

async function Preview() {
  const h = await headers();
  if (!allowPreview(process.env.NODE_ENV, h.get('host'), h.has('forwarded') || ['x-forwarded-for', 'x-real-ip'].some(key => { const value = h.get(key); return value !== null && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(value); }) || (h.has('x-forwarded-host') && h.get('x-forwarded-host') !== h.get('host')))) notFound();
  const result = await readPreview();
  return <main className="container py-5 text-dark bg-white">
    <h1>DAAM Database Preview</h1>
    <p className="text-secondary">SQLite · ฐานข้อมูลจำลอง <strong>daam_dev.sqlite</strong> · localhost เท่านั้น</p>
    <div className="alert alert-info">อ่านอย่างเดียว · ไม่มีการแก้ไขข้อมูลหรือโครงสร้าง · ไม่แสดงข้อมูลผู้ใช้</div>
    <div className={`alert alert-${result.ok ? 'success' : 'danger'}`} role="status">{result.ok ? 'เชื่อมต่อสำเร็จ · Read-Only transaction' : result.error}</div>
    {result.ok && <>
      <p>พบ {result.tables.length} ตาราง/วิว · ตรวจสิทธิ์ SELECT-only ของบัญชีโดยผู้ดูแลฐานข้อมูล ยังไม่ได้ยืนยันหรือแก้ไขสิทธิ์</p>
      <h2 className="h4 mt-4">ข้อมูลตัวอย่างครุภัณฑ์ (ไม่เกิน 10 รายการ)</h2>
      {result.sampleTable ? <><p>ตาราง {result.sampleTable} · แสดงเฉพาะรหัสและราคา · ตัดค่าที่ไม่ตรงรูปแบบปลอดภัยออก</p><table className="table table-striped"><thead><tr><th>DA_ID</th><th>DA_Price</th></tr></thead><tbody>{result.samples.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.price}</td></tr>)}</tbody></table>{!result.samples.length && <p>ไม่มีรายการที่ตรงรูปแบบปลอดภัย</p>}</> : <p>ไม่พบตาราง/คอลัมน์ที่ตรง Allowlist แสดงเฉพาะ Metadata</p>}
      <h2 className="h4 mt-4">ตารางและคอลัมน์</h2>
      {result.tables.map(table => <details className="border rounded p-3 mb-2" key={table.tableName}><summary><strong>{table.tableName}</strong> <span className="text-secondary">{table.tableType}</span></summary><div className="table-responsive"><table className="table table-sm mt-3"><thead><tr><th>Column</th><th>Type</th><th>Key</th><th>Nullable</th></tr></thead><tbody>{result.columns.filter(c => c.tableName === table.tableName).map(c => <tr key={c.columnName}><td>{c.columnName}</td><td>{c.columnType}</td><td>{c.columnKey || '—'}</td><td>{c.nullable}</td></tr>)}</tbody></table></div></details>)}
      <h2 className="h4 mt-4">ความสัมพันธ์ Foreign Key ที่ประกาศจริง</h2>
      {result.relations.length ? <ul>{result.relations.map((r, i) => <li key={i}>{r.tableName}.{r.columnName} → {r.referencedTable}.{r.referencedColumn}</li>)}</ul> : <p>ไม่พบ Foreign Key ที่ประกาศใน Metadata ไม่ได้หมายความว่าไม่มีความสัมพันธ์ในโค้ดเดิม</p>}
      <p className="text-secondary">จาก Source PHP: durable_articles เกี่ยวข้องกับ classification, status_active, building, building_classroom; borrow_back และ borrowing เกี่ยวข้องกับการยืม–คืน (ต้องยืนยันกับ Metadata จริง ไม่อ่านรายการผู้ยืม)</p>
    </>}
  </main>;
}
export default function Page() { return <Suspense fallback={<p className="p-4">กำลังตรวจสอบการเชื่อมต่อ…</p>}><Preview /></Suspense>; }
