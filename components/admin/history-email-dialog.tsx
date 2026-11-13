'use client';
import { useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';

type Preview = {
  html: string;
  token: string;
  disabled: string;
  uncertain: boolean;
  sentToday: number;
  history: { sentAt: string; recipient: string }[];
};

export function HistoryEmailDialog({id,label,sendLabel}:{id:string;label:string;sendLabel:string}){
 const ref=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLElement|null>(null);
 const previousOverflow=useRef('');
 const inFlight=useRef(false);
 const router=useRouter();
 const [preview,setPreview]=useState<Preview|null>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const sentTotal = preview?.history.length ?? 0;
 const sentToday = preview?.sentToday ?? 0;
 const nextSendLabel = preview ? `ส่งวันนี้ครั้งที่ ${sentToday + 1}` : 'ส่งอีเมล';
 async function request(action:'preview'|'send'){
  if(inFlight.current)return;
  const confirmUncertain = action === 'send' && preview?.uncertain === true;
  if (confirmUncertain && !window.confirm('ยังยืนยันผลครั้งก่อนไม่ได้ หากส่งตอนนี้ผู้รับอาจได้รับอีเมลซ้ำ ต้องการส่งอีกครั้งหรือไม่?')) return;
  inFlight.current=true;setBusy(true);setMessage('');
  try{
   const fetchReminder = async (payload: object) => {
    const response = await fetch('/api/admin/history-reminder', {
     method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,...payload}),
    });
    return response.json();
   };
   const result = await fetchReminder({action,previewToken:preview?.token,confirmUncertain});
   if (action === 'preview') {
    if (result.ok) setPreview(result);
    else setMessage(result.message || 'เปิดตัวอย่างอีเมลไม่สำเร็จ');
   } else {
    setMessage(result.message || 'ดำเนินการไม่สำเร็จ');
    setPreview(null);
    if (result.sent) router.refresh();
    const refreshed = await fetchReminder({action:'preview'}).catch(() => null);
    if (refreshed?.ok) setPreview(refreshed);
   }
  }catch{if(action==='send')setPreview(null);setMessage('ไม่สามารถยืนยันผลได้ กรุณาตรวจประวัติก่อนลองอีกครั้ง');}
  finally{inFlight.current=false;setBusy(false);}
 }
 function open(){
  if(!ref.current||ref.current.open)return;
  trigger.current=document.activeElement as HTMLElement;
  previousOverflow.current=document.body.style.overflow;
  ref.current.showModal();document.body.style.overflow='hidden';
  setPreview(null);void request('preview');
 }
 return <><button type="button" className="btn btn-outline-primary btn-sm rounded-pill" onClick={open}><Icon name="eye" className="me-1"/>{label}</button><button type="button" className="btn btn-warning btn-sm rounded-pill" onClick={open}>{sendLabel}</button>
 <dialog
   ref={ref}
   className="history-email-dialog rounded-4 border-0 p-0 shadow"
   aria-labelledby={`history-email-title-${id}`}
   onClose={() => {
     document.body.style.overflow = previousOverflow.current;
     trigger.current?.focus();
   }}
 >
   <div className="history-email-layout">
     <header className="modal-header bg-dark text-white py-3 px-3 px-md-4 gap-3">
       <h2 id={`history-email-title-${id}`} className="modal-title h6 fw-bold mb-0">
         <Icon name="envelope-open-text" className="text-danger me-2"/>
         ตัวอย่างอีเมล <span className="fw-normal text-white-50">(Email Preview)</span>
       </h2>
       <button type="button" aria-label="ปิดตัวอย่างอีเมล" className="btn-close btn-close-white flex-shrink-0" onClick={() => ref.current?.close()}/>
     </header>
     <div className="history-email-body bg-light" aria-busy={busy}>
       {preview && <section className="bg-white border rounded p-3 mb-3 history-email-summary" aria-label="ประวัติการส่งอีเมล">
         <h3 className="h6 fw-bold">ประวัติการส่งอีเมล · {preview.history.length} ครั้งที่ยืนยันได้</h3>
         {preview.history.length > 0 ? <ol className="small mb-0 ps-4 overflow-auto" style={{ maxHeight: '10rem' }}>
           {preview.history.map((entry, index) => <li key={index} className="history-email-entry">
             <time dateTime={entry.sentAt.replace(' ', 'T')}>{entry.sentAt}</time>
             {entry.recipient && <span className="text-secondary">{entry.recipient}</span>}
           </li>)}
         </ol> : <p className="small text-secondary mb-0">ยังไม่พบประวัติการส่งที่ยืนยันได้</p>}
         {preview.history.length > 0 && <p className="small text-secondary mt-2 mb-0">เวลาไทย (UTC+7)</p>}
         {preview.uncertain && <p className="small text-danger mt-2 mb-0">ยังยืนยันผลครั้งก่อนไม่ได้ การส่งอีกครั้งอาจทำให้ผู้รับได้รับอีเมลซ้ำ</p>}
       </section>}
       {preview && <div className="history-email-content" dangerouslySetInnerHTML={{ __html: preview.html }}/>}
       {busy && <p role="status" className="text-secondary mb-0 mt-2">กำลังดำเนินการ…</p>}
       {preview?.disabled && <p className="alert alert-warning mt-3 mb-0">{preview.disabled}</p>}
       {message && <p role="status" className="alert alert-info mt-3 mb-0">{message}</p>}
     </div>
     <footer className="history-email-footer bg-white border-top">
       {preview && <p className="small text-secondary mb-0 me-auto" aria-live="polite">
         ส่งไปแล้ว <strong className="text-dark">{sentTotal} ครั้ง</strong> · วันนี้ {sentToday} ครั้ง
       </p>}
       <div className="history-email-actions">
       <button type="button" className="btn btn-outline-secondary" onClick={() => ref.current?.close()}>ปิด</button>
       <button type="button" className="btn btn-primary" disabled={busy || !preview || Boolean(preview.disabled)} onClick={() => void request('send')}>
         <Icon name="paper-plane" className="me-1"/>{nextSendLabel}
       </button>
       </div>
     </footer>
   </div>
 </dialog>
 <style>{`
   .history-email-dialog {
     position: fixed;
     inset: 0;
     margin: auto;
     width: min(860px, calc(100% - 1.5rem));
     max-height: min(90dvh, 900px);
     overflow: hidden;
     text-align: start;
   }
   .history-email-dialog::backdrop { background: rgba(0,0,0,.55); }
   .history-email-layout {
     display: flex;
     flex-direction: column;
     max-height: min(90dvh, 900px);
   }
   .history-email-layout > header, .history-email-layout > footer { flex: 0 0 auto; }
   .history-email-body {
     min-height: 0;
     min-width: 0;
     padding: clamp(.75rem, 2vw, 1.25rem);
     overflow-y: auto;
     overscroll-behavior: contain;
     overflow-wrap: anywhere;
   }
   .history-email-content, .history-email-content td, .history-email-content th { text-align: start; }
   .history-email-content { min-width: 0; font-size: .925rem; }
   .history-email-content > div > div { padding: clamp(.75rem, 2.4vw, 1.125rem) !important; }
   .history-email-content table { margin-block: .75rem; table-layout: fixed; }
   .history-email-content th { width: 37%; }
   .history-email-content td, .history-email-content th {
     padding: .45rem clamp(.4rem, 1.5vw, .875rem) !important;
     vertical-align: top;
     overflow-wrap: anywhere;
   }
   .history-email-entry { overflow-wrap: anywhere; }
   .history-email-entry time { margin-inline-end: .65rem; }
   .history-email-footer, .history-email-actions {
     display: flex;
     align-items: center;
     flex-wrap: wrap;
     gap: .5rem;
   }
   .history-email-footer { padding: .75rem; }
   .history-email-actions { margin-inline-start: auto; }
 `}</style></>;
}
