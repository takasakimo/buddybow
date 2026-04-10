-- 受講生の内部プロフィール（管理者・担当メンターのみ参照。受講生マイページには出さない）
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_hearing_notes" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_background" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_mindset" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_current_goals" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_diagnosis_notes" TEXT;
