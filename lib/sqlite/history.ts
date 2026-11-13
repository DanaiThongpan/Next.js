import 'server-only';
import { isAdmin,type Identity } from '../auth/policy';
import { borrowerAccountJoin, borrowerName, borrowerRank, borrowerDepartment, borrowerEmail } from '../borrower-profile';
import { bangkokDay } from '../dashboard/model';
import { readSqliteQueries } from './read';
import type { Filters } from './catalog';
export async function readHistory(user:Identity,filters:Filters, recordId?:string){
 if(!isAdmin(user))throw new Error('FORBIDDEN');
 const get=(k:string)=>typeof filters[k]==='string'?filters[k].slice(0,200):'';
 const today=bangkokDay();const page=Math.min(100000,Math.max(1,parseInt(get('page'))||1));const length=[10,25,50,100].includes(Number(get('length')))?Number(get('length')):25;
 const global=['admin','admin_test','administrator'].includes(user.id.toLowerCase())||user.name.toLowerCase()==='administrator'||!user.department||user.department==='ส่วนกลาง';
 const scope=global?'':" WHERE (da.owner_department=? OR da.owner_department='ส่วนกลาง' OR (da.owner_department IS NULL AND da.created_by=?))";const scopeValues=global?[]:[user.department,user.id];
 const base=`SELECT b.IDborrow_back AS id,b.useraccountID_borrow AS borrowerId,COALESCE(NULLIF(TRIM(da.owner_useraccountID),''),da.created_by) AS receiverId,COALESCE(da.DA_ListName,b.Detail_borrow,'ครุภัณฑ์ไม่ระบุชื่อ') AS name,da.DA_Number AS number,da.owner_department AS department,da.is_visible AS visible,${borrowerName} AS borrower,${borrowerRank} AS rank,${borrowerDepartment} AS affiliation,u.userDepartment AS userDepartment,${borrowerEmail} AS email,b.Date_borrow AS borrowed,COALESCE(b.due_date,b.Deadline_borrow) AS due,COALESCE(b.status,CASE WHEN b.Date_back IS NOT NULL AND b.Date_back!='' THEN 'returned' ELSE 'borrowed' END) AS status,b.Date_back AS returned,b.last_reminded_at AS reminded,COALESCE(b.timestamp_borrow,b.Date_borrow) AS ordering FROM borrow_back b LEFT JOIN durable_articles da ON b.DA_ID=da.DA_ID ${borrowerAccountJoin}${scope}`;
 const returned="(status='returned' OR (returned IS NOT NULL AND returned!='' AND returned!='0' AND status!='pending_return'))";
 const borrowed = `NOT ${returned}`;
 const overdue = `(${borrowed} AND status!='pending_return' AND date(substr(due,1,10)) < ?)`;
 const late = `(${returned} AND date(substr(returned,1,10)) > date(substr(due,1,10)))`;
 const summary = `SELECT COUNT(*) AS total,
  SUM(CASE WHEN ${borrowed} THEN 1 ELSE 0 END) AS borrowed,
  SUM(CASE WHEN ${overdue} THEN 1 ELSE 0 END) AS overdue,
  SUM(CASE WHEN ${returned} THEN 1 ELSE 0 END) AS returned,
  SUM(CASE WHEN ${late} THEN 1 ELSE 0 END) AS late FROM (${base}) h`;
 if(recordId!==undefined){const [rows]=await readSqliteQueries([{sql:`SELECT * FROM (${base}) h WHERE id=? LIMIT 1`,values:[...scopeValues,recordId]}]);return {stats:{} as Record<string,string|number|null>,total:rows.length,rows,page:1,length,today};}
 const predicates:string[]=[];
 const searchValues:string[]=[];
 const statusFilter = get('status');
 if (statusFilter === 'borrowed') predicates.push(borrowed);
 if (statusFilter === 'returned') predicates.push(returned);
 if (statusFilter === 'overdue') {
  predicates.push(overdue);
  searchValues.push(today);
 }
 if(get('q')){
  predicates.push('(CAST(id AS TEXT) LIKE ? OR number LIKE ? OR name LIKE ? OR borrower LIKE ? OR affiliation LIKE ? OR email LIKE ? OR userDepartment LIKE ? OR department LIKE ? OR rank LIKE ? OR borrowed LIKE ? OR due LIKE ? OR returned LIKE ?)');
  searchValues.push(...Array<string>(12).fill(`%${get('q')}%`));
 }
 for(const [key,operator] of [['from','>='],['to','<=']]){
  const date=get(key);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)){
   predicates.push(`date(borrowed)${operator}?`);
   searchValues.push(date);
  }
 }
 const search=predicates.length?' WHERE '+predicates.join(' AND '):'';
 const sorts:Record<string,string>={borrower:'borrower',asset:'name',date:'ordering',status:'status'};const order=sorts[get('sort')]?`${sorts[get('sort')]} ${get('direction')==='asc'?'ASC':'DESC'},id DESC`:'ordering DESC,id DESC';
 const [stats,count,rows]=await readSqliteQueries([{sql:summary,values:[today,...scopeValues]},{sql:`SELECT COUNT(*) AS total FROM (${base}) h${search}`,values:[...scopeValues,...searchValues]},{sql:`SELECT * FROM (${base}) h${search} ORDER BY ${order} LIMIT ? OFFSET ?`,values:[...scopeValues,...searchValues,length,(page-1)*length]}]);return {stats:stats[0],total:Number(count[0].total),rows,page,length,today};
}
