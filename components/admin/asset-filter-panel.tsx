'use client';
import { useId, useState, type ReactNode } from 'react';

export function AssetFilterPanel({ children, active }: { children: ReactNode; active: boolean }) {
  const [open, setOpen] = useState(active);
  const id = useId();
  return <div className="asset-filter-panel">
    <button type="button" className="btn btn-outline-primary asset-filter-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <i className="fa-solid fa-filter me-2" aria-hidden="true"/>ตัวกรอง{active ? ' • มีเงื่อนไขที่เลือก' : ''}
      <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} ms-2`} aria-hidden="true"/>
    </button>
    <div id={id} className={`asset-filter-fields ${open ? 'is-open' : ''}`}>{children}</div>
  </div>;
}
