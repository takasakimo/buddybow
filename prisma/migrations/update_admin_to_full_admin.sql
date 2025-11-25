-- 管理者を全権管理者に更新するSQL
-- admin@test.com のユーザーを FULL_ADMIN に更新

UPDATE users 
SET role = 'FULL_ADMIN' 
WHERE email = 'admin@test.com' AND role = 'admin';

-- 確認用クエリ（実行後に確認してください）
-- SELECT id, name, email, role FROM users WHERE email = 'admin@test.com';

