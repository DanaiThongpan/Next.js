import { Suspense } from 'react';
import { requireIdentity } from '@/lib/auth/session';
import { readCsvReferences } from '@/lib/sqlite/csv-import';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { CsvPreview } from '@/components/admin/csv-preview';
import { Icon } from '@/components/admin/icon';

async function Content() {
  const user = await requireIdentity('admin');
  const references = await readCsvReferences().catch(() => null);
  return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}>
    <div className="php-page-csv mx-auto pb-4" style={{ maxWidth: '1520px' }}>
      <section className="card border-0 shadow">
        <header className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-3 px-md-4">
          <div>
            <h1 className="h5 fw-bold mb-1"><Icon name="cloud-arrow-up" className="text-primary me-2"/>นำเข้าข้อมูลครุภัณฑ์ด้วย CSV (CSV Import)</h1>
            <p className="small text-secondary mb-0">ตรวจข้อมูลก่อนเพิ่มครุภัณฑ์ใหม่ ระบบจะข้ามหมายเลขที่ซ้ำ</p>
          </div>
          <a href="/api/admin/csv" download className="btn btn-outline-primary btn-sm rounded-pill px-3">
            <Icon name="download" className="me-2"/>ดาวน์โหลดไฟล์ต้นแบบ (Template CSV)
          </a>
        </header>
        <div className="card-body p-3 p-md-4"><CsvPreview references={references}/></div>
      </section>
    </div>
  </AdminShell>;
}

export default function Page() {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดข้อมูลอ้างอิงสำหรับนำเข้า CSV…</p>}><Content/></Suspense>;
}
