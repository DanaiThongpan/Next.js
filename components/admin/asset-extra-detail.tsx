'use client';
import { useEffect,useState } from 'react';
type Loan={borrower:string|null;borrowed:string|null;due:string|null;returned?:string|null};
type Detail={location:string|null;active:Loan|null;history:Loan[]};
export function AssetExtraDetail({id}:{id:string}){
 const [data,setData]=useState<Detail|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/admin/asset-detail?id='+encodeURIComponent(id),{signal:controller.signal})
   .then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.message);return result as Detail;})
   .then(setData).catch(e=>{if(!controller.signal.aborted)setError(e.message||'อ่านรายละเอียดไม่สำเร็จ');});
  return ()=>controller.abort();
 },[id]);
 if(error)return <p role="alert" className="alert alert-danger">{error}</p>;
 if(!data)return <p role="status">กำลังโหลดประวัติการยืม–คืน…</p>;
 return <section className="mt-3"><p>จุดติดตั้ง: {data.location||'—'}</p>
 {data.active&&<p className="alert alert-warning">ผู้ยืมปัจจุบัน {data.active.borrower||'—'} · ยืม {data.active.borrowed||'—'} · กำหนดคืน {data.active.due||'—'}</p>}
 <h6 className="fw-bold">ประวัติการทำรายการยืม-คืนล่าสุด (Recent Borrow Records)</h6>
 {data.history.length?<div className="table-responsive"><table className="table table-sm"><thead><tr><th>วันที่ยืม</th><th>ผู้ยืม</th><th>กำหนดคืน</th><th>วันที่คืน</th></tr></thead><tbody>{data.history.map((r,i)=><tr key={i}><td>{r.borrowed||'—'}</td><td>{r.borrower||'—'}</td><td>{r.due||'—'}</td><td className={!r.returned?'text-danger fw-bold':''}>{r.returned||'ยังไม่ส่งคืน'}</td></tr>)}</tbody></table></div>:<p className="text-muted">ไม่มีประวัติการยืม–คืน</p>}</section>;
}
