'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Icon } from './icon';
import type { CatalogRow } from '@/lib/sqlite/catalog';

export function RepairForm({ row, assets=[] }: { row?: CatalogRow; assets?:CatalogRow[] }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/repairs', { method: 'POST', body: new FormData(form) });
      if (!response.ok) {
        setMessage('บันทึกไม่ได้ กรุณาตรวจรหัสรายการ รหัสครุภัณฑ์ และสิทธิ์การเขียน');
        return;
      }
      form.reset();
      setMessage('บันทึกการซ่อมแล้ว');
      router.refresh();
    } catch {
      setMessage('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setBusy(false);
    }
  }
  return <><button type="button" className={row?'btn btn-warning btn-sm':'btn btn-primary rounded-pill px-3'} onClick={()=>{setMessage('');dialog.current?.showModal();}}><Icon name={row?'pen-to-square':'plus'} className="me-1"/>{row?'แก้ไข':'บันทึกการซ่อมใหม่'}</button><dialog ref={dialog} className="border-0 rounded-4 p-0 shadow-lg text-start" aria-label="บันทึกข้อมูลการซ่อมบำรุง" style={{position:'fixed',inset:0,margin:'auto',width:'min(800px,94vw)',maxHeight:'90dvh',overflow:'auto'}} onCancel={e=>{if(busy)e.preventDefault();}}><div className="modal-header border-bottom py-3 px-4 bg-light"><div className="d-flex align-items-center gap-2"><span className="bg-primary-subtle text-primary rounded-3 p-2"><Icon name="wrench"/></span><div><h5 className="fw-bold text-dark mb-0">{row?'แก้ไขบันทึกการซ่อมบำรุง':'เพิ่มบันทึกการซ่อมบำรุงใหม่'}</h5><small className="text-muted">บันทึกรายละเอียดงานซ่อมและค่าใช้จ่ายของครุภัณฑ์</small></div></div><button type="button" disabled={busy} className="btn-close" aria-label="ปิด" onClick={()=>dialog.current?.close()}/></div><form onSubmit={save}><div className="p-4">
    <fieldset disabled={busy}>
      <input type="hidden" name="id" value={String(row?.id ?? '')}/>
      <label className="form-label w-100 fw-bold text-secondary small mb-3"><Icon name="barcode" className="text-primary me-1"/>เลือกครุภัณฑ์ที่ทำการซ่อม: <span className="text-danger">*</span><select name="asset" defaultValue={String(row?.assetId??'')} required className="form-select mt-2"><option value="">-- กรุณาเลือกครุภัณฑ์ --</option>{row&&!assets.some(a=>String(a.id)===String(row.assetId))&&<option value={String(row.assetId)}>{row.number} - {row.name}</option>}{assets.map(a=><option key={String(a.id)} value={String(a.id)}>{a.number} - {a.name} ({a.department||'ส่วนกลาง'})</option>)}</select></label>
      <div className="row g-3">
        <label className="col-md-6 form-label"><Icon name="calendar" className="text-success me-1"/>วันที่ดำเนินการซ่อม: <span className="text-danger">*</span><input name="date" defaultValue={String(row?.date ?? new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok'}).format(new Date())).slice(0,10)} type="date" required className="form-control"/></label>
        <label className="col-md-6 form-label"><Icon name="money-bill" className="text-danger me-1"/>ค่าใช้จ่าย (บาท): <span className="text-danger">*</span><input name="cost" type="number" min="0" max="999999999.99" step="0.01" defaultValue={String(row?.cost ?? 0)} required className="form-control"/></label>
      </div>
      <label className="form-label w-100 mt-3">รายการซ่อมบำรุง / อาการเสีย / การเปลี่ยนอะไหล่: <span className="text-danger">*</span><textarea placeholder="ระบุรายละเอียดอาการเสีย งานที่ทำ หรืออะไหล่ที่เปลี่ยน..." name="description" defaultValue={String(row?.description ?? '')} required maxLength={2000} className="form-control" rows={3}/></label>

    </fieldset>
    {message && <p role="status" className="mt-3">{message}</p>}
  </div><div className="modal-footer bg-light border-top py-2 px-4 gap-2"><button type="button" className="btn btn-secondary rounded-pill px-3" disabled={busy} onClick={()=>dialog.current?.close()}>× ยกเลิก</button><button disabled={busy} className="btn btn-primary rounded-pill px-3"><Icon name="floppy-disk" className="me-1"/>{busy?'กำลังบันทึก…':'บันทึกข้อมูล'}</button></div></form></dialog></>;
}
