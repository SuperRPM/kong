-- 알림 개별/전체 삭제 권한
CREATE POLICY "users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (recipient_id = auth.uid());

-- 댓글 멘션 알림 직접 삽입 허용 (클라이언트에서 멘션 알림 생성)
CREATE POLICY "users can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
