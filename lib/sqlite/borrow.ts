import 'server-only';
import { type Identity } from '../auth/policy';
import { readSqliteQueries } from './read';

export const activeLoan = "(b.status IS NULL OR b.status!='returned') AND (b.Date_back IS NULL OR b.Date_back IN ('','0','0000-00-00','0000-00-00 00:00:00') OR b.status='pending_return')";
export const visibleApprovedAsset = '(a.is_visible=1 OR a.is_visible IS NULL) AND (a.is_approved=1 OR a.is_approved IS NULL)';
export const borrowableAsset = `${visibleApprovedAsset}
  AND (a.statusID='s0001' OR a.statusID IS NULL OR a.statusID='')
  AND NOT EXISTS (SELECT 1 FROM main.borrow_back b WHERE b.DA_ID=a.DA_ID AND ${activeLoan})`;
export const escapeAssetSearch = (value: string) => value.replace(/[!%_]/g, '!$&');
export const loanDue = "COALESCE(NULLIF(NULLIF(NULLIF(NULLIF(b.due_date,''),'0'),'0000-00-00'),'0000-00-00 00:00:00'),b.Deadline_borrow)";
const returnReviewer = "(a.owner_useraccountID=? OR (NULLIF(TRIM(a.owner_useraccountID),'') IS NULL AND a.created_by=?))";
const returnReviewerValues = (user: Identity) => [user.id, user.id];

export async function hasLoanAudit() {
  const [rows] = await readSqliteQueries([{
    sql: "SELECT 1 FROM main.sqlite_master WHERE type='table' AND name='next_loan_events'",
    values: [],
  }]);
  return rows.length > 0;
}

export async function hasOwnedAssets(user: Identity) {
  const [rows] = await readSqliteQueries([{
    sql: `SELECT 1 FROM main.durable_articles a WHERE ${returnReviewer} LIMIT 1`,
    values: returnReviewerValues(user),
  }]);
  return rows.length > 0;
}

const inventory = `SELECT a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,a.DA_Brand AS brand,a.DA_Size AS size,a.DA_Year AS year,a.DA_Price AS price,a.DA_Detail AS detail,a.DA_DetailLocation AS location,
  CASE WHEN TRIM(COALESCE(a.DA_URLImg,''))<>'' THEN 1 ELSE 0 END AS hasPhoto,c.classificationName AS category,bd.buildingName AS building,cr.classroomName AS room,a.statusID AS status
  FROM durable_articles a LEFT JOIN classification c ON c.classificationID=a.classificationID
  LEFT JOIN building bd ON bd.buildingID=a.buildingID
  LEFT JOIN building_classroom cr ON cr.classroomID=a.classroomID AND cr.buildingID=a.buildingID`;

export async function searchBorrowAssets(keyword: string) {
  const escaped = escapeAssetSearch(keyword);
  const [rows] = await readSqliteQueries([{
    sql: `${inventory} WHERE ${borrowableAsset}
      AND (a.DA_ID=? OR a.DA_Number LIKE ? ESCAPE '!' OR a.DA_ListName LIKE ? ESCAPE '!' OR a.DA_Brand LIKE ? ESCAPE '!')
      ORDER BY CASE WHEN a.DA_Number=? OR a.DA_ID=? THEN 0 WHEN a.DA_Number LIKE ? ESCAPE '!' THEN 1 ELSE 2 END,a.DA_Number,a.DA_ID LIMIT 10`,
    values: [keyword, `%${escaped}%`, `%${escaped}%`, `%${escaped}%`, keyword, keyword, `${escaped}%`],
  }]);
  return rows.map(({ id, number, name, category }) => ({ id, number, name, category }));
}

export async function readPendingReturns(user: Identity, page = 1) {
  const [rows] = await readSqliteQueries([{
    sql: `SELECT b.IDborrow_back AS loanId,a.DA_ID AS id,a.DA_Number AS number,a.DA_ListName AS name,b.Date_back AS requested,b.Name_borrow AS borrower,b.Date_borrow AS borrowed,${loanDue} AS due
      FROM main.borrow_back b JOIN main.durable_articles a ON a.DA_ID=b.DA_ID
      WHERE b.status='pending_return' AND b.useraccountID_borrow<>? AND ${returnReviewer}
      ORDER BY requested,a.DA_ID,b.IDborrow_back LIMIT 11 OFFSET ?`,
    values: [user.id, ...returnReviewerValues(user), (page - 1) * 10],
  }]);
  return rows;
}

export async function readBorrowScreen(user: Identity, identifier: string, intent: 'borrow' | 'return' | 'review' | 'auto' = 'auto', loanId = '') {
  const [accounts, assets] = await readSqliteQueries([
    { sql: "SELECT userEmail AS email,userRank AS rank FROM useraccount WHERE useraccountID=? AND userActive='1'", values: [user.id] },
    { sql: `${inventory} WHERE (${visibleApprovedAsset}) AND (a.DA_ID=? OR a.DA_Number=?) ORDER BY a.DA_ID=? DESC,a.DA_ID LIMIT 2`,
      values: [identifier, identifier, identifier] },
  ]);
  if (!identifier) return { account: accounts[0], asset: null, loan: null, mode: null };
  const asset = assets[0];
  if (assets.length > 1 && String(asset.id) !== identifier) return { account: accounts[0], asset: null, loan: null, mode: null };

  // A borrower may return their own loan even if the asset was hidden after borrowing.
  const [loans] = await readSqliteQueries([{
    sql: `SELECT b.IDborrow_back AS id,b.DA_ID AS assetId,b.useraccountID_borrow AS borrowerId,b.status,
      b.Name_borrow AS borrower,b.Date_borrow AS borrowed,${loanDue} AS due,b.Date_back AS returned,
      a.DA_ListName AS assetName,a.DA_Number AS assetNumber,a.owner_useraccountID AS owner,a.created_by AS creator,a.owner_department AS department
      FROM main.borrow_back b LEFT JOIN main.durable_articles a ON a.DA_ID=b.DA_ID
      WHERE ${activeLoan} AND ${asset ? 'b.DA_ID=?' : `(b.DA_ID=? OR a.DA_Number=?) AND (
        b.useraccountID_borrow=? OR ${returnReviewer})`}
      AND (?='' OR b.IDborrow_back=?)
      ORDER BY CASE WHEN ?=1 AND b.status='pending_return' AND b.useraccountID_borrow<>? THEN 0
                    WHEN b.useraccountID_borrow=? THEN 1 ELSE 2 END,
        b.Date_borrow DESC,b.timestamp_borrow DESC,b.IDborrow_back DESC LIMIT 2`,
    values: [
      ...(asset ? [String(asset.id)] : [identifier, identifier, user.id, ...returnReviewerValues(user)]),
      loanId, loanId, Number(intent === 'review'), user.id, user.id,
    ],
  }]);
  if (!asset && new Set(loans.map(row => row.assetId)).size > 1) return { account: accounts[0], asset: null, loan: null, mode: null };
  const loan = loans[0];
  const own = loan?.borrowerId === user.id;
  const owner = Boolean(loan && (loan.owner === user.id || (!String(loan.owner ?? '').trim() && loan.creator === user.id)));
  const pending = loan?.status === 'pending_return';
  let mode: 'return' | 'approve_return' | 'direct_return' | 'borrow' | null = null;
  if (intent !== 'borrow' && owner && pending && !own) mode = 'approve_return';
  else if (intent !== 'borrow' && intent !== 'review' && loan && !pending) {
    if (owner) mode = 'direct_return';
    else if (own) mode = 'return';
  } else if ((intent === 'auto' || intent === 'borrow') && !loanId && !loan && asset && (!asset.status || asset.status === 's0001')) mode = 'borrow';
  return {
    account: accounts[0],
    asset: asset ?? (loan && (own || owner) ? { id: loan.assetId, name: loan.assetName, number: loan.assetNumber } : null),
    loan: own || owner ? { id: loan.id, borrower: loan.borrower, borrowed: loan.borrowed, due: loan.due, returned: loan.returned, status: loan.status } : null,
    mode, occupied: Boolean(loan), available: !loan && Boolean(asset && (!asset.status || asset.status === 's0001')),
  };
}
