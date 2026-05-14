# Kong

사내 팀용 경량 이슈 트래커. Jira를 단순화한 버전으로, 프로젝트별 이슈 생성·관리·상태 추적에 집중합니다.

## 스택

- **Next.js 15** (App Router)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **Vercel** (배포)

## 로컬 개발 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase 프로젝트 URL과 anon key를 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인합니다.

## 배포

Vercel에 레포를 연결하고 환경 변수를 설정하면 `main` 브랜치 push 시 자동 배포됩니다.

## DB 스키마

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql`을 실행합니다.

## 주요 기능

- 이메일 / 소셜 로그인 (Supabase Auth)
- 프로젝트 생성 및 목록 관리
- 이슈 CRUD (제목, 설명, 상태, 우선순위, 담당자)
- 이슈 상태 변경: `할 일` → `진행 중` → `완료`
