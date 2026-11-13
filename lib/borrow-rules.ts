import { historyDate } from './history-logic';

const dayMs = 86400000;
export function addBorrowDays(day: string, days: number) {
  return new Date(historyDate(day)! + days * dayMs).toISOString().slice(0, 10);
}

export function validateBorrowDates(start: string, end: string, today: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const from = dateOnly.test(start) ? historyDate(start) : null;
  const to = dateOnly.test(end) ? historyDate(end) : null;
  if (from === null || to === null) return 'กรุณาระบุวันที่เริ่มยืมและกำหนดคืนที่ถูกต้อง';
  if (start < today) return 'วันที่เริ่มยืมต้องเป็นวันนี้หรือหลังจากนี้';
  if (start > addBorrowDays(today, 30)) return 'จองล่วงหน้าได้ไม่เกิน 30 วัน';
  if (to < from) return 'กำหนดคืนต้องไม่อยู่ก่อนวันที่เริ่มยืม';
  if (to - from > 365 * dayMs) return 'ยืมได้ไม่เกิน 365 วัน';
  return '';
}
