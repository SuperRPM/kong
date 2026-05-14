-- 관리자가 한 명도 없을 때 최초 가입자를 관리자로 자동 설정
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE is_admin = true);
