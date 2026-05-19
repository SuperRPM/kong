-- 증권주문봇 이슈 시드 데이터
-- 취소 상태 4건 제외, 총 23건
-- 실행 전 프로젝트명 '증권주문봇' 확인 필요

DO $$
DECLARE
  proj_id UUID;
  uid_lsy UUID;  -- 이상용
  uid_jjy UUID;  -- 전준엽
  uid_pye UUID;  -- 박영은
BEGIN
  SELECT id INTO proj_id FROM projects WHERE name = '증권주문봇' AND deleted_at IS NULL;
  SELECT id INTO uid_lsy FROM profiles WHERE name = '이상용';
  SELECT id INTO uid_jjy FROM profiles WHERE name = '전준엽';
  SELECT id INTO uid_pye FROM profiles WHERE name = '박영은';

  IF proj_id IS NULL THEN
    RAISE EXCEPTION '프로젝트 "증권주문봇"을 찾을 수 없습니다.';
  END IF;

  -- 카테고리 SS 등록 (없는 경우에만)
  INSERT INTO project_categories (project_id, value, label, sort_order)
  VALUES (proj_id, 'SS', '삼성증권', 0)
  ON CONFLICT (project_id, value) DO NOTHING;

  -- 1
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '국민은행 계좌 비밀번호 오류 수정', 'done', 'medium', 'SS', NULL, NULL, NULL);

  -- 2
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '계좌번호 마스킹 처리', 'done', 'medium', 'SS', uid_lsy, uid_lsy, '2026-04-03');

  -- 3
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '계좌번호 직접입력 오류 수정', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-03');

  -- 4
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '계좌번호 입력 후 대화 강제종료 수정', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-03');

  -- 5
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매도 가격별 체결/예약 처리', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-06');

  -- 6
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수주문 가격 단위(initPrice) 조절 기능', 'done', 'medium', 'SS', uid_pye, uid_pye, NULL);

  -- 7
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '현재가 조회 시 가격 제의 기능 통합', 'done', 'medium', 'SS', NULL, NULL, NULL);

  -- 8
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, 'STT 발화 오류 시 통화 강제종료 수정', 'done', 'medium', 'SS', uid_pye, uid_pye, '2026-04-03');

  -- 9
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '보유종목 수량 조회 기능', 'done', 'medium', 'SS', uid_lsy, uid_lsy, NULL);

  -- 10
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '웰컴인증 이후 추가 인증 생략 처리', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-03');

  -- 11
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수/매도 가격 선택 무반응 수정', 'done', 'medium', 'SS', uid_pye, uid_pye, NULL);

  -- 12
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매도 UI 매수 UI로 통일', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-06');

  -- 13
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수 UI 수정', 'done', 'medium', 'SS', uid_pye, uid_pye, NULL);

  -- 14
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매도예약 목록 표시', 'done', 'medium', 'SS', uid_lsy, uid_lsy, NULL);

  -- 15
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수예약 목록 표시', 'done', 'medium', 'SS', uid_lsy, uid_lsy, NULL);

  -- 16
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수 가격별 체결/예약 처리', 'done', 'medium', 'SS', uid_pye, uid_pye, NULL);

  -- 17
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수/매도 주문 중 취소 기능', 'done', 'medium', 'SS', uid_pye, uid_pye, '2026-04-06');

  -- 18
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매도주문 수량 입력 취소/재주문 시나리오', 'done', 'medium', 'SS', uid_pye, uid_pye, '2026-04-06');

  -- 19
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '본인인증 2회 실패 시 통화종료 처리', 'done', 'medium', 'SS', uid_jjy, uid_jjy, NULL);

  -- 20 (상태 미정 → todo)
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '간투사 처리', 'todo', 'medium', 'SS', uid_lsy, uid_lsy, NULL);

  -- 21 (공통작업: 전준엽, 박영은)
  INSERT INTO issues (project_id, title, description, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '보유종목/매도종목 차이 처리', '공통작업 (전준엽, 박영은)', 'done', 'medium', 'SS', uid_jjy, uid_jjy, '2026-04-07');

  -- 22
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '매수 취소 후 예약종목 조회 결과 수정', 'done', 'medium', 'SS', uid_jjy, uid_jjy, NULL);

  -- 23
  INSERT INTO issues (project_id, title, status, priority, category, assignee_id, created_by, completed_at)
  VALUES (proj_id, '주문 정정 시나리오 오류 수정', 'done', 'medium', 'SS', uid_pye, uid_pye, NULL);

END $$;
