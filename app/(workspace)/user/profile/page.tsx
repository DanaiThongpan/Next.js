import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/admin/icon';
import { findOwnProfile } from '@/lib/auth/accounts';
import { permitted } from '@/lib/auth/policy';
import { requireIdentity } from '@/lib/auth/session';
import { isolatedSqliteWritePath } from '@/lib/sqlite/write-path';
import { UserShell } from '../_components/user-shell';
import { ProfileForms } from './profile-forms';

async function Content() {
  const user = await requireIdentity();
  if (!permitted(user, 'standard-user')) redirect('/unauthorized');
  const [profile, writePath] = await Promise.all([findOwnProfile(user.id).catch(() => null), isolatedSqliteWritePath()]);
  return <UserShell user={user} active="profile">
    <header className="user-hero d-flex align-items-center gap-3">
      <Icon name="circle-user" className="fs-1 text-primary flex-shrink-0"/>
      <div className="text-break"><h1>ข้อมูลส่วนตัว</h1><p>{user.name} · {user.department || 'ไม่ระบุแผนก'}</p></div>
    </header>
    {!profile ? <p className="alert alert-danger" role="alert">โหลดข้อมูลบัญชีไม่ได้ กรุณาเปิดหน้านี้อีกครั้ง</p> : <>
      {!writePath && <p className="alert alert-info" role="status">ขณะนี้ดูข้อมูลได้ การแก้ไขจะเปิดเมื่อผู้ดูแลตั้งค่าฐานข้อมูลแยกสำหรับ Next.js</p>}
      <section className="user-panel mb-4" aria-labelledby="profile-account">
        <header><h2 id="profile-account">ข้อมูลบัญชีและสิทธิ์</h2></header>
        <dl className="user-form user-grid mb-0 text-break">
          <div><dt>ชื่อผู้ใช้ / รหัสบัญชี</dt><dd>{profile.id}</dd></div>
          <div><dt>แผนก</dt><dd>{profile.department || 'ไม่ระบุ'}</dd></div>
          <div><dt>ประเภทบัญชี</dt><dd>ผู้ใช้งานทั่วไป</dd></div>
          <div><dt>สถานะบัญชี</dt><dd><span className="badge bg-success-subtle text-success-emphasis">เปิดใช้งาน</span></dd></div>
        </dl>
      </section>
      <ProfileForms name={profile.name} email={profile.email} writable={Boolean(writePath)}/>
    </>}
  </UserShell>;
}

export default function Page() {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดข้อมูลส่วนตัว…</p>}><Content/></Suspense>;
}
