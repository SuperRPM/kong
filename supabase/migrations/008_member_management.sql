-- Allow admins to update any member's is_admin status
DROP POLICY IF EXISTS "admins can update member admin status" ON profiles;
CREATE POLICY "admins can update member admin status" ON profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );
