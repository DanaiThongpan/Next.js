'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { CatalogRow } from '@/lib/sqlite/catalog';
import { Icon } from './icon';

const frequencies = [
  { value: 'none', label: 'ไม่ส่งแจ้งเตือน (Disable)', detail: 'ปิดการแจ้งเตือนทวงคืนอัตโนมัติ', badge: 'ปิดใช้งาน', icon: 'bell-slash' },
  { value: 'daily', label: 'วันละ 1 ครั้ง (Daily)', detail: 'รอบแจ้งเตือนทุกวันจนกว่าจะคืนครุภัณฑ์', badge: 'แนะนำ', icon: 'calendar-day' },
  { value: 'alternate', label: 'วันเว้นวัน (Every 2 Days)', detail: 'รอบแจ้งเตือนซ้ำทุก 2 วัน', badge: 'ทุก 2 วัน', icon: 'calendar-days' },
  { value: 'weekly', label: 'สัปดาห์ละ 1 ครั้ง (Weekly)', detail: 'รอบแจ้งเตือนซ้ำทุก 7 วัน', badge: 'ทุก 7 วัน', icon: 'calendar-week' },
  { value: 'custom', label: 'อื่น ๆ (กำหนดจำนวนวันเอง)', detail: 'ระบุระยะห่างระหว่างการแจ้งเตือน', badge: 'กำหนดเอง', icon: 'sliders' },
];

type Feedback = { ok: boolean; message: string };

export function MailSettingsView({ row, configured = false, smtpAccount = '', passwordConfigured = false, endpoint = '' }: {
  row: CatalogRow; configured?: boolean; smtpAccount?: string; passwordConfigured?: boolean; endpoint?: string;
}) {
  const router = useRouter();
  const [frequency, setFrequency] = useState(String(row.reminder_frequency ?? 'daily'));
  const [savedActive, setSavedActive] = useState(Number(row.is_active) === 1);
  const [customDays, setCustomDays] = useState(String(Math.max(1, Number(row.reminder_days) || 1)));
  const [name, setName] = useState(String(row.sender_name ?? ''));
  const [email, setEmail] = useState(String(row.sender_email ?? ''));
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<Feedback>();
  const [testPassword, setTestPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealingPassword, setRevealingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!revealedPassword) return;
    const timer = window.setTimeout(() => setRevealedPassword(''), 30000);
    return () => window.clearTimeout(timer);
  }, [revealedPassword]);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [testFeedback, setTestFeedback] = useState<Feedback>();
  const from = [name.trim(), email.trim()].filter(Boolean).join(' ');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setFeedback(undefined);
    try {
      const response = await fetch('/api/admin/mail', { method: 'POST', body: data });
      const result = await response.json().catch(() => null);
      if (response.ok) router.refresh();
      setFeedback({
        ok: response.ok,
        message: response.ok ? 'บันทึกการตั้งค่าแล้ว'
          : result?.code === 'WRITES_DISABLED' ? 'เซิร์ฟเวอร์เปิดอ่านฐานข้อมูลอย่างเดียว'
          : response.status === 400 ? 'กรุณาตรวจสอบชื่อ อีเมล และจำนวนวัน'
          : response.status === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
          : response.status === 403 ? 'บัญชีนี้ไม่มีสิทธิ์บันทึกการตั้งค่า'
          : 'บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่',
      });
    } catch {
      setFeedback({ ok: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    const data = new FormData();
    data.set('action', 'status');
    data.set('active', savedActive ? '0' : '1');
    data.set('previous', savedActive ? '1' : '0');
    setStatusFeedback(undefined);
    setToggling(true);
    try {
      const response = await fetch('/api/admin/mail', { method: 'POST', body: data });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setSavedActive(!savedActive);
        router.refresh();
      }
      setStatusFeedback({
        ok: response.ok,
        message: response.ok ? 'เปลี่ยนสถานะแล้ว' : result?.code === 'STALE'
          ? 'สถานะเปลี่ยนไปแล้ว กรุณารีเฟรชหน้า' : 'เปลี่ยนสถานะไม่ได้ กรุณาตรวจสอบสิทธิ์และการเขียนฐานข้อมูล',
      });
    } catch {
      setStatusFeedback({ ok: false, message: 'ยืนยันสถานะไม่ได้ กรุณารีเฟรชหน้า' });
    } finally {
      setToggling(false);
    }
  }

  async function togglePassword() {
    setPasswordError('');
    if (testPassword) {
      setPasswordVisible(!passwordVisible);
      return;
    }
    if (revealedPassword) {
      setRevealedPassword('');
      return;
    }
    setRevealingPassword(true);
    try {
      const data = new FormData();
      data.set('action', 'reveal-password');
      const response = await fetch('/api/admin/mail', { method: 'POST', body: data, cache: 'no-store' });
      if (!response.ok) throw new Error('Password unavailable');
      const { password } = await response.json();
      if (typeof password !== 'string' || !password) throw new Error('Password unavailable');
      setRevealedPassword(password);
    } catch {
      setPasswordError('แสดงรหัสไม่ได้ กรุณาตรวจสอบสิทธิ์และการตั้งค่า SMTP');
    } finally {
      setRevealingPassword(false);
    }
  }

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set('name', name);
    data.set('email', email);
    if (testPassword) data.set('smtpPassword', testPassword);
    setTestPassword('');
    setPasswordVisible(false);
    setRevealedPassword('');
    setTesting(true);
    setTestFeedback(undefined);
    try {
      const response = await fetch('/api/admin/mail', { method: 'POST', body: data });
      const result = await response.json().catch(() => null);
      setTestFeedback({
        ok: response.ok,
        message: result?.message ?? 'ส่งอีเมลทดสอบไม่ได้ กรุณาตรวจสอบสิทธิ์',
      });
    } catch {
      setTestFeedback({ ok: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setTesting(false);
    }
  }

  const payload = JSON.stringify({
    SMTP_USER: smtpAccount || '[บัญชีบนเซิร์ฟเวอร์]',
    SMTP_PASS: '••••••••',
    from,
    to: '[อีเมลผู้ยืม]',
    subject: '[แจ้งเตือน] ครุภัณฑ์เลยกำหนดส่งคืน',
    html: '<div>เนื้อหาอีเมล</div>',
  }, null, 2);

  return <div className="php-page-mail pb-5">
    <div className="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
      <div>
        <nav aria-label="เส้นทาง" className="small text-secondary mb-2">
          <Link href="/admin" className="text-decoration-none">หน้าหลัก</Link> / <Link href="/admin/history" className="text-decoration-none">ระบบแจ้งเตือน</Link> / ตั้งค่าระบบส่งอีเมล (REST API)
        </nav>
        <h1 className="h3 fw-bold d-flex align-items-center gap-2 mb-1"><span className="mail-heading-icon bg-primary-subtle text-primary"><Icon name="paper-plane"/></span>ตั้งค่าระบบส่งอีเมล (External REST API)</h1>
        <p className="small text-secondary mb-0">เชื่อมต่อบริการส่งอีเมลผ่าน REST API ของมหาวิทยาลัยอุบลราชธานี และกำหนดรอบแจ้งเตือนสำหรับครุภัณฑ์ที่เลยกำหนดส่งคืน</p>
      </div>
      <div className="d-flex flex-wrap gap-2">
        <Link href="/admin/history" className="btn btn-outline-secondary btn-sm rounded-pill">
          <Icon name="arrow-left" className="me-2"/>กลับหน้าประวัติการยืม-คืน
        </Link>
        <Link href="/admin" className="btn btn-outline-primary btn-sm rounded-pill">แดชบอร์ด</Link>
      </div>
    </div>

    <section className="status-strip shadow-sm mb-4">
      <div className="d-flex align-items-center flex-wrap gap-3 p-3 p-md-4">
        <span className={`mail-status-icon ${savedActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}><Icon name="envelope-circle-check"/></span>
        <div className="flex-grow-1">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="fw-bold">สถานะระบบอีเมล <span className={savedActive ? 'text-success' : 'text-secondary'}>{savedActive ? 'เปิดใช้งาน (Active)' : 'ปิดใช้งาน (Inactive)'}</span></span>
            <span className={`badge rounded-pill ${!savedActive ? 'text-bg-secondary' : configured ? 'bg-success text-white' : 'text-bg-warning'}`}>
              <span className={`pulse-dot ${savedActive && configured ? 'pulse-green' : 'pulse-gray'}`} aria-hidden="true"/>
              {!savedActive ? 'OFFLINE' : configured ? 'ONLINE' : 'รอตั้งค่า SMTP'}
            </span>
          </div>
          <div className="small text-secondary mt-1 d-flex flex-wrap align-items-center gap-2">
            {endpoint && <span className="text-break"><strong className="text-primary"><Icon name="cloud" className="me-1"/>API Endpoint</strong> <code className="bg-light text-dark rounded px-2 py-1">{endpoint}</code></span>}
            {row.updated_at && <span>อัปเดตล่าสุด {String(row.updated_at)}</span>}
          </div>
        </div>
        <button type="button" disabled={busy || toggling || testing} onClick={toggleStatus}
          className={`btn btn-sm rounded-pill ${savedActive ? 'btn-outline-danger' : 'btn-outline-success'}`}>
          {toggling ? 'กำลังเปลี่ยนสถานะ…' : savedActive ? 'ปิดการส่งอีเมลชั่วคราว' : 'เปิดการส่งอีเมล'}
        </button>
        {statusFeedback && <p role="status" className={`small mb-0 w-100 ${statusFeedback.ok ? 'text-success' : 'text-danger'}`}>{statusFeedback.message}</p>}
      </div>
    </section>

    <div className="row g-4">
      <div className="col-lg-7">
        <form onSubmit={save}>
          <fieldset disabled={busy || toggling}>
            <input type="hidden" name="active" value={savedActive ? '1' : '0'}/>
            <section className="card saas-card mb-4">
              <div className="card-header saas-card-header py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <span className="rounded-circle bg-primary-subtle text-primary p-2"><Icon name="network-wired"/></span>
                  <div>
                    <h2 className="h6 fw-bold mb-1">Card 1: API Configuration</h2>
                    <p className="small text-secondary mb-0">ข้อมูลการเชื่อมต่อ External REST API หลัก</p>
                  </div>
                </div>
                <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">UBU Secure API</span>
              </div>
              <div className="saas-card-body">
                <div className="mb-3">
                  <label htmlFor="smtp-account" className="form-label fw-semibold">บัญชีผู้ส่ง (SMTP_USER)</label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-saas"><Icon name="user-shield"/></span>
                    <input id="smtp-account" className="form-control form-control-saas" value={smtpAccount || 'ยังไม่ได้ตั้งค่าบัญชี'} readOnly aria-describedby="smtp-account-help"/>
                  </div>
                  <div id="smtp-account-help" className="form-text">บัญชีที่ใช้ยืนยันตัวตนกับ Mail API ตั้งค่าบนเซิร์ฟเวอร์</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="smtp-test-password" className="form-label fw-semibold">รหัสผ่าน / รหัสผ่านแอป (SMTP_PASS)</label>
                  <div className="input-group">
                    <span className="input-group-text input-group-text-saas"><Icon name="lock"/></span>
                    <input id="smtp-test-password" type={passwordVisible || revealedPassword ? 'text' : 'password'} className="form-control form-control-saas"
                      value={revealedPassword || testPassword} readOnly={Boolean(revealedPassword) || revealingPassword} onChange={event => setTestPassword(event.target.value)}
                      placeholder={passwordConfigured ? '••••••••••••••••' : 'กรอกรหัสผ่านแอปสำหรับทดสอบ'}
                      autoComplete="new-password" maxLength={512} aria-describedby="smtp-password-help"/>
                    <button type="button" className="btn btn-outline-secondary input-group-text-saas"
                      aria-label={passwordVisible || revealedPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      aria-controls="smtp-test-password" disabled={revealingPassword || (!testPassword && !passwordConfigured)}
                      onClick={togglePassword}>
                      <Icon name={passwordVisible || revealedPassword ? 'eye-slash' : 'eye'}/>
                    </button>
                  </div>
                  <div id="smtp-password-help" className="form-text">กรอกรหัสผ่านเพื่อใช้ส่งอีเมลทดสอบครั้งนี้ เว้นว่างเพื่อใช้รหัสที่ตั้งไว้บนเซิร์ฟเวอร์ รหัสที่เปิดดูจะซ่อนเองหลัง 30 วินาที</div>
                  {passwordError && <p role="alert" className="small text-danger mb-0">{passwordError}</p>}
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="mail-sender-name" className="form-label fw-semibold">ชื่อผู้ส่งที่แสดง (Sender Name) <span className="text-danger" aria-hidden="true">*</span></label>
                    <input id="mail-sender-name" name="name" required maxLength={120} className="form-control form-control-saas" value={name} onChange={event => setName(event.target.value)} aria-describedby="mail-name-help"/>
                    <div id="mail-name-help" className="form-text">ชื่อบุคคลหรือหน่วยงานที่ผู้รับเห็นในกล่องจดหมาย</div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="mail-sender-email" className="form-label fw-semibold">อีเมลผู้ส่ง (Sender Email) <span className="text-danger" aria-hidden="true">*</span></label>
                    <input id="mail-sender-email" name="email" type="email" required maxLength={254} className="form-control form-control-saas" value={email} onChange={event => setEmail(event.target.value)} aria-describedby="mail-email-help"/>
                    <div id="mail-email-help" className="form-text">ที่อยู่อีเมลที่แสดงในช่อง From ของข้อความ</div>
                  </div>
                </div>
                <div className="from-preview-badge mt-3">
                  <div className="d-flex justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-semibold"><Icon name="code" className="text-primary me-2"/>ตัวอย่างฟิลด์ from ใน Payload</span>
                    <span className="badge text-bg-light">Auto-generated</span>
                  </div>
                  <div className="text-break"><code className="text-primary fw-semibold">{from ? JSON.stringify(from) : '—'}</code></div>
                </div>
              </div>
            </section>

            <section className="card saas-card mb-3">
              <div className="card-header saas-card-header py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h2 className="h6 fw-bold mb-1"><Icon name="clock-rotate-left" className="text-primary me-2"/>Card 2: Overdue Reminder Frequency</h2>
                  <p className="small text-secondary mb-0">กำหนดความถี่การแจ้งเตือนครุภัณฑ์ที่เลยกำหนดส่งคืน</p>
                </div>
                <span className="badge rounded-pill text-bg-light">รอบแจ้งเตือน</span>
              </div>
              <div className="saas-card-body">
                <fieldset>
                  <legend className="small text-secondary mb-3">กำหนดรอบแจ้งเตือนซ้ำสำหรับงานที่ตั้งเวลาไว้</legend>
                  {frequencies.map(({ value, label, detail, icon, badge }) => (
                    <label key={value} className={`frequency-tile d-flex align-items-center gap-3 w-100 mb-2 ${frequency === value ? 'active' : ''}`}>
                      <input type="radio" name="frequency" value={value} checked={frequency === value} onChange={() => setFrequency(value)}/>
                      <Icon name={icon} className="text-primary"/>
                      <span className="flex-grow-1"><span className="d-block fw-semibold">{label}</span><span className="small text-secondary">{detail}</span></span>
                      <span className="badge rounded-pill text-bg-light d-none d-sm-inline">{badge}</span>
                    </label>
                  ))}
                  {frequency === 'custom' && <label className="form-label mt-2">จำนวนวัน (1–90)
                    <input name="days" type="number" min={1} max={90} required className="form-control form-control-saas" value={customDays} onChange={event => setCustomDays(event.target.value)}/>
                  </label>}
                </fieldset>
              </div>
            </section>
            <button type="submit" className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm"><Icon name="floppy-disk" className="me-2"/>{busy ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่าทั้งหมด (Save Settings)'}</button>
          </fieldset>
          {feedback && <p role="status" className={`alert mt-3 ${feedback.ok ? 'alert-success' : 'alert-warning'}`}>{feedback.message}</p>}
        </form>
      </div>

      <div className="col-lg-5">
        <section className="card saas-card border-primary mb-4">
          <div className="saas-card-header bg-primary bg-opacity-10 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h2 className="h6 fw-bold mb-1"><span className="mail-card-icon bg-success text-white me-2"><Icon name="paper-plane"/></span>Card 3: Send Test Email</h2>
                  <p className="small text-secondary mb-0">ทดสอบส่งอีเมลจริงผ่าน REST API</p>
                </div>
                <span className="badge rounded-pill bg-success text-white">Live Test</span>
              </div>
          <div className="saas-card-body">
            <p className="small text-secondary">กรอกอีเมลผู้รับเพื่อทดสอบการส่งจริง ระบบใช้ชื่อและอีเมลผู้ส่งจากฟอร์มด้านซ้าย</p>
            <form onSubmit={sendTest}>
              <fieldset disabled={testing || toggling || !smtpAccount || (!configured && !testPassword.trim()) || !savedActive || !name.trim() || !email.trim()}>
                <input type="hidden" name="action" value="test"/>
                <label className="form-label w-100">อีเมลผู้รับทดสอบ (To Email) <span className="text-danger" aria-hidden="true">*</span>
                  <span className="input-group mt-1"><span className="input-group-text input-group-text-saas"><Icon name="at"/></span><input name="recipient" type="email" required maxLength={254} className="form-control form-control-saas" placeholder="เช่น your.email@ubu.ac.th"/></span>
                </label>
                <button type="submit" className="btn btn-success mail-send-test rounded-pill w-100 py-3 fw-bold shadow-sm"><Icon name="paper-plane" className="me-2"/>{testing ? 'กำลังส่ง…' : 'ส่งอีเมลทดสอบทันที'}</button>
              </fieldset>
            </form>
            {(!smtpAccount || (!configured && !testPassword.trim()) || !savedActive) && <p className="small text-secondary mt-3 mb-0">การส่งทดสอบต้องเปิดระบบอีเมล มีบัญชี SMTP และมีรหัสผ่านแอป</p>}
            <div className="small bg-body-tertiary border rounded p-3 mt-3">
              <strong>เคล็ดลับการทดสอบ</strong>
              <ul className="mb-0 mt-1 ps-3">
                <li>ทดลองส่งด้วยค่าผู้ส่งที่กำลังกรอกได้ก่อนบันทึก</li>
                <li>หาก API ไม่ตอบสนองภายใน 10 วินาที ระบบจะหยุดรอผล</li>
                <li>หากไม่พบข้อความ ให้ตรวจโฟลเดอร์จดหมายขยะก่อนส่งซ้ำ</li>
              </ul>
            </div>
            {testFeedback && <p role="status" className={`alert mt-3 mb-0 ${testFeedback.ok ? 'alert-success' : 'alert-warning'}`}>{testFeedback.message}</p>}
          </div>
        </section>

        <section className="card saas-card">
          <div className="card-header saas-card-header py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h2 className="h6 fw-bold mb-1"><Icon name="code" className="text-primary me-2"/>API Architecture &amp; Payload</h2>
                  <p className="small text-secondary mb-0">ตัวอย่างข้อมูลที่ส่งผ่าน HTTPS</p>
                </div>
                <span className="badge rounded-pill text-bg-light">POST JSON</span>
              </div>
          <div className="saas-card-body">
            <pre className="mail-payload rounded bg-dark text-light p-3 mb-0"><code>{payload}</code></pre>
          </div>
        </section>
      </div>
    </div>
  </div>;
}
