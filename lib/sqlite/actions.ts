import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isolatedSqliteWritePath } from './write-path';
import { isAdmin,type Identity } from '../auth/policy';
import type { CsvRow } from '../csv-import-format';
import { bangkokDay } from '../dashboard/model';
const run=promisify(execFile);
export type AdminOperation='approve'|'reject'|'return'|'delete-borrow'|'show-asset'|'hide-asset'|'asset-ready'|'asset-damaged'|'delete-repair';
const program=`
import sqlite3,json,sys,pathlib
r=json.loads(sys.stdin.read() if len(sys.argv)==1 else sys.argv[1]);p=pathlib.Path(r['path']);c=None
try:
 if not p.is_file(): raise ValueError('SOURCE_UNAVAILABLE')
 c=sqlite3.connect(p.as_uri()+'?mode=rw',uri=True,timeout=5);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');c.execute('BEGIN IMMEDIATE')
 if r['action']=='user-edit':
  actor=c.execute('SELECT useraccountID,useraccountType,userDepartment,userActive FROM useraccount WHERE useraccountID=?',(r['user'],)).fetchone()
  target=c.execute('SELECT useraccountID,useraccountType,userDepartment,userActive,userEmail FROM useraccount WHERE useraccountID=?',(r['id'],)).fetchone()
  if not actor or str(actor['userActive'])!='1' or actor['useraccountType']!='UT00000001' or not target:raise ValueError('FORBIDDEN')
  full=actor['useraccountID']=='admin';dept=actor['userDepartment'] or '';f=r['fields'];self_edit=actor['useraccountID']==target['useraccountID']
  if not full and (not dept.strip() or target['userDepartment']!=dept or f['department']!=dept or target['useraccountID']=='admin'):raise ValueError('FORBIDDEN')
  role=target['useraccountType'] if self_edit else f['role'];active=target['userActive'] if self_edit else f['active'];email=target['userEmail'] if self_edit else f['email']
  if target['useraccountID']=='admin' and (role!='UT00000001' or str(active)!='1'):raise ValueError('FORBIDDEN')
  c.execute('UPDATE useraccount SET useraccountName=?,userRank=?,userDepartment=?,userEmail=?,useraccountType=?,userActive=? WHERE useraccountID=?',(f['name'],f['rank'],f['department'],email,role,active,r['id']))
  if r.get('passwordHash'):c.execute('UPDATE useraccount SET userPassword=? WHERE useraccountID=?',(r['passwordHash'],r['id']))
 elif r['action'] in ['self-profile','self-password']:
  account=c.execute("SELECT useraccountName,userEmail,userPassword FROM useraccount WHERE useraccountID=? AND userActive='1' AND useraccountType='UT00000002'",(r['user'],)).fetchone()
  if not account: raise ValueError('FORBIDDEN')
  if r['action']=='self-profile':
   if account['useraccountName']!=r['previousName'] or (account['userEmail'] or '')!=r['previousEmail']: raise ValueError('STALE')
   if r['email'] and r['email'].lower()!=(account['userEmail'] or '').strip().lower():
    if c.execute("SELECT 1 FROM useraccount WHERE LOWER(TRIM(userEmail))=LOWER(?) AND useraccountID!=? LIMIT 1",(r['email'],r['user'])).fetchone(): raise ValueError('EMAIL_IN_USE')
   c.execute('UPDATE useraccount SET useraccountName=?,userEmail=? WHERE useraccountID=?',(r['name'],r['email'] or None,r['user']))
  else:
   if account['userPassword']!=r['previousHash']: raise ValueError('STALE')
   c.execute('UPDATE useraccount SET userPassword=? WHERE useraccountID=?',(r['passwordHash'],r['user']))
 elif r['action'] in ['borrow','request-return','approve-user-return','owner-direct-return']:
  import secrets,time
  if not c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='next_loan_events'").fetchone():raise ValueError('LOAN_SCHEMA_REQUIRED')
  actor=c.execute("SELECT useraccountID,useraccountName,useraccountType,userRank,userDepartment FROM useraccount WHERE useraccountID=? AND userActive='1'",(r['user'],)).fetchone()
  if not actor or actor['useraccountType'] not in ('UT00000001','UT00000002'):raise ValueError('FORBIDDEN')
  asset=c.execute('SELECT DA_ID,statusID,is_approved,is_visible,classificationID,buildingID,owner_useraccountID,owner_department,created_by FROM durable_articles WHERE DA_ID=?',(r['asset'],)).fetchone()
  active="(status IS NULL OR status!='returned') AND (Date_back IS NULL OR Date_back IN ('','0','0000-00-00','0000-00-00 00:00:00') OR status='pending_return')"
  if r['action']=='borrow':
   if not asset:raise ValueError('NOT_FOUND')
   category_file=p.parent/'disabled-categories.json';clb_file=p.parent/'clb-visibility.json'
   categories=json.loads(category_file.read_text()) if category_file.exists() else []
   clb=json.loads(clb_file.read_text()) if clb_file.exists() else False
   if not isinstance(categories,list) or not all(isinstance(x,str) for x in categories) or not isinstance(clb,bool):raise ValueError('INVALID_POLICY')
   is_clb=(asset['buildingID'] or '').upper().startswith('CLB')
   visible=clb if is_clb else asset['is_visible'] in (None,1,'1')
   if not visible or asset['classificationID'] in categories or asset['is_approved'] not in (None,1,'1'):raise ValueError('NOT_AVAILABLE')
   if c.execute('SELECT 1 FROM borrow_back WHERE DA_ID=? AND '+active,(r['asset'],)).fetchone():raise ValueError('ALREADY_BORROWED')
   if asset['statusID'] not in (None,'','s0001'):raise ValueError('NOT_AVAILABLE')
   f=r['fields']
   while True:
    loan_id='B'+str(int(time.time()))+str(secrets.randbelow(900000)+100000)
    if not c.execute('SELECT 1 FROM borrow_back WHERE IDborrow_back=?',(loan_id,)).fetchone():break
   c.execute("INSERT INTO borrow_back (IDborrow_back,DA_ID,Date_borrow,Name_borrow,Rank_borrow,Belongto_borrow,Detail_borrow,Deadline_borrow,useraccountID_borrow,timestamp_borrow,userEmail,due_date,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'borrowed')",(loan_id,r['asset'],f['start'],actor['useraccountName'],f['rank'],f['department'],f['purpose'],f['end'],r['user'],r['timestamp'],f['email'],f['end']))
   c.execute("UPDATE durable_articles SET statusID='s0003' WHERE DA_ID=?",(r['asset'],))
   loan_status='borrowed'
  else:
   loan_id=r['loan']
   loan=c.execute('SELECT useraccountID_borrow,status FROM borrow_back WHERE IDborrow_back=? AND DA_ID=? AND '+active,(loan_id,r['asset'])).fetchone()
   if not loan:raise ValueError('STALE')
   own=loan['useraccountID_borrow']==r['user']
   owner=bool(asset and (asset['owner_useraccountID']==r['user'] or (not (asset['owner_useraccountID'] or '').strip() and asset['created_by']==r['user'])))
   if r['action']=='request-return':
    if not own or owner:raise ValueError('FORBIDDEN')
    if loan['status']=='pending_return':raise ValueError('STALE')
    c.execute("UPDATE borrow_back SET Date_back=?,timestamp_back=?,Name_back=?,Rank_back=?,Detail_back=?,useraccountID_back=?,status='pending_return' WHERE IDborrow_back=?",(r['day'],r['timestamp'],actor['useraccountName'],actor['userRank'],r['detail'],r['user'],loan_id))
    loan_status='pending_return'
   else:
    if not asset:raise ValueError('NOT_FOUND')
    if not owner:raise ValueError('FORBIDDEN')
    if r['action']=='approve-user-return':
     if own:raise ValueError('FORBIDDEN')
     if loan['status']!='pending_return':raise ValueError('STALE')
    elif loan['status']=='pending_return':raise ValueError('STALE')
    c.execute("UPDATE borrow_back SET Date_back=?,timestamp_back=?,status='returned',Name_back=?,Rank_back=?,useraccountID_back=? WHERE IDborrow_back=?",(r['day'],r['timestamp'],actor['useraccountName'],actor['userRank'],r['user'],loan_id))
    if not c.execute('SELECT 1 FROM borrow_back WHERE DA_ID=? AND '+active,(r['asset'],)).fetchone():
     c.execute("UPDATE durable_articles SET statusID='s0001' WHERE DA_ID=? AND statusID='s0003'",(r['asset'],))
    loan_status='returned'
  borrower=r['user'] if r['action']=='borrow' else loan['useraccountID_borrow']
  c.execute('INSERT INTO next_loan_events (loan_id,asset_id,borrower_id,actor_id,owner_id,action,occurred_at) VALUES (?,?,?,?,?,?,?)',(loan_id,r['asset'],borrower,r['user'],(asset['owner_useraccountID'] or asset['created_by']) if asset else None,r['action'],r['timestamp']))
 elif r['action'] in ['csv-import','asset-create','csv-request']:
  import uuid
  manual=r['action']=='asset-create'
  csv_request=r['action']=='csv-request'
  pending=csv_request or (manual and r['pending'])
  if csv_request and not c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='next_csv_request_items'").fetchone(): raise ValueError('REQUEST_SCHEMA_REQUIRED')
  actor=c.execute('SELECT useraccountID,useraccountType,userActive,userDepartment FROM useraccount WHERE useraccountID=?',(r['user'],)).fetchone()
  if not actor or actor['useraccountType']!=('UT00000002' if pending else 'UT00000001') or str(actor['userActive'])!='1': raise ValueError('FORBIDDEN')
  actor_id=actor['useraccountID']
  department_scope=(actor['userDepartment'] or '').strip()
  seen=set()
  inserted=0
  for record in r['rows']:
   number,name,brand,category,building,room,price,year,department=record['values']
   def fail(code,field): raise ValueError(code+':'+str(record['row'])+':'+field)
   if number in seen: fail('DUPLICATE','DA_Number')
   seen.add(number)
   if c.execute('SELECT 1 FROM durable_articles WHERE DA_Number=? LIMIT 1',(number,)).fetchone():
    fail('DUPLICATE' if manual else 'STALE','DA_Number')
   if (pending or actor_id!='admin') and (not department_scope or department!=department_scope): fail('FORBIDDEN','owner_department')
   if not c.execute('SELECT 1 FROM classification WHERE classificationID=?',(category,)).fetchone(): fail('REFERENCE','classificationID')
   if building and not c.execute('SELECT 1 FROM building WHERE buildingID=?',(building,)).fetchone(): fail('REFERENCE','buildingID')
   if room and not c.execute('SELECT 1 FROM building_classroom WHERE classroomID=? AND buildingID=?',(room,building)).fetchone(): fail('REFERENCE','classroomID')
   visible=int(not building.upper().startswith('CLB'))
   fields=(name,brand or None,category,building or None,room or None,price or None,year)
   asset_id="DA"+uuid.uuid4().hex[:10]
   while c.execute("SELECT 1 FROM durable_articles WHERE DA_ID=?",(asset_id,)).fetchone(): asset_id="DA"+uuid.uuid4().hex[:10]
   details=r.get('details',{})
   c.execute("INSERT INTO durable_articles (DA_ID,DA_Number,DA_ListName,DA_Brand,classificationID,buildingID,classroomID,DA_Price,DA_Year,statusID,created_by,owner_department,owner_useraccountID,useraccountID,is_approved,is_visible,DA_Detail,DA_Size,DA_DetailLocation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(asset_id,number,*fields,'s0002' if pending else 's0001',actor_id,department,actor_id,actor_id,int(not pending),visible,details.get('DA_Detail'),details.get('DA_Size'),details.get('DA_DetailLocation')))
   if csv_request:
    c.execute('INSERT INTO next_csv_request_items (asset_id,batch_id,requester_id,file_name,submitted_at,submitted_values) VALUES (?,?,?,?,?,?)',(asset_id,r['batchId'],actor_id,r['fileName'],r['submittedAt'],json.dumps(record['values'],ensure_ascii=False)))
   inserted+=1
 elif r['action']=='asset-edit':
  a=c.execute('SELECT DA_Number,owner_department,created_by,is_approved FROM durable_articles WHERE DA_ID=?',(r['id'],)).fetchone()
  if not a: raise ValueError('NOT_FOUND')
  if r['user']!='admin' and (not r['department'].strip() or not (a['owner_department']==r['department'] or (a['owner_department'] is None and a['created_by']==r['user']))): raise ValueError('FORBIDDEN')
  if a['is_approved'] not in (None,1): raise ValueError('STALE')
  f=r['fields']
  if f['DA_Number']!=a['DA_Number'] and c.execute('SELECT 1 FROM durable_articles WHERE DA_Number=? AND DA_ID!=?',(f['DA_Number'],r['id'])).fetchone(): raise ValueError('DUPLICATE')
  for table,key in [('classification','classificationID'),('building','buildingID'),('building_classroom','classroomID')]:
   if f[key] and not c.execute('SELECT 1 FROM '+table+' WHERE '+key+'=?',(f[key],)).fetchone(): raise ValueError('INVALID_INPUT')
  if f['classroomID'] and not c.execute('SELECT 1 FROM building_classroom WHERE classroomID=? AND buildingID=?',(f['classroomID'],f['buildingID'])).fetchone(): raise ValueError('INVALID_INPUT')
  c.execute('UPDATE durable_articles SET DA_Number=:DA_Number,DA_ListName=:DA_ListName,DA_Brand=:DA_Brand,DA_Size=:DA_Size,DA_DetailLocation=:DA_DetailLocation,DA_Year=:DA_Year,DA_Price=:DA_Price,DA_Detail=:DA_Detail,classificationID=:classificationID,buildingID=:buildingID,classroomID=:classroomID,DA_URLImg=COALESCE(:image,DA_URLImg) WHERE DA_ID=:id',dict(f,id=r['id'],image=r['image']))
 elif r['action']=='delete-repair':
  entry=c.execute('SELECT a.DA_ID,a.owner_department,a.created_by FROM repair r JOIN durable_articles a ON a.DA_ID=r.DA_ID WHERE r.repairID=?',(r['id'],)).fetchone()
  if not entry: raise ValueError('NOT_FOUND')
  if r['user']!='admin' and (not r['department'].strip() or not (entry['owner_department']==r['department'] or (entry['owner_department'] is None and entry['created_by']==r['user']))): raise ValueError('FORBIDDEN')
  for table in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
   quoted='"'+table['name'].replace('"','""')+'"'
   if any(fk['table'].lower()=='repair' for fk in c.execute('PRAGMA foreign_key_list('+quoted+')')): raise ValueError('RELATED')
  if c.execute("SELECT 1 FROM sqlite_master WHERE type='trigger' AND lower(tbl_name)='repair'").fetchone(): raise ValueError('RELATED')
  c.execute('DELETE FROM repair WHERE repairID=?',(r['id'],))
 elif r['action']=='repair-save':
  repair_id,asset_id,description,cost,day=r['settings']
  def check_asset(asset_id):
   asset=c.execute('SELECT owner_department,created_by FROM durable_articles WHERE DA_ID=?',(asset_id,)).fetchone()
   if not asset: raise ValueError('NOT_FOUND')
   if r['user']!='admin' and (not r['department'].strip() or not (asset['owner_department']==r['department'] or (asset['owner_department'] is None and asset['created_by']==r['user']))): raise ValueError('FORBIDDEN')
  check_asset(asset_id)
  if repair_id:
   existing=c.execute('SELECT DA_ID FROM repair WHERE repairID=?',(repair_id,)).fetchone()
   if not existing: raise ValueError('NOT_FOUND')
   check_asset(existing['DA_ID'])
   c.execute('UPDATE repair SET DA_ID=?,repair_Hisory=?,repair_Price=?,repair_Date=? WHERE repairID=?',(asset_id,description,cost,day,repair_id))
  else:
   next_id=c.execute('SELECT COALESCE(MAX(CAST(repairID AS INTEGER)),0)+1 FROM repair').fetchone()[0]
   c.execute('INSERT INTO repair (repairID,DA_ID,repair_Hisory,repair_Price,repair_Date) VALUES (?,?,?,?,?)',(str(next_id),asset_id,description,cost,day))
 elif r['action']=='mail-status':
  result=c.execute("UPDATE system_settings SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND is_active=?",(r['active'],r['previous']))
  if result.rowcount!=1: raise ValueError('STALE')
 elif r['action']=='mail-settings':
  result=c.execute("UPDATE system_settings SET sender_name=?,sender_email=?,reminder_frequency=?,reminder_days=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",r['settings'][:4])
  if result.rowcount!=1:
   c.execute("INSERT INTO system_settings (id,smtp_user,smtp_pass,sender_name,sender_email,reminder_frequency,reminder_days,is_active,updated_at) VALUES (1,'','',?,?,?,?,?,CURRENT_TIMESTAMP)",r['settings'])
 elif r['action'] in ['show-asset','hide-asset','asset-ready','asset-damaged']:
  asset=c.execute('SELECT is_visible,is_approved,owner_department,created_by FROM durable_articles WHERE DA_ID=?',(r['id'],)).fetchone()
  if not asset: raise ValueError('NOT_FOUND')
  if r['user']!='admin' and (not r['department'].strip() or not (asset['owner_department']==r['department'] or (asset['owner_department'] is None and asset['created_by']==r['user']))): raise ValueError('FORBIDDEN')
  if asset['is_approved'] not in (None,1): raise ValueError('STALE')
  if r['action'] in ['asset-ready','asset-damaged']:
   loan=c.execute("SELECT 1 FROM borrow_back WHERE DA_ID=? AND (status IN ('borrowed','ยังไม่ส่งคืน','pending_return') OR (Date_back IS NULL AND status!='returned')) LIMIT 1",(r['id'],)).fetchone()
   if loan: raise ValueError('ACTIVE_LOAN')
   status='s0001' if r['action']=='asset-ready' else 's0002'
   c.execute('UPDATE durable_articles SET statusID=? WHERE DA_ID=?',(status,r['id']))
   if status=='s0002' and r['repairNote']:
    # BEGIN IMMEDIATE serializes the legacy numeric ID allocation.
    next_id=c.execute("SELECT COALESCE(MAX(CAST(repairID AS INTEGER)),0)+1 FROM repair").fetchone()[0]
    c.execute("INSERT INTO repair (repairID,repair_Hisory,repair_Price,DA_ID,repair_Date) VALUES (?,?,?,?,?)",(str(next_id),r['repairNote'],r['repairPrice'],r['id'],r['day']))
  else:
   visible=1 if r['action']=='show-asset' else 0
   c.execute('UPDATE durable_articles SET is_visible=? WHERE DA_ID=?',(visible,r['id']))
 elif r['action'] in ['approve','reject']:
  a=c.execute('SELECT DA_ID,is_approved,owner_department,created_by FROM durable_articles WHERE DA_ID=?',(r['id'],)).fetchone()
  if not a: raise ValueError('NOT_FOUND')
  if r['user']!='admin' and (not r['department'].strip() or not ((a['owner_department'] or '').strip()==r['department'].strip() or (a['owner_department'] is None and a['created_by']==r['user']))): raise ValueError('FORBIDDEN')
  if a['is_approved']!=0: raise ValueError('STALE')
  actor=c.execute("SELECT userDepartment FROM useraccount WHERE useraccountID=? AND userActive='1' AND useraccountType='UT00000001'",(r['user'],)).fetchone()
  if not actor or a['created_by']==r['user'] or (r['user']!='admin' and (actor['userDepartment'] or '').strip()!=r['department'].strip()):raise ValueError('FORBIDDEN')
  tracked=c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='next_csv_request_items'").fetchone() and c.execute('SELECT 1 FROM next_csv_request_items WHERE asset_id=? AND requester_id=?',(r['id'],a['created_by'])).fetchone()
  if r['action']=='approve':
   c.execute("UPDATE durable_articles SET is_approved=1,statusID='s0001' WHERE DA_ID=? AND is_approved=0",(r['id'],))
  else:
   if not tracked:raise ValueError('BACKUP_REQUIRED')
   if not r.get('rejectReason'):raise ValueError('INVALID_INPUT')
   c.execute("UPDATE durable_articles SET is_approved=-1,is_visible=0 WHERE DA_ID=? AND is_approved=0",(r['id'],))
  if tracked:
   c.execute('UPDATE next_csv_request_items SET decided_by=?,decided_at=?,rejection_reason=? WHERE asset_id=?',(r['user'],r['timestamp'],r.get('rejectReason') or None,r['id']))
 elif r['action']=='delete-borrow':
  if not r['global']: raise ValueError('FORBIDDEN')
  b=c.execute('SELECT DA_ID FROM borrow_back WHERE IDborrow_back=?',(r['id'],)).fetchone()
  if not b: raise ValueError('NOT_FOUND')
  for table in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
   quoted='"'+table['name'].replace('"','""')+'"'
   for fk in c.execute('PRAGMA foreign_key_list('+quoted+')').fetchall():
    if fk['table']=='borrow_back': raise ValueError('RELATED')
  if c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='borrowing'").fetchone():
   c.execute('DELETE FROM borrowing WHERE IDborrow_back=?',(r['id'],))
  c.execute('DELETE FROM borrow_back WHERE IDborrow_back=?',(r['id'],))
  other=c.execute("SELECT 1 FROM borrow_back WHERE DA_ID=? AND (status!='returned' OR status IS NULL) AND (Date_back IS NULL OR Date_back IN ('','0','0000-00-00','0000-00-00 00:00:00') OR status='pending_return') LIMIT 1",(b['DA_ID'],)).fetchone()
  if not other:c.execute("UPDATE durable_articles SET statusID='s0001' WHERE DA_ID=? AND statusID='s0003'",(b['DA_ID'],))
 elif r['action']=='return':
  if not c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='next_loan_events'").fetchone():raise ValueError('LOAN_SCHEMA_REQUIRED')
  actor=c.execute("SELECT useraccountName,userRank FROM useraccount WHERE useraccountID=? AND userActive='1' AND useraccountType='UT00000001'",(r['user'],)).fetchone()
  if not actor:raise ValueError('FORBIDDEN')
  b=c.execute('SELECT DA_ID,status,useraccountID_borrow FROM borrow_back WHERE IDborrow_back=?',(r['id'],)).fetchone()
  if not b:raise ValueError('NOT_FOUND')
  a=c.execute('SELECT owner_useraccountID,created_by FROM durable_articles WHERE DA_ID=?',(b['DA_ID'],)).fetchone()
  owner=(a['owner_useraccountID'] if (a['owner_useraccountID'] or '').strip() else a['created_by']) if a else None
  if owner!=r['user'] or b['useraccountID_borrow']==r['user']:raise ValueError('FORBIDDEN')
  if b['status']!='pending_return':raise ValueError('STALE')
  c.execute("UPDATE borrow_back SET Date_back=?,timestamp_back=?,status='returned',Name_back=?,Rank_back=?,useraccountID_back=? WHERE IDborrow_back=?",(r['day'],r['timestamp'],actor['useraccountName'],actor['userRank'],r['user'],r['id']))
  other=c.execute("SELECT 1 FROM borrow_back WHERE DA_ID=? AND (status IS NULL OR status!='returned') AND (Date_back IS NULL OR Date_back IN ('','0','0000-00-00','0000-00-00 00:00:00') OR status='pending_return') LIMIT 1",(b['DA_ID'],)).fetchone()
  if not other:c.execute("UPDATE durable_articles SET statusID='s0001' WHERE DA_ID=? AND statusID='s0003'",(b['DA_ID'],))
  c.execute('INSERT INTO next_loan_events (loan_id,asset_id,borrower_id,actor_id,owner_id,action,occurred_at) VALUES (?,?,?,?,?,?,?)',(r['id'],b['DA_ID'],b['useraccountID_borrow'],r['user'],owner,'approve-user-return',r['timestamp']))
 else:raise ValueError('INVALID_INPUT')
 c.commit()
 result={'ok':True}
 if r['action'] in ('csv-import','csv-request'): result.update(inserted=inserted)
 if r['action']=='asset-create': result.update(id=asset_id,pending=pending)
 if r['action'] in ('borrow','request-return','approve-user-return','owner-direct-return'):result.update(id=loan_id,status=loan_status)
 print(json.dumps(result))
except ValueError as e:
 if c:c.rollback()
 print(json.dumps({'ok':False,'code':str(e)}))
except sqlite3.OperationalError as e:
 if c:c.rollback()
 print(json.dumps({'ok':False,'code':'BUSY' if getattr(e,'sqlite_errorcode',0) in (sqlite3.SQLITE_BUSY,sqlite3.SQLITE_LOCKED) else 'DATABASE_ERROR'}))
except Exception:
 if c:c.rollback()
 print(json.dumps({'ok':False,'code':'DATABASE_ERROR'}))
finally:
 if c:c.close()
`;
export async function performAdminOperation(user:Identity,action:AdminOperation,id:string,repairNote="",repairPrice=0,rejectReason=""){
 if(!isAdmin(user))return {ok:false,code:'FORBIDDEN'};
 if(action==='delete-borrow')return {ok:false,code:'BACKUP_REQUIRED'};
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.DAAM_SQLITE_WRITES!=='enabled'||process.env.NEXT_PHASE==='phase-production-build')return {ok:false,code:'WRITES_DISABLED'};
 const path=await isolatedSqliteWritePath();if(!path)return {ok:false,code:'WRITES_DISABLED'};
 const now=new Date();const timestamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
 const global=['admin','admin_test','administrator'].includes(user.id.toLowerCase())||user.name.toLowerCase()==='administrator'||!user.department||user.department==='ส่วนกลาง';
 try{const {stdout}=await run('python3',['-c',program,JSON.stringify({path,action,id,repairNote,repairPrice,rejectReason,user:user.id,department:user.department,global,day:bangkokDay(now),timestamp})],{timeout:15000,maxBuffer:16384});return JSON.parse(stdout) as {ok:boolean;code?:string};}catch{return {ok:false,code:'DATABASE_ERROR'};}
}

type MailSettings = [string, string, string, number, number];

export function saveMailSettings(user: Identity, settings: MailSettings) {
  return writeMailSettings(user, { action: 'mail-settings', settings });
}

export function setMailStatus(user: Identity, active: number, previous: number) {
  return writeMailSettings(user, { action: 'mail-status', active, previous });
}

async function writeMailSettings(user: Identity, operation:
  { action: 'mail-settings'; settings: MailSettings } |
  { action: 'mail-status'; active: number; previous: number }
) {
 if(!isAdmin(user)||!['admin','admin_test'].includes(user.id))return {ok:false,code:'FORBIDDEN'};
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.DAAM_SQLITE_WRITES!=='enabled'||process.env.NEXT_PHASE==='phase-production-build')return {ok:false,code:'WRITES_DISABLED'};
 const path=await isolatedSqliteWritePath();
 if(!path)return {ok:false,code:'WRITES_DISABLED'};
 try{
  const {stdout}=await run('python3',['-c',program,JSON.stringify({path,...operation})],{timeout:15000,maxBuffer:16384});
  return JSON.parse(stdout) as {ok:boolean;code?:string};
 }catch{return {ok:false,code:'DATABASE_ERROR'};}
}

export async function saveRepair(user:Identity,settings:[string,string,string,number,string]){
 if(!isAdmin(user))return {ok:false,code:'FORBIDDEN'};
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.DAAM_SQLITE_WRITES!=='enabled'||process.env.NEXT_PHASE==='phase-production-build')return {ok:false,code:'WRITES_DISABLED'};
 const path=await isolatedSqliteWritePath();
 if(!path)return {ok:false,code:'WRITES_DISABLED'};
 try{
  const {stdout}=await run('python3',['-c',program,JSON.stringify({path,action:'repair-save',settings,user:user.id,department:user.department})],{timeout:15000,maxBuffer:16384});
  return JSON.parse(stdout) as {ok:boolean;code?:string};
 }catch{return {ok:false,code:'DATABASE_ERROR'};}
}

export async function saveAssetEdit(user:Identity,id:string,fields:Record<string,string>,image:string|null){
 if(!isAdmin(user))return {ok:false,code:'FORBIDDEN'};
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.DAAM_SQLITE_WRITES!=='enabled'||process.env.NEXT_PHASE==='phase-production-build')return {ok:false,code:'WRITES_DISABLED'};
 const path=await isolatedSqliteWritePath();
 if(!path)return {ok:false,code:'WRITES_DISABLED'};
 try{
  const {stdout}=await run('python3',['-c',program,JSON.stringify({path,action:'asset-edit',id,fields,image,user:user.id,department:user.department})],{timeout:15000,maxBuffer:16384});
  return JSON.parse(stdout) as {ok:boolean;code?:string};
 }catch{return {ok:false,code:'DATABASE_ERROR'};}
}

type CsvCommitResult = { ok: true; inserted: number } | { ok: false; code: string };

type CreateResult = { ok: true; id: string; pending: boolean } | { ok: false; code: string };
type AssetWrite = { action: 'csv-import'; rows: CsvRow[] } | { action: 'csv-request'; rows: CsvRow[]; batchId: string; fileName: string; submittedAt: string } | {
  action: 'asset-create'; rows: [CsvRow]; pending: boolean; details: Record<string, string | null>;
};

export async function importAssets(user: Identity, rows: CsvRow[]): Promise<CsvCommitResult> {
  if (!isAdmin(user)) return { ok: false, code: 'FORBIDDEN' };
  return writeAssets<CsvCommitResult>(user, { action: 'csv-import', rows: rows.filter(row => !row.duplicate) });
}

export async function submitCsvRequest(user: Identity, rows: CsvRow[], batchId: string, fileName: string) {
  if (user.type !== 'UT00000002' || !user.department.trim()) return { ok: false, code: 'FORBIDDEN' } as const;
  return writeAssets<CsvCommitResult>(user, { action: 'csv-request', rows: rows.filter(row => !row.duplicate),
    batchId, fileName, submittedAt: new Date().toISOString() });
}

export async function createAsset(user: Identity, row: CsvRow, details: Record<string, string | null>): Promise<CreateResult> {
  if (!isAdmin(user) && user.type !== 'UT00000002') return { ok: false, code: 'FORBIDDEN' };
  return writeAssets<CreateResult>(user, { action: 'asset-create', rows: [row], pending: !isAdmin(user), details });
}

async function writeAssets<T extends CsvCommitResult | CreateResult>(user: Identity, operation: AssetWrite): Promise<T | { ok: false; code: string }> {
  if (process.env.DAAM_DB_ACCESS !== 'enabled' || process.env.DAAM_SQLITE_WRITES !== 'enabled'
    || process.env.NEXT_PHASE === 'phase-production-build') return { ok: false, code: 'WRITES_DISABLED' };
  const path = await isolatedSqliteWritePath();
  if (!path) return { ok: false, code: 'WRITES_DISABLED' };
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = execFile('python3', ['-c', program], { timeout: 60000, maxBuffer: 16384 },
        (error, stdout) => error ? reject(error) : resolve(stdout));
      child.stdin?.on('error', reject);
      child.stdin?.end(JSON.stringify({ ...operation, path, user: user.id }));
    });
    return JSON.parse(output) as T;
  } catch {
    return { ok: false, code: 'RESULT_UNKNOWN' };
  }
}

export async function saveUserEdit(user:Identity,id:string,fields:Record<string,string>,passwordHash:string|null){
 if(!isAdmin(user))return {ok:false,code:'FORBIDDEN'};
 const path=await isolatedSqliteWritePath();
 if(process.env.DAAM_DB_ACCESS!=='enabled'||process.env.DAAM_SQLITE_WRITES!=='enabled'||process.env.NEXT_PHASE==='phase-production-build')return {ok:false,code:'WRITES_DISABLED'};
 if(!path)return {ok:false,code:'WRITES_DISABLED'};
 try {
  const stdout=await new Promise<string>((resolve,reject)=>{
   const child=execFile('python3',['-c',program],{timeout:15000,maxBuffer:16384},(error,out)=>error?reject(error):resolve(out));
   child.stdin?.on('error',reject);
   child.stdin?.end(JSON.stringify({path,action:'user-edit',user:user.id,id,fields,passwordHash}));
  });
  return JSON.parse(stdout) as {ok:boolean;code?:string};
 }catch{return {ok:false,code:'DATABASE_ERROR'};}
}

type OwnAccountUpdate =
  | { action: 'self-profile'; name: string; email: string; previousName: string; previousEmail: string }
  | { action: 'self-password'; passwordHash: string; previousHash: string };

export async function saveOwnAccount(user: Identity, update: OwnAccountUpdate): Promise<{ok: true} | {ok: false; code: string}> {
  if (user.type !== 'UT00000002') return { ok: false, code: 'FORBIDDEN' };
  const path = await isolatedSqliteWritePath();
  if (!path) return { ok: false, code: 'WRITES_DISABLED' };
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = execFile('python3', ['-c', program], { timeout: 15000, maxBuffer: 16384 },
        (error, stdout) => error ? reject(error) : resolve(stdout));
      child.stdin?.on('error', reject);
      child.stdin?.end(JSON.stringify({ ...update, path, user: user.id }));
    });
    return JSON.parse(output);
  } catch {
    return { ok: false, code: 'RESULT_UNKNOWN' };
  }
}

export type LoanOperation = { action: 'borrow'; asset: string; fields: {
  start: string; end: string; department: string; rank: string; email: string; purpose: string;
}} | { action: 'request-return' | 'approve-user-return' | 'owner-direct-return'; asset: string; loan: string; detail: string };

export async function saveLoan(user: Identity, operation: LoanOperation, now: Date) {
  const path = await isolatedSqliteWritePath();
  if (!path) return { ok: false, code: 'WRITES_DISABLED' } as const;
  const timestamp = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Bangkok', year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = execFile('python3', ['-c', program], { timeout: 15000, maxBuffer: 16384 },
        (error, stdout) => error ? reject(error) : resolve(stdout));
      child.stdin?.on('error', reject);
      child.stdin?.end(JSON.stringify({ ...operation, path, user: user.id, day: bangkokDay(now), timestamp }));
    });
    return JSON.parse(output) as {ok:true; id:string; status:string} | {ok:false; code:string};
  } catch {
    return { ok:false, code:'RESULT_UNKNOWN' } as const;
  }
}
