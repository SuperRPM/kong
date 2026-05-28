-- Phase 13: 이슈 취소 상태(cancelled) 추가
-- 기존 status CHECK 제약을 확장하여 'cancelled' 허용
-- completed_at은 done과 동일 패턴: cancelled 전환 시 자동 채움, 되돌리면 자동 비움 (애플리케이션 레이어에서 처리)

ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check
  CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled'));

-- 알림 트리거의 status_label CASE에 cancelled 추가
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
      WHEN 'cancelled'   THEN '취소'
      ELSE NEW.status
    END;
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (NEW.assignee_id, NEW.id, 'status_changed',
            '[' || NEW.title || '] 상태가 ' || status_label || '로 변경되었습니다.');
  END IF;

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
        WHEN 'cancelled'   THEN '취소'
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
