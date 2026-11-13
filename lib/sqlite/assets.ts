import { readClbVisibility } from './clb-visibility';
import { disabledCategories } from './category-availability';
import 'server-only';
import { isAdmin,type Identity } from '../auth/policy';
import { readCatalog,type Filters } from './catalog';
import { readSqliteQueries } from './read';
export async function readAssetPage(user:Identity,filters:Filters){
 if(!isAdmin(user))throw new Error('FORBIDDEN');
 const get=(k:string)=>typeof filters[k]==='string'?filters[k]:'';
 const visibility=get('filter_visibility')||get('visibility')||'visible';
 const mapped={...filters,visibility,category:get('filter_category')||get('category'),building:get('filter_building')||get('building'),year:get('filter_year')||get('year'),status:({'พร้อมใช้งาน':'ready','กำลังถูกยืม':'borrowed','ชำรุด / ไม่พร้อมใช้':'damaged','ชำรุด':'damaged'} as Record<string,string>)[get('filter_status')]||get('status')};
 const scope=user.id==='admin'?'':user.department.trim()?' AND (owner_department=? OR (owner_department IS NULL AND created_by=?))':' AND 1=0';const values=user.id==='admin'||!user.department.trim()?[]:[user.department,user.id];
 const [categories,buildings,years,counts]=await readSqliteQueries([
 {sql:'SELECT classificationID AS id,classificationName AS name FROM classification ORDER BY classificationName',values:[]},
 {sql:'SELECT buildingID AS id,buildingName AS name FROM building ORDER BY buildingName',values:[]},
 {sql:`SELECT DISTINCT REPLACE(DA_Year, char(39), '') AS year FROM durable_articles WHERE DA_Year IS NOT NULL AND DA_Year!=''${scope} ORDER BY year DESC`,values},
 {sql:`SELECT SUM(CASE WHEN is_visible=1 OR is_visible IS NULL THEN 1 ELSE 0 END) AS visible,SUM(CASE WHEN is_visible=0 THEN 1 ELSE 0 END) AS hidden,COUNT(*) AS total FROM durable_articles WHERE (is_approved=1 OR is_approved IS NULL)${scope}`,values}], {inspectClb:true});
 const raw=filters.filter_category??filters.category;
 const supplied=Array.isArray(raw)?raw:typeof raw==='string'&&raw?[raw]:[];
 const allowed=new Set(categories.map(row=>String(row.id)));
 const selectedCategories=[...new Set(supplied.filter(id=>allowed.has(id)))];
 const categorySelection=get('category_selection')==='none'?[]:supplied.length?selectedCategories:undefined;
 return {visibility,showClb:await readClbVisibility(),disabledCategories:await disabledCategories(),...await readCatalog(user,'assets',mapped,categorySelection),selectedCategories:categorySelection??[...allowed],categories,buildings,years,counts:counts[0]};
}
