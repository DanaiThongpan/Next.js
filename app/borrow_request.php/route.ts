import { parseLoanQr } from '@/lib/qr-loan';

export function GET(request: Request) {
  const url = new URL(request.url);
  if (!url.search) return new Response(null, {
    status: 307,
    headers: { Location: '/user/borrow', 'Cache-Control': 'no-store' },
  });
  const id = parseLoanQr(request.url, true);
  if (!id) return new Response('ลิงก์ครุภัณฑ์ไม่ถูกต้อง', { status: 400 });
  return new Response(null, {
    status: 307,
    headers: { Location: '/user/borrow?' + new URLSearchParams({ asset_id: id }), 'Cache-Control': 'no-store' },
  });
}
