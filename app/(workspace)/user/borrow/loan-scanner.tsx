'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/admin/icon';
import { parseLoanQr } from '@/lib/qr-loan';

export function LoanScanner({ intent, compact = false }: { intent?: 'borrow' | 'return'; compact?: boolean }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [camera, setCamera] = useState('');
  const [message, setMessage] = useState('');
  const [loading, navigate] = useTransition();

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let stream: MediaStream | undefined;
    let frame = 0;
    const player = video.current;
    function stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach(track => track.stop());
      if (player) player.srcObject = null;
    }
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setMessage('เปิดกล้องได้บน HTTPS หรือ localhost กรุณาใช้ช่องค้นหาครุภัณฑ์');
          setEnabled(false);
          return;
        }
        const { default: decode } = await import('jsqr');
        if (stopped || !player) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: camera ? { deviceId: { exact: camera } } : { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) { stop(); return; }
        player.srcObject = stream;
        await player.play();
        if (stopped) return;
        void navigator.mediaDevices.enumerateDevices().then(all => {
          if (!stopped) setDevices(all.filter(device => device.kind === 'videoinput' && device.deviceId));
        }).catch(() => {});
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('NO_CANVAS');
        let lastFrame = 0;
        function scan(time: number) {
          if (stopped || !player || !context) return;
          if (time - lastFrame >= 150 && player.videoWidth) {
            lastFrame = time;
            const scale = Math.min(1, 640 / player.videoWidth);
            canvas.width = Math.round(player.videoWidth * scale);
            canvas.height = Math.round(player.videoHeight * scale);
            context.drawImage(player, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = decode(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
            if (result) {
              const id = parseLoanQr(result.data, true);
              stop();
              setEnabled(false);
              if (!id) { setMessage('QR นี้ไม่มีรหัสครุภัณฑ์ที่ใช้ได้'); return; }
              dialog.current?.close();
              navigate(() => router.push('/user/borrow?' + new URLSearchParams({ asset_id: id, ...(intent ? { intent } : {}) })));
              return;
            }
          }
          frame = requestAnimationFrame(scan);
        }
        frame = requestAnimationFrame(scan);
      } catch (error) {
        if (stopped) return;
        const name = error instanceof Error ? error.name : '';
        setMessage(name === 'NotAllowedError' ? 'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาเปิดสิทธิ์ในเบราว์เซอร์' :
          name === 'NotFoundError' ? 'ไม่พบกล้องในอุปกรณ์นี้' : 'เปิดกล้องหรือโหลดตัวอ่าน QR ไม่สำเร็จ กรุณาลองใหม่');
        setEnabled(false);
      }
    }
    void start();
    return stop;
  }, [camera, enabled, intent, router]);

  return <>
    <button type="button" disabled={loading} className={compact
      ? 'btn btn-outline-success btn-sm rounded-pill px-3'
      : 'btn borrow-scan-button btn-lg rounded-pill w-100 fw-bold py-3'} onClick={() => {
        setMessage('');
        dialog.current?.showModal();
        setEnabled(true);
      }}><Icon name="camera" className="me-2"/>{loading ? 'กำลังตรวจสอบ…' : compact ? 'สแกน QR Code' : 'สแกน QR Code ด้วยกล้อง'}</button>
    <dialog ref={dialog} className="borrow-camera-dialog" aria-labelledby="borrow-camera-title" onClose={() => setEnabled(false)}>
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <h2 className="h6 mb-0" id="borrow-camera-title"><Icon name="qrcode" className="me-2"/>สแกน QR Code ครุภัณฑ์</h2>
        <button type="button" className="btn-close btn-close-white" aria-label="ปิด" onClick={() => dialog.current?.close()}/>
      </div>
      {devices.length > 1 && <label className="d-block mb-3">เลือกกล้อง
        <select className="form-select mt-1" value={camera} onChange={event => setCamera(event.target.value)}>
          <option value="">กล้องเริ่มต้น</option>
          {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `กล้อง ${index + 1}`}</option>)}
        </select>
      </label>}
      {enabled && <video ref={video} autoPlay playsInline muted className="loan-camera" aria-label="ภาพจากกล้องสำหรับสแกน QR"/>}
      {message && <p role="alert" className="alert alert-warning">{message}</p>}
      <p className="small mb-3">วาง QR Code ให้อยู่ในภาพจากกล้อง</p>
      <div className="d-flex justify-content-end gap-2">
        {!enabled && <button type="button" className="btn btn-success" onClick={() => { setMessage(''); setEnabled(true); }}>ลองอีกครั้ง</button>}
        <button type="button" className="btn btn-secondary rounded-pill" onClick={() => dialog.current?.close()}>ยกเลิก</button>
      </div>
    </dialog>
  </>;
}
