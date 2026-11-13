-- Apply manually to the isolated Next.js SQLite database only.
-- Keep the legacy durable_articles structure; this table adds CSV audit metadata.
CREATE TABLE IF NOT EXISTS next_csv_request_items (
  asset_id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL,
  requester_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  submitted_values TEXT NOT NULL,
  decided_by TEXT,
  decided_at TEXT,
  rejection_reason TEXT
);
CREATE INDEX IF NOT EXISTS next_csv_request_history
  ON next_csv_request_items(requester_id, batch_id, submitted_at);
