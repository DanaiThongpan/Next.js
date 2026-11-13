import 'server-only';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile, stat, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { isolatedSqliteWritePath } from './write-path';
import { isAdmin, type Identity } from '../auth/policy';
import { historyEmail } from '../history-email';
import { readHistory } from './history';
import { deliverMail } from './mail-delivery';
import { readSqliteQueries } from './read';

const update = `
import json,sqlite3,sys,pathlib
p,id,stamp,previous=json.loads(sys.argv[1])
with sqlite3.connect(pathlib.Path(p).as_uri()+'?mode=rw',uri=True,timeout=5) as db:
 cursor=db.execute("UPDATE borrow_back SET last_reminded_at=? WHERE IDborrow_back=? AND last_reminded_at IS ?",(stamp,id,previous))
 if cursor.rowcount!=1: raise ValueError('STALE')
`;
const run = promisify(execFile);
const hash = (value:string) => createHash('sha256').update(value).digest('hex');

const runtimeDir = resolve('.daam-runtime', 'reminders');
const logFile = resolve(runtimeDir, 'sent_emails.jsonl');
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

async function exists(path: string) {
  try { await stat(path); return true; }
  catch (error) { if (missing(error)) return false; throw error; }
}

async function sentHistory(id: string, lastReminded: unknown) {
  let contents = '';
  try { contents = await readFile(logFile, 'utf8'); }
  catch (error) { if (!missing(error)) throw error; }

  const history: { sentAt: string; recipient: string }[] = [];
  for (const line of contents.split('\n')) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    if (entry?.id === id && entry.result === 'accepted' && typeof entry.sentAt === 'string') {
      history.push({ sentAt: entry.sentAt, recipient: typeof entry.recipient === 'string' ? entry.recipient : '' });
    }
  }
  const last = String(lastReminded ?? '').trim().replace('T', ' ');
  if (/^\d{4}-\d{2}-\d{2}/.test(last) && !history.some(entry => entry.sentAt.replace('T', ' ') === last)) {
    history.push({ sentAt: last, recipient: '' });
  }
  return history.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function historyReminder(user:Identity,id:string,action:'preview'|'send',previewToken?:unknown, confirmUncertain = false) {
  if(!isAdmin(user)) return {ok:false,message:'ไม่ได้รับอนุญาต'};
  const {rows,today}=await readHistory(user,{},id);
  const row=rows[0];
  if(!row)return {ok:false,message:'ไม่พบรายการยืมในขอบเขตสิทธิ์'};
  const [[settings]]=await readSqliteQueries([{sql:'SELECT sender_name,sender_email,is_active FROM system_settings WHERE id=1 LIMIT 1',values:[]}]);
  const sender=String(settings?.sender_name||'งานบริหารทั่วไป กองวิชาการ');
  const smtpUser=process.env.SMTP_USER?.trim(), smtpPass=process.env.SMTP_PASS;
  const senderEmail=String(settings?.sender_email||smtpUser||'').trim();
  const from=[sender,senderEmail].filter(Boolean).join(' ');
  const email=String(row.email??'').trim();
  const template=historyEmail(row,today,from);
  const source = process.env.DAAM_SQLITE_PATH;
  const path = await isolatedSqliteWritePath();
  const history = await sentHistory(id, row.reminded);
  const key = resolve(runtimeDir, hash(JSON.stringify([source,id])) + '.pending');
  const uncertainKey = key + '.uncertain';
  const legacyKey = resolve(runtimeDir, hash(JSON.stringify([source,id,today])) + '.lock');
  const isUncertain = async (entries: typeof history) => await exists(uncertainKey) ||
    (await exists(legacyKey) && !entries.some(entry => entry.sentAt.slice(0, 10) === today));
  const uncertain = await isUncertain(history);
  const makeToken = (entries: typeof history, hasUncertainAttempt: boolean) => hash(JSON.stringify([
    user.id, id, email, template.subject, template.html, row.status, row.returned, row.reminded, entries, hasUncertainAttempt,
  ]));
  const token = makeToken(history, uncertain);
  const pendingMessage = 'กำลังดำเนินการส่งรายการนี้ กรุณาเปิดตัวอย่างอีกครั้ง';
  const disabled=!path?'ระบบยังไม่ได้เปิดการเขียนในฐานข้อมูลแยกของ Next.js':
    Number(settings?.is_active)!==1?'ระบบแจ้งเตือนปิดใช้งาน':
    !smtpUser||!smtpPass?'ยังไม่ได้กำหนดค่า SMTP บนเซิร์ฟเวอร์':
    row.status==='returned'||row.status==='pending_return'||Boolean(row.returned)?'รายการนี้อยู่ในขั้นตอนคืนหรือคืนแล้ว':
    template.days===null?'ไม่พบวันครบกำหนดที่ถูกต้อง':
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)?'ไม่มีอีเมลผู้รับที่ใช้ได้ กรุณาตรวจข้อมูลบัญชีผู้ยืม':
    await exists(key) ? pendingMessage : '';
  if (action === 'preview') {
    const sentToday = history.filter(entry => entry.sentAt.slice(0, 10) === today).length;
    return { ok:true, html:template.html, token, disabled, history, uncertain, sentToday };
  }
  if(disabled)return {ok:false,message:disabled};
  if(previewToken!==token)return {ok:false,message:'รายการเปลี่ยนแปลง กรุณาเปิดตัวอย่างใหม่'};
  if (uncertain && !confirmUncertain) return {ok:false,message:'ยังยืนยันผลครั้งก่อนไม่ได้ กรุณายืนยันก่อนส่งอีกครั้ง'};
  await mkdir(runtimeDir,{recursive:true,mode:0o700});
  try {await writeFile(key,'reserved',{flag:'wx',mode:0o600});}
  catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')return {ok:false,message:pendingMessage};throw e;}
  // Another request can finish after the first read and before this lock is acquired.
  try {
    const latestHistory = await sentHistory(id, row.reminded);
    if (makeToken(latestHistory, await isUncertain(latestHistory)) !== token) {
      await unlink(key);
      return {ok:false,message:'ประวัติการส่งเปลี่ยนแปลง กรุณาเปิดตัวอย่างใหม่'};
    }
  } catch (error) {
    await unlink(key).catch(() => {});
    throw error;
  }
  const delivery = await deliverMail({
    SMTP_USER: smtpUser!, SMTP_PASS: smtpPass!, from, to: email, subject: template.subject, html: template.html,
  });
  if (delivery.state === 'uncertain') {
    await rename(key, uncertainKey);
    return { ok:false, message: delivery.message + ' หากส่งอีกครั้งผู้รับอาจได้รับอีเมลซ้ำ' };
  }
  if (delivery.state === 'rejected') {
    await unlink(key);
    return { ok:false, message: delivery.message };
  }
  const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  let recorded=true;
  try {await run('python3',['-c',update,JSON.stringify([path,id,stamp,row.reminded])],{timeout:8000});}catch{recorded=false;}
  let logged=true;
  try {await writeFile(logFile,JSON.stringify({id,recipient:email,type:template.days!<0?'overdue':'due',sentAt:stamp,result:'accepted',actor:user.id,timestampSaved:recorded})+'\n',{flag:'a',mode:0o600});}catch{logged=false;}
  if (logged) {
    await unlink(uncertainKey).catch(error => { if (!missing(error)) throw error; });
    await unlink(key);
  }
  return {ok:recorded&&logged,sent:true,message:recorded&&logged?'ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว':`ระบบอีเมลรับข้อความแล้ว แต่บันทึก${!recorded?'เวลาแจ้งเตือน':''}${!recorded&&!logged?'และ':''}${!logged?'ประวัติส่ง':''}ไม่สำเร็จ กรุณาตรวจสอบก่อนส่งซ้ำ`};
}
