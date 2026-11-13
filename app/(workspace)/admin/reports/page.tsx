import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { requireIdentity } from '@/lib/auth/session';
import { bangkokDay } from '@/lib/dashboard/model';
import { readReport, reportAllDepartments } from '@/lib/sqlite/reports';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { HistoryEmailDialog } from '@/components/admin/history-email-dialog';
import { DashboardChart } from '@/components/admin/dashboard-chart';
import { ReportChart } from '@/components/admin/report-chart';
import { Icon } from '@/components/admin/icon';
import { ReportOutput } from '@/components/admin/report-output';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type Row = Record<string, string | number | null>;
const tabs = { inventory: 'ภาพรวมสถานะครุภัณฑ์', borrowing: 'สถิติการยืม-คืน', analytics: 'บทวิเคราะห์เชิงลึก' };
const tabIcons = ['boxes-stacked', 'chart-line', 'ranking-star'];
const metricColors = ['blue', 'green', 'amber', 'red'];
const metricText = ['text-dark', 'text-success', 'text-warning', 'text-danger'];
const states = { total: 'ครุภัณฑ์ทั้งหมดในคลัง', available: 'พร้อมใช้งาน (Available)', borrowed: 'กำลังถูกยืม (Borrowed)', damaged: 'ชำรุด / สูญหาย (Damaged)' };
const money = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inventoryStatuses = ['available', 'borrowed', 'damaged'] as const;
const statusPercent = new Intl.NumberFormat('th-TH', {
  style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2,
});
const statusColors = ['success', 'warning', 'danger'] as const;

function Card({ title, children, detail, icon = 'table-list', table = false, extra, danger = false }: { title: string; children: ReactNode; detail?: string; icon?: string; table?: boolean; extra?: ReactNode; danger?: boolean }) {
  return <section className={`card analytics-card h-100 ${danger ? 'report-overdue' : ''}`}><header className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2"><div><h2 className="h6 fw-bold mb-0"><Icon name={icon} className="text-primary me-2"/>{title}</h2>{detail && <p className="small text-secondary mb-0 mt-1">{detail}</p>}</div>{extra}</header><div className={table ? "p-0" : "card-body"}>{children}</div></section>;
}

function Table({ headers, rows, overdue = false }: { headers: string[]; rows: ReactNode[][]; overdue?: boolean }) {
  return <div className="table-responsive"><table className="table table-sm table-hover align-middle mb-0">
    <thead className="table-light"><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((row, i) => <tr key={i} className={overdue ? 'table-danger' : undefined}>{row.map((cell, j) => <td key={j}>{cell ?? '—'}</td>)}</tr>)
      : <tr><td colSpan={headers.length} className="text-center py-4">ไม่พบข้อมูล</td></tr>}</tbody>
  </table></div>;
}

function Summary({ items }: { items: [string, number][] }) {
  return <div className="row g-3 mb-4">{items.map(([label, value], index) =>
    <div className="col-6 col-lg" key={label}>
      <div className={`mini-kpi h-100 mini-kpi-${metricColors[index]}`}>
        <div className="small text-secondary fw-semibold">{label}</div>
        <strong className={`fs-3 ${metricText[index]}`}>{value.toLocaleString('th-TH')}</strong>
        <span className="small text-secondary ms-1">รายการ</span>
      </div>
    </div>)}</div>;
}

function Inventory({ summary, categories }: { summary: Row; categories: Row[] }) {
  const total = Number(summary.total ?? 0);
  const shares = inventoryStatuses.map((key, index) => {
    const count = Number(summary[key] ?? 0);
    const share = total > 0 ? count / total : 0;
    return {
      key, count, color: statusColors[index],
      barWidth: count > 0 ? Math.max(3, share * 100) : 0,
      percentage: share > 0 && share < 0.0001 ? '<0.01%' : statusPercent.format(share),
    };
  });
  return <>
    <Summary items={Object.entries(states).map(([key, label]) => [label, Number(summary[key] ?? 0)])}/>
    <div className="row g-3 mb-4">
      <div className="col-lg-5"><Card title="Chart 1.1: สัดส่วนสถานะครุภัณฑ์ทั้งหมด" icon="chart-pie" detail="เปรียบเทียบสัดส่วนพร้อมใช้งาน กำลังถูกยืม และชำรุดหรือสูญหาย">
        <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
          <DashboardChart kind="status" navigateOnClick={false}
            labels={shares.map(({ key }) => states[key])} values={shares.map(({ count }) => count)}/>
          <ul className="list-unstyled d-flex flex-column gap-2 mb-0 flex-grow-1" style={{ flexBasis: '13rem' }}
            aria-label="จำนวนและสัดส่วนครุภัณฑ์ตามสถานะ">
            {shares.map(({ key, count, color, percentage, barWidth }) => <li key={key}
              className="status-legend-card border rounded-3 bg-white p-2">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 small mb-1">
                <span className="d-inline-flex align-items-center gap-2 fw-semibold">
                  <span aria-hidden="true" className={`bg-${color} rounded-circle flex-shrink-0`} style={{ width: 10, height: 10 }}/>
                  {states[key]}
                </span>
                <strong className={`text-${color === 'warning' ? 'warning-emphasis' : color} text-nowrap`}>
                  {count.toLocaleString('th-TH')} ({percentage})
                </strong>
              </div>
              <div className="progress" style={{ height: 5 }} aria-hidden="true">
                <div className={`progress-bar bg-${color}`} style={{ width: `${barWidth}%` }}/>
              </div>
            </li>)}
          </ul>
        </div>
        <p className="small text-secondary mb-0 mt-3">กราฟขยายส่วนที่มีสัดส่วนน้อยเพื่อให้มองเห็นง่าย ดูสัดส่วนจริงจากตัวเลขในแต่ละสถานะ</p>
      </Card></div>
      <div className="col-lg-7"><Card title="Chart 1.2: จำนวนครุภัณฑ์แยกตามหมวดหมู่" icon="chart-column" detail="10 หมวดหมู่ที่มีจำนวนครุภัณฑ์มากที่สุด">
        <ReportChart type="bar" labels={categories.map(row => String(row.category))} series={[{ label: 'จำนวนครุภัณฑ์', values: categories.map(row => Number(row.total)), color: '#4475ed' }]}/>
      </Card></div>
    </div>
    <Card title="สรุปจำนวนและมูลค่าจัดซื้อแยกตามหมวดหมู่" table>
      <Table headers={['#','ชื่อหมวดหมู่ครุภัณฑ์','จำนวน (รายการ)','มูลค่ารวม (บาท)','สัดส่วน']} rows={categories.map((row, i) => {
        const share = total ? 100 * Number(row.total) / total : 0;
        return [i + 1, <strong key="category">{row.category}</strong>, <strong key="total">{Number(row.total).toLocaleString('th-TH')}</strong>,
          <strong key="value" className="text-success text-nowrap">฿{money.format(Number(row.value))}</strong>,
          <div key="share" className="report-share text-center"><div className="progress" aria-hidden="true"><div className="progress-bar" style={{ width: `${share}%` }}/></div><small className="text-secondary">{share.toFixed(1)}%</small></div>];
      })}/>
    </Card>
  </>;
}

function Borrowing({ data, from, to, daily }: { data: Row[][]; from: string; to: string; daily: boolean }) {
  const [borrow, returns, overdue] = data;
  const labels: string[] = [];
  const periods: string[] = [];
  const cursor = new Date(daily ? from : from.slice(0, 7) + '-01');
  const format = new Intl.DateTimeFormat('th-TH', daily ? { day: '2-digit', month: '2-digit', timeZone: 'UTC' } : { month: 'short', year: '2-digit', timeZone: 'UTC' });
  while (cursor.toISOString().slice(0, 10) <= to) {
    periods.push(cursor.toISOString().slice(0, daily ? 10 : 7));
    labels.push(format.format(cursor));
    if (daily) cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const series = [borrow, returns].map((rows, i) => {
    const counts = new Map(rows.map(row => [String(row.period), Number(row.total)]));
    return { label: i ? 'รายการคืน (Returns)' : 'รายการยืม (Borrowings)', values: periods.map(period => counts.get(period) ?? 0), color: i ? '#10b981' : '#0d6efd' };
  });
  const totals = series.map(item => item.values.reduce((sum, count) => sum + count, 0));
  return <>
    <div className="mb-4">
      <Card title="Chart 2.1: แนวโน้มการทำรายการยืม-คืนตามช่วงเวลา" icon="chart-line"
        detail="เปรียบเทียบรายการยืม (สีน้ำเงิน) กับรายการคืน (สีเขียว)"
        extra={<div className="d-flex flex-wrap gap-2">
          <span className="badge bg-primary-subtle text-primary">ยืมสะสม {totals[0].toLocaleString('th-TH')} ครั้ง</span>
          <span className="badge bg-success-subtle text-success">คืนสะสม {totals[1].toLocaleString('th-TH')} ครั้ง</span>
          <span className="badge text-bg-light">ช่วงข้อมูล {from} ถึง {to}</span>
        </div>}>
        <ReportChart type="line" labels={labels} series={series}/>
      </Card>
    </div>
    <Card title="Table 2.2: รายการเกินกำหนดส่งคืน (Overdue Borrowings)" icon="triangle-exclamation"
      detail="แสดงรายการที่ยังไม่ส่งคืนและเลยกำหนด เพื่อให้ติดตามทวงคืนได้"
      danger table extra={<span className="badge rounded-pill bg-danger text-white">เกินกำหนดทั้งหมด {overdue.length} รายการ</span>}>
      <Table overdue headers={['#','หมายเลขครุภัณฑ์','รายการครุภัณฑ์','ผู้ยืมและข้อมูลติดต่อ','วันที่ยืม','กำหนดส่งคืน','จำนวนวันที่เกินกำหนด','การจัดการ']} rows={overdue.map((row, i) =>
        [i + 1,
          <code key="number" className="badge bg-white text-danger border border-danger-subtle">{String(row.number ?? '').replace(/^['"]+|['"]+$/g, '') || '—'}</code>,
          <strong key="asset">{row.name}</strong>,
          <div key="borrower"><strong><Icon name="user" className="text-secondary me-1"/>{row.borrower}</strong>{row.email && <small className="d-block text-secondary"><Icon name="envelope" className="me-1"/>{row.email}</small>}</div>,
          row.borrowed, <strong key="due" className="text-danger text-nowrap">{row.due}</strong>,
          <span key="days" className="badge rounded-pill bg-danger text-white">เกิน {row.days} วัน</span>,
          <HistoryEmailDialog key="reminder" id={String(row.id)} label="ทวงคืน" sendLabel="ส่งอีเมลทวงคืน"/>])}/>
    </Card>
  </>;
}

function Analytics({ items, users }: { items: Row[]; users: Row[] }) {
  return <div className="row g-3">
    <div className="col-lg-6"><Card title="Chart 3.1: Top 5 ครุภัณฑ์ที่ถูกยืมบ่อยที่สุด" icon="fire"
      detail="จัดอันดับครุภัณฑ์ยอดนิยมที่มีการทำรายการยืมสูงสุด">
      <ReportChart type="bar" horizontal labels={items.map(row => String(row.name))} series={[{ label: 'ครั้งที่ยืม', values: items.map(row => Number(row.total)), color: 'rgba(139, 92, 246, 0.85)' }]}/>
    </Card></div>
    <div className="col-lg-6"><Card title="Chart 3.2: Top 5 ผู้ใช้งานที่ทำรายการยืมสูงสุด" icon="users"
      detail="จัดอันดับผู้ใช้งานที่มีการทำรายการยืมครุภัณฑ์มากที่สุด">
      <ReportChart type="polarArea" labels={users.map(row => String(row.name))} series={[{ label: 'ครั้งที่ยืม', values: users.map(row => Number(row.total)), color: ['#3b82f6bf', '#10b981bf', '#f59e0bbf', '#8b5cf6bf', '#ec4899bf'] }]}/>
    </Card></div>
    <div className="col-lg-6"><Card title="ตารางอันดับครุภัณฑ์ที่ถูกยืมบ่อยที่สุด" icon="trophy" table>
      <Table headers={['อันดับ','หมายเลข / ชื่อครุภัณฑ์','จำนวนครั้งที่ยืม']} rows={items.map((row, i) => [i + 1,
        <div key="asset"><strong>{row.name}</strong>{row.number && <div><code className="badge bg-light text-primary border">{row.number}</code></div>}</div>,
        <span key="count" className="badge rounded-pill bg-primary text-white px-3">{row.total} ครั้ง</span>])}/>
    </Card></div>
    <div className="col-lg-6"><Card title="ตารางอันดับผู้ใช้งานที่ยืมสูงสุด" icon="medal" table>
      <Table headers={['อันดับ','ชื่อผู้ยืม / แผนก','จำนวนครั้งที่ยืม']} rows={users.map((row, i) => [i + 1,
        <div key="borrower"><strong>{row.name}</strong>{row.department && <small className="d-block text-secondary"><Icon name="building" className="me-1"/>{row.department}</small>}</div>,
        <span key="count" className="badge rounded-pill report-rank-count px-3">{row.total} ครั้ง</span>])}/>
    </Card></div>
  </div>;
}

function validDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

async function Content({ searchParams }: Props) {
  const user = await requireIdentity('admin');
  const params = await searchParams;
  const tab = params.tab === 'analytics' || params.tab === '3' ? 'analytics' : params.tab === 'borrowing' || params.tab === '2' ? 'borrowing' : 'inventory';
  const today = bangkokDay();
  const monthsAgo = (months: number) => {
    const date = new Date(today);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return date.toISOString().slice(0, 10);
  };
  const recent = new Date(today);
  recent.setUTCDate(recent.getUTCDate() - 29);
  const presets = [['30 วันล่าสุด', recent.toISOString().slice(0, 10)], ['6 เดือน', monthsAgo(6)], ['ปีนี้', today.slice(0, 4) + '-01-01']];
  let from = typeof params.start_date === 'string' && params.start_date ? params.start_date : monthsAgo(6);
  let to = typeof params.end_date === 'string' && params.end_date ? params.end_date : today;
  const valid = validDay(from) && validDay(to);
  if (valid && from > to) [from, to] = [to, from];
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  let error = !valid || days > 3660 ? 'กรุณาระบุวันที่ที่ถูกต้องและเลือกช่วงไม่เกิน 10 ปี' : '';
  let data: Row[][] | undefined;
  if (!error) {
    try { data = await readReport(user, tab, from, to, today, days <= 45); }
    catch { error = 'ไม่สามารถโหลดรายงานได้'; }
  }
  return <AdminShell sidebar={<AdminSidebar user={user}/>} year={new Date().getFullYear()}>
    <div className="php-page-reports pb-4">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <div>
        <nav aria-label="เส้นทาง"><ol className="breadcrumb small mb-1"><li className="breadcrumb-item"><Link className="text-decoration-none text-secondary" href="/admin"><Icon name="house" className="me-1"/>หน้าแรก</Link></li><li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">รายงานและสถิติเชิงลึก</li></ol></nav>
        <h1 className="h4 fw-bold mb-1"><span className="rounded bg-primary-subtle text-primary p-2 me-2 d-inline-flex"><Icon name="chart-pie"/></span>รายงานและสถิติเชิงลึก (Advanced Analytics)</h1>
        <p className="small text-secondary mb-0">ศูนย์รวมภาพรวมสถิติทรัพย์สิน แนวโน้มการยืม-คืน และบทวิเคราะห์เชิงลึกสำหรับผู้บริหารและผู้ดูแลระบบ</p>
      </div>
      <span className={`badge rounded-pill px-3 py-2 ${reportAllDepartments(user) ? 'bg-danger' : 'bg-primary'}`}>
        <Icon name={reportAllDepartments(user) ? 'globe' : 'building'} className="me-1"/>
        {reportAllDepartments(user) ? 'ทุกแผนก (Super Admin)' : user.department.trim() || 'ยังไม่ระบุแผนก'}
      </span>
    </div>
    <div className="report-control-card p-3 p-md-4 mb-4 d-flex flex-wrap align-items-center gap-2 d-print-none">
      <form className="d-flex flex-wrap align-items-center gap-2">
        <input type="hidden" name="tab" value={tab}/>
        <span className="fw-bold text-secondary small"><Icon name="calendar-days" className="text-primary me-1"/>ช่วงวันที่วิเคราะห์</span>
        <input aria-label="วันที่เริ่มต้น" type="date" className="form-control form-control-sm w-auto" name="start_date" defaultValue={from} required/>
        <span className="small text-secondary">ถึง</span>
        <input aria-label="วันที่สิ้นสุด" type="date" className="form-control form-control-sm w-auto" name="end_date" defaultValue={to} required/>
        <button className="btn btn-primary btn-sm rounded-pill px-3"><Icon name="filter" className="me-1"/>กรองข้อมูล</button>
        <div className="btn-group btn-group-sm rounded-pill border overflow-hidden" role="group" aria-label="ช่วงวันที่ด่วน">
          {presets.map(([label, start]) => <Link key={label} className="btn btn-light" href={`?${new URLSearchParams({ tab, start_date: start, end_date: today })}`}>{label}</Link>)}
        </div>
      </form>
      {data && <ReportOutput {...(tab === 'analytics' ? { ranking: { items: data[0], users: data[1] } } : tab === 'borrowing' ? { overdue: data[2] } : { summary: data[0][0] ?? {}, categories: data[1] })}/>}
    </div>
    <nav className="nav nav-pills custom-report-tabs flex-wrap mb-4 d-print-none" aria-label="หมวดรายงาน">
      {Object.entries(tabs).map(([key, label], index) => <Link key={key} className={`nav-link ${key === tab ? 'active' : ''}`} aria-current={key === tab ? 'page' : undefined} href={`?${new URLSearchParams({ tab: key, start_date: from, end_date: to })}`}><Icon name={tabIcons[index]} className="me-2"/>Tab {index + 1}: {label}</Link>)}
    </nav>
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    {data && (tab === 'analytics' ? <Analytics items={data[0]} users={data[1]}/> : tab === 'borrowing' ? <Borrowing data={data} from={from} to={to} daily={days <= 45}/> : <Inventory summary={data[0][0] ?? {}} categories={data[1]}/>)}
    </div>
  </AdminShell>;
}

export default function Page(props: Props) {
  return <Suspense fallback={<p className="p-4" role="status">กำลังโหลดรายงาน…</p>}><Content {...props}/></Suspense>;
}
