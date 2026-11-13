'use client';

import { Children, isValidElement, useId, useState, type ReactNode } from 'react';

const labels = ['หมายเลขครุภัณฑ์','ชื่อรายการครุภัณฑ์','หมวดหมู่','สถานที่ / อาคาร','ราคาจัดซื้อ','แผนกเจ้าของ','การแสดงผล','สถานะ','จัดการ'];

export function AssetResponsiveRow({ children, name, image, detail }: { children: ReactNode; name: string; image?: string; detail: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const cells = Children.toArray(children).filter(isValidElement);
  const content = (index: number) => (cells[index]?.props as { children?: ReactNode } | undefined)?.children;
  return <>
    <tr className="asset-mobile-row"><td colSpan={10}>
      <article className="asset-mobile-card" aria-label={name}>
        <div className="asset-mobile-heading">
          <div className="asset-mobile-photo">{image ? <img src={image} alt={name} loading="lazy"/> : <i className="fa-solid fa-box" aria-label="ไม่มีรูปภาพ"/>}</div>
          <div className="asset-mobile-title">{content(1)}<div className="asset-mobile-number">{content(0)}</div></div>
        </div>
        <div className="asset-mobile-status">{content(7)}{content(6)}</div>
        <div className="asset-mobile-location">{content(3)}</div>
        <div className="asset-mobile-footer">
          <div className="asset-mobile-detail">{detail}</div>
          <details className="asset-mobile-menu"><summary aria-label={`จัดการ ${name}`}>⋮ <span>จัดการ</span></summary>
            <div className="asset-mobile-menu-content"><p className="small text-muted mb-2">รายละเอียด · แก้ไข · สถานะ · ซ่อม · รูป · QR · การแสดงผล</p>{content(8)}</div>
          </details>
        </div>
      </article>
    </td></tr>
    <tr className="asset-responsive-row">
      {cells}
      <td className="asset-expand-cell">
        <button type="button" className="btn btn-outline-primary btn-sm" aria-expanded={expanded} aria-controls={id} aria-label={`${expanded ? 'ย่อ' : 'ขยาย'}รายละเอียด ${name}`} onClick={() => setExpanded(value => !value)}>
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
      </td>
    </tr>
    {expanded && <tr className="asset-expanded-row" id={id}>
      <td colSpan={10}>
        <dl className="asset-expanded-details mb-0">
          {cells.slice(2).map((cell, index) => <div key={index}>
            <dt>{labels[index + 2]}</dt>
            <dd>{(cell.props as { children: ReactNode }).children}</dd>
          </div>)}
        </dl>
      </td>
    </tr>}
  </>;
}
