import { historyDate } from './history-logic';
import type { CatalogRow } from './sqlite/catalog';

const escape = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function historyEmail(row: CatalogRow, today: string, sender: string) {
  const due = historyDate(row.due), now = historyDate(today);
  const days = due === null || now === null ? null : (due - now) / 86400000;
  const overdue = days !== null && days < 0;
  const title = overdue ? 'หนังสือแจ้งเตือน: เลยกำหนดส่งคืนครุภัณฑ์' : 'หนังสือแจ้งเตือน: กำหนดส่งคืนครุภัณฑ์';
  const status = days === null ? 'ไม่ระบุวันครบกำหนด' : overdue ? `เลยกำหนดคืน ${-days} วัน` : days === 0 ? 'ครบกำหนดส่งคืนวันนี้' : `เหลือเวลาอีก ${days} วัน`;
  const subject = `${overdue ? '⚠️ [ทวงคืน] เลยกำหนดส่งคืน' : '📋 [แจ้งเตือน] กำหนดส่งคืน'}ครุภัณฑ์: ${row.name} (ครบกำหนด ${row.due ?? '—'})`.replace(/[\r\n]/g, ' ');
  const details = [['รหัสรายการยืม',row.id],['หมายเลขครุภัณฑ์',row.number],['ชื่อครุภัณฑ์',row.name],['วันที่ยืม',row.borrowed],['กำหนดส่งคืน',row.due],['สถานะกำหนดคืน',status]];
  const html = `<div style="font-family:Arial,sans-serif;color:#172554;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:${overdue?'#b91c1c':'#1d4ed8'};color:#fff;padding:22px"><strong>▣ ระบบบริหารจัดการครุภัณฑ์</strong><div>${escape(sender)}</div><p>${title} · ${escape(today)}</p></div><div style="padding:22px"><p><strong>เรียน</strong> ${escape(row.borrower)} &lt;${escape(row.email||'ไม่มีอีเมล')}&gt;<br><strong>เรื่อง</strong> ${escape(subject)}<br><strong>จาก</strong> ${escape(sender)}</p><p>ตามที่ท่านได้ดำเนินการยืมพัสดุ/ครุภัณฑ์จากระบบบริหารจัดการครุภัณฑ์ ขอเรียนแจ้งเตือนว่า ${escape(status)} โดยมีรายละเอียดดังนี้</p><table style="width:100%;background:#eff6ff;border-radius:8px;border-collapse:collapse">${details.map(([key,value])=>`<tr><th scope="row" style="text-align:left;padding:10px 14px">${key}</th><td style="padding:10px 14px">${escape(value)}</td></tr>`).join('')}</table><p>จึงเรียนมาเพื่อโปรดนำครุภัณฑ์มาส่งมอบคืน ณ งานพัสดุและครุภัณฑ์ หรือติดต่อประสานงานเจ้าหน้าที่ผู้ดูแลระบบ${overdue?'โดยเร็วที่สุด':''}</p><p>ขอแสดงความนับถือ<br><strong>${escape(sender)}</strong></p></div></div>`;
  return {html,subject,days};
}
