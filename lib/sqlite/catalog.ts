import 'server-only';
import { readSqliteQueries } from './read';
import { isAdmin, type Identity } from '../auth/policy';
export type CatalogRow = Record<string, string | number | null>;
export type Filters = Record<string, string | string[] | undefined>;
export async function readCatalog(user: Identity, kind: 'assets' | 'users' | 'qr', filters: Filters, assetCategories?: readonly string[]) {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  if (process.env.DAAM_DB_ACCESS !== 'enabled' || process.env.NEXT_PHASE === 'phase-production-build') throw new Error('DISABLED');
  const get = (key: string) => typeof filters[key] === 'string' ? filters[key].slice(0,200) : '';
  const page = Math.min(100000, Math.max(1, Number.parseInt(get('page')) || 1));
  const pageSize=(kind==='assets'||kind==='users')&&[10,25,50,100].includes(Number(get('length')))?Number(get('length')):(kind==='assets'||kind==='users')?10:25;
  const values: (string | number)[] = [];
  const where: string[] = [];
  const add = (sql: string, ...params: string[]) => { where.push(sql); values.push(...params); };
  let from: string, fields: string, order: string;
  if (kind === 'users') {
    from = 'useraccount u';
    fields = 'u.useraccountID AS id,u.useraccountName AS name,u.useraccountType AS role,u.userDepartment AS department,u.userActive AS active,u.userRank AS rank,u.userEmail AS email';
    const sorts: Record<string,string> = {role:'u.useraccountType',name:'u.useraccountName',id:'u.useraccountID',department:'u.userDepartment',active:'u.userActive',rank:'u.userRank',email:'u.userEmail'};
    const sort=sorts[get('sort')]??sorts.role;
    order = `${sort} ${get('direction')==='desc'?'DESC':'ASC'},u.useraccountName ASC,u.useraccountID ASC`;
    if (user.id !== 'admin') {
      if (!user.department.trim()) add('1=0'); else add('u.userDepartment=?',user.department);
    }
    if (get('q')) add('(u.useraccountID LIKE ? OR u.useraccountName LIKE ?)',`%${get('q')}%`,`%${get('q')}%`);
    for (const [key,col] of [['role','useraccountType'],['department','userDepartment'],['active','userActive']]) if (get(key)) add(`u.${col}=?`,get(key));
  } else {
    from = 'durable_articles a LEFT JOIN classification c ON c.classificationID=a.classificationID LEFT JOIN status_active s ON s.statusID=a.statusID LEFT JOIN building bd ON bd.buildingID=a.buildingID LEFT JOIN building_classroom cr ON cr.classroomID=a.classroomID';
    fields = 'a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Year AS year,a.DA_Price AS price,a.DA_Detail AS detail,a.DA_URLImg AS image,a.useraccountID AS responsible,a.DA_Size AS size,bd.buildingName AS building,cr.classroomName AS room,a.owner_department AS department,a.created_by AS creator,a.is_approved AS approved,a.is_visible AS visible,c.classificationName AS category,s.statusName AS status';
    if (kind === 'assets') {
      from += ' LEFT JOIN useraccount creator ON creator.useraccountID=a.created_by';
      fields += ',creator.useraccountName AS creatorName';
    }
    const sorts:Record<string,string>={number:'a.DA_Number',name:'a.DA_ListName',category:'c.classificationName',building:'bd.buildingName',price:'a.DA_Price',department:'a.owner_department',visible:'a.is_visible',status:'s.statusName'};
    order = `${sorts[get('sort')]??sorts.number} ${get('direction')==='desc'?'DESC':'ASC'},a.DA_ID ASC`;
    add('(a.is_approved=1 OR a.is_approved IS NULL)');
    if (user.id !== 'admin') {
      if (!user.department.trim()) add('1=0'); else add('(a.owner_department=? OR (a.owner_department IS NULL AND a.created_by=?))',user.department,user.id);
    }
    if (kind !== 'qr' && get('visibility') === 'hidden') add('a.is_visible=0'); else if (kind === 'qr' || get('visibility') !== 'all') add('(a.is_visible=1 OR a.is_visible IS NULL)');
    if (get('id')) add('a.DA_ID=?',get('id'));
    if (get('q')) add('(a.DA_Number LIKE ? OR a.DA_ListName LIKE ? OR a.DA_Brand LIKE ?)',...Array(3).fill(`%${get('q')}%`));
    if(get('status')==='borrowed') add("EXISTS (SELECT 1 FROM borrow_back b WHERE b.DA_ID=a.DA_ID AND (b.status='borrowed' OR b.status='ยังไม่ส่งคืน' OR (b.Date_back IS NULL AND b.status!='returned')))");
    else if(get('status')==='ready') add("a.statusID='s0001' AND NOT EXISTS (SELECT 1 FROM borrow_back b WHERE b.DA_ID=a.DA_ID AND (b.status='borrowed' OR b.status='ยังไม่ส่งคืน' OR (b.Date_back IS NULL AND b.status!='returned')))");
    else if(get('status')==='damaged') add("a.statusID!='s0001'");
    else if(get('status')) add('a.statusID=?',get('status'));
    if (kind==='assets' && assetCategories!==undefined) {
      if (assetCategories.length) add(`a.classificationID IN (${assetCategories.map(()=>'?').join(',')})`,...assetCategories);
      else add('1=0');
    } else if(get('category')) add('a.classificationID=?',get('category'));
    for (const [key,col] of [['department','owner_department'],['building','buildingID']]) if (get(key)) add(`a.${col}=?`,get(key));
    if (get('year')) add('(a.DA_Year=? OR a.DA_Year=?)',get('year'),`'${get('year')}'`);
  }
  const clause = where.length ? ' WHERE '+where.join(' AND ') : '';
  const queries = [{sql:`SELECT COUNT(*) AS total FROM ${from}${clause}`,values}, {sql:`SELECT ${fields} FROM ${from}${clause} ORDER BY ${order} LIMIT ? OFFSET ?`,values:[...values,pageSize,(page-1)*pageSize]}];
  try {
    const result = await readSqliteQueries(queries, {inspectClb:kind==='assets'});
    return {total:Number(result[0][0].total),rows:result[1],page,pageSize};
  } catch { throw new Error('ไม่สามารถอ่านข้อมูลได้ในขณะนี้'); }
}
