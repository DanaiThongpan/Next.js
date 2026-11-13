'use client';
import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {qrPayload} from './qr-payload';
export function AssetQrCode({number}:{number:string}){const [src,setSrc]=useState('');const [error,setError]=useState(false);useEffect(()=>{let active=true;setSrc('');setError(false);if(window.location.port==='8000'){setError(true);return;}QRCode.toDataURL(qrPayload(window.location.origin+'/user/borrow?asset_id=',number),{errorCorrectionLevel:'M',margin:2,width:300}).then(value=>{if(active)setSrc(value);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[number]);return src?<img src={src} alt={'QR Code '+number} style={{width:'100%',maxWidth:250,height:'auto'}}/>:<span role="status">{error?'สร้าง QR Code ไม่สำเร็จ':'กำลังสร้าง QR Code…'}</span>;}
