'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { addBorrowDays, validateBorrowDates } from '@/lib/borrow-rules';
import { historyDate } from '@/lib/history-logic';

type Action = 'borrow' | 'request-return' | 'approve-user-return' | 'owner-direct-return';
const labels = { borrow: 'ยืนยันการยืม', 'request-return': 'แจ้งส่งคืน', 'approve-user-return': 'ยืนยันรับคืน', 'owner-direct-return': 'รับคืนโดยเจ้าของ' };

export function BorrowForm({ action, asset, loan, today, name, department, rank, email }: {
  action: Action; asset: string; loan: string; today: string; name: string; department: string; rank: string; email: string;
}) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [start, setStart] = useState(today);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<{id:string;status:string} | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || receipt) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const invalid = action === 'borrow' ? validateBorrowDates(fields.start, fields.end, today) : '';
    if (invalid) { setMessage(invalid); return; }
    const confirm = action === 'borrow' ? `${labels[action]} ตั้งแต่ ${fields.start} ถึง ${fields.end} หรือไม่?` : `${labels[action]}รายการนี้หรือไม่?`;
    if (!window.confirm(confirm)) return;
    inFlight.current = true;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/user/borrow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, action, asset, ...(action !== 'borrow' ? {loan, detail: fields.detail ?? ''} : {}) }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') {
        setMessage(result.message || 'ทำรายการไม่สำเร็จ');
      } else setReceipt({ id: result.id, status: result.status });
    } catch { setMessage('ยืนยันผลไม่ได้ กรุณาตรวจรายการก่อนส่งใหม่'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (receipt) return <div className="alert alert-success mb-0" role="status">
    <strong>{receipt.status === 'borrowed' ? 'ยืมครุภัณฑ์สำเร็จ' : receipt.status === 'pending_return' ? 'แจ้งคืนแล้ว รอเจ้าของรับคืน' : 'รับคืนครุภัณฑ์แล้ว'}</strong>
    <p className="mb-2">รหัสอ้างอิง {receipt.id}</p>
    <Link href="/user/borrowed" className="btn btn-outline-success me-2">ดูรายการยืมของฉัน</Link>
    <button type="button" className="btn btn-outline-secondary" onClick={() => router.refresh()}>โหลดสถานะล่าสุด</button>
  </div>;
  return <form method="post" onSubmit={submit} aria-busy={busy}>
    {message && <p className="alert alert-danger" role="alert">{message}</p>}
    <fieldset disabled={busy}>
      {action === 'borrow' ? <>
        <div className="user-grid mb-3">
          <label>ผู้ยืม<input className="form-control mt-1" value={name} readOnly/></label>
          <label>แผนก / หน่วยงาน<input className="form-control mt-1" name="department" defaultValue={department} maxLength={255}/></label>
          <label>ตำแหน่ง<input className="form-control mt-1" name="rank" defaultValue={rank} maxLength={255}/></label>
          <label>อีเมลติดต่อ<input className="form-control mt-1" type="email" name="email" defaultValue={email} maxLength={150}/></label>
          <label>วันที่เริ่มยืม *<input className="form-control mt-1" type="date" name="start" min={today} max={addBorrowDays(today, 30)} required value={start} onChange={e => setStart(e.target.value)}/></label>
          <label>กำหนดส่งคืน *<input className="form-control mt-1" type="date" name="end" min={start || today} max={addBorrowDays(historyDate(start) !== null ? start : today, 365)} defaultValue={addBorrowDays(today, 7)} required/></label>
        </div>
        <label className="d-block mb-3">วัตถุประสงค์ / หมายเหตุ<textarea className="form-control mt-1" name="purpose" defaultValue="ใช้ในการปฏิบัติงาน" rows={3} maxLength={1000}/></label>
        <p className="small text-secondary">จองล่วงหน้าได้ไม่เกิน 30 วัน และยืมได้ไม่เกิน 365 วัน</p>
      </> : action === 'request-return' ? <label className="d-block mb-3">สภาพครุภัณฑ์หรือข้อความถึงผู้รับคืน
        <textarea className="form-control mt-1" name="detail" defaultValue="ส่งคืนตามกำหนด" rows={2} maxLength={1000}/>
      </label> : <p>ยืนยันเมื่อได้รับครุภัณฑ์คืนแล้ว</p>}
      <div className="d-grid gap-2"><button className={`btn btn-lg fw-bold ${action === 'borrow' ? 'btn-primary' : action === 'request-return' ? 'btn-warning' : 'btn-success'}`}>{busy ? 'กำลังบันทึก…' : labels[action]}</button>
        <Link href="/user/borrow" className="btn btn-outline-secondary">ยกเลิก</Link></div>
    </fieldset>
  </form>;
}
