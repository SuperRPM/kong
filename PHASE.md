# Kong — Phase 관리

## Phase 1 — 기반 구축 ✅
- [x] Next.js 16 + Supabase + Tailwind 초기화
- [x] 인증 (로그인/회원가입, @mindwareworks.com 도메인 전용)
- [x] 프로젝트 CRUD
- [x] 이슈 CRUD (상태/우선순위/카테고리/담당자/날짜)
- [x] 이슈 번호 자동 채번 (REQ-SL-001 형식)
- [x] 소프트 딜리트 + 휴지통 (30일 보관, 관리자 전용)
- [x] 버전 표시 (Navbar 하단)
- [x] 자동 마이그레이션 (Vercel 빌드 시 실행)

## Phase 2 — 데이터 & 모바일 ✅
- [x] 요구사항정의_v0.1 데이터 시드 입력 (SL 19건, CS 8건, CM 4건)
- [x] 모바일 UI 개선 (테이블 → 카드형 레이아웃)
- [x] 이슈 목록 필터 (카테고리/상태/담당자)

## Phase 3 — 협업 기능 ✅
- [x] 댓글 기능
- [x] 이슈 활동 로그
- [x] 멤버 관리

## Phase 4 — 고급 뷰 ✅
- [x] 칸반 보드
- [x] 통계 대시보드
- [x] 이슈 검색

## Phase 5 — 운영 ✅
- [x] 30일 자동 영구삭제 (pg_cron)
- [x] Vercel 배포 최적화 (보안 헤더, 서울 리전)
- [x] 알림 기능 (담당자 지정/상태 변경 인앱 통지)

## Phase 6 — 콘텐츠 & 외부 연동 🔄 진행 중
- [x] 이미지/스크린샷 첨부 (Supabase Storage, 이슈 상세 페이지)
- [ ] Teams 웹훅 연동 — TODO: 담당자 지정/상태 변경 시 Teams 채널 메시지 발송
  - Incoming Webhook 또는 Power Automate 플로우 사용
  - TEAMS_WEBHOOK_URL 환경변수로 관리
  - API Route: /api/teams-notify
