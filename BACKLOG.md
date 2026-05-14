# Kong — 개발 백로그

## 우선순위 1 (다음)
- [ ] **이슈 번호 시스템** — `REQ-SLS-001` 형식
  - `issues` 테이블에 `number`(INT), `prefix`(TEXT), `category`(TEXT) 컬럼 추가
  - 프로젝트+prefix별 자동 채번 (DB 트리거 또는 함수)
  - 이슈 목록 테이블에 번호 컬럼 추가
- [ ] **카테고리(prefix) 필터** — prefix 탭으로 이슈 분류 보기
  - 이슈 목록 상단 탭 UI (전체 / REQ / SLS / ...)
  - URL 쿼리 파라미터로 상태 유지

## 우선순위 2
- [ ] **이슈 상세 페이지** — `/projects/[id]/issues/[issueId]`
  - 이슈 전체 내용 조회 및 수정
  - 댓글 목록 표시

## 우선순위 3
- [ ] **댓글 기능**
  - `comments` 테이블 추가 (issue_id, author_id, content, created_at)
  - 이슈 상세 페이지에서 댓글 CRUD

## 우선순위 4
- [ ] **칸반 보드 뷰** — 드래그앤드롭으로 상태 변경
  - 상태별 컬럼 (`todo` / `in_progress` / `review` / `done`)
  - `@dnd-kit/core` 라이브러리 사용

## 완료
- [x] 다크 슬레이트 블루 테마
- [x] 이슈 목록 엑셀 스타일 테이블 (선 구분)
- [x] Vercel 배포
- [x] Supabase 인증 (이메일/비밀번호, @mindwareworks.com 도메인 제한)
- [x] 프로젝트 CRUD
- [x] 이슈 CRUD + 인라인 상태 변경
