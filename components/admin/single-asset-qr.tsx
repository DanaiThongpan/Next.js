'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import {AssetQrCode} from './asset-qr-code';
export function SingleAssetQr({number,name,brand}:{number:string;name:string;brand:string}){
 const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
 const label=<div className="single-asset-label" style={{border:'2px solid black',background:'white',width:350,maxWidth:'100%',padding:20,textAlign:'center',color:'#212529'}}><AssetQrCode number={number}/><h5 className="fw-bold mt-2 mb-2">{number}</h5><div>{name}</div>{brand&&<div className="small text-secondary">({brand})</div>}</div>;
 return <><section className="d-flex flex-column align-items-center text-center py-4"><h3 className="fw-bold">ระบบสร้าง QR Code สำหรับแปะประจำเครื่อง</h3><p className="text-secondary">ขนาดและรูปแบบถูกออกแบบมาให้พอดีกับการพิมพ์ (Printable)</p><div className="d-flex gap-2 mb-3"><button className="btn btn-primary" onClick={()=>window.print()}>พิมพ์ QR Code นี้</button><Link href="/admin/manage-data" className="btn btn-secondary">กลับหน้ารายการ</Link></div>{label}</section>{mounted&&createPortal(<div id="single-asset-print">{label}</div>,document.body)}<style>{`#single-asset-print{display:none}@media print{body>*{display:none!important}body>#single-asset-print{display:block!important;width:100%;padding:0}#single-asset-print .single-asset-label{margin:0 auto;max-width:100%}}`}</style></>;
}
