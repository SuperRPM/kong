# Kong

사내 팀 전용 경량 이슈 트래커. Next.js + Supabase로 구축된 간단한 프로젝트 관리 도구입니다.

## 스택

- **Next.js 15** (App Router, JavaScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **Vercel** (배포)

## 주요 기능

- `@mindwareworks.com` 이메일만 가입/로그인 가능
- 가입 시 이름 입력 → 담당자 지정에 사용
- 프로젝트 생성 및 목록 관리
- 이슈 CRUD (제목, 설명, 상태, 우선순위, 담당자)
- 이슈 상태: 할 일 → 진행 중 → 검토 대기 → 완료

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Supabase DB 초기화

Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 전체 실행

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속

## Vercel 배포

1. Vercel에 레포 연결
2. 환경 변수 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 추가
3. `main` 브랜치 push → 자동 배포
