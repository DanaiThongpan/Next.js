import 'server-only';
import { isAdmin,type Identity } from '../auth/policy';
import { hasCsvRequestHistory } from './csv-requests';
import { readSqliteQueries } from './read';
import type { Filters } from './catalog';
export async function readApprovals(user:Identity,filters:Filters){
 if(!isAdmin(user))throw new Error('FORBIDDEN');
 const get=(k:string)=>typeof filters[k]==='string'?filters[k].slice(0,200):'';
 const page=Math.min(100000,Math.max(1,parseInt(get('page'))||1));const length=[10,25,50,100].includes(Number(get('length')))?Number(get('length')):10;
 const where=['a.is_approved=0'];const values:(string|number)[]=[];
 if(user.id!=='admin'){if(!user.department.trim())where.push('1=0');else{where.push('(TRIM(a.owner_department)=? OR (a.owner_department IS NULL AND a.created_by=?))');values.push(user.department.trim(),user.id);}}
 const tracked=await hasCsvRequestHistory();
 const csvFields=tracked?',m.batch_id AS csvBatch,m.file_name AS csvFile,m.submitted_at AS csvSubmitted':'';
 const csvJoin=tracked?' LEFT JOIN main.next_csv_request_items m ON m.asset_id=a.DA_ID AND m.requester_id=a.created_by':'';
 const from='main.durable_articles a LEFT JOIN classification c ON a.classificationID=c.classificationID LEFT JOIN building b ON a.buildingID=b.buildingID LEFT JOIN building_classroom cr ON a.classroomID=cr.classroomID AND a.buildingID=cr.buildingID LEFT JOIN useraccount u ON a.created_by=u.useraccountID'+csvJoin;
 const base=where.join(' AND ');const baseValues=[...values];
 if(get('department')){where.push('a.owner_department=?');values.push(get('department'));}
 if(get('q')){where.push('(a.DA_Number LIKE ? OR a.DA_ListName LIKE ? OR a.DA_Brand LIKE ? OR u.useraccountName LIKE ?)');values.push(...Array(4).fill(`%${get('q')}%`));}
 const sorts:Record<string,string>={number:'a.DA_Number',name:'a.DA_ListName',category:'c.classificationName',department:'a.owner_department',requester:'u.useraccountName',location:'b.buildingName',price:'a.DA_Price'};
 const order=sorts[get('sort')]?`${sorts[get('sort')]} ${get('direction')==='desc'?'DESC':'ASC'},a.DA_ID DESC`:'a.DA_ID DESC';
 const [pending,count,rows]=await readSqliteQueries([
 {sql:`SELECT COUNT(*) AS total FROM ${from} WHERE ${base}`,values:baseValues},
 {sql:`SELECT COUNT(*) AS total FROM ${from} WHERE ${where.join(' AND ')}`,values},
 {sql:`SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Detail AS detail,a.DA_Price AS price,a.owner_department AS department,c.classificationName AS category,b.buildingName AS building,cr.classroomName AS room,a.created_by AS creator,u.useraccountName AS requester,u.userDepartment AS requesterDepartment,a.DA_Year AS year,a.buildingID AS buildingId,a.classroomID AS roomId${csvFields} FROM ${from} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`,values:[...values,length,(page-1)*length]}]);
 return {pending:Number(pending[0].total),total:Number(count[0].total),rows,page,length};
}
