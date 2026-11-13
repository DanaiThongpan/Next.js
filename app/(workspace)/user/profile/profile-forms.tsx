'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Feedback = { message: string; field?: string; ok?: boolean };
async function patch(body: Record<string, string>) {
  const response = await fetch('/api/user/profile', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await response.json();
  return { ...result, ok: response.ok && result.ok === true };
}

export function ProfileForms({ name, email, writable }: { name: string; email: string; writable: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState({ name, email });
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'profile' | 'password' | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [security, setSecurity] = useState<Feedback | null>(null);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [reauthenticate, setReauthenticate] = useState(false);
  const inFlight = useRef(false);
  const nameField = useRef<HTMLInputElement>(null);
  const dirty = draft.name !== saved.name || draft.email !== saved.email;

  useEffect(() => {
    if (!dirty && !passwordDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const confirmNavigation = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (anchor instanceof HTMLAnchorElement && anchor.pathname !== window.location.pathname &&
          !window.confirm('มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่?')) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', confirmNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', confirmNavigation, true);
    };
  }, [dirty, passwordDirty]);

  useEffect(() => { if (editing) nameField.current?.focus(); }, [editing]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writable || !editing || !dirty || inFlight.current || reauthenticate) return;
    inFlight.current = true;
    setBusy('profile');
    setFeedback(null);
    try {
      const result = await patch({ action: 'profile', ...draft, previousName: saved.name, previousEmail: saved.email });
      if (result.ok) {
        const next = { name: String(result.name), email: String(result.email) };
        setSaved(next);
        setDraft(next);
        setEditing(false);
        setFeedback({ ok: true, message: 'บันทึกข้อมูลส่วนตัวแล้ว' });
        router.refresh();
      } else setFeedback({ message: result.message || 'บันทึกไม่สำเร็จ', field: result.field });
    } catch { setFeedback({ message: 'ยืนยันผลการบันทึกไม่ได้ กรุณาโหลดหน้าใหม่เพื่อตรวจสอบ' }); }
    finally { inFlight.current = false; setBusy(null); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writable || inFlight.current || reauthenticate) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get('currentPassword') ?? '');
    const newPassword = String(values.get('newPassword') ?? '');
    const confirmation = String(values.get('confirmation') ?? '');
    if (newPassword !== confirmation) { setSecurity({ message: 'รหัสผ่านที่ยืนยันไม่ตรงกัน', field: 'confirmation' }); return; }
    if (dirty && !window.confirm('การเปลี่ยนรหัสผ่านจะออกจากระบบ และข้อมูลส่วนตัวที่ยังไม่ได้บันทึกจะหาย ต้องการดำเนินการหรือไม่?')) return;
    inFlight.current = true;
    setBusy('password');
    setSecurity(null);
    try {
      const result = await patch({ action: 'password', currentPassword, newPassword, confirmation });
      setSecurity({ ok: result.ok, message: result.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', field: result.field });
      if (result.ok && result.reauthenticate) {
        form.reset();
        setPasswordDirty(false);
        setDraft(saved);
        setEditing(false);
        setReauthenticate(true);
      }
    } catch { setSecurity({ message: 'ยืนยันผลไม่ได้ กรุณาตรวจสอบก่อนลองอีกครั้ง' }); }
    finally { inFlight.current = false; setBusy(null); }
  }

  const inline = (state: Feedback | null, field: string) =>
    state?.field === field && <p id={`error-${field}`} className="small text-danger mt-1 mb-0" role="alert">{state.message}</p>;

  return <>
    <section className="user-panel mb-4" aria-labelledby="profile-personal">
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 id="profile-personal">ข้อมูลส่วนตัว</h2>
        {!editing && writable && !reauthenticate && <button type="button" className="btn btn-outline-primary" disabled={Boolean(busy)}
          onClick={() => { setFeedback(null); setEditing(true); }}>แก้ไขข้อมูล</button>}
      </header>
      <form method="post" className="user-form" onSubmit={save} aria-busy={busy === 'profile'}>
        {feedback && !feedback.field && <p className={`alert alert-${feedback.ok ? 'success' : 'danger'}`} role={feedback.ok ? 'status' : 'alert'}>{feedback.message}</p>}
        {editing ? <fieldset disabled={Boolean(busy) || reauthenticate}>
          <div className="user-grid mb-3">
            <div><label htmlFor="profile-name" className="form-label">ชื่อ–นามสกุล *</label>
              <input ref={nameField} id="profile-name" className="form-control" autoComplete="name" required maxLength={150}
                value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}
                aria-invalid={feedback?.field === 'name'} aria-describedby={feedback?.field === 'name' ? 'error-name' : undefined}/>
              {inline(feedback, 'name')}</div>
            <div><label htmlFor="profile-email" className="form-label">อีเมลติดต่อ</label>
              <input id="profile-email" className="form-control" type="email" autoComplete="email" maxLength={150}
                value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })}
                aria-invalid={feedback?.field === 'email'} aria-describedby={feedback?.field === 'email' ? 'error-email' : undefined}/>
              {inline(feedback, 'email')}</div>
          </div>
          <div className="user-data-actions">
            <button className="btn btn-primary" disabled={!dirty}>{busy === 'profile' ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => {
              if (dirty && !window.confirm('ยกเลิกการแก้ไขที่ยังไม่ได้บันทึกหรือไม่?')) return;
              setDraft(saved); setFeedback(null); setEditing(false);
            }}>ยกเลิก</button>
          </div>
        </fieldset> : <dl className="user-grid mb-0 text-break">
          <div><dt>ชื่อ–นามสกุล</dt><dd>{saved.name || 'ไม่ระบุ'}</dd></div>
          <div><dt>อีเมลติดต่อ</dt><dd>{saved.email || 'ไม่ระบุ'}</dd></div>
        </dl>}
      </form>
    </section>
    <section className="user-panel" aria-labelledby="profile-security">
      <header><h2 id="profile-security">ความปลอดภัยของบัญชี</h2></header>
      <form method="post" className="user-form" onSubmit={changePassword} aria-busy={busy === 'password'} onChange={event => {
        setPasswordDirty(Array.from(new FormData(event.currentTarget).values()).some(Boolean));
      }}>
        {security && !security.field && <p className={`alert alert-${security.ok ? 'success' : 'danger'}`} role={security.ok ? 'status' : 'alert'}>{security.message}</p>}
        {reauthenticate ? <Link className="btn btn-primary" href="/login?redirect=%2Fuser%2Fprofile">เข้าสู่ระบบใหม่</Link> :
          writable ? <fieldset disabled={Boolean(busy)}>
            <p className="small text-secondary">ใช้รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร หลังบันทึกให้เข้าสู่ระบบใหม่ด้วยรหัสผ่านใหม่</p>
            <div className="user-grid mb-3">
              {([
                ['currentPassword', 'รหัสผ่านปัจจุบัน'], ['newPassword', 'รหัสผ่านใหม่'], ['confirmation', 'ยืนยันรหัสผ่านใหม่'],
              ] as const).map(([field, label]) => <div key={field}>
                <label htmlFor={field} className="form-label">{label} *</label>
                <input id={field} name={field} className="form-control" type="password" required
                  autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                  minLength={field === 'currentPassword' ? undefined : 8} maxLength={field === 'currentPassword' ? 4096 : 72}
                  aria-invalid={security?.field === field} aria-describedby={security?.field === field ? `error-${field}` : undefined}/>
                {inline(security, field)}
              </div>)}
            </div>
            <button className="btn btn-primary">{busy === 'password' ? 'กำลังเปลี่ยนรหัสผ่าน…' : 'เปลี่ยนรหัสผ่าน'}</button>
          </fieldset> : <p className="mb-0 text-secondary">การเปลี่ยนรหัสผ่านยังไม่เปิดใช้งาน</p>}
      </form>
    </section>
  </>;
}
