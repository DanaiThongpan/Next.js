import { disabledCategories } from './category-availability';
import 'server-only';
import { isAdmin, type Identity } from '../auth/policy';
import { readSqliteQueries } from './read';
import type { Filters, CatalogRow } from './catalog';
export async function readQrCatalog(user:Identity, filters:Filters) {
 if(!isAdmin(user)) throw new Error('FORBIDDEN');
 const aliases:Record<string,string>={category:'category_id',building:'building_id',q:'keyword'};
 const get=(key:string)=>{const value=filters[aliases[key]]??filters[key];return typeof value==='string'?value.trim().slice(0,200):'';};
 const page=1;
 const singleId=get('asset');
 const generated=Boolean(singleId)||(get('generate')==='1'&&Boolean(get('category')));
 const limit=[12,24,48,96].includes(Number(get('limit')))?Number(get('limit')):24;
 // print_qrcode.php has no department WHERE predicate after its strict Admin gate.
 const where=['(a.is_visible=1 OR a.is_visible IS NULL)'];const values:(string|number)[]=[];
 if(singleId){
  where.push('a.DA_ID=?');values.push(singleId);
  if(user.id!=='admin'){
   where.push(user.department.trim()?'(a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))':'1=0');
   if(user.department.trim())values.push(user.department,user.id);
  }
 }
 if(get('category')&&get('category')!=='all'){where.push('a.classificationID=?');values.push(get('category'));}
 if(get('building')){where.push('a.buildingID=?');values.push(get('building'));}
 if(get('q')){where.push('(a.DA_Number LIKE ? OR a.DA_ListName LIKE ? OR a.DA_Brand LIKE ?)');values.push(...Array(3).fill(`%${get('q')}%`));}
 const disabled=await disabledCategories();
 if(disabled.length){where.push(`(a.classificationID IS NULL OR a.classificationID NOT IN (${disabled.map(()=>'?').join(',')}))`);values.push(...disabled);}
 if(!generated)where.push('1=0');
 const clause=where.join(' AND ');
 const result=await readSqliteQueries([
  {sql:'SELECT c.classificationID AS id,c.classificationName AS name,COUNT(a.DA_ID) AS total FROM classification c LEFT JOIN durable_articles a ON a.classificationID=c.classificationID AND (a.is_visible=1 OR a.is_visible IS NULL) GROUP BY c.classificationID,c.classificationName ORDER BY c.classificationID',values:[]},
  {sql:'SELECT buildingID AS id,buildingName AS name FROM building WHERE (is_active=1 OR is_active IS NULL) ORDER BY buildingName',values:[]},
  {sql:`SELECT COUNT(*) AS total FROM durable_articles a WHERE ${clause}`,values}
 ]);
 const total=Number(result[2][0].total);const requested=singleId?Math.min(1,total):get('limit')==='all'?total:Math.min(total,limit);const rows:CatalogRow[]=[];
 for(let offset=0;offset<requested;offset+=200){const [batch]=await readSqliteQueries([{sql:`SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Year AS year,c.classificationName AS category FROM durable_articles a LEFT JOIN classification c ON c.classificationID=a.classificationID WHERE ${clause} ORDER BY a.DA_Number,a.DA_ID LIMIT ? OFFSET ?`,values:[...values,Math.min(200,requested-offset),offset]}]);rows.push(...batch);if(!batch.length)break;}
 return {categories:result[0],buildings:result[1],total,rows,page,limit,generated};
}
export function qrScanBase() {
 const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:3000');
 if (!['http:', 'https:'].includes(origin.protocol) || origin.port === '8000' || origin.username || origin.password) {
  throw new Error('INVALID_APP_ORIGIN');
 }
 return origin.origin + '/user/borrow?asset_id=';
}
