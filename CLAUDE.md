@AGENTS.md

# Kong — 프로젝트 진행 현황

## 프로젝트 개요
사내 팀 전용 경량 이슈 트래커 (Jira 단순화 버전).  
`@mindwareworks.com` 이메일만 가입/로그인 가능.

## 기술 스택
- **Next.js 16.2.6** (App Router, JavaScript, Turbopack)
- **Supabase** (PostgreSQL + Auth) — URL: `https://vkezarhccbxrmawkjvha.supabase.co`
- **Tailwind CSS**
- **Vercel** (배포 완료, 서울 리전)
- `@supabase/ssr` 패키지 사용 (구버전 `auth-helpers` 아님)

## Next.js 16 주의사항
- `middleware.js` → **`proxy.js`** 로 변경됨 (함수명도 `middleware` → `proxy`)
- `config.matcher` export는 그대로 유지
- 반드시 `node_modules/next/dist/docs/` 먼저 확인 후 코드 작성

## 브랜치
`claude/setup-project-management-UdsGI`

## 권한 체계 (3단계)
| 레벨 | 조건 | 가능한 작업 |
|------|------|-------------|
| 글로벌 관리자 | `profiles.is_admin = true` | 전체 관리자 기능, 휴지통, 멤버 관리 페이지 |
| 프로젝트 관리자 | `project_members.role = 'admin'` | 해당 프로젝트 멤버/카테고리/설정 관리 |
| 멤버 | `project_members.role = 'member'` | 이슈 CRUD, 댓글 |

- `canManage = isAdmin || isProjectAdmin` — 프로젝트 수준 관리 권한 판단에 사용
- 프로젝트 생성자는 자동으로 해당 프로젝트의 관리자(`role='admin'`)로 등록됨

## DB 스키마 요약
```sql
profiles        (id UUID PK → auth.users, name TEXT, email TEXT, is_admin BOOLEAN, created_at)

projects        (id UUID PK, name, description, prefix TEXT,
                 created_by → profiles, is_private BOOLEAN DEFAULT false,
                 created_at, deleted_at)

project_members (project_id → projects, user_id → profiles,
                 role CHECK('member'|'admin'), created_at)
                 PK: (project_id, user_id)

project_categories (id UUID PK, project_id → projects,
                    value TEXT, label TEXT, sort_order INT,
                    created_at, UNIQUE(project_id, value))

issues          (id UUID PK, project_id → projects,
                 number INT, -- 프로젝트 내 자동 채번
                 title, description,
                 status CHECK(todo|in_progress|review|done),
                 priority CHECK(low|medium|high),
                 category TEXT, -- project_categories.value 참조
                 assignee_id → profiles, created_by → profiles,
                 completed_at DATE,
                 created_at, updated_at, deleted_at)

issue_comments  (id UUID PK, issue_id → issues,
                 author_id → profiles, body TEXT,
                 created_at, deleted_at)

issue_activities (id UUID PK, issue_id → issues,
                  user_id → profiles, action TEXT, detail JSONB, created_at)

notifications   (id UUID PK, recipient_id → profiles,
                 issue_id → issues, type TEXT, message TEXT,
                 read_at TIMESTAMPTZ, created_at)
```

## 마이그레이션 현황
| 파일 | 내용 |
|------|------|
| `supabase/schema.sql` | 초기 스키마 (profiles, projects, issues, RLS) |
| `supabase/migrations/001~012` | 채번, 휴지통, 댓글, 활동로그, 알림, 이미지, 계정관리 등 |
| `supabase/migrations/013_project_members.sql` | project_members 테이블 + RLS |
| `supabase/migrations/014_project_role.sql` | project_members.role 추가, 프로젝트 관리자 권한 정책 |
| `supabase/migrations/015_project_categories.sql` | project_categories 테이블 + RLS |
| `supabase/migrations/016_private_projects.sql` | projects.is_private + 비공개 RLS 정책 |
| `supabase/migrations/017_fix_notifications.sql` | Realtime 구독 + 알림 트리거 수정 (actor NULL 처리) |
| `supabase/migrations/018_notifications_delete_policy.sql` | 알림 개인삭제 + 클라이언트 INSERT 정책 |

> 모든 마이그레이션은 Supabase 대시보드 SQL Editor에서 수동 실행됨

## 구현된 페이지
| 파일 | 설명 |
|------|------|
| `app/login/page.jsx` | 이메일+비밀번호 로그인 |
| `app/signup/page.jsx` | 이름+이메일+비밀번호 가입, 도메인 검증 |
| `app/projects/page.jsx` | 프로젝트 목록, 비공개 배지 표시 |
| `app/projects/[id]/page.jsx` | 프로젝트 상세 + 이슈 목록 |
| `app/projects/[id]/issues/new/page.jsx` | 이슈 생성 |
| `app/projects/[id]/issues/[issueId]/page.jsx` | 이슈 상세 |
| `app/account/page.jsx` | 계정 설정 (이름 변경, 비밀번호 변경, 탈퇴) |
| `app/admin/trash/page.jsx` | 휴지통 (글로벌 관리자 전용) |
| `app/admin/members/page.jsx` | 멤버 관리 (글로벌 관리자 전용) |
| `app/projects/[id]/assign/page.jsx` | 업무 분배 (드래그앤드롭) |
| `app/issues/[id]/page.jsx` | 이슈 ID → 프로젝트 상세 페이지 리다이렉트 |

## 구현된 컴포넌트
| 파일 | 설명 |
|------|------|
| `components/Navbar.jsx` | 상단 네비게이션, 알림, 로그아웃 |
| `components/StatusBadge.jsx` | 상태/우선순위 뱃지 |
| `components/NewProjectButton.jsx` | 프로젝트 생성 모달, is_private 설정 |
| `components/ProjectActions.jsx` | 멤버 관리 / 카테고리 관리 / 프로젝트 수정 / 삭제 |
| `components/ProjectViewClient.jsx` | 목록/칸반 뷰 전환 |
| `components/IssueList.jsx` | 이슈 목록, 필터, 정렬, bulk 액션, 키보드 단축키, 인라인 댓글 |
| `components/KanbanBoard.jsx` | 칸반 보드 (드래그앤드롭) |
| `components/NewIssueForm.jsx` | 이슈 생성 폼 (카테고리 동적 로드) |
| `components/IssueDetailClient.jsx` | 이슈 상세, 댓글, 활동 로그, 이미지 첨부 |
| `components/ProjectStats.jsx` | 통계 대시보드 |
| `components/MembersClient.jsx` | 멤버 관리 UI (글로벌 관리자 영역 분리) |
| `components/NotificationBell.jsx` | 인앱 알림 벨 |
| `components/WeeklyReport.jsx` | 주간 리포트 |
| `components/AssignBoard.jsx` | 업무 분배 보드 (드래그앤드롭, CSS Grid 3×3 아레나) |

## 이슈 상태 / 우선순위
- 상태: `todo`(할 일) | `in_progress`(진행 중) | `review`(검토 대기) | `done`(완료)
- 우선순위: `low`(낮음) | `medium`(보통) | `high`(높음)
- 카테고리: 프로젝트별 `project_categories` 테이블에서 관리 (하드코딩 없음)

## 환경 변수 (.env.local — 이미 설정됨)
```
NEXT_PUBLIC_SUPABASE_URL=https://vkezarhccbxrmawkjvha.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4mQDsXGvcksjlHhy7oHx2A_xjddZeFI
```
> Supabase는 anon key를 "publishable key"로 명칭 변경했으나 env var명은 그대로 유지

## 향후 과제
- [ ] 이슈 취소(cancelled) 상태 추가 — DB CHECK 제약 수정 + UI 전체 반영 필요
- [ ] 다크모드 — 전체 컴포넌트 수정 필요

## 코딩 주의사항 (시행착오)
- `input`/`textarea` 생성 시 `text-[#171717]` 반드시 명시 — Tailwind v4는 `body` color를 폼 요소에 상속하지 않음
- 컴포넌트 정의는 반드시 모듈 레벨 — 함수 내부에 정의하면 매 렌더마다 remount되어 포커스 소실 등 부작용 발생
- URL params 변경 시 `new URLSearchParams(searchParams.toString())` 후 `.set()` — 통째로 교체하면 기존 파라미터 날아감

## 로컬 실행
```bash
npm run dev -- -p 3001
# → http://localhost:3001/login
```
