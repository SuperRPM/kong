# Kong — 시행착오 메모

작업 중 발생한 버그/실수에서 추출한 재발 방지 규칙. 새 규칙은 항상 "원인 → 규칙" 순서로 기록.

## React / Next.js

- **컴포넌트 정의는 반드시 모듈 레벨**
  함수 컴포넌트 내부에 다른 함수 컴포넌트를 정의하면 부모 렌더마다 새 함수 참조가 생겨 React가 unmount → remount를 반복함. textarea 한 글자 입력에 포커스 소실 등 발생.

- **`hidden md:block` / `md:hidden`은 React 렌더 여부와 무관**
  CSS로만 숨김 처리. 두 레이아웃 모두 Virtual DOM에 렌더링되므로 같은 컴포넌트를 양쪽에서 호출 시 props를 양쪽 모두 전달해야 함. (모바일에서만 발견되는 버그가 PC에서도 터지는 이유)

- **URL params 변경 시 기존 값 보존**
  `router.replace(`?key=값`)`처럼 통째로 교체하지 말 것. 다른 파라미터가 날아감. 항상 `new URLSearchParams(searchParams.toString())` 후 `.set(...)`.

## Tailwind v4

- **`input` / `textarea`는 `text-[#171717]` 반드시 명시**
  Tailwind v4 Preflight는 폼 요소에 `body` color 상속을 보장하지 않음. `placeholder:text-[#cccccc]`만 쓰고 본문 색을 빠뜨리면 회색으로 렌더됨. 공통 클래스 상수(`inputCls`)로 정의해두면 예방됨.

## Supabase

- **`SECURITY DEFINER` 함수 + `auth.uid()` = NULL 가능**
  트리거 안에서 `auth.uid()`를 읽으면 NULL이 될 수 있음. `NEW.assignee_id != actor` 같은 비교가 NULL 전파로 false가 되어 알림이 안 갈 수 있음. `(actor IS NULL OR NEW.assignee_id != actor)`로 NULL 분기 추가.

## 운영

- **버전 파일(`lib/version.js`) 업데이트는 PHASE.md 버전 히스토리 작성과 함께**
  PHASE.md 버전 기록만 하고 `lib/version.js`를 깜빡하면 앱 표시 버전이 고정됨.
