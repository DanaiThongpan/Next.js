-- Apply only to a separately provisioned Next.js SQLite database.
BEGIN IMMEDIATE;
CREATE TABLE IF NOT EXISTS next_loan_events (
  event_id INTEGER PRIMARY KEY,
  loan_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  owner_id TEXT,
  action TEXT NOT NULL CHECK(action IN ('borrow','request-return','approve-user-return','owner-direct-return')),
  occurred_at TEXT NOT NULL,
  UNIQUE(loan_id, action)
);
COMMIT;
