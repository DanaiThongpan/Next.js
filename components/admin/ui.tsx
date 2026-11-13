import type { ReactNode } from 'react';
export function AdminReadOnlyNotice({children}:{children?:ReactNode}) {return <div className="alert alert-info small" role="note"><strong>ระบบอยู่ในโหมดอ่านข้อมูลเท่านั้น (Read-Only)</strong>{children&&<div>{children}</div>}</div>;}
