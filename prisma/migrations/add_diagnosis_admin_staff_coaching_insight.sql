-- 診断ごとのスタッフ向けAIインサイト（管理者・メンターのみ。受講生には非公開）
ALTER TABLE "diagnoses" ADD COLUMN IF NOT EXISTS "admin_staff_coaching_insight" JSONB;
