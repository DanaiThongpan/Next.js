'use client';
import { useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CatalogRow } from '@/lib/sqlite/catalog';
import { Icon } from './icon';

export function UserEditor({row,self,global}:{row:CatalogRow;self:boolean;global:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);const router=useRouter();
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');setSaved(false);
  const data=new FormData(event.currentTarget);const body:Record<string,string>={id:String(row.id)};
  for(const key of ['name','rank','department','email','role','active','password'])body[key]=String(data.get(key)??row[key]??'');
  try{const response=await fetch('/api/admin/user-edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok){setError(response.status===403?'ไม่มีสิทธิ์แก้ไขบัญชีนี้ หรือบัญชีอยู่นอกแผนกของคุณ':response.status===400?'กรุณาตรวจสอบข้อมูล อีเมล และรหัสผ่าน (8 ตัวอักษรขึ้นไป ไม่เกิน 72 ไบต์)':response.status===401?'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่':'บันทึกไม่สำเร็จ กรุณาตรวจสอบการเปิดใช้งานเขียน SQLite');return;}const result=await response.json();if(result.reauthenticate){router.replace('/login');router.refresh();return;}setSaved(true);router.refresh();}catch{setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง');}finally{setBusy(false);}
 }
 return <><button type="button" className="btn btn-warning btn-sm btn-action text-white" title="แก้ไขข้อมูลผู้ใช้" aria-label="แก้ไขข้อมูลผู้ใช้" onClick={()=>{setError('');setSaved(false);dialog.current?.showModal();}}><Icon name="pen-to-square"/></button>
 <dialog ref={dialog} aria-label="แก้ไขข้อมูลผู้ใช้" className="border-0 rounded-4 p-0 shadow text-start" style={{position:'fixed',inset:0,margin:'auto',width:'min(720px,94vw)',maxHeight:'90dvh',overflow:'auto'}} onCancel={e=>{if(busy)e.preventDefault();}}>
 <form onSubmit={submit}><div className="modal-header bg-warning-subtle border-bottom px-4 py-3"><h5 className="fw-bold mb-0"><Icon name="user-pen" className="me-2"/>แก้ไขข้อมูลผู้ใช้</h5><button type="button" className="btn-close" disabled={busy} aria-label="ปิด" onClick={()=>dialog.current?.close()}/></div>
 <div className="p-4">{error&&<div className="alert alert-danger" role="alert">{error}</div>}{saved&&<div className="alert alert-success" role="status">บันทึกข้อมูลเรียบร้อยแล้ว</div>}<div className="row g-3">
 <div className="col-12"><label className="form-label fw-semibold">ไอดี (Username)</label><input className="form-control bg-light" value={String(row.id)} readOnly/></div>
 {([['name','ชื่อ - นามสกุล'],['rank','ตำแหน่ง'],['department','สังกัด / แผนก'],['email','อีเมล']] as const).map(([key,label])=><label key={key} className="col-md-6">{label}<input name={key} className="form-control mt-1" type={key==='email'?'email':'text'} defaultValue={String(row[key]??'')} required={key==='name'} maxLength={500} readOnly={(key==='department'&&!global)||(key==='email'&&self)}/></label>)}
 <label className="col-md-6">ระดับสิทธิ์<select name="role" className="form-select mt-1" defaultValue={String(row.role)} disabled={self}><option value="UT00000002">User (ผู้ใช้งานทั่วไป)</option><option value="UT00000001">Admin (ผู้ดูแลระบบ)</option></select></label>
 <label className="col-md-6">สถานะ<select name="active" className="form-select mt-1" defaultValue={String(row.active)} disabled={self}><option value="1">ใช้งานได้ (Active)</option><option value="0">ระงับใช้งาน (Disabled)</option></select></label>
 <label className="col-12">รหัสผ่านใหม่<input name="password" className="form-control mt-1" type="password" autoComplete="new-password" minLength={8} maxLength={72}/><span className="form-text">เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน</span></label>
 {self&&<p className="small text-muted mb-0">ไม่สามารถเปลี่ยนสิทธิ์ สถานะ และอีเมลของบัญชีตนเองได้</p>}</div></div>
 <div className="modal-footer border-top bg-light p-3 gap-2"><button type="button" disabled={busy} className="btn btn-secondary" onClick={()=>dialog.current?.close()}>ปิด</button><button disabled={busy} className="btn btn-primary">{busy?'กำลังบันทึก…':'บันทึกการเปลี่ยนแปลง'}</button></div></form></dialog></>;
}
