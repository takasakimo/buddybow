-- LP等からの匿名診断結果用テーブル
CREATE TABLE IF NOT EXISTS "diagnosis_submissions" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "personality_type" TEXT,
    "result_data" JSONB,
    "diagnosed_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT DEFAULT 'lp',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_submissions_pkey" PRIMARY KEY ("id")
);
