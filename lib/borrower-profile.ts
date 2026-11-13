// SQL fragments for loan queries using borrow_back b and useraccount u.
// Match only by account ID. The stored loan fields remain the historical record.
export const borrowerAccountJoin = 'LEFT JOIN useraccount u ON u.useraccountID=b.useraccountID_borrow';
export const borrowerName = "COALESCE(NULLIF(TRIM(u.useraccountName),''),NULLIF(TRIM(b.Name_borrow),''),'ไม่ระบุ')";
export const borrowerRank = "CASE WHEN u.useraccountID IS NOT NULL THEN TRIM(u.userRank) ELSE b.Rank_borrow END";
export const borrowerDepartment = "CASE WHEN u.useraccountID IS NOT NULL THEN TRIM(u.userDepartment) ELSE b.Belongto_borrow END";
// A cleared account email must not silently route a reminder to the old address.
export const borrowerEmail = "CASE WHEN u.useraccountID IS NOT NULL THEN COALESCE(TRIM(u.userEmail),'') WHEN NULLIF(TRIM(b.useraccountID_borrow),'') IS NULL THEN COALESCE(TRIM(b.userEmail),'') ELSE '' END";
