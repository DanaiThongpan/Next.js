'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';

type AssetResult = { id: string; number: string | null; name: string; category: string | null };
import { Icon } from '@/components/admin/icon';
import { parseLoanQr } from '@/lib/qr-loan';

export function BorrowSearch({ initial, intent }: { initial: string; intent?: 'borrow' | 'return' }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const [rows, setRows] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState(-1);
  const [status, setStatus] = useState('');
  const assetHref = (id: string) => '/user/borrow?' + new URLSearchParams({ asset_id: id, ...(intent ? { intent } : {}) });
  const navigate = (value: string) => {
    const asset = parseLoanQr(value, true);
    if (!asset || asset.length > 150 || asset.includes('\0')) {
      setStatus('กรุณากรอกหมายเลขครุภัณฑ์หรือ QR ที่ถูกต้อง');
      return;
    }
    router.push(assetHref(asset));
  };

  useEffect(() => {
    if (intent === 'return') return;
    const keyword = query.trim();
    if (keyword.length < 2 || keyword.length > 150 || keyword.includes('?') || keyword.includes('://')) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus('กำลังค้นหา…');
      try {
        const response = await fetch('/api/user/borrow?' + new URLSearchParams({q: keyword}), {signal: controller.signal});
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !data.ok || !Array.isArray(data.rows)) {
          setStatus(data.message || 'ค้นหาไม่สำเร็จ');
          return;
        }
        setRows(data.rows);
        setStatus(data.rows.length ? 'เลือกครุภัณฑ์จากผลค้นหา' : 'ไม่พบครุภัณฑ์พร้อมยืมที่ตรงกับคำค้น');
      } catch {
        if (!controller.signal.aborted) setStatus('ค้นหาไม่สำเร็จ กรุณาลองใหม่');
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, intent]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedRow = rows[selected];
    if (selectedRow) router.push(assetHref(selectedRow.id));
    else navigate(query);
  }

  function selectResult(event: KeyboardEvent<HTMLInputElement>) {
    if (!rows.length) return;
    if (event.key === 'Escape') { setRows([]); setSelected(-1); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(index => index < 0 ? (event.key === 'ArrowDown' ? 0 : rows.length - 1) :
        (index + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length);
    }
  }

  return <form action="/user/borrow" onSubmit={submit} className="text-start">
    <label htmlFor="borrow-search" className="visually-hidden">ชื่อหรือหมายเลขครุภัณฑ์</label>
    <div className="position-relative">
      <div className="input-group shadow-sm">
        <span className="input-group-text bg-white"><Icon name="magnifying-glass" className="text-primary"/></span>
        <input id="borrow-search" name="asset_id" className="form-control" type="search" maxLength={2000} value={query}
          autoComplete="off" spellCheck={false} required placeholder="พิมพ์หมายเลขหรือชื่อครุภัณฑ์" onKeyDown={selectResult}
          onChange={event => { setQuery(event.target.value); setRows([]); setSelected(-1); setStatus(''); }}/>
        {query && <button type="button" className="btn btn-outline-secondary" aria-label="ล้างข้อความ"
          onClick={() => { setQuery(''); setRows([]); setSelected(-1); setStatus(''); }}><Icon name="xmark"/></button>}
        <button className="btn btn-primary fw-bold">ค้นหา</button>
      </div>
      {rows.length > 0 && <ul className="list-group borrow-live-results shadow" aria-label="ผลค้นหาครุภัณฑ์">
        {rows.map((row, index) => <li className="list-group-item p-0" key={row.id}>
          <Link className={`d-block px-3 py-2 text-decoration-none ${selected === index ? 'bg-primary-subtle' : ''}`} href={assetHref(row.id)}>
            <strong className="d-block text-break">{row.name}</strong>
            <span className="small text-secondary">{row.number || row.id} · {row.category || 'ไม่ระบุหมวดหมู่'}</span>
          </Link>
        </li>)}
      </ul>}
    </div>
    {intent && <input type="hidden" name="intent" value={intent}/>}
    {status && <p className="small text-secondary mt-2 mb-0" role="status">{status}</p>}
  </form>;
}
