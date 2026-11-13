import 'server-only';
import { isAdmin, type Identity } from '../auth/policy';
import { borrowerAccountJoin, borrowerName } from '../borrower-profile';
import { allDepartments, bangkokDay } from '../dashboard/model';
import { readSqliteQueries } from './read';
import type { Filters } from './catalog';
export type ReadModule='approvals'|'history'|'repairs'|'mail';
export async function readAdminModule(user:Identity,kind:ReadModule,filters:Filters){
 if(!isAdmin(user))throw new Error('FORBIDDEN');
 const get=(k:string)=>typeof filters[k]==='string'?filters[k].slice(0,200):'';
 const page=Math.min(100000,Math.max(1,parseInt(get('page'))||1));
 const where:string[]=[];const values:(string|number)[]=[];
 const add=(s:string,...v:string[])=>{where.push(s);values.push(...v);};
 let from='',fields='',order='';
 if(kind==='mail'){
  if(!['admin','admin_test'].includes(user.id))throw new Error('FORBIDDEN');
  const [rows]=await readSqliteQueries([{sql:'SELECT sender_name,sender_email,reminder_frequency,reminder_days,is_active,updated_at FROM system_settings WHERE id=1 LIMIT 1',values:[]}]);return {rows:rows.length?rows:[{sender_name:'',sender_email:'',reminder_frequency:'none',reminder_days:0,is_active:0}],total:rows.length,page:1};
 }
 if(kind==='approvals'){
  from='durable_articles a';fields='a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.owner_department AS department,a.is_approved AS approval,a.DA_Price AS price';order='a.DA_ID';add('a.is_approved=0');
  if(user.id!=='admin'){if(!user.department.trim())add('1=0');else add('(a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))',user.department,user.id);}
 }else{
  const history=kind==='history';from=history?`borrow_back b LEFT JOIN durable_articles a ON a.DA_ID=b.DA_ID ${borrowerAccountJoin}`:'repair r LEFT JOIN durable_articles a ON a.DA_ID=r.DA_ID';
  fields=history?`b.IDborrow_back AS id,a.DA_Number AS number,a.DA_ListName AS name,a.owner_department AS department,${borrowerName} AS borrower,b.Date_borrow AS borrowed,b.Deadline_borrow AS deadline,b.Date_back AS returned,b.status AS status`:'r.repairID AS id,r.DA_ID AS assetId,a.DA_Number AS number,a.DA_ListName AS name,a.owner_department AS department,r.repair_Date AS date,r.repair_Hisory AS description,r.repair_Price AS cost';
  order=history?'b.IDborrow_back':'r.repair_Date';
  const global=history?(allDepartments(user)||user.id.toLowerCase()==='administrator'):(user.id==='admin'||!user.department);
  if(!global)add("(a.owner_department=? OR a.owner_department='ส่วนกลาง' OR (a.owner_department IS NULL AND a.created_by=?))",user.department,user.id);
  if(history&&get('status')){if(get('status')==='overdue')add("b.status!='returned' AND (b.Date_back IS NULL OR b.Date_back='' OR b.status='pending_return') AND b.Deadline_borrow<?",bangkokDay());else add('b.status=?',get('status'));}
  const date=history?'b.Date_borrow':'r.repair_Date';if(get('from'))add(`${date}>=?`,get('from'));if(get('to'))add(`${date}<=?`,get('to'));
 }
 if(get('department'))add('a.owner_department=?',get('department'));
 if(get('q')){const term=`%${get('q')}%`;if(kind==='history')add(`(a.DA_Number LIKE ? OR a.DA_ListName LIKE ? OR ${borrowerName} LIKE ?)`,term,term,term);else add('(a.DA_Number LIKE ? OR a.DA_ListName LIKE ?)',term,term);}
 const clause=where.length?' WHERE '+where.join(' AND '):'';
 const [count,rows]=await readSqliteQueries([{sql:`SELECT COUNT(*) AS total FROM ${from}${clause}`,values},{sql:`SELECT ${fields} FROM ${from}${clause} ORDER BY ${order} ${get('direction')==='asc'?'ASC':'DESC'} LIMIT ? OFFSET ?`,values:[...values,25,(page-1)*25]}]);
 return {rows,total:Number(count[0].total),page};
}
