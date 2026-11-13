'use client';
import { useRef, useState, type FormEvent } from 'react';
import { Icon } from './icon';
import { useRouter } from 'next/navigation';

export function AssetStatusForm({id,name,initialDamaged=false}:{id:string;name:string;initialDamaged?:boolean}) {
 const router=useRouter();
 const [damaged,setDamaged]=useState(initialDamaged);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const sending=useRef(false);

 async function save(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(sending.current||!window.confirm(`ยืนยันเปลี่ยนสถานะ ${name} (${id})?`))return;
  const form=new FormData(event.currentTarget);
  const repairNote=damaged?String(form.get('note')??'').trim():'';
  const repairPrice=damaged?Number(form.get('price')??0):0;
  if(repairPrice>0&&!repairNote){setMessage('กรุณาระบุรายละเอียดการซ่อมเมื่อกรอกค่าซ่อม');return;}
  sending.current=true;setBusy(true);setMessage('');
  try {
   const response=await fetch('/api/admin/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:damaged?'asset-damaged':'asset-ready',id,repairNote,repairPrice})});
   const result=await response.json();
   if(response.ok&&result.ok){setMessage('บันทึกสถานะเรียบร้อยแล้ว');router.refresh();}
   else setMessage(({ACTIVE_LOAN:'ครุภัณฑ์ยังมีรายการยืมหรือรอรับคืน',FORBIDDEN:'ไม่มีสิทธิ์แก้ไขรายการนี้',SESSION_EXPIRED:'กรุณาเข้าสู่ระบบใหม่',WRITES_DISABLED:'ยังไม่เปิดการบันทึกข้อมูล',INVALID_INPUT:'ข้อมูลการซ่อมไม่ถูกต้อง'} as Record<string,string>)[result.code]??'บันทึกไม่สำเร็จ');
  } catch {setMessage('ยืนยันผลไม่ได้ กรุณาตรวจสอบรายการก่อนบันทึกซ้ำ');}
  finally {sending.current=false;setBusy(false);}
 }
 return <form onSubmit={save}><div className="border rounded-3 bg-light p-3 mb-3"><strong><Icon name="box" className="text-primary me-2"/>{name}</strong><div className="small text-muted ms-4 mt-1">รหัสครุภัณฑ์: {id}</div></div>
 <fieldset disabled={busy}><div className="small fw-bold text-secondary mb-2">เลือกสถานะใหม่:</div><div className="row g-2 mb-3">{[false,true].map(value=><div className="col-6" key={String(value)}><label className={`w-100 text-center rounded border p-3 ${value?(damaged?'bg-danger text-white border-danger':'text-danger border-danger'):(!damaged?'bg-success text-white border-success':'text-success border-success')}`} style={{cursor:'pointer'}}><input className="visually-hidden" type="radio" name="status" checked={damaged===value} onChange={()=>setDamaged(value)}/><Icon name={value?'triangle-exclamation':'circle-check'} className="fs-4 d-block mb-2"/><strong>{value?'ชำรุด / ไม่พร้อม':'พร้อมใช้งาน'}</strong><small className="d-block opacity-75">{value?'ส่งซ่อม/ระงับยืม':'สภาพดี ยืมได้'}</small></label></div>)}</div>
 {damaged&&<div className="bg-danger-subtle rounded p-3 mb-3"><h6 className="text-danger fw-bold"><Icon name="screwdriver-wrench" className="me-1"/>บันทึกประวัติการชำรุด / ส่งซ่อม</h6><label className="form-label w-100 small fw-semibold">รายละเอียดอาการชำรุด / หมายเหตุ:<textarea name="note" maxLength={2000} className="form-control mt-1" placeholder="ระบุอาการชำรุด หรือรายละเอียดการส่งซ่อม (ถ้ามี)" rows={2}/></label><label className="form-label w-100 small fw-semibold">ประมาณการค่าซ่อม (บาท):<input name="price" type="number" min="0" max="999999999" step="0.01" defaultValue="0.00" className="form-control mt-1"/></label><small className="text-muted">* ข้อมูลนี้จะถูกบันทึกเข้าตารางประวัติการซ่อมบำรุงโดยอัตโนมัติเมื่อระบุรายละเอียด</small></div>}
 <div className="border-top pt-3 d-flex justify-content-end"><button className="btn btn-primary rounded-pill" type="submit"><Icon name="floppy-disk" className="me-1"/>{busy?'กำลังบันทึก…':'บันทึกสถานะ'}</button></div></fieldset>{message&&<p role="status" className="mt-2">{message}</p>}</form>;
}
