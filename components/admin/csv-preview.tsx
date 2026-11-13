'use client';

import { useEffect, useRef, useState } from 'react';
import { csvColumns, csvExamples, csvMaxBytes, type CsvDuplicate, type CsvPreviewResult } from '@/lib/csv-import-format';
import { Icon } from './icon';

const fields = [
  ['หมายเลขครุภัณฑ์','จำเป็น','req'], ['ชื่อรายการ','จำเป็น','req'], ['ยี่ห้อ / รุ่น','เว้นว่างได้','opt'],
  ['รหัสหรือชื่อหมวดหมู่','ตรวจจับอัตโนมัติ','auto'], ['รหัสหรือชื่ออาคาร','เว้นว่างได้','opt'],
  ['รหัสหรือชื่อห้อง','เว้นว่างได้','opt'], ['ราคา (บาท)','เว้นว่างได้','opt'],
  ['ปีงบประมาณ','ตรวจจับอัตโนมัติ','auto'], ['สังกัด','ค่าเริ่มต้นตามบัญชี','auto'],
];
const tabs = [
  ['categories','รหัสหมวดหมู่','tags'], ['buildings','รหัสอาคาร / สถานที่','building'],
  ['rooms','รหัสห้องและอาคาร','door-open'],
] as const;
type RefKind = typeof tabs[number][0];
type References = Record<RefKind, Record<string, string | number | null>[]>;
type Preview = Omit<CsvPreviewResult, 'rows'> & {
  headers: string[];
  ignoredHeaders: string[];
  rows: CsvPreviewResult['rows'];
  skippedRows: { row: number; number: string; duplicate: CsvDuplicate }[];
};
type Commit = { inserted: number; skipped: number; message: string };
const duplicateReason: Record<CsvDuplicate, string> = {
  existing: 'มีหมายเลขนี้ในระบบแล้ว',
  'in-file': 'หมายเลขซ้ำในไฟล์',
  both: 'หมายเลขซ้ำทั้งในไฟล์และในระบบ',
};

export function CsvPreview({ references }: { references: References | null }) {
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const [showExample, setShowExample] = useState(false);
  const [tab, setTab] = useState<RefKind>('categories');
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<Preview>();
  const [result, setResult] = useState<Commit>();
  const [busy, setBusy] = useState<'preview' | 'commit'>();
  const [error, setError] = useState('');
  const issueRows = new Set(preview?.issues.map(issue => issue.row));

  useEffect(() => {
    if (preview && !busy) previewHeading.current?.focus();
  }, [preview, busy]);

  function chooseFile(next?: File) {
    if (inFlight.current) return;
    setPreview(undefined);
    setResult(undefined);
    setFile(undefined);
    setError('');
    if (!next) return;
    const problem = !/\.csv$/i.test(next.name) ? 'กรุณาเลือกไฟล์ .csv'
      : next.size > csvMaxBytes ? 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB'
      : !next.size ? 'ไฟล์ CSV ว่าง' : '';
    if (problem) {
      setError(problem);
      if (input.current) input.current.value = '';
    } else {
      setFile(next);
      void submit('preview', next);
    }
  }

  async function submit(action: 'preview' | 'commit', selected = file) {
    if (!selected || inFlight.current || (action === 'commit' && (!preview || preview.invalid || !preview.inserted))) return;
    if (action === 'commit' && preview && !window.confirm(
      `ยืนยันเพิ่มใหม่ ${preview.inserted} รายการ (ข้ามรายการซ้ำ ${preview.duplicates} แถว) หรือไม่?`,
    )) return;
    inFlight.current = true;
    setBusy(action);
    setError('');
    setResult(undefined);
    if (action === 'preview') setPreview(undefined);
    try {
      const params = new URLSearchParams({ action, filename: selected.name });
      const response = await fetch(`/api/admin/csv?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv', ...(action === 'commit' && preview ? { 'X-CSV-Preview': preview.token } : {}) },
        body: selected,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        setError(data?.message ?? 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
        if (action === 'commit') {
          setPreview(previous => previous && Array.isArray(data?.issues) ? {
            ...previous, issues: data.issues, invalid: data.invalid, valid: data.valid,
            duplicates: data.duplicates, inserted: data.inserted,
          } : undefined);
        }
      } else if (action === 'preview') {
        if (typeof data.token !== 'string' || !Array.isArray(data.rows) || !Array.isArray(data.headers) ||
            !Array.isArray(data.ignoredHeaders) || !Array.isArray(data.skippedRows) || !Array.isArray(data.issues)) {
          setError('ไม่ได้รับผลตรวจไฟล์ที่สมบูรณ์ กรุณากดตรวจไฟล์อีกครั้ง');
        } else setPreview(data);
      }
      else {
        setResult(data);
        setPreview(undefined);
        setFile(undefined);
        if (input.current) input.current.value = '';
      }
    } catch {
      setError(action === 'commit' ? 'ยืนยันผลการนำเข้าไม่ได้ กรุณาตรวจรายการในคลังก่อนลองใหม่' : 'ตรวจไฟล์ไม่สำเร็จ กรุณาลองใหม่');
      if (action === 'commit') setPreview(undefined);
    } finally {
      inFlight.current = false;
      setBusy(undefined);
    }
  }

  return <>
    <section className="alert-custom border border-start-0 shadow-sm rounded p-3 bg-body-tertiary mb-4" aria-labelledby="csv-format">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 id="csv-format" className="h6 fw-bold mb-0"><Icon name="circle-info" className="text-primary me-2"/>รูปแบบโครงสร้างข้อมูล</h2>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <code className="badge bg-primary-subtle text-primary">durable_articles</code>
          <button type="button" className="btn btn-outline-primary btn-sm rounded-pill"
            aria-expanded={showExample} aria-controls="csv-template-example" onClick={() => setShowExample(open => !open)}>
            <Icon name="eye" className="me-2"/>{showExample ? 'ซ่อนตัวอย่างไฟล์ CSV' : 'ดูตัวอย่างไฟล์ CSV'}
          </button>
        </div>
      </div>
      <p className="small text-secondary my-2">ใช้ไฟล์ CSV แบบ UTF-8 หัวตารางต้องมีหมายเลขครุภัณฑ์และชื่อรายการ จัดรูปแบบรหัสเป็นข้อความเพื่อรักษาเลขศูนย์นำหน้า</p>
      <div id="csv-template-example" hidden={!showExample}>
        <p className="small text-secondary mb-2">ตัวอย่างจากไฟล์ต้นแบบ สามารถดูได้ทันทีโดยไม่ต้องอัปโหลด และไม่มีการบันทึกข้อมูล</p>
        <div className="table-responsive rounded border">
        <table className="table table-preview table-striped align-middle mb-0">
          <thead className="table-light"><tr>{csvColumns.map((column, i) => <th scope="col" key={column} className="text-nowrap">
            <div>{column}</div><small className="d-block text-secondary fw-normal">{fields[i][0]}</small>
            <span className={`badge badge-col-${fields[i][2]}`}>{fields[i][1]}</span>
          </th>)}</tr></thead>
          <tbody>{csvExamples.map(row => <tr key={row[0]}>{row.map((value, i) =>
            <td key={csvColumns[i]} className={i === 1 ? '' : 'text-nowrap'}>{value}</td>)}</tr>)}</tbody>
        </table>
      </div>
      </div>
      <p className="small text-secondary mt-2 mb-0">เว้นหมวดหมู่หรือปีงบประมาณให้ระบบตรวจจากรหัสและชื่อรายการได้ กรุณาตรวจค่าที่ระบบเลือกก่อนยืนยัน ไฟล์ต้นแบบมีข้อมูลตัวอย่างที่อาจตรงกับรายการในคลัง</p>
    </section>

    <section className="card mb-4" aria-label="ข้อมูลอ้างอิง">
      <div className="card-header bg-body-tertiary pb-0">
        <div className="nav nav-tabs flex-wrap" aria-label="เลือกประเภทข้อมูลอ้างอิง">
          {tabs.map(([kind, label, icon]) => <button key={kind} type="button" aria-pressed={tab === kind}
            className={`nav-link ${tab === kind ? 'active' : ''}`} onClick={() => setTab(kind)}>
            <Icon name={icon} className="me-2"/>{label}{references && ` (${references[kind].length})`}
          </button>)}
        </div>
      </div>
      <div className="card-body">
        {!references ? <p className="alert alert-warning mb-0" role="alert">โหลดข้อมูลอ้างอิงไม่ได้ กรุณารีเฟรชหน้า</p>
          : !references[tab].length ? <p className="text-secondary mb-0">ไม่พบข้อมูลอ้างอิงในหมวดนี้</p>
          : <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-2 overflow-auto" style={{ maxHeight: '16rem' }}>
            {references[tab].map(row => <div className="col" key={`${row.building ?? ''}:${row.id}`}>
              <div className="d-flex justify-content-between gap-2 align-items-center border rounded px-2 py-1 bg-body-tertiary small">
                <span>{row.name || '—'}{row.building && <small className="d-block text-secondary">อาคาร {row.building}</small>}</span>
                <code className="badge bg-primary text-white">{row.id}</code>
              </div>
            </div>)}
          </div>}
        <p className="small text-secondary mt-2 mb-0">ใช้รหัสหรือชื่อที่ระบุได้ชัดเจน ห้องต้องอยู่ในอาคารที่เลือก</p>
      </div>
    </section>

    <section className="border rounded-3 p-3 p-md-4 shadow-sm" aria-labelledby="csv-upload">
      <h2 id="csv-upload" className="h6 fw-bold"><Icon name="file-csv" className="text-success me-2"/>เลือกไฟล์ CSV ที่ต้องการนำเข้าสู่ระบบ</h2>
      <div className="dropzone-box p-3 p-md-4 text-center">
        <Icon name="cloud-arrow-up" className="fs-2 text-primary mb-3"/>
        <input ref={input} aria-label="เลือกไฟล์ CSV" type="file" accept=".csv,text/csv" disabled={Boolean(busy)}
          className="form-control" onChange={event => chooseFile(event.target.files?.[0])}/>
        <p className="small text-secondary mt-2 mb-0">รองรับ .csv (UTF-8) ขนาดสูงสุด 5 MB และ 10,000 แถว เลือกไฟล์แล้วระบบจะตรวจให้ทันที</p>
        {file && <div className="d-flex justify-content-center align-items-center flex-wrap gap-2 mt-2 small">
          <span className="text-break">{file.name} · {file.size.toLocaleString('th-TH')} ไบต์</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={Boolean(busy)} onClick={() => {
            if (input.current) input.current.value = '';
            chooseFile();
          }}>ล้างไฟล์</button>
        </div>}
      </div>
      <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
        <button type="button" className="btn btn-outline-primary rounded-pill px-4" disabled={Boolean(busy)}
          onClick={() => file ? void submit('preview') : input.current?.click()}>
          <Icon name="eye" className="me-2"/>{busy === 'preview' ? 'กำลังตรวจไฟล์…' : file ? 'ตรวจไฟล์อีกครั้ง' : 'เลือกไฟล์เพื่อดูตัวอย่าง'}
        </button>
        <button type="button" className="btn btn-primary rounded-pill px-4" disabled={!file || !preview || preview.invalid > 0 || !preview.inserted || Boolean(busy)}
          onClick={() => void submit('commit')}><Icon name="upload" className="me-2"/>{busy === 'commit' ? 'กำลังนำเข้า…' : 'ยืนยันการนำเข้าข้อมูล'}</button>
      </div>
      {busy === 'preview' && <p role="status" className="alert alert-info mt-3 mb-0">กำลังอัปโหลดและตรวจข้อมูลในไฟล์ ยังไม่มีการบันทึกรายการ</p>}
      {error && <p role="alert" className="alert alert-danger mt-3 mb-0">{error}</p>}
      {result && <div role="status" className="alert alert-success mt-3 mb-0">
        <strong>{result.message}</strong>
        <div>เพิ่มใหม่ {result.inserted} · ข้ามรายการซ้ำ {result.skipped}</div>
      </div>}
      {preview && <section className="mt-4" aria-labelledby="csv-preview-title">
        <h3 ref={previewHeading} tabIndex={-1} id="csv-preview-title" className="h6 fw-bold">ตัวอย่างก่อนนำเข้า</h3>
        <p className="small text-secondary text-break mb-2">{file?.name} · {file?.size.toLocaleString('th-TH')} ไบต์ · {preview.headers.length} คอลัมน์</p>
        <div className="row row-cols-2 row-cols-md-3 row-cols-xl-5 g-2 mb-3">
          {([
            ['แถวข้อมูลทั้งหมด', preview.total], ['ผ่านการตรวจ', preview.valid],
            ['ต้องแก้ไข', preview.invalid], ['ข้ามเพราะซ้ำ', preview.duplicates],
            ['จะเพิ่มใหม่', preview.inserted],
          ] as const).map(([label, count]) => <div className="col" key={label}>
            <div className="border rounded bg-body-tertiary p-2 h-100"><strong className="d-block fs-5">{count.toLocaleString('th-TH')}</strong><span className="small">{label}</span></div>
          </div>)}
        </div>
        <p className="small text-break"><strong>หัวคอลัมน์ในไฟล์:</strong> {preview.headers.map(header => header || '(ว่าง)').join(' · ')}</p>
        {preview.ignoredHeaders.length > 0 && <p className="alert alert-warning small text-break">คอลัมน์ที่ระบบไม่นำเข้า: {preview.ignoredHeaders.map(header => header || '(ว่าง)').join(' · ')}</p>}
        <p className="small text-secondary">ตารางด้านล่างแสดงข้อมูลหลังตรวจ พร้อมผลของแต่ละแถว</p>
        {preview.inserted > 0 && <p className="small text-secondary">รายการใหม่จะบันทึกบัญชีที่เข้าสู่ระบบเป็นผู้เพิ่มโดยอัตโนมัติ</p>}
        {preview.duplicates > 0 && <div className="alert alert-warning small">
          <strong>พบรายการซ้ำ {preview.duplicates} แถว ระบบจะไม่บันทึกแถวเหล่านี้และไม่แก้ไขรายการเดิม</strong>
          {preview.inserted === 0 && <p className="mb-0 mt-1">ไม่มีรายการใหม่ที่พร้อมบันทึก</p>}
          <details className="mt-2" open>
            <summary>แถวที่ข้ามและสาเหตุ</summary>
            <ul className="mb-0 mt-2 overflow-auto" style={{ maxHeight: '12rem' }}>
              {preview.skippedRows.map(row => <li key={row.row} className="text-break">แถว {row.row} · <code>{row.number}</code> · {duplicateReason[row.duplicate]}</li>)}
            </ul>
          </details>
        </div>}
        <div className="table-responsive rounded border">
          <table className="table table-preview table-striped mb-0">
            <thead className="table-light"><tr>{['แถว', ...csvColumns, 'ผล'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>{preview.rows.map(row => <tr key={row.row} className={row.duplicate ? 'table-warning' : issueRows.has(row.row) ? 'table-danger' : undefined}>
              <td>{row.row}</td>{row.values.map((value, i) => <td key={csvColumns[i]}>{value || '—'}</td>)}
              <td className="text-nowrap">{row.duplicate ? 'ข้าม — ไม่บันทึก' : issueRows.has(row.row) ? 'ผิดพลาด' : 'เพิ่มใหม่'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {preview.total > preview.rows.length && <p className="small text-secondary mt-2">แสดงตัวอย่าง 100 แถวแรก ตรวจสอบแล้วทั้งไฟล์</p>}
        {preview.issues.length > 0 && <div className="alert alert-danger mt-3 mb-0">
          <strong>แก้ไขข้อมูลก่อนนำเข้า</strong>
          <ul className="mb-0 overflow-auto" style={{ maxHeight: '14rem' }}>{preview.issues.map((issue, i) =>
            <li key={i}>แถว {issue.row} · <code>{issue.field}</code> · {issue.message}</li>)}</ul>
        </div>}
      </section>}
    </section>
  </>;
}
