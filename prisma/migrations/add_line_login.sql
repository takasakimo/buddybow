-- DiagnosisSubmission に LINE連携カラム追加
ALTER TABLE diagnosis_submissions
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  ADD COLUMN IF NOT EXISTS line_report_sent_at TIMESTAMP;

-- LINEログインOAuth state一時管理テーブル
CREATE TABLE IF NOT EXISTS line_oauth_states (
  id           TEXT PRIMARY KEY,
  state        TEXT UNIQUE NOT NULL,
  diagnosis_id TEXT NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
