'use client';
import { useRef, useState, type FormEvent } from 'react';

export default function LoginForm({ destination, disabled = false }: { destination: string; disabled?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current) return;
    submitting.current = true; setPending(true); setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: data.get('username'), password: data.get('password'), redirect: destination }) });
      const result = await response.json();
      if (response.ok && typeof result.redirect === 'string') {
        window.location.assign(result.redirect); return;
      }
      setError(result.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่');
    } catch { setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่'); }
    finally {
      const password = form.elements.namedItem('password');
      if (password instanceof HTMLInputElement) password.value = '';
      submitting.current = false; setPending(false);
    }
  }
  return <form method="post" onSubmit={submit} aria-busy={pending}>
    {error && <div className="alert alert-danger small" role="alert">{error}</div>}
    <fieldset disabled={disabled || pending}>
      <div className="mb-3"><label className="form-label text-secondary small fw-bold" htmlFor="username">รหัสผู้ใช้ (Username)</label><input className="form-control" id="username" name="username" autoComplete="username" placeholder="กรอกชื่อผู้ใช้งาน" maxLength={100} required /></div>
      <div className="mb-4"><label className="form-label text-secondary small fw-bold" htmlFor="password">รหัสผ่าน (Password)</label><input className="form-control" type="password" id="password" name="password" autoComplete="current-password" placeholder="กรอกรหัสผ่าน" required /></div>
      <div className="d-grid gap-2 mb-3"><button className="btn btn-primary btn-lg rounded-3 fw-bold shadow-sm py-2 fs-6" type="submit">{pending ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />กำลังเข้าสู่ระบบ…</> : 'เข้าสู่ระบบ'}</button><button className="btn btn-outline-secondary rounded-3 fw-bold py-2 fs-6" type="button" disabled>เข้าสู่ระบบด้วย SSO (ยังไม่เปิดใช้งาน)</button></div>
    </fieldset>
    <p className="text-center mt-3 mb-0 small text-muted">ยังไม่มีบัญชีผู้ใช้งาน? ติดต่อผู้ดูแลระบบ<br />การลงทะเบียนยังไม่เปิดใช้งานระหว่างย้ายระบบ</p>
  </form>;
}
