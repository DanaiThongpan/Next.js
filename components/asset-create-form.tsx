'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { assetDetailLimits, assetFieldLimits, csvColumns } from '@/lib/csv-import-format';

type Reference = { id: string; name: string; building: string };
type Props = {
  categories: Reference[]; buildings: Reference[]; rooms: Reference[];
  department: string; allDepartments: boolean; pending: boolean; writable: boolean;
};

const labels = ['หมายเลขครุภัณฑ์', 'ชื่อรายการ', 'ยี่ห้อ / รุ่น', 'หมวดหมู่', 'อาคาร', 'ห้อง', 'ราคาจัดซื้อ (บาท)', 'ปีงบประมาณ (พ.ศ.)', 'แผนกเจ้าของ'];
const extraLabels = { DA_Detail: 'รายละเอียดเพิ่มเติม', DA_Size: 'ขนาด / สเปค', DA_DetailLocation: 'รายละเอียดสถานที่' };

export function AssetCreateForm({ categories, buildings, rooms, department, allDepartments, pending, writable }: Props) {
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!writable || submitting.current || saved) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (pending && !window.confirm(`ส่งคำขอขึ้นทะเบียน ${String(data.DA_Number ?? '')} เพื่อให้ผู้ดูแลตรวจสอบหรือไม่?`)) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/assets/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true || typeof result.id !== 'string') {
        setError(result.message || 'ยืนยันผลการบันทึกไม่ได้');
        return;
      }
      setSaved(result.id);
    } catch {
      setError('ยืนยันผลการบันทึกไม่ได้ กรุณาตรวจสอบหมายเลขครุภัณฑ์ก่อนส่งอีกครั้ง');
    } finally { submitting.current = false; setSaving(false); }
  }

  function options(rows: Reference[]) {
    return rows.map(row => <option key={row.id} value={row.id}>{row.name} ({row.id})</option>);
  }

  const buildingRooms = rooms.filter(item => item.building === building);
  const normalizedSearch = roomSearch.trim().toLowerCase();
  const matchingRooms = buildingRooms.filter(item => item.id === room ||
    `${item.name} ${item.id}`.toLowerCase().includes(normalizedSearch));

  const renderField = (field: typeof csvColumns[number]) => {
    const index = csvColumns.indexOf(field);
    return <div key={field} className="col-12 col-md-6 col-xl-4">
          <label className="form-label fw-semibold" htmlFor={field}>{labels[index]}{index < 2 ? ' *' : ''}</label>
          {field === 'classificationID' ? <select id={field} name={field} className="form-select"><option value="">ตรวจจับอัตโนมัติ</option>{options(categories)}</select>
          : field === 'buildingID' ? <select id={field} name={field} className="form-select" value={building} onChange={event => { setBuilding(event.target.value); setRoom(''); setRoomSearch(''); }}><option value="">ไม่ระบุอาคาร</option>{options(buildings)}</select>
          : field === 'classroomID' ? <>
            {pending && buildingRooms.length > 12 && <input type="search" aria-label="ค้นหาชื่อหรือรหัสห้อง" className="form-control mb-2"
              placeholder="ค้นหาชื่อหรือรหัสห้อง" value={roomSearch} onChange={event => setRoomSearch(event.target.value)}/>}
            <select id={field} name={field} className="form-select" disabled={!building} value={room} onChange={event => setRoom(event.target.value)}>
              <option value="">{building ? 'ไม่ระบุห้อง' : 'เลือกอาคารก่อน'}</option>{options(matchingRooms)}
            </select>
            {normalizedSearch && !matchingRooms.length && <small className="text-secondary" role="status">ไม่พบห้องที่ตรงกับคำค้น</small>}
          </>
          : <input id={field} name={field} className="form-control" maxLength={assetFieldLimits[index]} required={index < 2}
            inputMode={field === 'DA_Price' ? 'decimal' : field === 'DA_Year' ? 'numeric' : undefined}
            pattern={field === 'DA_Year' ? '[0-9]{4}' : undefined}
            placeholder={field === 'DA_Year' ? 'เว้นว่างเพื่อใช้ปีจากรหัสครุภัณฑ์' : pending && field === 'DA_Number' ? 'เช่น 001234' : undefined}
            readOnly={field === 'owner_department' && !allDepartments} defaultValue={field === 'owner_department' ? department : undefined}/>}
        </div>;
  };
  const renderExtra = ([field, limit]: [string, number]) => <div key={field} className="col-12 col-md-6">
          <label htmlFor={field} className="form-label fw-semibold">{extraLabels[field as keyof typeof extraLabels]}</label>
          {field === 'DA_Detail' ? <textarea id={field} name={field} className="form-control" rows={3} maxLength={limit}/> : <input id={field} name={field} className="form-control" maxLength={limit}/>}
        </div>;
  const details = Object.entries(assetDetailLimits);

  return <form method="post" onSubmit={submit} aria-busy={saving}>
    {!writable && <p className="alert alert-info" role="status">ยังไม่เปิดการบันทึกในฐานข้อมูลแยกของ Next.js</p>}
    {pending && <p className="small text-secondary">ช่องที่มี * ต้องกรอก</p>}
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    {saved && <div className="alert alert-success" role="status">{pending ? 'ส่งคำขอขึ้นทะเบียนแล้ว รอแอดมินอนุมัติ' : 'เพิ่มครุภัณฑ์แล้ว'} · รหัส {saved}
      {pending && <Link className="ms-2" href={'/user/request-history?' + new URLSearchParams({ q: saved })}>ติดตามคำขอ</Link>}
      {!pending && <Link className="ms-2" href={`/admin/manage-data?id=${encodeURIComponent(saved)}&visibility=all`}>ดูรายการ</Link>}
    </div>}
    {!allDepartments && !department && <p role="alert" className="alert alert-warning">บัญชีนี้ยังไม่มีแผนก กรุณาติดต่อผู้ดูแลระบบ</p>}
    <fieldset disabled={!writable || saving || !!saved || (!allDepartments && !department)}>
      {pending ? <>
        <fieldset className="asset-form-group">
          <legend>ข้อมูลครุภัณฑ์</legend>
          <div className="row g-3">{csvColumns.slice(0, 4).map(renderField)}{details.filter(([field]) => field === 'DA_Size').map(renderExtra)}</div>
        </fieldset>
        <fieldset className="asset-form-group">
          <legend>สถานที่และหน่วยงาน</legend>
          <div className="row g-3">{(['buildingID','classroomID','owner_department'] as const).map(renderField)}{details.filter(([field]) => field === 'DA_DetailLocation').map(renderExtra)}</div>
        </fieldset>
        <fieldset className="asset-form-group">
          <legend>ข้อมูลการจัดซื้อและรายละเอียด</legend>
          <div className="row g-3">{(['DA_Price','DA_Year'] as const).map(renderField)}{details.filter(([field]) => field === 'DA_Detail').map(renderExtra)}</div>
        </fieldset>
      </> : <div className="row g-3">{csvColumns.map(renderField)}{details.map(renderExtra)}</div>}
      <button type="submit" className="btn btn-primary mt-4">{saving ? 'กำลังบันทึก…' : pending ? 'ส่งคำขอขึ้นทะเบียน' : 'บันทึกครุภัณฑ์'}</button>
    </fieldset>
    {pending && <Link href="/user" className="btn btn-outline-secondary mt-4">กลับภาพรวม</Link>}
  </form>;
}
