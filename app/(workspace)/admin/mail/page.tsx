import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { MailSettingsView } from '@/components/admin/mail-settings-view';
import { requireIdentity } from '@/lib/auth/session';
import { readAdminModule } from '@/lib/sqlite/admin-modules';
import { MAIL_API_ENDPOINT } from '@/lib/sqlite/mail-test';

async function Content() {
  const user = await requireIdentity('admin');
  const data = await readAdminModule(user, 'mail', {}).catch(() => null);
  const row = data?.rows[0];
  const smtpAccount = process.env.SMTP_USER?.trim() ?? '';
  const passwordConfigured = Boolean(process.env.SMTP_PASS);
  const configured = Boolean(smtpAccount && passwordConfigured);
  return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}>
    {row ? <MailSettingsView row={row} configured={configured} smtpAccount={smtpAccount} passwordConfigured={passwordConfigured} endpoint={MAIL_API_ENDPOINT}/>
      : <p role="alert" className="alert alert-warning">ไม่สามารถอ่านการตั้งค่าอีเมลได้ หรือบัญชีนี้ไม่มีสิทธิ์เข้าถึง</p>}
  </AdminShell>;
}

export default function Page() {
  return <Suspense fallback={<p className="p-4">กำลังโหลดการตั้งค่าอีเมล…</p>}><Content/></Suspense>;
}
