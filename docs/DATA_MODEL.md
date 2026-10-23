# DATA_MODEL - Todo 앱

> 상태: 초안
> 근거 문서: docs/PRD.md, docs/TRD.md
> 할 일 데이터를 어떤 이름과 타입으로 저장할지 정리한다. DB 테이블은 v0.3부터 쓰지만, 필드 이름과 타입은 v0.1부터 똑같이 쓴다.

## 1. 테이블 목록

| 테이블 | 설명 | 도입 버전 |
|------|------|------|
| todos | 할 일 한 개를 한 줄(행)로 저장한다 | v0.3 (DB 저장) |

- 테이블은 `todos` 하나만 둔다.
- 로그인이 없으므로 사용자 테이블은 만들지 않는다 (PRD 5장).
- 마감일, 카테고리는 범위 밖이므로 필드를 만들지 않는다 (PRD 5장).

## 2. todos 테이블

| 필드 (DB) | 필드 (TypeScript) | 타입 (Postgres) | 제약조건 | 설명 |
|------|------|------|------|------|
| id | id | serial (정수) | PRIMARY KEY, 자동 증가 | 할 일 하나를 구분하는 번호. 완료 전환, 삭제, 수정할 때 어떤 할 일인지 가리킨다 (F-03, F-04, F-09). 나중에 만든 할 일일수록 크다. |
| title | title | varchar(100) | NOT NULL, 최대 100자 | 할 일 제목. 앞뒤 공백을 잘라낸 뒤 저장한다. 중복을 허용하므로 UNIQUE를 걸지 않는다 (F-01). DB는 빈 문자열을 막지 않는다 (아래 메모). |
| completed | completed | boolean | NOT NULL, 기본값 false | 완료 여부. true면 완료, false면 진행 중(미완료)이다 (F-03, F-08). |
| created_at | createdAt | timestamptz | NOT NULL, 기본값 now() | 만든 시간. 서버 로직이 넣지 않고 DB 기본값 `now()`가 넣는다. 목록을 최신순으로 정렬할 때 쓴다 (F-02). 만든 뒤에는 바꾸지 않는다. |

### 제약조건과 규칙 메모

**제목 검사를 누가 하는가**

| 막는 대상 | 서버 검증 (Zod) | DB (`varchar(100)`, `NOT NULL`) |
|------|------|------|
| 빈 제목 (`""`) | 막는다 | 막지 않는다 |
| 공백만 있는 제목 (`"   "`) | 막는다 (앞뒤 공백을 잘라내면 빈 제목이 된다) | 막지 않는다 |
| 100자 초과 제목 | 막는다 | 막는다 |
| 제목이 아예 없음 (null) | 막는다 | 막는다 |

- `NOT NULL`은 "값이 아예 없는 것"만 막는다. 빈 문자열 `""`은 값이 있는 것으로 보기 때문에 DB에 저장될 수 있다.
- 그래서 빈 제목과 공백만 있는 제목은 반드시 서버 검증(Zod)이 막아야 한다. DB가 제목 규칙 중 직접 막는 것은 100자 초과뿐이다.

**글자 수 세는 기준**
- 제목 길이는 JavaScript 문자열 길이(`.length`) 기준으로 센다 (PRD F-01, TRD 5장).
- 이 기준은 Postgres `varchar(100)`이 세는 방법보다 엄격하다. 이모지 같은 글자를 `.length`는 2자로 세고 Postgres는 1자로 센다. 반대로 `.length`가 더 적게 세는 글자는 없다.
- 그래서 Zod를 통과한 제목(`.length` 100 이하)은 Postgres에서도 항상 100자 이하이고, DB에서 거부되지 않는다.

**DB가 제목을 거부할 때의 문구 (검토 1-4)**
- 위의 글자 수 기준 덕분에 해결되었다. Zod를 통과한 제목을 DB가 거부하는 일이 없으므로, 제목 규칙에 걸렸는데 "요청에 실패했습니다. 다시 시도해 주세요."가 보이는 경우는 생기지 않는다.

**정렬**
- `created_at` 내림차순(최신순)으로 읽는다. 만든 시간이 같으면 `id`가 큰 것을 위에 둔다 (PRD F-02).
- 정렬에 `completed`를 쓰지 않으므로 완료 상태를 바꿔도 순서가 그대로이다 (F-02, F-03).

**수정과 삭제**
- 수정(F-09, v0.4): `title`만 바꾼다. `created_at`은 바꾸지 않으므로 수정해도 자리가 그대로이다.
- 삭제(F-04): 행을 바로 지운다. "삭제됨" 표시용 필드는 두지 않는다.

## 3. 저장하지 않는 것

| 값 | 저장하지 않는 이유 |
|------|------|
| 필터 선택값 (전체 / 진행 중 / 완료) | 화면에서 목록을 걸러 보는 상태일 뿐이다. `completed` 값으로 거른다 (F-08). |
| 입력창에 쓰는 중인 글자 | 추가 버튼을 누르기 전의 화면 상태이다. |
| 에러 문구 | 화면에서 보여주는 상태이다. |
| 수정한 시간 | PRD에 필요한 기능이 없다. |

## 4. TypeScript 타입 예시

### 4-1. 타입이 `Todo`와 `TodoRow` 두 개인 이유

할 일을 나타내는 타입은 두 개이다. 같은 할 일인데 **있는 곳에 따라 `createdAt`의 모양이 다르기** 때문이다.

| 타입 | 쓰는 곳 | createdAt의 타입 | 도입 버전 |
|------|------|------|------|
| `TodoRow` | 서버 안 (DB에서 막 읽어온 값) | `Date` (JavaScript 날짜 객체) | v0.3 |
| `Todo` | 화면과 서버가 주고받는 값 | `string` (ISO 형식 문자열) | v0.1 |

1. Drizzle은 DB의 `timestamptz` 값을 읽어 올 때 JavaScript의 `Date` 객체로 바꿔 준다. 이것이 `TodoRow`이다.
2. 서버가 화면에 응답을 보낼 때는 JSON을 쓴다. JSON에는 `Date` 객체를 그대로 담을 수 없어서 문자열로 바꿔야 한다.
3. 그래서 서버는 `TodoRow`를 `Todo`로 바꾼 뒤(4-4의 `toTodo`) 화면에 보낸다. 화면은 `Todo`만 알면 된다.
4. `Todo`는 v0.1부터 쓰고, `TodoRow`는 DB가 생기는 v0.3부터 쓴다. 그래서 v0.3에서 DB로 바꿔도 화면 코드는 고치지 않아도 된다.

```
[Postgres]  ── Drizzle이 읽기 ──▶  TodoRow (createdAt: Date)
                                      │ toTodo()로 바꾸기
                                      ▼
                                   Todo (createdAt: string) ── JSON 응답 ──▶ [화면]
```

### 4-2. 화면과 서버가 같이 쓰는 타입 (src/types/todo.ts)

```ts
// 할 일 한 개 (화면과 서버가 같이 쓴다)
export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  // ISO 형식 문자열. 예: "2026-10-23T09:00:00.000Z"
  createdAt: string;
};
```

- v0.1, v0.2에서 `id`와 `createdAt`을 만드는 방법은 5장 결정 사항에 적었다.

### 4-3. DB 테이블 정의 예시 (src/lib/db/schema.ts, v0.3)

```ts
import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

// 할 일 테이블
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(), // 자동으로 1, 2, 3... 번호가 붙는다
  title: varchar("title", { length: 100 }).notNull(), // 최대 100자 (빈 문자열은 막지 않는다)
  completed: boolean("completed").notNull().default(false), // 처음엔 미완료
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), // 만든 시간은 DB가 넣는다
});

// DB에서 읽어온 한 줄의 타입 (createdAt은 JavaScript Date 객체)
export type TodoRow = typeof todos.$inferSelect;
```

### 4-4. DB 한 줄을 공유 타입으로 바꾸기 (src/lib/todo-mapper.ts)

```ts
import type { Todo } from "@/types/todo";
import type { TodoRow } from "./db/schema";

// DB에서 읽어온 createdAt(JavaScript Date 객체)을 ISO 형식 문자열로 바꿔서 화면에 보낼 모양으로 만든다
export function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
  };
}
```

- 요청에 담는 값(예: 추가할 때 보내는 제목)의 모양은 docs/API_SPEC.md에서 정한다.

## 5. 결정 사항
- **테이블 수:** `todos` 하나만 둔다.
- **id 타입:** 자동 증가 정수(serial)를 쓴다. 초보자가 읽기 쉽고, 만든 시간이 같을 때 정렬 기준으로도 쓸 수 있다.
- **정렬:** `created_at` 내림차순으로 읽고, 만든 시간이 같으면 `id`가 큰 것을 위에 둔다. PRD F-02, TRD와 같은 규칙이다.
- **제목 검사 역할 나누기:** 빈 제목과 공백만 있는 제목은 서버 검증(Zod)이 막는다. DB는 `varchar(100)`으로 100자 초과만 막고, 빈 문자열은 막지 않는다.
- **제목 글자 수 세는 기준:** JavaScript 문자열 길이(`.length`)로 센다. 이 기준이 DB보다 엄격하므로 Zod를 통과한 제목은 DB에서 거부되지 않는다.
- **DB가 제목을 거부할 때의 문구:** 위의 글자 수 기준으로 해결되었다. 이런 경우가 생기지 않는다.
- **만든 시간 저장:** DB 기본값 `now()`가 넣는다. 서버 로직은 `createdAt` 값을 넣지 않는다.
- **시간 타입:** 시간대 정보를 함께 저장하는 `timestamptz`를 쓴다. 화면과 주고받을 때는 ISO 형식 문자열로 바꾼다.
- **파일 경로:**

  | 파일 | 내용 |
  |------|------|
  | src/types/todo.ts | 공유 타입 `Todo` |
  | src/lib/db/schema.ts | Drizzle 테이블 정의 `todos`, 타입 `TodoRow` (v0.3) |
  | src/lib/todo-mapper.ts | `TodoRow`를 `Todo`로 바꾸는 `toTodo` 함수 (v0.3) |

- **v0.1·v0.2에서 id와 createdAt 만드는 방법:** DB가 없으므로 직접 만든다.
  - `id`: 1부터 시작해 할 일을 추가할 때마다 1씩 늘린다. v0.1은 브라우저 메모리, v0.2는 서버 메모리에 다음 번호를 기억해 둔다. 새로고침(v0.1)이나 서버 재시작(v0.2)으로 데이터가 사라지면 번호도 1부터 다시 시작한다.
  - `createdAt`: 추가하는 순간의 시간을 `new Date().toISOString()`으로 만들어 넣는다.
- **`@/` 경로:** STEP 9 프로젝트 초기 설정 때 설정한다. 그 전까지 4장의 `@/types/todo`는 예시로만 본다.

## 6. 용어 설명
- **테이블:** DB 안의 표이다. 할 일 하나가 한 줄(행)이고, 제목·완료 여부 같은 항목 하나가 한 칸(열)이다.
- **행:** 테이블의 가로 한 줄이다. 여기서는 할 일 한 개이다.
- **열:** 테이블의 세로 한 칸이다. 여기서는 필드 하나(예: title)이다.
- **필드:** 데이터 한 개가 가진 항목이다. 예: 제목, 완료 여부
- **스키마:** DB에 어떤 테이블과 필드를 둘지 정한 설계도이다. schema.ts는 이 설계도를 코드로 적은 파일이다.
- **제약조건:** DB가 지키도록 거는 규칙이다. 규칙에 맞지 않는 값은 저장을 거부한다.
- **PRIMARY KEY (기본 키):** 각 줄을 서로 구분하는 값이다. 같은 값이 두 번 나올 수 없다.
- **NOT NULL:** 값이 아예 없으면(null) 안 된다는 규칙이다. 빈 문자열 `""`은 값이 있는 것으로 보므로 막지 않는다.
- **빈 문자열:** 글자가 하나도 없는 문자열 `""`이다. "값이 없음(null)"과는 다르다.
- **UNIQUE:** 같은 값이 두 번 나오면 안 된다는 규칙이다. 제목은 중복을 허용하므로 쓰지 않는다.
- **기본값:** 값을 따로 주지 않았을 때 자동으로 들어가는 값이다.
- **serial:** 새 줄을 넣을 때마다 1, 2, 3...처럼 자동으로 늘어나는 정수 타입이다.
- **varchar(100):** 최대 100자까지 넣을 수 있는 글자 타입이다.
- **boolean:** true(참) 또는 false(거짓) 둘 중 하나만 갖는 타입이다.
- **timestamptz:** 날짜와 시간을 시간대 정보와 함께 저장하는 타입이다.
- **시간대 정보:** 그 시간이 어느 지역 기준인지 나타내는 정보이다. 예를 들어 한국 오전 9시와 영국 오전 9시는 서로 다른 순간이다. 시간대 정보가 있으면 어디서 보든 같은 순간으로 맞출 수 있다.
- **now():** 지금 이 순간의 시간을 뜻하는 DB 함수이다.
- **내림차순:** 큰 값(최신 시간)부터 작은 값 순서로 정렬하는 것이다.
- **JavaScript 문자열 길이 (`.length`):** JavaScript가 글자 수를 세는 방법이다. 한글, 영어, 숫자는 한 글자를 1자로 세지만, 이모지(예: 😀)는 2자로 셀 때가 있다.
- **ISO 형식:** 날짜와 시간을 `2026-10-23T09:00:00.000Z`처럼 적는 국제 표준 형식이다.
- **Z (ISO 형식 끝 글자):** 이 시간이 세계 표준시(UTC) 기준이라는 표시이다. 한국 시간은 UTC보다 9시간 빠르다.
- **JSON:** 서버와 화면이 데이터를 주고받을 때 쓰는 글자 형식이다. 날짜 객체(Date)를 그대로 담을 수 없어서 문자열로 바꾼다.
- **Date:** JavaScript에서 날짜와 시간을 다루는 객체이다. DB가 아니라 JavaScript 코드 안에서 쓰는 값이다.
- **toISOString():** `Date` 객체를 ISO 형식 문자열로 바꿔 주는 JavaScript 함수이다.
- **typeof (TypeScript 타입 자리에서):** 이미 만든 값(여기서는 `todos`)을 보고 그 값의 타입을 가져오는 문법이다.
- **$inferSelect:** Drizzle이 테이블 정의를 보고 "읽어온 한 줄"의 타입을 자동으로 만들어 주는 기능이다.
- **import type:** 다른 파일에서 타입만 가져오는 문법이다. 실행되는 코드는 가져오지 않는다.
- **`@/` 경로:** 프로젝트의 기준 폴더를 줄여 쓰는 표시이다. `@/types/todo`처럼 쓰면 `../../types/todo`처럼 긴 경로를 쓰지 않아도 된다. STEP 9에서 설정한다.
- **점으로 이어 쓰기 (메서드 체이닝):** `.notNull().default(false)`처럼 점(.)으로 함수를 이어 붙여 규칙을 하나씩 더하는 방법이다. 왼쪽부터 차례로 적용된다.
