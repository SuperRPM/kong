-- 알림 트리거 버그 수정 + Realtime 활성화
-- SECURITY DEFINER 컨텍스트에서 auth.uid()가 NULL을 반환할 수 있어
-- actor가 NULL이면 모든 알림이 차단되던 문제를 수정
-- notifications 테이블을 Supabase Realtime publication에 추가

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

CREATE OR REPLACE FUNCTION create_issue_notifications()
RETURNS TRIGGER AS $$
DECLARE
  actor UUID;
  status_label TEXT;
BEGIN
  actor := auth.uid();
  -- actor가 NULL이면 자기자신 제외 조건을 건너뜀 (모든 담당자에게 알림)

  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id
     AND NEW.assignee_id IS NOT NULL
     AND (actor IS NULL OR NEW.assignee_id != actor)
  THEN
    INSERT INTO notifications (recipient_id, issue_id, type, message)
    VALUES (
      NEW.assignee_id,
      NEW.id,
      'assigned',
      '[' || NEW.title || '] 이슈에 담당자로 지정되었습니다.'
    );
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
    VALUES (
      NEW.assignee_id,
      NEW.id,
      'status_changed',
      '[' || NEW.title || '] 상태가 ' || status_label || '로 변경되었습니다.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
