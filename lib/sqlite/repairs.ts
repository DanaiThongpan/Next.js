import 'server-only';
import { isAdmin,type Identity } from '../auth/policy';
import { bangkokDay } from '../dashboard/model';
import { readSqliteQueries } from './read';
import type { Filters } from './catalog';
export async function readRepairs(user:Identity,filters:Filters){
 if(!isAdmin(user))throw new Error('FORBIDDEN');
 const get=(key:string)=>typeof filters[key]==='string'?filters[key].slice(0,200):'';
 const scope=user.id==='admin'?'':' AND (a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))';
 const params=user.id==='admin'?[]:[user.department,user.id];
 const allowed=user.id==='admin'||user.department.trim()?'1=1':'1=0';
 const base=` FROM repair r JOIN durable_articles a ON a.DA_ID=r.DA_ID WHERE ${allowed}${scope}`;
 let filtered=base;const values:(string|number)[]=[...params];
 if(get('q')){filtered+=' AND (a.DA_Number LIKE ? OR a.DA_ListName LIKE ? OR r.repair_Hisory LIKE ?)';values.push(...Array(3).fill('%'+get('q')+'%'));}
 const asset=(get('da_id')||get('DAID')).trim();if(asset){filtered+=' AND r.DA_ID=?';values.push(asset);}
 const length=[10,25,50,100].includes(Number(get('length')))?Number(get('length')):10;
 const requested=Math.max(1,Math.min(100000,parseInt(get('page'))||1));
 const [stats,count,assets]=await readSqliteQueries([
 {sql:`SELECT COUNT(*) AS total,COALESCE(SUM(r.repair_Price),0) AS cost,COUNT(DISTINCT r.DA_ID) AS assets,SUM(CASE WHEN substr(r.repair_Date,1,7)=? THEN 1 ELSE 0 END) AS month${base}`,values:[bangkokDay().slice(0,7),...params]},
 {sql:`SELECT COUNT(*) AS total,COALESCE(SUM(r.repair_Price),0) AS cost${filtered}`,values},
 {sql:`SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.owner_department AS department FROM durable_articles a WHERE ${allowed} AND (a.is_approved=1 OR a.is_approved IS NULL)${scope}${asset?' AND a.DA_ID=?':''} ORDER BY a.DA_Number ASC`,values:asset?[...params,asset]:params}]);
 const total=Number(count[0].total);const page=Math.min(requested,Math.max(1,Math.ceil(total/length)));
 const sorts:Record<string,string>={date:'r.repair_Date',number:'a.DA_Number',name:'a.DA_ListName',cost:'r.repair_Price',id:'CAST(r.repairID AS INTEGER)'};
 const [rows]=await readSqliteQueries([{sql:`SELECT r.repairID AS id,r.DA_ID AS assetId,a.DA_Number AS number,a.DA_ListName AS name,a.owner_department AS department,r.repair_Date AS date,r.repair_Hisory AS description,r.repair_Price AS cost${filtered} ORDER BY ${sorts[get('sort')]||sorts.date} ${get('direction')==='asc'?'ASC':'DESC'},CAST(r.repairID AS INTEGER) DESC LIMIT ? OFFSET ?`,values:[...values,length,(page-1)*length]}]);
 return {rows,assets,stats:stats[0],total,cost:Number(count[0].cost),page,length};
}

export async function readRepairAsset(user:Identity,id:string){
 if(!isAdmin(user)||!id||id.length>128)throw new Error('FORBIDDEN');
 const scope=user.id==='admin'?'':user.department.trim()?' AND (a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))':' AND 1=0';
 const values=user.id==='admin'||!user.department.trim()?[id]:[id,user.department,user.id];
 const [rows]=await readSqliteQueries([{sql:`SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Size AS size,a.DA_Year AS year,a.DA_Price AS price,a.DA_DetailLocation AS location,a.owner_department AS department,c.classificationName AS category,b.buildingName AS building,cr.classroomName AS room,s.statusName AS status FROM durable_articles a LEFT JOIN classification c ON c.classificationID=a.classificationID LEFT JOIN building b ON b.buildingID=a.buildingID LEFT JOIN building_classroom cr ON cr.classroomID=a.classroomID LEFT JOIN status_active s ON s.statusID=a.statusID WHERE a.DA_ID=?${scope} LIMIT 1`,values}]);
 return rows[0]??null;
}
