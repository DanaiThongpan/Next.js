'use client';
import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function ClbVisibilitySwitch({ enabled, canManage }: { enabled: boolean; canManage: boolean }) {
  const id = useId();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  async function toggle(next: boolean) {
    if (!window.confirm(next ? 'แสดงครุภัณฑ์ CLB ในทุกหน้า?' : 'ซ่อนครุภัณฑ์ CLB จากทุกหน้า?')) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/clb-visibility', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }) });
      if (!response.ok) { setError('บันทึกไม่ได้ กรุณาตรวจสิทธิ์และการเปิดใช้งานการบันทึก'); return; }
      startTransition(() => router.refresh());
    } catch { setError('ไม่สามารถตรวจผลการบันทึกได้ กรุณาโหลดหน้าใหม่'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="form-check form-switch">
      <input id={id} type="checkbox" role="switch" className="form-check-input" checked={enabled} disabled={!canManage || busy || pending} onChange={event => toggle(event.target.checked)}/>
      <label className="form-check-label small fw-semibold" htmlFor={id}>{busy || pending ? 'กำลังบันทึก…' : enabled ? 'แสดง CLB ทุกหน้า' : 'ซ่อน CLB ทุกหน้า'}</label>
    </div>
    {error && <small className="text-danger" role="alert">{error}</small>}
  </div>;
}
