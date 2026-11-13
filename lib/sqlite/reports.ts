import 'server-only';
import { isAdmin, type Identity } from '../auth/policy';
import { borrowerAccountJoin, borrowerName, borrowerDepartment, borrowerEmail } from '../borrower-profile';
import { readSqliteQueries } from './read';

export function reportAllDepartments(user: Identity) {
  return ['admin', 'admin_test', 'administrator'].includes(user.id.toLowerCase()) || user.department === 'ส่วนกลาง';
}

export async function readReport(user: Identity, tab: string, from: string, to: string, today: string, daily: boolean) {
  if (!isAdmin(user)) throw new Error('FORBIDDEN');
  const global = reportAllDepartments(user);
  const scope = global ? '' : user.department.trim()
    ? " AND (da.owner_department=? OR da.owner_department='ส่วนกลาง' OR (da.owner_department IS NULL AND da.created_by=?))"
    : ' AND 1=0';
  const values = global || !user.department.trim() ? [] : [user.department, user.id];
  const loans = 'FROM borrow_back b LEFT JOIN durable_articles da ON da.DA_ID=b.DA_ID';
  if (tab === 'analytics') return readSqliteQueries([
    { sql: `SELECT da.DA_ID AS id,da.DA_Number AS number,da.DA_ListName AS name,da.DA_Brand AS brand,da.owner_department AS department,COUNT(b.IDborrow_back) AS total ${loans} WHERE da.DA_ID IS NOT NULL${scope} GROUP BY b.DA_ID ORDER BY total DESC,name LIMIT 5`, values },
    { sql: `SELECT ${borrowerName} AS name,${borrowerEmail} AS email,${borrowerDepartment} AS department,COUNT(b.IDborrow_back) AS total ${loans} ${borrowerAccountJoin} WHERE (u.useraccountID IS NOT NULL OR NULLIF(TRIM(b.Name_borrow),'') IS NOT NULL)${scope} GROUP BY NULLIF(TRIM(b.useraccountID_borrow),''),CASE WHEN NULLIF(TRIM(b.useraccountID_borrow),'') IS NULL THEN ${borrowerName} END ORDER BY total DESC,name DESC LIMIT 5`, values },
  // Global rankings use historical loans, including assets hidden from current inventory.
  ], { includeClbHistory: global });
  if (tab === 'borrowing') {
    const trend = (column: 'Date_borrow' | 'Date_back') => {
      const key = daily ? `b.${column}` : `strftime('%Y-%m',b.${column})`;
      return { sql: `SELECT ${key} AS period,COUNT(b.IDborrow_back) AS total ${loans} WHERE b.${column} BETWEEN ? AND ?${scope} GROUP BY period`, values: [from, to, ...values] };
    };
    return readSqliteQueries([
      trend('Date_borrow'), trend('Date_back'),
      { sql: `SELECT b.IDborrow_back AS id,da.DA_Number AS number,da.DA_ListName AS name,${borrowerName} AS borrower,${borrowerEmail} AS email,b.Date_borrow AS borrowed,COALESCE(b.due_date,b.Deadline_borrow) AS due,CAST(julianday(?) - julianday(date(COALESCE(b.due_date,b.Deadline_borrow))) AS INTEGER) AS days ${loans} ${borrowerAccountJoin} WHERE da.DA_ID IS NOT NULL AND (b.Date_back IS NULL OR b.Date_back='') AND (b.status!='returned' OR b.status IS NULL) AND COALESCE(b.due_date,b.Deadline_borrow)<?${scope} ORDER BY due`, values: [today, today, ...values] },
    ]);
  }
  return readSqliteQueries([
    { sql: `SELECT SUM(CASE WHEN (da.statusID='s0001' OR da.statusID IS NULL OR da.statusID='') AND b.DA_ID IS NULL THEN 1 ELSE 0 END) AS available,SUM(CASE WHEN b.DA_ID IS NOT NULL OR da.statusID='s0003' THEN 1 ELSE 0 END) AS borrowed,SUM(CASE WHEN (da.statusID='s0002' OR (da.statusID NOT IN ('s0001','s0003') AND da.statusID IS NOT NULL AND da.statusID!='')) AND b.DA_ID IS NULL THEN 1 ELSE 0 END) AS damaged,COUNT(da.DA_ID) AS total FROM durable_articles da LEFT JOIN (SELECT DISTINCT DA_ID FROM borrow_back WHERE (Date_back IS NULL OR Date_back='') AND (status!='returned' OR status IS NULL)) b ON da.DA_ID=b.DA_ID WHERE (da.is_approved=1 OR da.is_approved IS NULL)${scope}`, values },
    { sql: `SELECT COALESCE(c.classificationName,'ไม่ระบุหมวดหมู่') AS category,COUNT(da.DA_ID) AS total,SUM(COALESCE(da.DA_Price,0)) AS value FROM durable_articles da LEFT JOIN classification c ON da.classificationID=c.classificationID WHERE (da.is_approved=1 OR da.is_approved IS NULL)${scope} GROUP BY category ORDER BY total DESC,category LIMIT 10`, values },
  ]);
}
