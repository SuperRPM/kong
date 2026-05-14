-- 요구사항정의_v0.1 시드 데이터
-- 이미 시드된 경우 스킵 (견적서 파일 검색 존재 여부로 판단)
DO $$
DECLARE
  v_project_id UUID;
  v_admin_id   UUID;
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE is_admin = true ORDER BY created_at ASC LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM profiles ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_admin_id IS NULL THEN
    RAISE NOTICE '005_seed: no user found, skipping';
    RETURN;
  END IF;

  INSERT INTO projects (name, description, prefix, created_by)
  SELECT '스마트 업무지원', 'AI 기반 스마트 업무지원 플랫폼 요구사항', 'REQ', v_admin_id
  WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE prefix = 'REQ' AND deleted_at IS NULL
  );

  SELECT id INTO v_project_id
  FROM projects WHERE prefix = 'REQ' AND deleted_at IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE NOTICE '005_seed: REQ project not found, skipping';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM issues
    WHERE project_id = v_project_id
      AND title = '견적서 파일 검색'
      AND deleted_at IS NULL
  ) THEN
    RAISE NOTICE '005_seed: already seeded, skipping';
    RETURN;
  END IF;

  INSERT INTO issues (project_id, title, description, status, priority, category, created_by) VALUES
  (v_project_id, '이미지, pdf 인식', '이미지, pdf를 입력으로 받아서 요청을 처리', 'todo', 'medium', 'CM', v_admin_id),
  (v_project_id, '출처파일 다운로드', '모든 답변에 출처를 표시, 원본파일 다운로드', 'todo', 'medium', 'CM', v_admin_id),
  (v_project_id, '스냅샷 보여주기', '답변에 해당하는 이미지 스냅샷 제공 (pdf인 경우)', 'todo', 'medium', 'CM', v_admin_id),
  (v_project_id, '자주 사용하는 기능 버튼 목록', '설명없이 사용가능한 기능하도록 메뉴 버튼 추가', 'todo', 'medium', 'CM', v_admin_id),
  (v_project_id, '곬적서 파일 검색', E'기존 곬적서 파일 검색 (파일명, 키워드, 업로드를 통한 검색)\n예) "하나은행 곬적서 가장 최신꺼 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '유사 곬적서 추천', E'요청하는 내용을 바탕으로 가장 매치되는 유사 곬적서를 검색\n예) "신한은행 음성봇 프로젝트를 하는데 가장 유사한 케이스의 곬적서를 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '곬적서 컨텐츠 생성', '곬적서에 들어갈 내용을 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '곬적서 생성 (엑셀)', '곬적서 최종 엑셀 파일을 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, 'RFP 파일 검색', E'기존 RFP 파일 검색 (파일명, 키워드, 업로드를 통한 검색)\n예) "하나은행 RFP 가장 최신꺼 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '유사 RFP 추천', E'요청하는 내용을 바탕으로 가장 매치되는 유사 RFP를 검색\n예) "신한은행 음성봇 프로젝트를 하는데 가장 유사한 케이스의 RFP를 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '요약보고서', 'RFP의 내용을 표현식을 클릭하여 출력 (마크다운)', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '제안서 파일 검색', E'기존 제안서 파일 검색 (파일명, 키워드, 업로드를 통한 검색)\n예) "하나은행 제안서 2024년도 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '유사 제안서 추천', E'요청하는 내용을 바탕으로 가장 매치되는 유사 제안서를 검색\n예) "신한은행 음성봇 프로젝트를 하는데 가장 유사한 케이스의 제안서를 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '제안 컨텐츠 생성', '제안서에 들어갈 내용을 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '템플릿 업로드로 컨텐츠 만들기', '제안서에 목차를 업로드하면 해당 목차에 맞는 데이터를 수집하여 제안서 컨텐츠 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '제안서 생성 (PPT)', '제안서 최종 PPT 파일을 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, 'RFP로 제안서 데이터 생성', 'RFP(pdf)를 업로드하여 제안서에 들어갈 내용을 생성', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, 'SOW 파일 검색', '기존 SOW 파일 검색 (파일명, 키워드, 업로드를 통한 검색)', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '문서파일 검색', E'기타 문서 파일 검색, 문서명/내용에 대한 의미 검색\n예) "한글 문서를 파악하기 위한 제품소개서 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '하드웨어 사양 예측', '프로젝트 규모별 하드웨어 사용 예측 추천', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '유사 사례 검색 (곬적서)', E'요청하는 내용을 바탕으로 가장 매치되는 유사 문서를 검색\n예) "신한은행 음성봇 프로젝트를 하는데 가장 유사한 케이스의 곬적서를 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '유사 사례 검색 (내부지식)', E'요청하는 내용을 바탕으로 가장 매치되는 유사 문서를 검색\n예) "신한은행 음성봇 프로젝트를 하는데 가장 유사한 케이스의 곬적서를 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '파일 검색 (RFP, 곬적서, 제안서 등)', E'기존 문서 파일 검색 (파일명, 키워드, 업로드를 통한 검색)\n예) "하나은행 곬적서 가장 최신꺼 찾아줘"', 'todo', 'medium', 'SL', v_admin_id),
  (v_project_id, '매뉴얼 내용 검색', '매뉴얼만 특정하여 내용 검색', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '포럼 내용 검색', '포럼 Q&A만 특정하여 내용 검색', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '해결방안 추천', '사용자의 질문에 대한 해결 방안 제시', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '코드 조각 생성', '매뉴얼 내용 기반으로 코드 조각 생성 (예: cg-action, javascript)', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '다이얼로그 생성 (json)', E'사용자 요구사항에 알맞는 다이얼로그 생성\n예) 슬라이드 업로드 → 슬라이드에 맞는 다이얼로그 생성', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '매뉴얼 내용 검색 (고객응대)', '매뉴얼만 특정하여 내용 검색 (고객응대 용)', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '해결방안 추천 (메뉴얼 기반)', '사용자의 질문에 대한 해결 방안 제시 (고객응대 용)', 'todo', 'medium', 'CS', v_admin_id),
  (v_project_id, '코드 조각 생성 (고객응대)', '매뉴얼 내용 기반으로 코드 조각 생성 (예: cg-action, javascript)', 'todo', 'medium', 'CS', v_admin_id);

  RAISE NOTICE '005_seed: inserted CM=4, SL=19, CS=8 (total 31 issues)';
END $$;
