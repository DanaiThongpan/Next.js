import 'server-only';
import { bangkokDay } from '../dashboard/model';
import { hasCsvRequestHistory } from './csv-requests';
import { activeLoan, borrowableAsset, escapeAssetSearch, loanDue } from './borrow';
import { readSqliteQueries } from './read';

const pageSize = 20;
const ownLoans = 'FROM main.borrow_back b LEFT JOIN main.durable_articles a ON a.DA_ID=b.DA_ID WHERE b.useraccountID_borrow=?';
const returned = "(COALESCE(b.status,'')!='pending_return' AND NOT (" + activeLoan + "))";
const loanFields = `b.IDborrow_back AS id,b.DA_ID AS assetId,a.DA_Number AS number,
 COALESCE(a.DA_ListName,b.Detail_borrow,'ไม่ระบุชื่อ') AS name,b.Date_borrow AS borrowed,
 ${loanDue} AS due,b.Date_back AS returned,b.status,b.Detail_borrow AS purpose,b.Detail_back AS returnDetail`;

export async function readUserDashboard(id: string, view: string, page: number, keyword: string, category = '', building = '', status = '') {
  const today = bangkokDay();
  const offset = (page - 1) * pageSize;
  const match = `%${escapeAssetSearch(keyword)}%`;
  const filter = [
    keyword ? " AND (a.DA_Number LIKE ? ESCAPE '!' OR a.DA_ListName LIKE ? ESCAPE '!')" : '',
    category ? ' AND a.classificationID=?' : '',
    building ? ' AND a.buildingID=?' : '',
  ].join('');
  const search = [...(keyword ? [match, match] : []), ...(category ? [category] : []), ...(building ? [building] : [])];
  const showInventory = view === '' || view === 'available';
  const available = `FROM durable_articles a WHERE ${borrowableAsset}${filter}`;
  const historyConditions: Record<string, string> = {
    returned, pending: "b.status='pending_return'",
    active: `(${activeLoan}) AND COALESCE(b.status,'')!='pending_return'`,
  };
  const historyFilter = ownLoans
    + (keyword && view === 'history' ? " AND (a.DA_Number LIKE ? ESCAPE '!' OR a.DA_ListName LIKE ? ESCAPE '!' OR b.Detail_borrow LIKE ? ESCAPE '!' OR b.IDborrow_back LIKE ? ESCAPE '!')" : '')
    + (Object.hasOwn(historyConditions, status) && view === 'history' ? ' AND (' + historyConditions[status] + ')' : '');
  const historyValues = [id, ...(keyword && view === 'history' ? [match, match, match, match] : [])];
  const withCsvHistory = view === 'requests' && await hasCsvRequestHistory();
  const requestFields = withCsvHistory ? `,m.batch_id AS batchId,m.file_name AS fileName,m.submitted_at AS submittedAt,m.submitted_values AS submittedValues,
    m.decided_by AS decidedBy,m.decided_at AS decidedAt,m.rejection_reason AS rejectionReason,
    (SELECT COUNT(*) FROM main.next_csv_request_items x WHERE x.requester_id=m.requester_id AND x.batch_id=m.batch_id) AS batchCount` : '';
  const requestJoin = withCsvHistory ? ' LEFT JOIN main.next_csv_request_items m ON m.asset_id=a.DA_ID AND m.requester_id=a.created_by' : '';
  const requestOrder = withCsvHistory ? 'm.submitted_at DESC,m.batch_id DESC,a.DA_Number,a.DA_ID' : 'a.DA_Number,a.DA_ID';
  const requestStatuses: Record<string, number> = { pending: 0, approved: 1, rejected: -1 };
  const filterRequests = view === 'requests' && Object.hasOwn(requestStatuses, status);
  const requestFilter = `FROM main.durable_articles a${requestJoin} WHERE a.created_by=?`
    + (keyword && view === 'requests' ? " AND (a.DA_Number LIKE ? ESCAPE '!' OR a.DA_ListName LIKE ? ESCAPE '!' OR a.DA_ID LIKE ? ESCAPE '!'"
      + (withCsvHistory ? " OR m.batch_id LIKE ? ESCAPE '!' OR m.file_name LIKE ? ESCAPE '!'" : '') + ')' : '')
    + (filterRequests ? ' AND a.is_approved=?' : '');
  const requestValues = [id, ...(keyword && view === 'requests' ? [match, match, match, ...(withCsvHistory ? [match, match] : [])] : []),
    ...(filterRequests ? [requestStatuses[status]] : [])];
  const [stats, loans, availableCount, inventory, extra, categories, buildings] = await readSqliteQueries([
    { sql: `SELECT (SELECT COUNT(*) ${historyFilter}) AS history,
      (SELECT COUNT(*) ${requestFilter}) AS requests`, values: [...historyValues, ...requestValues] },
    view === '' || view === 'borrowed' ? { sql: `SELECT * FROM (SELECT ${loanFields},
      ROW_NUMBER() OVER (PARTITION BY NULLIF(b.DA_ID,''),CASE WHEN COALESCE(b.DA_ID,'')='' THEN b.IDborrow_back END
        ORDER BY b.Date_borrow DESC,b.timestamp_borrow DESC,b.IDborrow_back DESC) AS row_number
      ${ownLoans} AND ${activeLoan}) WHERE row_number=1 ORDER BY status='pending_return',due,id`, values: [id] } : { sql: 'SELECT 1 WHERE 0', values: [] },
    showInventory ? { sql: `SELECT COUNT(*) AS total ${available}`, values: search } : { sql: 'SELECT 0 AS total', values: [] },
    showInventory ? { sql: `SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Size AS size,a.DA_Year AS year,a.DA_Detail AS detail,
      (SELECT classificationName FROM classification WHERE classificationID=a.classificationID) AS category,
      (SELECT buildingName FROM building WHERE buildingID=a.buildingID) AS building,
      (SELECT classroomName FROM building_classroom WHERE classroomID=a.classroomID AND buildingID=a.buildingID) AS room
      ${available} ORDER BY a.DA_Number,a.DA_ID LIMIT ? OFFSET ?`, values: [...search, pageSize, offset] } : { sql: 'SELECT 1 WHERE 0', values: [] },
    view === 'history' || view === ''
      ? { sql: `SELECT ${loanFields} ${historyFilter} ORDER BY b.Date_borrow DESC,b.timestamp_borrow DESC,b.IDborrow_back DESC LIMIT ? OFFSET ?`,
          values: [...historyValues, view === '' ? 3 : pageSize, view === '' ? 0 : offset] }
      : view === 'requests'
        ? { sql: `SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Detail AS detail,
          a.DA_Price AS price,a.DA_Year AS year,a.classificationID AS category,a.buildingID AS building,a.classroomID AS room,
          a.owner_department AS department,a.is_approved AS approved${requestFields}
          ${requestFilter} ORDER BY ${requestOrder} LIMIT ? OFFSET ?`, values: [...requestValues, pageSize, offset] }
        : { sql: 'SELECT 1 WHERE 0', values: [] },
    showInventory ? { sql: 'SELECT classificationID AS id, classificationName AS name FROM classification ORDER BY name', values: [] } : { sql: 'SELECT 1 WHERE 0', values: [] },
    showInventory ? { sql: 'SELECT buildingID AS id, buildingName AS name FROM building ORDER BY name', values: [] } : { sql: 'SELECT 1 WHERE 0', values: [] },
  ]);
  // Prefer the submitted values in history; editing an approved asset must not rewrite the request.
  if (withCsvHistory) for (const row of extra) {
    if (typeof row.submittedValues !== 'string') continue;
    try {
      const values: unknown = JSON.parse(row.submittedValues);
      const fields = ['number', 'name', 'brand', 'category', 'building', 'room', 'price', 'year', 'department'];
      if (Array.isArray(values) && values.length === fields.length && values.every(value => typeof value === 'string')) {
        fields.forEach((field, i) => { row[field] = values[i]; });
      }
    } catch { /* Older or unreadable metadata leaves the existing request details visible. */ }
  }
  return { stats: stats[0], loans, available: Number(availableCount[0].total), inventory, extra, categories, buildings, today, pageSize };
}
