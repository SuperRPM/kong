@AGENTS.md

# Kong — 프로젝트 진행 현황

## 프로젝트 개요
사내 팀 전용 경량 이슈 트래커 (Jira 단순화 버전).  
`@mindwareworks.com` 이메일만 가입/로그인 가능.

## 기술 스택
- **Next.js 16.2.6** (App Router, JavaScript, Turbopack)
- **Supabase** (PostgreSQL + Auth) — URL: `https://vkezarhccbxrmawkjvha.supabase.co`
- **Tailwind CSS**
- **Vercel** (배포 예정)
- `@supabase/ssr` 패키지 사용 (구버전 `auth-helpers` 아님)

## Next.js 16 주의사항
- `middleware.js` → **`proxy.js`** 로 변경됨 (함수명도 `middleware` → `proxy`)
- `config.matcher` export는 그대로 유지
- 반드시 `node_modules/next/dist/docs/` 먼저 확인 후 코드 작성

## 브랜치
`claude/setup-project-management-UdsGI`

## 완료된 작업

### 1. 프로젝트 초기화
- Next.js 16 + Tailwind + ESLint 설치 완료
- `@supabase/supabase-js`, `@supabase/ssr` 설치 완료
- `.env.local` 생성 완료 (Supabase URL + publishable key 설정됨)
- `.env.example` 작성 완료

### 2. Supabase 스키마
- `supabase/schema.sql` 작성 완료 — **Supabase 대시보드 SQL Editor에서 이미 실행 완료**
- 테이블: `profiles`, `projects`, `issues`
- RLS 정책 포함
- `issues.updated_at` 자동 갱신 트리거 포함

### 3. 인증 구조
- `lib/supabase/client.js` — 브라우저용 Supabase 클라이언트
- `lib/supabase/server.js` — 서버 컴포넌트용 Supabase 클라이언트
- `proxy.js` — 미인증 사용자 `/login` 리다이렉트, 인증된 사용자 `/login·/signup` 접근 시 `/projects` 리다이렉트

### 4. 구현된 페이지 및 컴포넌트
| 파일 | 설명 |
|------|------|
| `app/login/page.jsx` | 이메일+비밀번호 로그인, `@mindwareworks.com` 도메인 검증 |
| `app/signup/page.jsx` | 이름+이메일+비밀번호 가입, 도메인 검증, `profiles` 테이블 insert |
| `app/projects/page.jsx` | 프로젝트 목록 (서버 컴포넌트) |
| `app/projects/[id]/page.jsx` | 프로젝트 상세 + 이슈 목록 (서버 컴포넌트) |
| `components/Navbar.jsx` | 상단 네비게이션, 로그아웃 버튼 |
| `components/NewProjectButton.jsx` | 프로젝트 생성 모달 (클라이언트 컴포넌트) |
| `components/IssueList.jsx` | 이슈 목록 + CRUD + 인라인 상태 변경 (클라이언트 컴포넌트) |
| `components/StatusBadge.jsx` | 상태/우선순위 뱃지 + `STATUS_OPTIONS`, `PRIORITY_OPTIONS` export |

### 5. 이슈 상태 / 우선순위
- 상태: `todo`(할 일) | `in_progress`(진행 중) | `review`(검토 대기) | `done`(완료)
- 우선순위: `low`(낮음) | `medium`(보통) | `high`(높음)

### 6. 빌드 확인
`npm run build` — 경고·에러 없이 통과 완료

## DB 스키마 요약
```sql
profiles   (id UUID PK → auth.users, name TEXT, email TEXT, created_at)
projects   (id UUID PK, name, description, created_by → profiles, created_at)
issues     (id UUID PK, project_id → projects, title, description,
            status CHECK(todo|in_progress|review|done),
            priority CHECK(low|medium|high),
            assignee_id → profiles, created_by → profiles,
            created_at, updated_at)
```

## 환경 변수 (.env.local — 이미 설정됨)
```
NEXT_PUBLIC_SUPABASE_URL=https://vkezarhccbxrmawkjvha.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4mQDsXGvcksjlHhy7oHx2A_xjddZeFI
```
> Supabase는 anon key를 "publishable key"로 명칭 변경했으나 env var명은 그대로 유지

## 다음 작업 (미완료)
아직 추가 기능 요청 없음. 다음 중 우선순위에 따라 진행:
- [ ] 칸반 보드 뷰 (드래그앤드롭)
- [ ] 이슈 상세 페이지 (별도 라우트)
- [ ] 댓글 기능
- [ ] Vercel 배포 설정

## 로컬 실행
```bash
npm run dev -- -p 3001
# → http://localhost:3001/login
```
