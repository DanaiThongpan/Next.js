'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { csvColumns, csvMaxBytes, type CsvDuplicate, type CsvIssue, type CsvRow } from '@/lib/csv-import-format';

type Preview = {
  total: number; valid: number; invalid: number; duplicates: number;
  token: string; rows: CsvRow[]; issues: CsvIssue[];
  skippedRows: { row: number; number: string; duplicate: CsvDuplicate }[];
};
type Receipt = { batchId: string; inserted: number; skipped: number };
const duplicateLabel = { existing: 'ซ้ำในระบบ', 'in-file': 'ซ้ำในไฟล์', both: 'ซ้ำทั้งในระบบและในไฟล์' };

export function RequestCsvForm({ ready, hasDepartment }: { ready: boolean; hasDepartment: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [working, setWorking] = useState<'preview' | 'commit' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState('');
  const [issueLimit, setIssueLimit] = useState(50);
  const [skipLimit, setSkipLimit] = useState(50);

  function choose(selected: File | null) {
    if (busy.current) return;
    setPreview(null);
    setReceipt(null);
    setIssueLimit(50);
    setSkipLimit(50);
    setFile(null);
    const error = selected && (!/\.csv$/i.test(selected.name) ? 'กรุณาเลือกไฟล์ .csv' :
      selected.size > csvMaxBytes ? 'ไฟล์มีขนาดเกิน 5 MB' : !selected.size ? 'ไฟล์ว่าง' : '');
    setMessage(error || '');
    if (!error) setFile(selected);
    if ((!selected || error) && input.current) input.current.value = '';
  }

  async function send(action: 'preview' | 'commit') {
    if (!file || !hasDepartment || busy.current || (action === 'commit' && (!ready || !preview?.valid || preview.invalid))) return;
    busy.current = true;
    setWorking(action);
    setMessage('');
    setReceipt(null);
    setPreview(null);
    setIssueLimit(50);
    setSkipLimit(50);
    try {
      const query = new URLSearchParams({ action, filename: file.name });
      const response = await fetch('/api/user/request-csv?' + query, {
        method: 'POST', body: file, headers: {
          'Content-Type': 'text/csv',
          ...(action === 'commit' && preview ? { 'X-CSV-Preview': preview.token } : {}),
        },
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      if (action === 'preview' && typeof result.token === 'string' && Array.isArray(result.rows)) setPreview(result);
      else if (action === 'commit' && response.status === 201 && typeof result.batchId === 'string' && result.inserted > 0) {
        setReceipt(result);
        setFile(null);
        if (input.current) input.current.value = '';
      } else setMessage('ยืนยันผลไม่ได้ กรุณาตรวจประวัติคำขอก่อนส่งอีกครั้ง');
    } catch {
      setMessage(action === 'commit' ? 'การเชื่อมต่อขัดข้อง กรุณาตรวจประวัติคำขอก่อนส่งอีกครั้ง' :
        'การเชื่อมต่อขัดข้อง กรุณาลองตรวจไฟล์อีกครั้ง');
    } finally {
      busy.current = false;
      setWorking(null);
    }
  }

  const badRows = new Set(preview?.issues.map(issue => issue.row));
  return <section className="user-panel">
    <header><h2>2. ตรวจไฟล์และส่งคำขอ</h2></header>
    <div className="user-form">
      {!hasDepartment && <p role="status" className="alert alert-warning">บัญชีนี้ยังไม่มีสังกัด กรุณาติดต่อผู้ดูแลก่อนส่งคำขอ</p>}
      {hasDepartment && !ready && <p role="status" className="alert alert-warning">ตรวจไฟล์ได้ แต่ยังส่งคำขอไม่ได้จนกว่าจะเปิดใช้ฐานข้อมูลแยกและตารางประวัติ</p>}
      <label className="form-label fw-semibold" htmlFor="user-request-file">เลือกไฟล์ CSV</label>
      <input id="user-request-file" type="file" accept=".csv,text/csv" ref={input} disabled={Boolean(working)}
        aria-describedby="user-request-file-hint" className="form-control" onChange={e => choose(e.target.files?.[0] ?? null)}/>
      <p className="small text-secondary mt-2" id="user-request-file-hint">รองรับ UTF-8 ขนาดไม่เกิน 5 MB และ 10,000 แถว</p>
      {file && <p className="user-csv-break">{file.name} · {file.size.toLocaleString('th-TH')} ไบต์</p>}
      <div className="user-data-actions mb-3">
        <button type="button" className="btn btn-outline-primary" disabled={!file || !hasDepartment || Boolean(working)} onClick={() => send('preview')}>ตรวจสอบข้อมูล</button>
        {file && <button type="button" className="btn btn-outline-secondary" disabled={Boolean(working)} onClick={() => choose(null)}>ล้างไฟล์</button>}
      </div>
      {working && <p role="status">{working === 'preview' ? 'กำลังตรวจสอบข้อมูล…' : 'กำลังบันทึกคำขอ…'}</p>}
      {message && <p role="alert" className="alert alert-danger">{message}</p>}
      {receipt && <div role="status" className="alert alert-success user-csv-break">
        <strong>ส่งคำขอแล้ว {receipt.inserted} รายการ · รออนุมัติ</strong>
        <div>เลขอ้างอิงชุดคำขอ: {receipt.batchId}</div>
        {receipt.skipped > 0 && <div>ข้ามรายการซ้ำ {receipt.skipped} แถว</div>}
        <Link href={'/user/request-history?' + new URLSearchParams({q: receipt.batchId})} className="alert-link">ดูประวัติและสถานะ</Link>
      </div>}
      {preview && <>
        <h3 className="h6 fw-bold">ผลตรวจไฟล์</h3>
        <dl className="user-csv-stats" aria-live="polite">
          {[[preview.total, 'แถวทั้งหมด'], [preview.valid, 'พร้อมส่ง'], [preview.invalid, 'ต้องแก้ไข'], [preview.duplicates, 'ซ้ำ · ไม่บันทึก']].map(([count, label]) =>
            <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}
        </dl>
        {preview.issues.length > 0 && <details open className="user-csv-feedback">
          <summary>รายละเอียดข้อผิดพลาด ({preview.issues.length} ข้อ)</summary>
          <ul>{preview.issues.slice(0, issueLimit).map(issue =>
            <li key={issue.row + ':' + issue.field + ':' + issue.message}>แถว {issue.row} · {issue.field}: {issue.message}</li>)}</ul>
          {issueLimit < preview.issues.length && <button className="btn btn-sm btn-outline-secondary" onClick={() => setIssueLimit(n => n + 50)}>ดูข้อผิดพลาดเพิ่มเติม</button>}
        </details>}
        {preview.duplicates > 0 && <details className="user-csv-feedback">
          <summary>รายการซ้ำที่ระบบจะข้าม ({preview.duplicates} แถว)</summary>
          <ul>{preview.skippedRows.slice(0, skipLimit).map(row => <li key={row.row} className="user-csv-break">
            แถว {row.row} · {row.number} · {duplicateLabel[row.duplicate]}
          </li>)}</ul>
          {skipLimit < preview.skippedRows.length && <button className="btn btn-sm btn-outline-secondary" onClick={() => setSkipLimit(n => n + 50)}>ดูรายการซ้ำเพิ่มเติม</button>}
        </details>}
        <p className="small text-secondary">แสดง {preview.rows.length} จาก {preview.total} แถว · เลื่อนตารางด้านข้างเพื่อดูทุกคอลัมน์</p>
        <div className="table-responsive user-csv-preview" tabIndex={0} role="region" aria-label="ตารางตัวอย่างข้อมูล CSV">
          <table className="table table-sm table-striped align-middle">
            <thead><tr><th scope="col">แถว</th><th scope="col">สถานะ</th>{csvColumns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
            <tbody>{preview.rows.map(row => <tr key={row.row}>
              <th scope="row">{row.row}</th>
              <td>{row.duplicate ? duplicateLabel[row.duplicate] : badRows.has(row.row) ? 'ต้องแก้ไข' : 'พร้อมส่ง'}</td>
              {row.values.map((value, index) => <td key={csvColumns[index]}>{value || '—'}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
        <div className="user-data-actions mt-3">
          <button type="button" className="btn btn-primary" disabled={!ready || !preview.valid || preview.invalid > 0}
            onClick={() => send('commit')}>ยืนยันส่งคำขอ {preview.valid} รายการ</button>
          <span className="small text-secondary">รายการที่ส่งจะอยู่ในสถานะรออนุมัติ</span>
        </div>
      </>}
    </div>
  </section>;
}
