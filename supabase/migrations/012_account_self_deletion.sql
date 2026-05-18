-- 본인 계정을 직접 삭제할 수 있는 RPC 함수
-- auth.users 삭제 시 profiles는 ON DELETE CASCADE로 자동 삭제됨
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
