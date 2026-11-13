'use client';
import './asset-table.css';
const styles = {category:'asset-category',categoryOn:'asset-categoryOn',categoryOff:'asset-categoryOff'};
import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function AssetCategorySwitches({ categories, disabled, canManage }: {
  categories: { id: string; name: string }[]; disabled: string[]; canManage: boolean;
}) {
  const router = useRouter();
  const prefix = useId();
  const [currentDisabled, setCurrentDisabled] = useState(disabled);
  const [refreshing, startTransition] = useTransition();
  useEffect(() => setCurrentDisabled(disabled), [disabled]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function change(id: string, enabled: boolean, name: string) {
    if (!window.confirm(`ยืนยัน${enabled ? 'เปิด' : 'ปิด'}ใช้งานหมวด ${name}? การปิดจะซ่อนรายการและหยุดการยืมใหม่ทั้งหมวด`)) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/category-availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, enabled }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const errors: Record<string, string> = {
          FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์เปิด–ปิดหมวดหมู่',
          SESSION_EXPIRED: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
          WRITES_DISABLED: 'Server ยังไม่เปิดการบันทึก กรุณาตั้ง DAAM_DB_ACCESS และ DAAM_SQLITE_WRITES เป็น enabled',
          SOURCE_UNAVAILABLE: 'Server ยังไม่พบเส้นทางฐานข้อมูล SQLite',
          SAVE_FAILED: 'บันทึกไม่ได้ กรุณาตรวจสิทธิ์เขียนโฟลเดอร์ control และไฟล์สถานะหมวดหมู่',
        };
        setMessage(errors[result.code] ?? 'ไม่สามารถบันทึกสถานะหมวดหมู่ได้');
        return;
      }
      setCurrentDisabled(previous => enabled ? previous.filter(value => value !== id) : [...new Set([...previous, id])]);
      setMessage('บันทึกสถานะหมวดหมู่แล้ว');
      startTransition(() => router.refresh());
    } catch { setMessage('ไม่สามารถตรวจผลการบันทึกได้ กรุณาโหลดหน้าใหม่'); }
    finally { setBusy(false); }
  }
  return <fieldset className="col-12" disabled={busy || refreshing || !canManage} aria-busy={busy || refreshing}>
    <legend className="form-label fw-bold text-secondary small">เปิด–ปิดใช้งานหมวดหมู่ครุภัณฑ์</legend>
    <p className="small text-muted">เปิดใช้งาน {categories.filter(row => !currentDisabled.includes(row.id)).length} จาก {categories.length} หมวดหมู่</p>
    <div className="row g-2">{categories.map((row, i) => <div className="col-12 col-md-6 col-lg-4" key={row.id}>
      <div className={`form-check form-switch d-flex gap-3 ${styles.category} ${currentDisabled.includes(row.id)?styles.categoryOff:styles.categoryOn}`}>
        <input id={prefix+i} type="checkbox" role="switch" className="form-check-input m-0 mt-1" checked={!currentDisabled.includes(row.id)} onChange={event => change(row.id, event.target.checked, row.name)}/>
        <label htmlFor={prefix+i}>{row.name}<small className="d-block text-muted">{currentDisabled.includes(row.id) ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</small></label>
      </div>
    </div>)}</div>
    {message && <p role="status">{message}</p>}
    {!canManage && <p className="small">เฉพาะผู้ดูแลระบบส่วนกลางที่จัดการสถานะหมวดหมู่ได้</p>}
  </fieldset>;
}
