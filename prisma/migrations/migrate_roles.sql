-- ロール移行スクリプト
-- 既存の 'admin' を 'FULL_ADMIN' に、'user' を 'USER' に移行

-- 既存の 'admin' ロールを 'FULL_ADMIN' に変更
UPDATE users 
SET role = 'FULL_ADMIN' 
WHERE role = 'admin';

-- 既存の 'user' ロールを 'USER' に変更
UPDATE users 
SET role = 'USER' 
WHERE role = 'user';

-- 確認用クエリ（実行後に確認してください）
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;

