'use client';

import { useState } from 'react';

export function AssetPhoto({ id, name }: { id: string; name: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <p className="small text-secondary">ยังไม่มีรูปครุภัณฑ์ที่เปิดดูได้</p>;
  return <img className="user-asset-photo" src={'/api/user/asset-photo?' + new URLSearchParams({ id })}
    alt={name} loading="lazy" onError={() => setMissing(true)}/>;
}
