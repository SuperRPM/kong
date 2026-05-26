-- Phase 12: 하위이슈 (sub-issues)
-- 1단계 깊이만 허용, 부모/자식 모든 속성 독립, sub_number는 부모별 1부터 자동 채번
-- 부모 soft delete 시 자식도 cascade, 자식 댓글/상태변경 시 부모 담당자에게 알림

ALTER TABLE issues ADD COLUMN IF NOT EXISTS parent_issue_id UUID REFERENCES issues(id) ON DELETE CASCADE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS sub_number INT;

CREATE INDEX IF NOT EXISTS idx_issues_parent ON issues(parent_issue_id) WHERE parent_issue_id IS NOT NULL;

-- 1) 깊이 제한: 부모가 이미 자식이면 INSERT/UPDATE 거부
CREATE OR REPLACE FUNCTION check_issue_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_parent UUID;
BEGIN
  IF NEW.parent_issue_id IS NOT NULL THEN
    SELECT parent_issue_id INTO parent_parent
    FROM issues
    WHERE id = NEW.parent_issue_id;

    IF parent_parent IS NOT NULL THEN
      RAISE EXCEPTION 'sub-issue cannot have sub-issues (1-level limit)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_check_depth ON issues;
CREATE TRIGGER issues_check_depth
  BEFORE INSERT OR UPDATE OF parent_issue_id ON issues
  FOR EACH ROW
  EXECUTE FUNCTION check_issue_depth();

-- 2) sub_number 자동 채번 (부모별 MAX+1)
CREATE OR REPLACE FUNCTION assign_sub_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(sub_number), 0) + 1
  INTO NEW.sub_number
  FROM issues
  WHERE parent_issue_id = NEW.parent_issue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_auto_sub_number ON issues;
CREATE TRIGGER issues_auto_sub_number
  BEFORE INSERT ON issues
  FOR EACH ROW
  WHEN (NEW.parent_issue_id IS NOT NULL)
  EXECUTE FUNCTION assign_sub_number();

-- 3) 기존 number 채번 트리거 수정: 자식은 number 미할당, 부모 카운트도 자식 제외
CREATE OR REPLACE FUNCTION assign_issue_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_issue_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(MAX(number), 0) + 1
  INTO NEW.number
  FROM issues
  WHERE project_id = NEW.project_id AND category = NEW.category AND parent_issue_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) 부모 soft delete 시 자식 cascade
CREATE OR REPLACE FUNCTION cascade_soft_delete_children()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE issues
    SET deleted_at = NEW.deleted_at
    WHERE parent_issue_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_cascade_delete ON issues;
CREATE TRIGGER issues_cascade_delete
  AFTER UPDATE OF deleted_at ON issues
  FOR EACH ROW
  EXECUTE FUNCTION cascade_soft_delete_children();

-- 5) 자식 상태변경 시 부모 담당자에게 알림 (기존 트리거 함수 확장)
CREATE OR REPLACE FUNCTION create_issue_notifications()
RETURNS TRIGGER AS $$
DECLARE
  actor UUID;
  status_label TEXT;
  parent_assignee UUID;
BEGIN
  actor := auth.uid();

  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id
     AND NEW.assignee_id IS NOT NULL
     AND (actor IS NULL OR NEW.assignee_id != actor)
  THEN
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (NEW.assignee_id, NEW.id, 'assigned',
            '[' || NEW.title || '] 이슈에 담당자로 지정되었습니다.');
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.assignee_id IS NOT NULL
     AND (actor IS NULL OR NEW.assignee_id != actor)
  THEN
    status_label := CASE NEW.status
      WHEN 'todo'        THEN '할 일'
      WHEN 'in_progress' THEN '진행 중'
      WHEN 'review'      THEN '검토 대기'
      WHEN 'done'        THEN '완료'
      ELSE NEW.status
    END;
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (NEW.assignee_id, NEW.id, 'status_changed',
            '[' || NEW.title || '] 상태가 ' || status_label || '로 변경되었습니다.');
  END IF;

  -- 자식 이슈 상태변경 → 부모 담당자에게 추가 알림
  IF NEW.parent_issue_id IS NOT NULL
     AND OLD.status IS DISTINCT FROM NEW.status
  THEN
    SELECT assignee_id INTO parent_assignee
    FROM issues WHERE id = NEW.parent_issue_id;

    IF parent_assignee IS NOT NULL
       AND (actor IS NULL OR parent_assignee != actor)
       AND (NEW.assignee_id IS NULL OR parent_assignee != NEW.assignee_id)
    THEN
      status_label := CASE NEW.status
        WHEN 'todo'        THEN '할 일'
        WHEN 'in_progress' THEN '진행 중'
        WHEN 'review'      THEN '검토 대기'
        WHEN 'done'        THEN '완료'
        ELSE NEW.status
      END;
      INSERT INTO notifications (recipient_id, issue_id, type, message)
      VALUES (parent_assignee, NEW.parent_issue_id, 'child_status',
              '하위이슈 [' || NEW.title || '] 상태가 ' || status_label || '로 변경되었습니다.');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) 자식 이슈에 댓글 작성 시 부모 담당자에게 알림
CREATE OR REPLACE FUNCTION notify_parent_on_child_comment()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  child_assignee UUID;
  parent_assignee UUID;
  child_title TEXT;
BEGIN
  SELECT parent_issue_id, assignee_id, title
  INTO parent_id, child_assignee, child_title
  FROM issues WHERE id = NEW.issue_id;

  IF parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT assignee_id INTO parent_assignee
  FROM issues WHERE id = parent_id;

  IF parent_assignee IS NOT NULL
     AND parent_assignee != NEW.author_id
     AND (child_assignee IS NULL OR parent_assignee != child_assignee)
  THEN
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (parent_assignee, parent_id, 'child_comment',
            '하위이슈 [' || child_title || ']에 새 댓글: ' || LEFT(NEW.body, 60));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS issue_comment_parent_notification ON issue_comments;
CREATE TRIGGER issue_comment_parent_notification
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_parent_on_child_comment();
