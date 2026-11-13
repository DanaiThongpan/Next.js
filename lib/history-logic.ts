import type { CatalogRow } from './sqlite/catalog';
export function historyDate(value:unknown){const match=/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/.exec(String(value??''));if(!match)return null;const [y,m,d]=match.slice(1).map(Number);const time=Date.UTC(y,m-1,d);const date=new Date(time);return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?time:null;}
export function historyState(row: CatalogRow, today: string) {
  const pending = row.status === 'pending_return';
  const back = String(row.returned ?? '');
  const returned = row.status === 'returned' ||
    (!pending && back !== '' && back !== '0' && !back.startsWith('0000-00-00'));
  const due = historyDate(row.due);
  const actual = historyDate(row.returned);
  const now = historyDate(today);
  const check = returned ? actual : pending ? actual ?? now : now;
  const delta = due === null || check === null ? null : Math.floor((check - due) / 86400000);
  const late = delta !== null && delta > 0;

  if (returned) {
    let detail = 'ส่งตามกำหนด';
    if (due === null) detail = 'ไม่ระบุวันครบกำหนด';
    else if (actual === null) detail = 'ไม่ระบุวันที่คืนจริง';
    else if (late) detail = `คืนช้ากว่ากำหนด ${delta} วัน`;
    else if (delta !== null && delta < 0) detail = `ส่งคืนก่อนกำหนด ${-delta} วัน`;
    return { label: delta === null ? 'คืนแล้ว' : late ? 'คืนเกินเวลา' : 'คืนตรงเวลา', detail, color: late ? 'warning' : 'success' };
  }
  if (pending) return {
    label: late ? 'รออนุมัติคืน (เกินเวลา)' : 'รออนุมัติคืน',
    detail: late ? `คืนช้ากว่ากำหนด ${delta} วัน` : 'รอการตรวจสอบการคืน',
    color: 'info',
  };
  let detail = 'ไม่ระบุวันครบกำหนด';
  if (delta !== null) {
    if (late) detail = `เกินกำหนด ${delta} วัน`;
    else if (delta === 0) detail = 'ครบกำหนดวันนี้';
    else detail = `เหลืออีก ${-delta} วัน`;
  }
  return { label: late ? 'เลยกำหนดคืน' : 'กำลังยืม', detail, color: late ? 'danger' : 'primary' };
}
export function displayHistoryDate(value: unknown) {
  const day = historyDate(value);
  return day === null ? '—' : new Date(day).toISOString().slice(0, 10);
}
export function historyAvatar(name:string){let crc=0xffffffff;for(const byte of new TextEncoder().encode(name)){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const value=(crc^0xffffffff)>>>0;return ['bg-primary','bg-info','bg-success','bg-secondary','bg-dark'][value%5];}
