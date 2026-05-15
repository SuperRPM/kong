CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION create_issue_notifications()
RETURNS TRIGGER AS $$
DECLARE
  actor UUID;
  status_label TEXT;
BEGIN
  actor := auth.uid();

  -- assignee changed: notify the new assignee (if not the actor)
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id
     AND NEW.assignee_id IS NOT NULL
     AND NEW.assignee_id != actor
  THEN
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (
      NEW.assignee_id,
      NEW.id,
      'assigned',
      NEW.title || '이 담당자로 지정되었습니다.'
    );
  END IF;

  -- status changed: notify the assignee (if not the actor)
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.assignee_id IS NOT NULL
     AND NEW.assignee_id != actor
  THEN
    status_label := CASE NEW.status
      WHEN 'todo'        THEN '할 일'
      WHEN 'in_progress' THEN '진행 중'
      WHEN 'review'      THEN '검토 대기'
      WHEN 'done'        THEN '완료'
      ELSE NEW.status
    END;

    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (
      NEW.assignee_id,
      NEW.id,
      'status_changed',
      NEW.title || ' 상태가 ' || status_label || '로 변경되었습니다.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS issue_notification_trigger ON issues;
CREATE TRIGGER issue_notification_trigger
  AFTER UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION create_issue_notifications();
