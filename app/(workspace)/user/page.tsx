import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { Icon } from '@/components/admin/icon';
import { canUseUserPanel, permitted } from '@/lib/auth/policy';
import { requireIdentity } from '@/lib/auth/session';
import { displayHistoryDate, historyDate, historyState } from '@/lib/history-logic';
import type { CatalogRow } from '@/lib/sqlite/catalog';
import { readPendingReturns } from '@/lib/sqlite/borrow';
import { readUserDashboard } from '@/lib/sqlite/user-dashboard';
import { UserShell } from './_components/user-shell';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const number = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toLocaleString('th-TH') : '—';
};
const borrowLink = (id: unknown) => '/user/borrow?' + new URLSearchParams({ asset_id: String(id) });
const historyStatuses = [['active', 'กำลังยืม'], ['pending', 'รอรับคืน'], ['returned', 'คืนแล้ว']];
const requestStatuses = [['pending', 'รออนุมัติ'], ['approved', 'อนุมัติแล้ว'], ['rejected', 'ไม่อนุมัติ']];
const titles: Record<string, string> = {
  home: 'ภาพรวมการใช้งาน', available: 'ค้นหาครุภัณฑ์พร้อมใช้งาน',
  borrowed: 'รายการที่กำลังยืม', history: 'ประวัติการยืม–คืน', 'request-history': 'ติดตามคำขอขึ้นทะเบียน',
};

function Panel({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return <section id={id} className="user-panel mb-4"><header><h2>{title}</h2></header>{children}</section>;
}

function LoanList({ rows, today, history = false }: {
  rows: CatalogRow[]; today: string; history?: boolean;
}) {
  if (!rows.length) return <p className="user-empty">ไม่พบรายการยืม <Link href="/user/available">ค้นหาครุภัณฑ์</Link></p>;
  return <div className="user-data">{rows.map(row => {
    const state = historyState(row, today);
    return <article key={String(row.id)} className="user-data-item">
      <div><h3 className="h6 fw-bold mb-1">{row.name}</h3>
        <p className="small text-secondary mb-2">หมายเลข {row.number || '—'} · อ้างอิง {row.id}</p>
        <dl><div><dt>วันที่ยืม</dt><dd>{displayHistoryDate(row.borrowed)}</dd></div><div><dt>กำหนดคืน</dt><dd>{displayHistoryDate(row.due)}</dd></div>
          {history && <div><dt>{row.status === 'pending_return' ? 'วันที่แจ้งคืน' : 'วันที่คืน'}</dt><dd>{displayHistoryDate(row.returned)}</dd></div>}</dl>
      </div>
      <div className="user-data-actions">
        <span className={`badge bg-${state.color}-subtle text-${state.color}-emphasis`} title={state.detail}>{state.label}</span>
        <small className="text-secondary">{state.detail}</small>
        {!history && row.status !== 'pending_return' && row.assetId &&
          <Link className="btn btn-outline-primary" href={borrowLink(row.assetId)}>คืนครุภัณฑ์</Link>}
      </div>
      {history && (row.purpose || row.returnDetail) && <details><summary>รายละเอียดการยืม–คืน</summary><dl>
        {row.purpose && <div><dt>วัตถุประสงค์</dt><dd>{row.purpose}</dd></div>}
        {row.returnDetail && <div><dt>หมายเหตุการคืน</dt><dd>{row.returnDetail}</dd></div>}
      </dl></details>}
    </article>;
  })}</div>;
}

const loanPageSizes = [10, 25, 50, 100];

function BorrowedTable({ rows, today, requestedPage, length, status }: {
  rows: CatalogRow[]; today: string; requestedPage: number; length: number; status: string;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / length));
  const page = Math.min(requestedPage, pages);
  const offset = (page - 1) * length;
  const href = (target: number) => '/user?' + new URLSearchParams({
    view: 'borrowed', length: String(length), page: String(target), ...(status ? {status} : {}),
  }) + '#borrowed-section';
  const pageNumbers = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter(value => value >= 1 && value <= pages).sort((a,b) => a - b);

  return <>
    <div className="table-responsive" tabIndex={0} role="region" aria-label="ตารางรายการที่กำลังยืม">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead className="table-light"><tr>
          {['ลำดับ','หมายเลขครุภัณฑ์','ชื่อรายการ','วันที่ยืม','กำหนดคืน','จัดการ'].map(label => <th key={label} scope="col" className="text-nowrap">{label}</th>)}
        </tr></thead>
        <tbody>
          {rows.slice(offset, offset + length).map((row, index) => {
            const state = historyState(row, today);
            const pending = row.status === 'pending_return';
            return <tr key={String(row.id)}>
              <td>{number(offset + index + 1)}</td>
              <td><strong className="font-monospace text-break">{row.number || '—'}</strong></td>
              <td><strong>{row.name}</strong></td>
              <td className="text-nowrap">{displayHistoryDate(row.borrowed)}</td>
              <td className="text-nowrap">{displayHistoryDate(row.due)} <span className={`badge bg-${state.color}-subtle text-${state.color}-emphasis`}>
                {state.label}
              </span><div className="small text-secondary">{state.detail}</div></td>
              <td className="text-nowrap">{pending ? <span className="small text-secondary">รอรับคืน</span> :
                row.assetId ? <Link className="btn btn-sm btn-outline-primary"
                  href={borrowLink(row.assetId)}>คืนครุภัณฑ์</Link> : '—'}</td>
            </tr>;
          })}
          {!rows.length && <tr><td colSpan={6} className="text-center text-secondary py-4">ไม่พบรายการยืมตามเงื่อนไข</td></tr>}
        </tbody>
      </table>
    </div>
    <nav className="user-pagination" aria-label="แบ่งหน้ารายการที่กำลังยืม">
      <span className="small text-secondary me-auto">แสดง {number(rows.length ? offset + 1 : 0)} ถึง {number(Math.min(offset + length, rows.length))} จาก {number(rows.length)} รายการ</span>
      {page > 1 ? <Link className="btn btn-sm btn-outline-secondary" href={href(page - 1)}>ก่อนหน้า</Link> : <button className="btn btn-sm btn-outline-secondary" disabled>ก่อนหน้า</button>}
      {pageNumbers.map((value, index) => <span key={value} className="d-inline-flex gap-2 align-items-center">
        {index > 0 && value - pageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
        {value === page ? <span className="btn btn-sm btn-primary" aria-current="page">{number(value)}</span> :
          <Link className="btn btn-sm btn-outline-secondary" href={href(value)}>{number(value)}</Link>}
      </span>)}
      {page < pages ? <Link className="btn btn-sm btn-outline-secondary" href={href(page + 1)}>ถัดไป</Link> : <button className="btn btn-sm btn-outline-secondary" disabled>ถัดไป</button>}
    </nav>
  </>;
}

async function Dashboard({ searchParams }: Props) {
  const user = await requireIdentity();
  if (!canUseUserPanel(user)) redirect('/unauthorized');
  const query = await searchParams;
  const get = (key: string) => typeof query[key] === 'string' ? query[key] : '';
  const standard = permitted(user, 'standard-user');
  const requested = get('view');
  const view = ['available', 'borrowed'].includes(requested) || (standard && ['history', 'requests'].includes(requested)) ? requested : '';
  const active = view === 'requests' ? 'request-history' : view || 'home';
  const keyword = get('q').trim().slice(0, 120);
  const category = get('category').slice(0, 100);
  const building = get('building').slice(0, 100);
  const loanStatus = ['overdue', 'due-soon', 'pending'].includes(get('status')) ? get('status') : '';
  const page = Math.max(1, Math.min(100000, Number.parseInt(get('page'), 10) || 1));
  const requestedLength = Number(get('length'));
  const loanLength = loanPageSizes.includes(requestedLength) ? requestedLength : 10;
  const statuses = view === 'history' ? historyStatuses : view === 'requests' ? requestStatuses : [];
  const detailStatus = statuses.some(([value]) => value === get('status')) ? get('status') : '';
  const [data, ownerReturns] = await Promise.all([
    readUserDashboard(user.id, view, page, keyword, category, building, detailStatus).catch(() => null),
    view ? Promise.resolve([]) : readPendingReturns(user).catch(() => null),
  ]);
  const count = Number(view === 'history' || view === 'requests' ? data?.stats[view] : data?.available) || 0;
  const pageCount = Math.max(1, Math.ceil(count / (data?.pageSize ?? 20)));
  const pageLink = (next: number) => '/user?' + new URLSearchParams({
    page: String(next), ...(view ? {view} : {}), ...(keyword ? {q: keyword} : {}),
    ...(category ? {category} : {}), ...(building ? {building} : {}), ...(detailStatus ? {status: detailStatus} : {}),
  }) + (view === 'history' || view === 'requests' ? '#detail-section' : '#available-section');
  if (data && view !== 'borrowed' && page > pageCount) redirect(pageLink(pageCount));
  const pager = <nav aria-label="หน้ารายการ" className="user-pagination">
    <span className="small text-secondary me-auto">{number(count)} รายการ · หน้า {page} / {pageCount}</span>
    {page > 1 && <Link className="btn btn-outline-secondary" href={pageLink(Math.min(page - 1, pageCount))}>ก่อนหน้า</Link>}
    {page < pageCount && <Link className="btn btn-outline-secondary" href={pageLink(page + 1)}>ถัดไป</Link>}
  </nav>;

  const getLoanStatus = (row: CatalogRow) => {
    if (!data) return '';
    if (row.status === 'pending_return') return 'pending';
    if (historyState(row, data.today).color === 'danger') return 'overdue';
    const due = historyDate(row.due);
    const today = historyDate(data.today);
    return due !== null && today !== null && due >= today && due - today <= 3 * 86400000 ? 'due-soon' : '';
  };
  const overdue = data?.loans.filter(row => getLoanStatus(row) === 'overdue').length ?? 0;
  const dueSoon = data?.loans.filter(row => getLoanStatus(row) === 'due-soon').length ?? 0;
  const metrics = [
    {key:'overdue', label:'เลยกำหนดคืน', href:'/user?view=borrowed&status=overdue', icon:'triangle-exclamation', color:'danger', value:overdue},
    {key:'borrowed', label:'กำลังยืม', href:'/user/borrowed', icon:'hand-holding-hand', color:'primary', value:data?.loans.length},
    {key:'due', label:'ครบกำหนดใน 3 วัน', href:'/user?view=borrowed&status=due-soon', icon:'calendar-days', color:'warning-emphasis', value:dueSoon},
    ...(standard ? [{key:'requests', label:'คำขอขึ้นทะเบียน', href:'/user/request-history', icon:'file-lines', color:'primary', value:data?.stats.requests}] : []),
  ];

  const detailsFilter = statuses.length > 0 && <form action="/user#detail-section" className="user-search" role="search">
    <input type="hidden" name="view" value={view}/>
    <label className="form-label mb-0">ชื่อ หมายเลข หรือเลขอ้างอิง
      <input name="q" type="search" maxLength={120} className="form-control mt-1" defaultValue={keyword}/>
    </label>
    <label className="form-label mb-0">สถานะ
      <select name="status" className="form-select mt-1" defaultValue={detailStatus}>
        <option value="">ทุกสถานะ</option>
        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <div className="user-search-actions"><button className="btn btn-primary">ค้นหา</button>
      <Link href={view === 'history' ? '/user/history' : '/user/request-history'} className="btn btn-outline-secondary">ล้าง</Link>
    </div>
  </form>;

  return <UserShell user={user} active={active}>
    <div className="user-hero">
      <h1>{titles[active]}</h1>
      <p>{!view ? `ยินดีต้อนรับ ${user.name} · ${user.department || 'ไม่ระบุแผนก'}` :
        view === 'available' ? 'ค้นหาด้วยชื่อหรือหมายเลข และเลือกหมวดหมู่หรืออาคาร' :
        'ตรวจสอบรายการและสถานะของบัญชีคุณ'}</p>
    </div>
    {!view && <div className="loan-scan-actions mb-4">
      <Link href="/user/borrow?intent=borrow" className="btn btn-primary"><Icon name="qrcode" className="me-2"/>สแกนเพื่อยืม</Link>
      <Link href="/user/borrow?intent=return" className="btn btn-outline-primary"><Icon name="rotate-left" className="me-2"/>สแกนเพื่อคืน</Link>
    </div>}
    {!view && ownerReturns && ownerReturns.length > 0 && <Link className="alert alert-warning d-block" href="/user/borrow?review=return">
      มีรายการรอให้คุณรับคืน{ownerReturns.length > 10 ? ' มากกว่า 10 รายการ' : ` ${ownerReturns.length} รายการ`}
    </Link>}
    {!data ? <p role="alert" className="alert alert-danger">โหลดข้อมูลไม่สำเร็จ กรุณาลองเปิดหน้านี้อีกครั้ง</p> : <>
      {!view && <>
        {overdue > 0 && <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2">
          <strong>มีครุภัณฑ์เลยกำหนดคืน {number(overdue)} รายการ</strong>
          <Link className="btn btn-outline-danger" href="/user?view=borrowed&status=overdue">ตรวจรายการเกินกำหนด</Link>
        </div>}
        <div className="user-grid mb-4">{metrics.map(item => <Link key={item.key} href={item.href} className="user-metric">
          <span><Icon name={item.icon} className={`me-2 text-${item.color}`}/>{item.label}</span><strong>{number(item.value)}</strong>
        </Link>)}</div>
      </>}
      {(!view || view === 'borrowed') && <Panel title={view ? "รายการครุภัณฑ์ที่คุณกำลังยืม (รอส่งคืน)" : "รายการที่กำลังยืม"} id="borrowed-section">
        {view === 'borrowed' && <form action="/user#borrowed-section" className="user-search">
          <input type="hidden" name="view" value="borrowed"/>
          <label className="form-label mb-0">รายการต่อหน้า<select name="length" className="form-select mt-1" defaultValue={loanLength}>
            {loanPageSizes.map(size => <option key={size} value={size}>{size}</option>)}
          </select></label>
          <label className="form-label mb-0">สถานะ<select name="status" className="form-select mt-1" defaultValue={loanStatus}>
            <option value="">ทั้งหมด</option><option value="overdue">เลยกำหนดคืน</option><option value="due-soon">ครบกำหนดใน 3 วัน</option><option value="pending">รออนุมัติคืน</option>
          </select></label>
          <div className="user-search-actions"><button className="btn btn-primary">กรอง</button><Link href="/user/borrowed" className="btn btn-outline-secondary">ล้าง</Link></div>
        </form>}
        {view === 'borrowed' ? <BorrowedTable rows={loanStatus ? data.loans.filter(row => getLoanStatus(row) === loanStatus) : data.loans}
          today={data.today} requestedPage={page} length={loanLength} status={loanStatus}/> :
          <LoanList rows={data.loans} today={data.today}/>}
      </Panel>}
      {!view && <div className="user-data-actions mb-4">
        <Link href="/user/available" className="btn btn-primary">ค้นหาครุภัณฑ์</Link>
        <Link href="/user/borrow" className="btn btn-outline-primary">เปิดระบบยืม–คืน</Link>
        {standard && <Link href="/user/requests" className="btn btn-outline-primary">เสนอขึ้นทะเบียน</Link>}
        {standard && <Link href="/user/history" className="btn btn-outline-secondary">ประวัติการยืม–คืน ({number(data.stats.history)})</Link>}
      </div>}
      {(!view || view === 'available') && <Panel title="ครุภัณฑ์พร้อมใช้งาน" id="available-section">
        <form action="/user#available-section" className="user-search" role="search">
          {view && <input type="hidden" name="view" value="available"/>}
          <label className="form-label mb-0">ชื่อหรือหมายเลข<input name="q" type="search" maxLength={120} className="form-control mt-1" defaultValue={keyword}/></label>
          <label className="form-label mb-0">หมวดหมู่<select name="category" className="form-select mt-1" defaultValue={category}>
            <option value="">ทุกหมวดหมู่</option>{data.categories.map(row => <option key={String(row.id)} value={String(row.id)}>{row.name}</option>)}</select></label>
          <label className="form-label mb-0">อาคาร<select name="building" className="form-select mt-1" defaultValue={building}>
            <option value="">ทุกอาคาร</option>{data.buildings.map(row => <option key={String(row.id)} value={String(row.id)}>{row.name}</option>)}</select></label>
          <div className="user-search-actions"><button className="btn btn-primary">ค้นหา</button><Link href={view ? '/user/available' : '/user#available-section'} className="btn btn-outline-secondary">ล้าง</Link></div>
        </form>
        {data.inventory.length ? <div className="user-data pt-0">{data.inventory.map(row => <article key={String(row.id)} className="user-data-item">
          <div><h3 className="h6 fw-bold mb-1">{row.name}</h3><p className="small text-secondary mb-0">{row.number ?? '—'} · {row.category ?? 'ไม่ระบุหมวดหมู่'}</p></div>
          <div className="user-data-actions"><span className="badge bg-success-subtle text-success-emphasis">พร้อมใช้งาน</span>
            <Link className="btn btn-outline-primary" href={borrowLink(row.id)}>ยืมครุภัณฑ์</Link></div>
          <details><summary>ดูรายละเอียด</summary><dl>
            <div><dt>ยี่ห้อ / รุ่น</dt><dd>{row.brand || '—'}</dd></div><div><dt>ขนาด / สเปค</dt><dd>{row.size || '—'}</dd></div>
            <div><dt>อาคาร / ห้อง</dt><dd>{[row.building,row.room].filter(Boolean).join(' · ') || '—'}</dd></div>
            <div><dt>ปีงบประมาณ</dt><dd>{row.year || '—'}</dd></div>
            {row.detail && <div><dt>รายละเอียด</dt><dd>{row.detail}</dd></div>}
          </dl></details>
        </article>)}</div> : <p className="user-empty">ไม่พบครุภัณฑ์พร้อมใช้งานตามเงื่อนไข</p>}
        {pager}
      </Panel>}
      {!view && standard && <Panel title="ประวัติการยืม–คืนล่าสุด">
        <LoanList rows={data.extra} today={data.today} history/>
        <div className="user-pagination"><Link href="/user/history" className="btn btn-outline-primary">ดูประวัติทั้งหมด</Link></div>
      </Panel>}
      {view === 'history' && <Panel title="รายการยืม–คืนของฉัน" id="detail-section">{detailsFilter}<LoanList rows={data.extra} today={data.today} history/>{pager}</Panel>}
      {view === 'requests' && <Panel title="คำขอของฉัน" id="detail-section">
        {detailsFilter}
        {data.extra.length ? <div className="user-data">{data.extra.map(row => {
          const approval = String(row.approved ?? '');
          const status = approval === '0' ? ['รออนุมัติ','warning'] : approval === '1' ? ['อนุมัติแล้ว','success'] : approval === '-1' ? ['ไม่อนุมัติ','danger'] : ['ไม่ระบุสถานะ','secondary'];
          return <article key={String(row.id)} className="user-data-item"><div>
            <h3 className="h6 fw-bold mb-1">{row.name}</h3><p className="small text-secondary mb-0">{row.batchId ? 'คำขอ CSV' : 'คำขอรายชิ้น'} · {row.number || '—'} · อ้างอิง {row.id}</p>
          </div><span className={`badge bg-${status[1]}-subtle text-${status[1]}-emphasis`}>{status[0]}</span>
          <details><summary>รายละเอียดคำขอ</summary><dl>
            <div><dt>ยี่ห้อ / รุ่น</dt><dd>{row.brand || '—'}</dd></div>
            <div><dt>แผนก</dt><dd>{row.department || '—'}</dd></div>
            <div><dt>ราคาจัดซื้อ</dt><dd>{row.price == null || row.price === '' ? '—' : `${number(row.price)} บาท`}</dd></div>
            {row.year && <div><dt>ปีงบประมาณ</dt><dd>{row.year}</dd></div>}
            {row.category && <div><dt>รหัสหมวดหมู่</dt><dd>{row.category}</dd></div>}
            {row.building && <div><dt>อาคาร / ห้อง</dt><dd>{row.building} / {row.room || '—'}</dd></div>}
            {row.batchId && <div><dt>เลขที่ชุดคำขอ CSV</dt><dd className="user-csv-break">{row.batchId} · {row.batchCount} รายการ</dd></div>}
            {row.fileName && <div><dt>ไฟล์ที่ส่ง</dt><dd className="user-csv-break">{row.fileName}</dd></div>}
            {row.submittedAt && Number.isFinite(Date.parse(String(row.submittedAt))) && <div><dt>วันที่ส่ง (เวลาไทย)</dt><dd>{new Intl.DateTimeFormat('th-TH', {
              dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok',
            }).format(new Date(String(row.submittedAt)))}</dd></div>}
            {row.decidedBy && <div><dt>ผู้พิจารณา</dt><dd>{row.decidedBy} · {row.decidedAt} (เวลาไทย)</dd></div>}
            {row.rejectionReason && <div><dt>เหตุผลที่ไม่อนุมัติ</dt><dd className="user-csv-break">{row.rejectionReason}</dd></div>}
            {row.detail && <div><dt>รายละเอียด</dt><dd>{row.detail}</dd></div>}
          </dl></details></article>;
        })}</div> : <p className="user-empty">ไม่พบคำขอตามเงื่อนไข <Link href="/user/requests">เสนอขึ้นทะเบียนครุภัณฑ์</Link></p>}
        {pager}
      </Panel>}
    </>}
  </UserShell>;
}


export default function Page(props: Props) {
  return <Suspense fallback={<p className="container-xl py-4" role="status">กำลังโหลดข้อมูลผู้ใช้งาน…</p>}><Dashboard {...props}/></Suspense>;
}
