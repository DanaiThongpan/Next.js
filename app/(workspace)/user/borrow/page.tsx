import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { currentIdentity } from '@/lib/auth/session';
import { canUseUserPanel, homeFor } from '@/lib/auth/policy';
import { displayHistoryDate } from '@/lib/history-logic';
import { bangkokDay } from '@/lib/dashboard/model';
import { hasLoanAudit, hasOwnedAssets, readBorrowScreen, readPendingReturns } from '@/lib/sqlite/borrow';
import { isolatedSqliteWritePath } from '@/lib/sqlite/write-path';
import { Icon } from '@/components/admin/icon';
import { parseLoanQr } from '@/lib/qr-loan';
import './borrow-request.css';
import { AssetPhoto } from './asset-photo';
import { BorrowForm } from './borrow-form';
import { LoanScanner } from './loan-scanner';
import { BorrowSearch } from './borrow-search';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Content({ searchParams }: Props) {
  const query = await searchParams;
  const raw = query.asset_id ?? query.da_id;
  const identifier = typeof raw === 'string' ? parseLoanQr(raw, true) ?? '' : '';
  const reviewingReturn = query.review === 'return';
  const intent = reviewingReturn ? 'review' : query.intent === 'borrow' || query.intent === 'return' ? query.intent : 'auto';
  const loanId = typeof query.loan === 'string' && /^[a-zA-Z0-9_-]{1,50}$/.test(query.loan) ? query.loan : '';
  const page = typeof query.page === 'string' ? Math.max(1, Math.min(100000, parseInt(query.page, 10) || 1)) : 1;
  const user = await currentIdentity();
  if (!user) {
    const destination = '/user/borrow?' + new URLSearchParams({
      ...(identifier ? {asset_id: identifier} : {}), ...(reviewingReturn ? {review: 'return'} : {}),
      ...(intent === 'borrow' || intent === 'return' ? {intent} : {}), ...(loanId ? {loan: loanId} : {}),
    });
    redirect('/login?' + new URLSearchParams({redirect: destination}));
  }
  if (!canUseUserPanel(user)) redirect('/unauthorized');
  const [data, writePath, pendingReturns, auditReady, owner] = await Promise.all([
    readBorrowScreen(user, identifier, intent, loanId).catch(() => null),
    isolatedSqliteWritePath(),
    identifier ? Promise.resolve([]) : readPendingReturns(user, page).catch(() => null),
    identifier ? hasLoanAudit().catch(() => false) : Promise.resolve(false),
    reviewingReturn ? hasOwnedAssets(user).catch(() => false) : Promise.resolve(false),
  ]);
  const asset = data?.asset;
  const loan = data?.loan;
  const action = data?.mode === 'borrow' ? 'borrow' : data?.mode === 'return' ? 'request-return' :
    data?.mode === 'approve_return' ? 'approve-user-return' : data?.mode === 'direct_return' ? 'owner-direct-return' : null;
  const searchUrl = intent === 'borrow' || intent === 'return' ? '/user/borrow?intent=' + intent : '/user/borrow';
  const scanIntent = intent === 'borrow' || intent === 'return' ? intent : undefined;
  return <main className="borrow-request">
    <div className="borrow-request-inner">
      <nav className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3" aria-label="ระบบยืมและคืน">
        <div className="d-flex flex-wrap gap-2">
          <Link href={homeFor(user)} className="btn btn-outline-secondary btn-sm rounded-pill px-3"><Icon name="arrow-left" className="me-1"/>กลับหน้าหลัก</Link>
          {raw && <Link href={searchUrl} className="btn btn-outline-primary btn-sm rounded-pill px-3"><Icon name="magnifying-glass" className="me-1"/>ค้นหาครุภัณฑ์อื่น</Link>}
          {asset && <LoanScanner key={identifier} intent={scanIntent} compact/>}
        </div>
        <span className="small text-muted"><Icon name="circle-user" className="text-primary me-1"/><strong>{user.name}</strong>{user.department && ` (${user.department})`}</span>
      </nav>
      <div className="card borrow-main-card">
        <header className="borrow-header text-center">
          <span className="borrow-header-icon"><Icon name="qrcode"/></span>
          <h1 className="h4 fw-bold mb-1">ระบบยืม-คืนครุภัณฑ์ (สแกน QR Code)</h1>
          <p className="small mb-0 opacity-75">ตรวจสอบรายละเอียดครุภัณฑ์และยืนยันการทำรายการ</p>
        </header>
        <div className="card-body p-3 p-sm-4">
    {!data && <p className="alert alert-danger" role="alert">โหลดข้อมูลไม่สำเร็จ กรุณาเปิดหน้าใหม่</p>}
    {!asset && (!reviewingReturn || raw) && <section className="text-center py-3">
      <span className="borrow-search-icon"><Icon name={raw ? 'circle-question' : 'barcode'}/></span>
      <h2 className="h5 fw-bold">{raw ? 'ไม่พบข้อมูลครุภัณฑ์ในระบบ' : 'ค้นหาหรือสแกนหมายเลขครุภัณฑ์'}</h2>
      <p className="small text-muted">{raw ? 'ตรวจสอบหมายเลข หรือสแกน QR บนครุภัณฑ์อีกครั้ง' : 'สแกน QR Code หรือค้นหาด้วยหมายเลขและชื่อครุภัณฑ์'}</p>
      <BorrowSearch key={identifier} initial={identifier} intent={scanIntent}/>
      <div className="mt-4 pt-3 border-top"><LoanScanner key={intent} intent={scanIntent}/></div>
    </section>}
    {asset && <section>
      <div className="text-center mb-4">
        {'hasPhoto' in asset && asset.hasPhoto === 1 &&
          <AssetPhoto key={String(asset.id)} id={String(asset.id)} name={String(asset.name || 'รูปครุภัณฑ์')}/>}
        <h2 className="h5 fw-bold text-primary mt-2 mb-1 text-break">{asset.name || 'รายการครุภัณฑ์'}</h2>
        <p className="font-monospace text-muted mb-2 text-break">หมายเลขครุภัณฑ์ <strong>{asset.number || asset.id}</strong></p>
        <span className={`badge rounded-pill px-3 py-2 ${data?.occupied ? 'bg-warning text-dark' : data?.available ? 'bg-success' : 'bg-danger'}`}>
          {loan?.status === 'pending_return' ? 'รอเจ้าของรับคืน' : action === 'request-return' ? 'คุณกำลังยืมชิ้นนี้อยู่' : data?.occupied ? 'กำลังถูกยืม' : data?.available ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
        </span>
      </div>
      {'category' in asset && <dl className="row g-3 bg-light rounded-4 p-3 mx-0 mb-4">
        <div className="col-6"><dt>หมวดหมู่</dt><dd>{asset.category || '—'}</dd></div>
        <div className="col-6"><dt>ยี่ห้อ / รุ่น</dt><dd>{asset.brand || '—'}</dd></div>
        <div className="col-6"><dt>สถานที่จัดเก็บ</dt><dd>{[asset.building, asset.room, asset.location].filter(Boolean).join(' · ') || '—'}</dd></div>
        <div className="col-6"><dt>ปีที่ได้มา / ราคา</dt><dd>{asset.year || '—'}{Number(asset.price) > 0 && ` / ฿${Number(asset.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</dd></div>
        {asset.detail && <div className="col-12"><dt>รายละเอียดครุภัณฑ์</dt><dd>{asset.detail}</dd></div>}
        {asset.size && <div className="col-12"><dt>ขนาด / สเปค</dt><dd>{asset.size}</dd></div>}
      </dl>}
      {loan && <div className={`alert ${loan.status === 'pending_return' ? 'alert-warning' : 'alert-info'} rounded-4`}>
        <strong><Icon name="user-tag" className="me-2"/>ผู้ยืม {loan.borrower || '—'}</strong>
        <div className="small mt-1">อ้างอิง {loan.id} · ยืม {displayHistoryDate(loan.borrowed)} · กำหนดคืน {displayHistoryDate(loan.due)}</div>
        {loan.returned && <div className="small">วันที่แจ้งคืน {displayHistoryDate(loan.returned)}</div>}
      </div>}
    </section>}
    {asset && (reviewingReturn || intent === 'return') && !action && <p className="alert alert-info" role="status">
      {loan?.status === 'pending_return' ? 'แจ้งส่งคืนแล้ว กำลังรอเจ้าของรับคืน' : 'ไม่มีรายการยืมที่คุณรับคืนหรือแจ้งคืนได้สำหรับครุภัณฑ์นี้'}
    </p>}
    {asset && action && <section className="border rounded-4 mb-3">
      <header className="px-3 pt-3"><h2 className="h6 fw-bold text-primary">{action === 'borrow' ? 'ข้อมูลการยืม' : action === 'request-return' ? 'แจ้งส่งคืน' : 'ยืนยันรับคืน'}</h2></header>
      <div className="p-3">{writePath && auditReady ?
        <BorrowForm key={String(asset.id) + ':' + action + ':' + String(loan?.id ?? '')} action={action}
          asset={String(asset.id)} loan={String(loan?.id ?? '')} today={bangkokDay()} name={user.name}
          department={user.department} rank={String(data?.account?.rank ?? '')} email={String(data?.account?.email ?? '')}/> :
        <p className="alert alert-info mb-0" role="status">{writePath ? 'ผู้ดูแลต้องเตรียมตารางประวัติการยืม–คืนในฐาน Next.js ก่อนทำรายการ' : 'การยืม–คืนจะเปิดเมื่อผู้ดูแลตั้งค่าฐานข้อมูลแยกสำหรับ Next.js'}</p>}
      </div>
    </section>}
    {!identifier && ((reviewingReturn && owner) || Boolean(pendingReturns?.length)) && <section className="user-panel mb-3">
      <header><h2>รายการรอให้คุณรับคืน</h2></header>
      {pendingReturns === null ? <p className="user-empty" role="status">โหลดรายการรอรับคืนไม่สำเร็จ</p> :
        pendingReturns.length ? <>
          <ul className="user-data list-unstyled mb-0">
            {pendingReturns.slice(0, 10).map(row => <li key={String(row.loanId)} className="user-data-item">
              <div><strong>{row.name || 'ครุภัณฑ์'}</strong><div className="small text-secondary">
                {row.number || row.id} · ผู้ยืม {row.borrower} · ยืม {displayHistoryDate(row.borrowed)} · กำหนด {displayHistoryDate(row.due)} · แจ้งคืน {displayHistoryDate(row.requested)}
              </div></div>
              <Link className="btn btn-outline-primary" href={'/user/borrow?' + new URLSearchParams({ asset_id: String(row.id), review: 'return', loan: String(row.loanId) })}>
                ตรวจรายการรับคืน
              </Link>
            </li>)}
          </ul>
          <nav className="user-pagination" aria-label="แบ่งหน้ารายการรอรับคืน">
            {page > 1 && <Link className="btn btn-outline-secondary" href={`/user/borrow?review=return&page=${page - 1}`}>ก่อนหน้า</Link>}
            {pendingReturns.length > 10 && <Link className="btn btn-outline-secondary" href={`/user/borrow?review=return&page=${page + 1}`}>ถัดไป</Link>}
          </nav>
        </> : <p className="user-empty">ไม่มีรายการรอรับคืนในขอบเขตของคุณ</p>}
    </section>}
    {reviewingReturn && !identifier && !owner && <p role="status" className="alert alert-info">เมนูรับคืนสำหรับบัญชีที่มีสิทธิ์ดูแลครุภัณฑ์</p>}
    <div className="user-data-actions mt-3">
      <Link className="btn btn-outline-secondary" href="/user/available">ครุภัณฑ์พร้อมใช้งาน</Link>
      <Link className="btn btn-outline-secondary" href="/user/borrowed">รายการที่กำลังยืม</Link>
    </div>
        </div>
      </div>
    </div>
  </main>;
}

export default function Page(props: Props) {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดข้อมูลครุภัณฑ์…</p>}><Content {...props}/></Suspense>;
}
