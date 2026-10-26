# API_SPEC - Todo 앱

> 상태: 초안
> 근거 문서: docs/DATA_MODEL.md, docs/PRD.md, docs/TRD.md
> 화면이 서버에 보내는 요청과 서버가 돌려주는 응답의 모양을 정리한다. API는 v0.2부터 쓴다.

## 1. 엔드포인트 목록

| 메서드 | 주소 | 하는 일 | 관련 기능 | 도입 버전 | 파일 |
|------|------|------|------|------|------|
| GET | /api/todos | 할 일 목록 조회 | F-02, F-05 | v0.2 | app/api/todos/route.ts |
| POST | /api/todos | 할 일 추가 | F-01 | v0.2 | app/api/todos/route.ts |
| PATCH | /api/todos/{id} | 완료 상태 바꾸기 | F-03 | v0.2 | app/api/todos/[id]/route.ts |
| PATCH | /api/todos/{id} | 제목 수정 | F-09 | v0.4 | app/api/todos/[id]/route.ts |
| DELETE | /api/todos/{id} | 할 일 삭제 | F-04 | v0.2 | app/api/todos/[id]/route.ts |

- `{id}` 자리에는 할 일의 id 숫자가 들어간다. 예: `/api/todos/3`
- 파일 이름 `route.ts`는 Next.js가 정한 이름이다. app/ 안의 폴더에 `route.ts`를 두면 그 폴더 경로가 API 주소가 된다.
- v0.2(서버 메모리)와 v0.3 이후(DB)의 요청·응답 모양은 똑같다. 저장 위치만 다르다.
- 요청과 응답의 본문은 모두 JSON이다. 단, DELETE 성공 응답은 본문이 없다.

## 2. 공통 규칙

### 2-1. 할 일 한 개의 모양
응답에 담기는 할 일은 DATA_MODEL.md의 `Todo` 타입과 같다.

```json
{
  "id": 3,
  "title": "우유 사기",
  "completed": false,
  "createdAt": "2026-10-23T09:00:00.000Z"
}
```

### 2-2. 에러 응답 형식
실패한 요청은 모두 아래 모양으로 돌려준다.

```json
{
  "error": {
    "code": "TITLE_REQUIRED",
    "message": "제목을 입력해 주세요."
  }
}
```

| code | 상태 코드 | message | 언제 |
|------|------|------|------|
| TITLE_REQUIRED | 400 | 제목을 입력해 주세요. | 제목이 필요한 요청(POST)에 `title` 필드가 없을 때, 또는 앞뒤 공백을 잘라낸 제목이 빈 문자열일 때 (빈 제목, 공백만 있는 제목) |
| TITLE_TOO_LONG | 400 | 제목은 100자 이하로 입력해 주세요. | 앞뒤 공백을 잘라낸 제목의 `.length`가 100을 넘을 때 |
| INVALID_REQUEST | 400 | 요청에 실패했습니다. 다시 시도해 주세요. | 요청 모양이 틀렸을 때 (아래 각 엔드포인트 참고) |
| NOT_FOUND | 404 | 요청에 실패했습니다. 다시 시도해 주세요. | 해당 id의 할 일이 없을 때 |
| INTERNAL_ERROR | 500 | 요청에 실패했습니다. 다시 시도해 주세요. | 서버 안에서 문제가 생겼을 때 (예: DB 연결이 끊김) |

- `TITLE_REQUIRED`, `TITLE_TOO_LONG`의 message는 src/lib의 Zod 규칙에 적힌 문구를 그대로 쓴다. 그래서 화면 검사 문구와 항상 같다 (PRD F-01, TRD 7장).
- `INVALID_REQUEST`는 화면을 거치지 않고 바로 오는 요청에서만 생긴다. 앱 화면은 항상 올바른 모양으로 보낸다.
- 제목 규칙 위반도 400인 이유: 사용자가 쓴 제목도 요청에 담긴 값이다. 그 값이 규칙에 맞지 않으므로 "요청이 잘못되었다"(400)에 들어간다. 어떤 규칙에 걸렸는지는 `code`로 구분한다.

**`code`와 `message`를 둘 다 보내는 이유**
- `code`는 **프로그램이 읽는 값**이다. 화면 코드는 `code`를 보고 "제목 규칙에 걸렸나, 그 밖의 실패인가"를 판단한다. 영어 이름으로 정해 두었으므로 문구를 바꾸더라도 화면 코드를 고치지 않아도 된다.
- `message`는 **사람이 읽는 값**이다. 그대로 화면에 보여줄 수 있는 문구이다. 화면을 거치지 않고 다른 도구로 API를 부른 사람도 무엇이 잘못됐는지 바로 알 수 있다.
- 화면은 `code`로 판단하고, 제목 규칙 code일 때는 `message`를 그대로 보여준다 (2-3).

### 2-3. 화면이 보여줄 문구
제목 규칙에 걸린 경우에만 제목 문구를 보여주고, 그 밖의 모든 실패에는 요청 실패 문구를 보여준다 (PRD F-06, TRD 7장).

| 상황 | 화면에 보여줄 문구 |
|------|------|
| code가 `TITLE_REQUIRED` 또는 `TITLE_TOO_LONG` | 응답의 message ("제목을 입력해 주세요." / "제목은 100자 이하로 입력해 주세요.") |
| code가 `INVALID_REQUEST` (400) | 요청에 실패했습니다. 다시 시도해 주세요. |
| code가 `NOT_FOUND` (404) | 요청에 실패했습니다. 다시 시도해 주세요. |
| code가 `INTERNAL_ERROR` (500) | 요청에 실패했습니다. 다시 시도해 주세요. |
| 네트워크 오류 (응답 자체를 못 받음) | 요청에 실패했습니다. 다시 시도해 주세요. |

- 네트워크 오류일 때는 응답이 없으므로 화면이 직접 문구를 정한다.

### 2-4. 검사 순서
한 요청에 문제가 여러 개 있으면 아래 순서대로 검사해서 **처음 걸린 것 하나만** 돌려준다.

1. 주소의 id가 올바른지 (2-5) → 아니면 `INVALID_REQUEST`
2. 요청 본문의 모양이 맞는지 (본문이 JSON인지, 필드 타입이 맞는지) → 아니면 `INVALID_REQUEST`
3. 제목 규칙 (제목을 다루는 요청만) → `TITLE_REQUIRED` 또는 `TITLE_TOO_LONG`
4. 해당 id의 할 일이 있는지 → 없으면 `NOT_FOUND`
5. 저장하다가 서버에서 문제가 생기면 → `INTERNAL_ERROR`

- POST에서 `title` 필드가 아예 없는 것은 2단계(모양)가 아니라 3단계(제목 규칙)에서 걸린다. 빈 제목과 똑같이 `TITLE_REQUIRED`이다.
- `title`이 있는데 문자열이 아니면(예: `123`) 2단계에서 `INVALID_REQUEST`로 걸린다.
- `"title": null`도 필드는 있는데 값이 문자열이 아닌 것이므로 `INVALID_REQUEST`이다. 필드 자체가 없는 `{}`만 `TITLE_REQUIRED`이다.

### 2-5. 그 밖의 규칙
- **id 규칙:** 주소의 id는 **1 이상 2,147,483,647 이하의 정수**여야 한다. 2,147,483,647은 DATA_MODEL의 `serial` 타입이 담을 수 있는 가장 큰 수이다.
  - 숫자가 아닌 값(`abc`), 범위를 벗어난 값(`0`, `-1`, `2147483648`), 정수가 아닌 값(`1.5`)은 모두 똑같이 `INVALID_REQUEST`(400)이다.
- **정해지지 않은 필드:** 요청 본문에 정해지지 않은 필드가 있으면 무시한다. 예: POST에 `createdAt`이나 `id`를 보내도 쓰지 않는다. 만든 시간은 DB 기본값 `now()`가 넣는다 (DATA_MODEL.md 5장).

## 3. 엔드포인트별 명세

### 3-1. GET /api/todos — 할 일 목록 조회 (v0.2)

**요청**
- 본문 없음.

**성공 응답: 200**

```json
{
  "todos": [
    {
      "id": 3,
      "title": "우유 사기",
      "completed": false,
      "createdAt": "2026-10-23T09:00:00.000Z"
    },
    {
      "id": 2,
      "title": "책 반납하기",
      "completed": true,
      "createdAt": "2026-10-22T15:30:00.000Z"
    }
  ]
}
```

- 만든 시간 기준 최신순으로 담는다. 만든 시간이 같으면 id가 큰 것이 앞이다 (PRD F-02).
- 완료한 할 일도 함께 담는다. 필터(F-08, v0.4)는 화면이 이 목록을 걸러서 보여준다.
- 할 일이 없으면 빈 배열을 돌려준다. 이때 화면은 "할 일이 없습니다"를 보여준다 (PRD F-05).

```json
{
  "todos": []
}
```

**에러**

| 상황 | 상태 코드 | code |
|------|------|------|
| 서버 안에서 문제가 생김 | 500 | INTERNAL_ERROR |

### 3-2. POST /api/todos — 할 일 추가 (v0.2)

**요청**

```json
{
  "title": "  우유 사기  "
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | 예 | 할 일 제목. 서버가 앞뒤 공백을 잘라낸 뒤 검사하고 저장한다. 없으면 빈 제목과 똑같이 `TITLE_REQUIRED`이다. |

**성공 응답: 201**

```json
{
  "todo": {
    "id": 4,
    "title": "우유 사기",
    "completed": false,
    "createdAt": "2026-10-23T09:05:00.000Z"
  }
}
```

- `title`은 앞뒤 공백을 잘라낸 값이다.
- `completed`는 항상 `false`로 시작한다.
- 같은 제목이 이미 있어도 추가한다 (PRD F-01).

**에러**

| 상황 | 상태 코드 | code | 요청 예시 |
|------|------|------|------|
| `title` 필드가 없음 | 400 | TITLE_REQUIRED | `{}` |
| 제목이 빈 문자열 | 400 | TITLE_REQUIRED | `{ "title": "" }` |
| 제목이 공백만 있음 | 400 | TITLE_REQUIRED | `{ "title": "   " }` |
| 공백을 잘라낸 제목이 100자 초과 | 400 | TITLE_TOO_LONG | `{ "title": "가가가…(101자)" }` |
| 본문이 JSON이 아님 | 400 | INVALID_REQUEST | `우유 사기` |
| `title`이 문자열이 아님 | 400 | INVALID_REQUEST | `{ "title": 123 }`, `{ "title": null }` |
| 서버 안에서 문제가 생김 | 500 | INTERNAL_ERROR | — |

에러 응답 예시 (100자 초과):

```json
{
  "error": {
    "code": "TITLE_TOO_LONG",
    "message": "제목은 100자 이하로 입력해 주세요."
  }
}
```

### 3-3. PATCH /api/todos/{id} — 완료 상태 바꾸기 (v0.2)

**요청** (`/api/todos/3`)

```json
{
  "completed": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| completed | boolean | 예 (v0.2~v0.3) | 바꾼 뒤의 완료 상태. true면 완료, false면 미완료이다. |

- 화면은 체크박스를 누르면 지금 상태의 반대 값을 보낸다. 서버는 "반대로 바꿔라"가 아니라 "이 값으로 바꿔라"로 받는다.
- 그래서 같은 요청을 두 번 보내도 결과가 같다. 예를 들어 체크박스를 실수로 빠르게 두 번 눌러 `{ "completed": true }`가 두 번 가도 결과는 "완료" 하나이다. "반대로 바꿔라"였다면 완료 → 미완료로 되돌아가 버린다.
- `createdAt`은 바뀌지 않으므로 목록에서의 자리가 그대로이다 (PRD F-03).

**성공 응답: 200**

```json
{
  "todo": {
    "id": 3,
    "title": "우유 사기",
    "completed": true,
    "createdAt": "2026-10-23T09:00:00.000Z"
  }
}
```

**에러**

| 상황 | 상태 코드 | code | 요청 예시 |
|------|------|------|------|
| id가 숫자가 아님 | 400 | INVALID_REQUEST | `/api/todos/abc` |
| id가 범위를 벗어남 | 400 | INVALID_REQUEST | `/api/todos/0`, `/api/todos/2147483648` |
| 본문이 JSON이 아님 | 400 | INVALID_REQUEST | `완료` |
| `completed` 필드가 없음 | 400 | INVALID_REQUEST | `{}` |
| `completed`가 boolean이 아님 | 400 | INVALID_REQUEST | `{ "completed": "yes" }` |
| 해당 id의 할 일이 없음 (이미 삭제됨 등) | 404 | NOT_FOUND | `/api/todos/999` |
| 서버 안에서 문제가 생김 | 500 | INTERNAL_ERROR | — |

### 3-4. PATCH /api/todos/{id} — 제목 수정 (v0.4)

v0.4부터 3-3과 같은 주소에 `title`도 보낼 수 있다.

- 제목 수정(F-09)은 v0.4에 도입하는 기능이다 (PRD 3장). 그래서 v0.2~v0.3의 PATCH는 `completed`만 받는다. 그 버전에서 `title`을 보내면 읽지 않고 넘어가며, 제목은 바뀌지 않는다.

**요청** (`/api/todos/3`)

```json
{
  "title": "  두유 사기  "
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | 아니요 | 새 제목. 추가(3-2)와 똑같은 규칙으로 검사한다 (PRD F-09). |
| completed | boolean | 아니요 | 3-3과 같다. |

- v0.4부터는 `title`과 `completed` 중 **하나 이상**이 있어야 한다. 둘 다 있으면 둘 다 바꾼다.
- PATCH에서는 `title`이 없어도 된다(제목을 안 바꾸는 요청). 그래서 "`title` 필드가 없으면 `TITLE_REQUIRED`" 규칙은 POST에만 쓴다. `title`이 **있을 때만** 제목 규칙으로 검사한다.
- `createdAt`은 바뀌지 않으므로 수정해도 자리가 그대로이다.

**성공 응답: 200**

```json
{
  "todo": {
    "id": 3,
    "title": "두유 사기",
    "completed": false,
    "createdAt": "2026-10-23T09:00:00.000Z"
  }
}
```

**에러**

| 상황 | 상태 코드 | code | 요청 예시 |
|------|------|------|------|
| 제목이 빈 문자열이거나 공백만 있음 | 400 | TITLE_REQUIRED | `{ "title": "   " }` |
| 공백을 잘라낸 제목이 100자 초과 | 400 | TITLE_TOO_LONG | `{ "title": "가가가…(101자)" }` |
| id가 숫자가 아님 | 400 | INVALID_REQUEST | `/api/todos/abc` |
| id가 범위를 벗어남 | 400 | INVALID_REQUEST | `/api/todos/0`, `/api/todos/2147483648` |
| 본문이 JSON이 아님 | 400 | INVALID_REQUEST | `두유 사기` |
| `title`과 `completed`가 둘 다 없음 | 400 | INVALID_REQUEST | `{}` |
| `title`이 문자열이 아님 | 400 | INVALID_REQUEST | `{ "title": 123 }`, `{ "title": null }` |
| `completed`가 boolean이 아님 | 400 | INVALID_REQUEST | `{ "completed": "yes" }` |
| 해당 id의 할 일이 없음 | 404 | NOT_FOUND | `/api/todos/999` |
| 서버 안에서 문제가 생김 | 500 | INTERNAL_ERROR | — |

### 3-5. DELETE /api/todos/{id} — 할 일 삭제 (v0.2)

**요청** (`/api/todos/3`)
- 본문 없음.

**성공 응답: 204**
- 본문 없음. 화면은 204를 받으면 그 할 일을 목록에서 뺀다.

**에러**

| 상황 | 상태 코드 | code | 요청 예시 |
|------|------|------|------|
| id가 숫자가 아님 | 400 | INVALID_REQUEST | `/api/todos/abc` |
| id가 범위를 벗어남 | 400 | INVALID_REQUEST | `/api/todos/0`, `/api/todos/2147483648` |
| 해당 id의 할 일이 없음 (이미 삭제됨 등) | 404 | NOT_FOUND | `/api/todos/999` |
| 서버 안에서 문제가 생김 | 500 | INTERNAL_ERROR | — |

## 4. TypeScript 타입 예시 (src/types/api.ts)

```ts
import type { Todo } from "@/types/todo";

// 에러 code 목록
export type ApiErrorCode =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

// 실패 응답의 모양
export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

// GET /api/todos 성공 응답
export type GetTodosResponse = {
  todos: Todo[];
};

// POST, PATCH 성공 응답
export type TodoResponse = {
  todo: Todo;
};

// POST /api/todos 요청
export type CreateTodoRequest = {
  title: string;
};

// PATCH /api/todos/{id} 요청 (title은 v0.4부터)
export type UpdateTodoRequest = {
  completed?: boolean;
  title?: string;
};
```

- `?`가 붙은 필드는 없어도 되는 필드이다.
- `@/` 경로는 STEP 9 프로젝트 초기 설정 때 설정한다. 그 전까지 `@/types/todo`는 예시로만 본다 (DATA_MODEL.md 5장).

## 5. 결정 사항
- **주소 모양:** 목록은 `/api/todos`, 할 일 하나는 `/api/todos/{id}`로 가리킨다.
- **응답 감싸기:** 성공 응답은 `{ "todos": [...] }`, `{ "todo": {...} }`처럼 이름을 붙여 감싼다. 에러 응답 `{ "error": {...} }`과 모양을 맞추기 위해서다.
- **에러 형식:** 모든 에러는 `{ "error": { "code": "...", "message": "..." } }`로 통일한다. `code`는 프로그램이 판단할 때, `message`는 사람이 읽을 때 쓴다.
- **에러 code:** `TITLE_REQUIRED`, `TITLE_TOO_LONG`, `INVALID_REQUEST`, `NOT_FOUND`, `INTERNAL_ERROR` 다섯 개만 쓴다.
- **화면 문구 고르기:** 제목 규칙 code(`TITLE_REQUIRED`, `TITLE_TOO_LONG`)일 때만 제목 문구를 보여준다. 그 밖의 모든 에러(400 `INVALID_REQUEST`, 404, 500, 네트워크 오류)에는 "요청에 실패했습니다. 다시 시도해 주세요."를 보여준다 (PRD F-06, TRD 7장).
- **title 필드가 없을 때 (POST):** 빈 제목과 똑같이 제목 규칙 위반으로 보고 `TITLE_REQUIRED`("제목을 입력해 주세요.")를 돌려준다.
- **title이 문자열이 아닐 때:** `INVALID_REQUEST`로 돌려준다. `"title": null`도 여기에 들어간다 (필드는 있고 값이 문자열이 아님).
- **id 규칙:** 1 이상 2,147,483,647 이하의 정수만 받는다. 범위를 벗어나면 숫자가 아닌 id와 똑같이 `INVALID_REQUEST`(400)이다.
- **완료 전환 방식:** "반대로 바꿔라"가 아니라 바꾼 뒤의 값(`completed: true/false`)을 보낸다. 같은 요청을 두 번 보내도 결과가 같다.
- **수정 주소:** 완료 전환과 제목 수정은 같은 PATCH 주소를 쓴다. 제목 수정은 F-09가 도입되는 v0.4부터 받는다.
- **필터:** 서버는 항상 전체 목록을 돌려주고, 필터(F-08)는 화면이 건다. 그래서 GET에 필터 조건을 붙이지 않는다.
- **삭제 성공 응답:** 본문 없이 204를 돌려준다.
- **없는 할 일:** 이미 삭제된 할 일을 바꾸거나 지우려 하면 404 `NOT_FOUND`를 돌려준다. 로그인 없이 공개 배포되므로 다른 사람이 먼저 지웠을 수 있다.
- **검사 순서:** 2-4의 순서대로 검사하고 처음 걸린 에러 하나만 돌려준다.
- **타입 파일:** API 요청·응답 타입은 src/types/api.ts에 둔다.

## 6. 용어 설명
- **엔드포인트:** 서버가 요청을 받는 주소 하나와 메서드의 묶음이다. 예: `GET /api/todos`
- **메서드:** 요청의 종류이다. GET은 읽기, POST는 새로 만들기, PATCH는 일부 바꾸기, DELETE는 지우기이다.
- **JSON:** 서버와 화면이 데이터를 주고받을 때 쓰는 글자 형식이다. `{ "이름": 값 }` 모양으로 쓴다.
- **본문:** 요청이나 응답에 담아 보내는 데이터이다. 이 문서에서는 JSON 모양이다.
- **필드:** JSON 안의 이름과 값 한 쌍이다. 예: `"title": "우유 사기"`
- **string:** 글자(문자열) 타입이다. JSON에서는 `"우유 사기"`처럼 따옴표로 감싼다.
- **boolean:** `true`(참) 또는 `false`(거짓) 둘 중 하나만 갖는 타입이다. 따옴표 없이 쓴다. `"true"`처럼 따옴표가 있으면 문자열이다.
- **배열:** 여러 값을 순서대로 담은 목록이다. JSON에서는 `[ ]`로 감싼다. 빈 배열은 `[]`이다.
- **감싸기 (응답 감싸기):** 값을 바로 보내지 않고 이름을 붙인 상자에 한 번 더 넣어 보내는 것이다. 예: 할 일 `{...}`을 그대로 보내지 않고 `{ "todo": {...} }`로 보낸다. 받는 쪽이 어떤 값인지 이름으로 알 수 있다.
- **상태 코드:** 서버가 요청 결과를 숫자로 알려주는 것이다.
  - **200:** 성공했다.
  - **201:** 성공했고, 새로 만들었다.
  - **204:** 성공했고, 돌려줄 본문은 없다.
  - **400:** 요청이 잘못되었다. 요청에 담긴 값이 규칙에 맞지 않는 경우(예: 제목이 100자 초과)도 여기에 들어간다.
  - **404:** 찾는 대상이 없다.
  - **500:** 서버 안에서 문제가 생겼다.
- **code:** 에러의 종류를 나타내는 영어 이름이다. 프로그램(화면 코드)이 읽고 판단하는 값이다.
- **message:** 사람이 읽을 수 있는 에러 문구이다.
- **같은 요청을 두 번 보내도 결과가 같다:** 실수로 두 번 누르거나, 응답을 못 받아 다시 보냈을 때도 결과가 꼬이지 않는다는 뜻이다.
- **route.ts:** Next.js에서 API 라우트를 만드는 파일 이름이다. 이 이름으로 정해져 있어서 다른 이름을 쓰면 API로 동작하지 않는다.
- **`{id}` (주소 안의 자리):** 실제 값으로 바꿔 쓰는 자리 표시이다. 파일 이름에서는 `[id]`로 쓴다 (Next.js 규칙).
- **export type:** 타입을 만들고 다른 파일에서 가져다 쓸 수 있게 내보내는 문법이다.
- **import type:** 다른 파일에서 타입만 가져오는 문법이다. 실행되는 코드는 가져오지 않는다.
- **`@/` 경로:** 프로젝트의 기준 폴더를 줄여 쓰는 표시이다. `../../types/todo`처럼 긴 경로를 쓰지 않아도 된다. STEP 9에서 설정한다.
- **`Todo[]`:** `Todo`가 여러 개 담긴 배열이라는 뜻이다.
- **`?` (TypeScript 필드 뒤):** 그 필드가 없어도 된다는 표시이다.
- **`|` (TypeScript 타입 사이):** "이것 또는 저것"이라는 뜻이다. `ApiErrorCode`는 다섯 이름 중 하나만 될 수 있다.
