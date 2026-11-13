import {Suspense} from 'react';
import {requireIdentity} from '@/lib/auth/session';
import {readRepairAsset} from '@/lib/sqlite/repairs';
import {SingleAssetQr} from '@/components/admin/single-asset-qr';
async function Content({searchParams}:{searchParams:Promise<{id?:string}>}){
 const user=await requireIdentity('admin');const {id}=await searchParams;
 let row;try{row=await readRepairAsset(user,typeof id==='string'?id:'');}catch{}
 if(!row)return <p role="alert" className="alert alert-warning m-4">ไม่พบครุภัณฑ์ในขอบเขตสิทธิ์ หรือไม่สามารถอ่านข้อมูลได้</p>;
 return <SingleAssetQr number={String(row.number)} name={String(row.name)} brand={String(row.brand||'')}/>;
}
export default function Page(props:{searchParams:Promise<{id?:string}>}){return <Suspense fallback={<p>กำลังโหลด QR Code…</p>}><Content {...props}/></Suspense>;}
