CREATE TABLE IF NOT EXISTS issue_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE issue_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read activity logs" ON issue_activity_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION log_issue_changes()
RETURNS TRIGGER AS $$
DECLARE
  actor UUID;
BEGIN
  actor := auth.uid();

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO issue_activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, actor, 'status_changed', OLD.status, NEW.status);
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO issue_activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, actor, 'priority_changed', OLD.priority, NEW.priority);
  END IF;

  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO issue_activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, actor, 'assignee_changed',
      (SELECT name FROM profiles WHERE id = OLD.assignee_id),
      (SELECT name FROM profiles WHERE id = NEW.assignee_id));
  END IF;

  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO issue_activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, actor, 'title_changed', OLD.title, NEW.title);
  END IF;

  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO issue_activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, actor, 'category_changed', OLD.category, NEW.category);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS issue_change_logger ON issues;
CREATE TRIGGER issue_change_logger
  AFTER UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION log_issue_changes();
