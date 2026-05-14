# Kong — 개발 백로그

## 진행 중
- [ ] **이슈 번호 시스템** — `REQ-SL-001` 형식
- [ ] **카테고리(prefix) 필터 탭**

## 우선순위 1 — 이슈 번호 시스템

### ID 구조
```
REQ  -  SL  -  001
 ↑       ↑       ↑
 prefix  category  자동채번
(프로젝트) (이슈생성시) (category내 순차)
```

### DB 변경
- `projects` 테이블: `prefix TEXT DEFAULT 'REQ'` 추가
- `issues` 테이블: `category TEXT`, `number INT`, `planned_at DATE`, `completed_at DATE` 추가
- 자동채번 트리거: (project_id + category) 기준으로 최대번호 + 1

### 카테고리 예시
- `SL` — 세일즈팀
- `CS` — CS팀
- `CM` — 공통
- 자유롭게 추가 가능 (직접 입력)

### UI 변경
- 프로젝트 생성 모달: prefix 입력 필드 추가 (default: REQ)
- 이슈 생성 모달: category 입력 필드 추가 (SL/CS/CM 안내)
- 이슈 목록 테이블: 번호 컨럼 추가, 카테고리 필터 탭
- 저장 시 자동으로 번호 발급

## 우선순위 2
- [ ] **이슈 상세 페이지** — `/projects/[id]/issues/[issueId]`

## 우선순위 3
- [ ] **댓글 기능**

## 우선순위 4
- [ ] **칸반 보드 뷰**

## 완료
- [x] Expo 디자인 시스템 적용 (라이트 테마, Inter 폰트, 블랙 CTA)
- [x] 이슈 목록 엑셀 스타일 테이블
- [x] Vercel 배포
- [x] Supabase 인증
- [x] 프로젝트 CRUD
- [x] 이슈 CRUD + 인라인 상태 변경
