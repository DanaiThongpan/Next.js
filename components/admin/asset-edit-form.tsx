'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AssetQrCode } from './asset-qr-code';
import { assetFields } from '@/lib/sqlite/asset-edit-fields';
import type { CatalogRow } from '@/lib/sqlite/catalog';

export function AssetEditForm({ asset, categories, buildings, rooms }: {
  asset: CatalogRow; categories: CatalogRow[]; buildings: CatalogRow[]; rooms: CatalogRow[];
}) {
  const router = useRouter();
  const [building, setBuilding] = useState(String(asset.buildingID ?? ''));
  const [room, setRoom] = useState(String(asset.classroomID ?? ''));
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = String(asset.DA_ID);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/asset-edit', { method: 'POST', body: new FormData(event.currentTarget) });
      if (!response.ok) {
        setError('บันทึกไม่ได้ กรุณาตรวจข้อมูล รูปภาพ และสิทธิ์การเขียน');
        return;
      }
      router.push('/admin/manage-data');
      router.refresh();
    } catch {
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setBusy(false);
    }
  }

  const options = (rows: CatalogRow[]) => rows.map(row => <option key={String(row.id)} value={String(row.id)}>{row.label}</option>);

  return <form onSubmit={save}>
    <fieldset disabled={busy} className="row g-3">
      <input type="hidden" name="id" value={id}/>
      <label className="col-12">หมวดหมู่<select name="classificationID" className="form-select" defaultValue={String(asset.classificationID ?? '')}><option value="">เลือกหมวดหมู่</option>{options(categories)}</select></label>
      <label className="col-12">อาคาร<select name="buildingID" className="form-select" value={building} onChange={event => { setBuilding(event.target.value); setRoom(''); }}><option value="">เลือกอาคาร</option>{options(buildings)}</select></label>
      <label className="col-12">ห้อง<select name="classroomID" className="form-select" value={room} onChange={event => setRoom(event.target.value)}><option value="">เลือกห้อง</option>{options(rooms.filter(row => String(row.building) === building))}</select></label>
      {['DA_DetailLocation','DA_ListName','DA_Brand','DA_Size','DA_Number','DA_Year','DA_Price','DA_Detail'].map(key=>[key,assetFields[key as keyof typeof assetFields]]).map(([key, label]) =>
        <label className="col-12" key={key}>{label}
          {key === 'DA_Detail'
            ? <textarea name={key} maxLength={2000} className="form-control" defaultValue={String(asset[key] ?? '')}/>
            : <input name={key} maxLength={2000} required={key === 'DA_Number' || key === 'DA_ListName'} className="form-control" defaultValue={String(asset[key] ?? '').replace(/^['"]+|['"]+$/g, '')}/>}
        </label>)}
      <p className="col-12 mb-0">หน่วยงาน {asset.owner_department ?? '—'} · สถานะ {asset.statusID ?? '—'}</p>
      <label className="col-12">รูปครุภัณฑ์<input name="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="form-control" onChange={event => setFile(event.target.files?.[0])}/></label>
      {(file ? preview : asset.DA_URLImg) && <div className="col-12"><img className="img-fluid rounded" style={{ maxHeight: 240 }} src={file ? preview : `/admin/manage-data/photo?id=${encodeURIComponent(id)}`} alt="รูปครุภัณฑ์"/></div>}
      <div className="col-12"><div className="border rounded p-2 d-inline-block text-center" style={{width:150}}><AssetQrCode number={String(asset.DA_Number)}/><small className="d-block text-break">{asset.DA_Number}</small></div></div><div className="col-12 border-top pt-3 d-flex gap-2"><button className="btn btn-success">{busy ? 'กำลังบันทึก…' : 'บันทึกการแก้ไขข้อมูล'}</button><Link href="/admin/manage-data" className="btn btn-outline-secondary">ยกเลิก</Link></div>
    </fieldset>
    {error && <p role="alert" className="alert alert-danger mt-3">{error}</p>}
  </form>;
}
