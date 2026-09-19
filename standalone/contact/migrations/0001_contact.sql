-- Hitobito共通問い合わせ専用DB。Habit Planetの課金・習慣データとは分離する。
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  app TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending','sending','retry','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  lease_until INTEGER,
  resend_email_id TEXT,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inquiries_delivery ON inquiries(delivery_status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
-- Only salted SHA-256 fingerprints are stored, never plaintext IPs.
CREATE TABLE IF NOT EXISTS submission_limits (
  bucket TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX IF NOT EXISTS idx_submission_limits_window ON submission_limits(window_start);
