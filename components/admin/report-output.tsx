'use client';

import { Icon } from './icon';

type ReportRow = Record<string, string | number | null>;

function csvCell(value: string | number | null) {
  const raw = String(value ?? '');
  const safe = typeof value === 'string' && /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function ReportOutput(props: { summary: ReportRow; categories: ReportRow[] } | { overdue: ReportRow[] } | { ranking: { items: ReportRow[]; users: ReportRow[] } }) {
  function exportCsv() {
    const rows = 'overdue' in props ? [
      ['ลำดับ', 'หมายเลขครุภัณฑ์', 'รายการครุภัณฑ์', 'ผู้ยืม', 'วันที่ยืม', 'กำหนดส่งคืน', 'จำนวนวันเกินกำหนด'],
      ...props.overdue.map((row, i) => [i + 1, String(row.number ?? '').replace(/^['"]+|['"]+$/g, ''), row.name, row.borrower, row.borrowed, row.due, row.days]),
    ] : 'ranking' in props ? [
      ['อันดับ', 'หมายเลขครุภัณฑ์', 'ชื่อครุภัณฑ์', 'จำนวนครั้งที่ยืม'],
      ...props.ranking.items.map((row, i) => [i + 1, row.number, row.name, row.total]),
      [],
      ['อันดับ', 'ชื่อผู้ยืม', 'แผนก', 'จำนวนครั้งที่ยืม'],
      ...props.ranking.users.map((row, i) => [i + 1, row.name, row.department, row.total]),
    ] : [
      ['สถานะ', 'จำนวน'],
      ...Object.entries(props.summary),
      [],
      ['หมวดหมู่', 'จำนวน', 'มูลค่ารวม (บาท)'],
      ...props.categories.map(({ category, total, value }) => [category, total, value]),
    ];
    const file = new Blob(['\uFEFF', rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'overdue' in props ? 'overdue-report.csv' : 'ranking' in props ? 'loan-rankings.csv' : 'daam-report.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="d-print-none d-flex gap-2 ms-lg-auto">
    <button type="button" className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => window.print()}><Icon name="file-pdf" className="me-1"/>Export เป็น PDF</button>
    <button type="button" className="btn btn-outline-success btn-sm rounded-pill px-3" title="ดาวน์โหลด CSV สำหรับเปิดใน Excel" onClick={exportCsv}><Icon name="file-excel" className="me-1"/>Export เป็น Excel</button>
  </div>;
}
