import Link from 'next/link';
export default function Page() { return <main className="container py-5"><div className="card p-4 shadow-sm"><h1 className="h3">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1><p>บัญชีของคุณไม่ได้รับอนุญาตให้เปิดหน้านี้</p><Link href="/dashboard">กลับหน้าหลัก</Link></div></main>; }
