# TEST_CASES - Todo 앱

> 상태: 초안
> 근거 문서: docs/PRD.md, docs/TRD.md, docs/DATA_MODEL.md, docs/API_SPEC.md, docs/COMPONENT_SPEC.md
> 어떤 테스트를 만들지 정리한다. 테스트 코드는 각 버전을 만들 때 이 문서를 보고 쓴다. PRD 6장 "성공 기준"대로, 이 문서의 테스트가 모두 통과해야 한다.

## 1. 읽는 법

### 1-1. 테스트 ID

| 앞부분 | 대상 |
|------|------|
| API-GET-, API-POST-, API-PATCH-, API-EDIT-, API-DEL-, API-DB- | API 라우트 (3장) |
| CMP-ERR-, CMP-FORM-, CMP-ITEM-, CMP-LIST-, CMP-FILTER-, CMP-APP-, CMP-PAGE- | 컴포넌트 (4장) |

- 뒤의 숫자는 그 대상 안에서의 순서이다. 버전이 올라가도 번호를 바꾸지 않고 뒤에 이어 붙인다.

### 1-2. 버전
- 각 소제목의 `(v0.x)`는 그 테스트를 **처음 만드는 버전**이다.
- 한 번 만든 테스트는 뒤 버전에서도 계속 통과해야 한다. 예외는 8장 1번, 3번에 적었다.

### 1-3. 줄여 쓰는 말

| 줄임말 | 뜻 |
|------|------|
| 「입력 문구」 | "제목을 입력해 주세요." |
| 「100자 문구」 | "제목은 100자 이하로 입력해 주세요." |
| 「실패 문구」 | "요청에 실패했습니다. 다시 시도해 주세요." |
| 「빈 목록 문구」 | "할 일이 없습니다" |
| 「로딩 문구」 | "불러오는 중..." |
| `가×100` | '가'를 100개 이어 붙인 글자 (`.length` 100) |
| `😀×50` | 이모지 😀를 50개 이어 붙인 글자 (`.length` 100) |
| 400 TITLE_REQUIRED | 상태 코드 400, 본문 `{ "error": { "code": "TITLE_REQUIRED", "message": 「입력 문구」 } }` (API_SPEC 2-2의 표대로) |
| 에러 자리 | 입력창 바로 아래의 ErrorMessage (COMPONENT_SPEC 1장) |
| 수정 입력창 아래 | 수정 모드인 TodoItem의 `editError` 문구 자리 (v0.4) |

- 문구는 문장부호까지 **글자 그대로 같은지** 확인한다 (PRD 7장).

## 2. 테스트 방법

**API 테스트 (3장)**
- `route.ts`가 내보내는 GET, POST, PATCH, DELETE 함수를 테스트에서 직접 부른다. 개발 서버를 띄우지 않는다.
- 500 `INTERNAL_ERROR`는 src/lib의 저장 함수가 에러를 던지도록 흉내 내서 만든다.
- 각 테스트는 빈 저장소에서 시작한다. 필요한 할 일은 테스트 안에서 POST로 미리 넣는다.

**컴포넌트 테스트 (4장)**
- React Testing Library로 그리고, 요소는 이름(aria-label, 글자, role)으로 찾는다 (COMPONENT_SPEC 7장 "이름").
- TodoApp 외의 컴포넌트는 Props 함수를 흉내 함수로 넘기고, 불린 값을 확인한다.
- TodoApp 테스트(v0.2~)는 `fetch`를 흉내 내서 서버 응답을 정한다. "응답 기다리는 중"은 흉내 낸 응답을 바로 돌려주지 않고 붙잡아 두어 만든다.
- "네트워크 오류"는 흉내 낸 `fetch`가 응답 대신 에러를 던지게 해서 만든다.

## 3. API 테스트

### 3-1. GET /api/todos — 목록 조회 (v0.2)

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-GET-01 | GET /api/todos | 할 일이 하나도 없다 | 200, `{ "todos": [] }` |
| API-GET-02 | GET /api/todos | A, B, C 순서로 추가했다 | 200, `todos`가 C, B, A 순서 (최신순) |
| API-GET-03 | GET /api/todos | 만든 시간이 똑같은 할 일 두 개 (id 1, 2) | id 2가 id 1보다 앞 |
| API-GET-04 | GET /api/todos | A, B, C 중 가장 오래된 A를 완료로 바꿨다 | 완료한 A도 담겨 있고, 순서는 그대로 C, B, A |
| API-GET-05 | GET /api/todos | 할 일이 하나 있다 | 할 일의 모양이 `id`(숫자), `title`(문자열), `completed`(boolean), `createdAt`(ISO 형식 문자열) |
| API-GET-06 | GET /api/todos | 저장 함수가 에러를 던진다 | 500 INTERNAL_ERROR, message는 「실패 문구」 |

### 3-2. POST /api/todos — 할 일 추가 (v0.2)

**정상**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-POST-01 | POST /api/todos | `{ "title": "우유 사기" }` | 201, `todo`의 `title`은 "우유 사기", `completed`는 `false`, `id`는 숫자, `createdAt`은 ISO 형식 문자열 |
| API-POST-02 | POST /api/todos | `{ "title": "  우유 사기  " }` | 201, `title`은 "우유 사기" (앞뒤 공백 제거) |
| API-POST-03 | POST /api/todos | 제목 1자 `{ "title": "가" }` | 201 (가장 짧은 경계값) |
| API-POST-04 | POST /api/todos | `가×100` | 201 (가장 긴 경계값) |
| API-POST-05 | POST /api/todos | 앞뒤에 공백 2칸씩 + `가×100` (전체 104자) | 201, `title`은 `가×100` (공백을 자른 뒤 센다) |
| API-POST-06 | POST /api/todos | `😀×50` (`.length` 100) | 201 |
| API-POST-07 | POST /api/todos | 이미 있는 제목 "우유 사기"를 한 번 더 보낸다 | 201, 새 `id`는 먼저 것과 다르다. GET에 "우유 사기"가 두 개 있다 |
| API-POST-08 | POST /api/todos | `{ "title": "우유 사기", "id": 999, "completed": true, "createdAt": "2000-01-01T00:00:00.000Z" }` | 201, 정해지지 않은 필드는 무시된다: `id`는 999가 아니고, `completed`는 `false`, `createdAt`은 2000년이 아니다 |
| API-POST-09 | POST 다음 GET | "우유 사기"를 추가한 뒤 GET | 추가한 할 일이 `todos` 맨 앞에 있다 |

**에러**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-POST-10 | POST /api/todos | `{}` (`title` 필드 없음) | 400 TITLE_REQUIRED |
| API-POST-11 | POST /api/todos | `{ "title": "" }` | 400 TITLE_REQUIRED |
| API-POST-12 | POST /api/todos | `{ "title": "   " }` (공백만) | 400 TITLE_REQUIRED |
| API-POST-13 | POST /api/todos | `가×101` | 400 TITLE_TOO_LONG |
| API-POST-14 | POST /api/todos | 앞뒤에 공백 2칸씩 + `가×101` | 400 TITLE_TOO_LONG (공백을 잘라도 101자) |
| API-POST-15 | POST /api/todos | `😀×51` (`.length` 102, 눈에는 51글자) | 400 TITLE_TOO_LONG (`.length` 기준) |
| API-POST-16 | POST /api/todos | 본문이 JSON이 아닌 글자 `우유 사기` | 400 INVALID_REQUEST, message는 「실패 문구」 |
| API-POST-17 | POST /api/todos | `{ "title": 123 }` | 400 INVALID_REQUEST (제목 규칙보다 모양 검사가 먼저) |
| API-POST-18 | POST 다음 GET | API-POST-10~17 중 하나로 실패한 뒤 GET | 목록이 실패 전과 똑같다 (저장되지 않음) |
| API-POST-19 | POST /api/todos | 저장 함수가 에러를 던진다 | 500 INTERNAL_ERROR |

### 3-3. PATCH /api/todos/{id} — 완료 상태 바꾸기 (v0.2)

**정상**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-PATCH-01 | PATCH /api/todos/{id} | 미완료 할 일에 `{ "completed": true }` | 200, `todo.completed`는 `true`. `id`, `title`, `createdAt`은 그대로 |
| API-PATCH-02 | PATCH /api/todos/{id} | 완료한 할 일에 `{ "completed": false }` | 200, `todo.completed`는 `false` |
| API-PATCH-03 | PATCH /api/todos/{id} | 같은 할 일에 `{ "completed": true }`를 두 번 보낸다 | 두 번 다 200, 결과는 `completed: true` (미완료로 되돌아가지 않음) |
| API-PATCH-04 | PATCH 다음 GET | C, B, A 중 B를 완료로 바꾼 뒤 GET | 순서가 그대로 C, B, A이고 B의 `createdAt`이 바뀌지 않았다 |
| API-PATCH-05 | PATCH /api/todos/{id} (v0.2~v0.3 전용) | `{ "completed": true, "title": "새 제목" }` | 200, `completed`는 `true`, `title`은 원래 제목 그대로 (`title`은 읽지 않음). 8장 3번 참고 |
| API-PATCH-06 | PATCH /api/todos/2147483647 | 가장 큰 id, 그 할 일은 없다 | 404 NOT_FOUND (id 모양은 올바르므로 400이 아니다) |

**에러**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-PATCH-07 | PATCH /api/todos/abc | id가 숫자가 아님 | 400 INVALID_REQUEST |
| API-PATCH-08 | PATCH /api/todos/0 | id가 1보다 작음 | 400 INVALID_REQUEST |
| API-PATCH-09 | PATCH /api/todos/-1 | id가 음수 | 400 INVALID_REQUEST |
| API-PATCH-10 | PATCH /api/todos/1.5 | id가 정수가 아님 | 400 INVALID_REQUEST |
| API-PATCH-11 | PATCH /api/todos/2147483648 | id가 가장 큰 값보다 1 큼 | 400 INVALID_REQUEST |
| API-PATCH-12 | PATCH /api/todos/{id} | 본문이 JSON이 아닌 글자 `완료` | 400 INVALID_REQUEST |
| API-PATCH-13 | PATCH /api/todos/{id} | `{}` (`completed` 없음) | 400 INVALID_REQUEST |
| API-PATCH-14 | PATCH /api/todos/{id} | `{ "completed": "yes" }` | 400 INVALID_REQUEST |
| API-PATCH-15 | PATCH /api/todos/{id} | `{ "completed": "true" }` (따옴표가 있는 문자열) | 400 INVALID_REQUEST (boolean이 아님) |
| API-PATCH-16 | PATCH /api/todos/999 | 없는 id에 `{ "completed": true }` | 404 NOT_FOUND, message는 「실패 문구」 |
| API-PATCH-17 | PATCH /api/todos/{id} | 삭제한 할 일의 id에 `{ "completed": true }` | 404 NOT_FOUND |
| API-PATCH-18 | PATCH /api/todos/0 | 잘못된 id + 잘못된 본문 `{}` | 400 INVALID_REQUEST (처음 걸린 것 하나만) |
| API-PATCH-19 | PATCH 다음 GET | API-PATCH-12~15 중 하나로 실패한 뒤 GET | 그 할 일의 `completed`가 그대로이다 |
| API-PATCH-20 | PATCH /api/todos/{id} | 저장 함수가 에러를 던진다 | 500 INTERNAL_ERROR |

### 3-4. PATCH /api/todos/{id} — 제목 수정 (v0.4)

**정상**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-EDIT-01 | PATCH /api/todos/{id} | `{ "title": "  두유 사기  " }` | 200, `title`은 "두유 사기". `completed`, `createdAt`은 그대로 |
| API-EDIT-02 | PATCH /api/todos/{id} | `{ "title": "두유 사기", "completed": true }` | 200, 제목과 완료 상태가 둘 다 바뀐다 |
| API-EDIT-03 | PATCH /api/todos/{id} | v0.4에서 `{ "completed": true }`만 보낸다 | 200, 완료만 바뀌고 제목은 그대로 (`title`은 없어도 됨) |
| API-EDIT-04 | PATCH 다음 GET | C, B, A 중 B의 제목을 바꾼 뒤 GET | 순서가 그대로 C, B, A이고 B의 `createdAt`이 바뀌지 않았다 |
| API-EDIT-05 | PATCH /api/todos/{id} | 지금 제목과 똑같은 제목 | 200 |
| API-EDIT-06 | PATCH /api/todos/{id} | 다른 할 일과 똑같은 제목 | 200 (중복 허용) |
| API-EDIT-07 | PATCH /api/todos/{id} | `가×100` | 200 |
| API-EDIT-08 | PATCH /api/todos/{id} | `😀×50` | 200 |

**에러**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-EDIT-09 | PATCH /api/todos/{id} | `{ "title": "" }` | 400 TITLE_REQUIRED |
| API-EDIT-10 | PATCH /api/todos/{id} | `{ "title": "   " }` | 400 TITLE_REQUIRED |
| API-EDIT-11 | PATCH /api/todos/{id} | `가×101` | 400 TITLE_TOO_LONG |
| API-EDIT-12 | PATCH /api/todos/{id} | `😀×51` | 400 TITLE_TOO_LONG |
| API-EDIT-13 | PATCH /api/todos/{id} | `{}` (`title`, `completed` 둘 다 없음) | 400 INVALID_REQUEST |
| API-EDIT-14 | PATCH /api/todos/{id} | `{ "title": 123 }` | 400 INVALID_REQUEST |
| API-EDIT-15 | PATCH /api/todos/{id} | `{ "title": "두유 사기", "completed": "yes" }` | 400 INVALID_REQUEST |
| API-EDIT-16 | PATCH /api/todos/{id} | 본문이 JSON이 아닌 글자 `두유 사기` | 400 INVALID_REQUEST |
| API-EDIT-17 | PATCH /api/todos/abc | id가 숫자가 아님 + `{ "title": "두유 사기" }` | 400 INVALID_REQUEST |
| API-EDIT-18 | PATCH /api/todos/999 | 없는 id + `{ "title": "두유 사기" }` | 404 NOT_FOUND |
| API-EDIT-19 | PATCH /api/todos/999 | 없는 id + `{ "title": "   " }` | 400 TITLE_REQUIRED (제목 규칙이 할 일 찾기보다 먼저) |
| API-EDIT-20 | PATCH /api/todos/0 | 잘못된 id + `{ "title": "   " }` | 400 INVALID_REQUEST (id 검사가 제목 규칙보다 먼저) |
| API-EDIT-21 | PATCH 다음 GET | 미완료 할 일에 `{ "title": "   ", "completed": true }`로 실패한 뒤 GET | 제목도 완료 상태도 그대로이다 (일부만 저장되지 않음) |
| API-EDIT-22 | PATCH /api/todos/{id} | 저장 함수가 에러를 던진다 | 500 INTERNAL_ERROR |

### 3-5. DELETE /api/todos/{id} — 할 일 삭제 (v0.2)

**정상**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-DEL-01 | DELETE /api/todos/{id} | 있는 할 일을 지운다 | 204, 본문 없음 |
| API-DEL-02 | DELETE 다음 GET | C, B, A 중 B를 지운 뒤 GET | `todos`가 C, A 순서 |

**에러**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-DEL-03 | DELETE /api/todos/{id} | 같은 할 일을 두 번 지운다 | 두 번째는 404 NOT_FOUND |
| API-DEL-04 | DELETE /api/todos/999 | 없는 id | 404 NOT_FOUND, message는 「실패 문구」 |
| API-DEL-05 | DELETE /api/todos/2147483647 | 가장 큰 id, 그 할 일은 없다 | 404 NOT_FOUND |
| API-DEL-06 | DELETE /api/todos/abc | id가 숫자가 아님 | 400 INVALID_REQUEST |
| API-DEL-07 | DELETE /api/todos/0 | id가 1보다 작음 | 400 INVALID_REQUEST |
| API-DEL-08 | DELETE /api/todos/1.5 | id가 정수가 아님 | 400 INVALID_REQUEST |
| API-DEL-09 | DELETE /api/todos/2147483648 | id가 가장 큰 값보다 1 큼 | 400 INVALID_REQUEST |
| API-DEL-10 | DELETE 다음 GET | API-DEL-04~09 중 하나로 실패한 뒤 GET | 목록이 실패 전과 똑같다 |
| API-DEL-11 | DELETE /api/todos/{id} | 저장 함수가 에러를 던진다 | 500 INTERNAL_ERROR |

### 3-6. DB 저장 (v0.3)

3-1~3-5의 테스트는 v0.3에서도 그대로 통과해야 한다 (요청·응답 모양은 같고 저장 위치만 바뀐다). 아래는 DB에 실제로 저장되는지 확인한다. 테스트용 DB를 어떻게 준비할지는 8장 2번에 적었다.

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| API-DB-01 | POST 다음 DB | "  우유 사기  "를 추가한다 | `todos` 테이블에 `title` "우유 사기", `completed` `false`인 행이 생긴다 |
| API-DB-02 | POST 다음 DB | 본문에 `createdAt`을 2000년으로 넣어 추가한다 | 행의 `created_at`은 DB가 넣은 지금 시간이다 (2000년이 아니다) |
| API-DB-03 | 다시 불러온 뒤 GET | 추가한 뒤, 서버 쪽 모듈을 새로 불러와서(재시작 흉내) GET | 추가한 할 일이 그대로 있다 (F-07) |
| API-DB-04 | PATCH 다음 DB | 완료로 바꾼다 | 행의 `completed`가 `true`이고 `created_at`은 그대로이다 |
| API-DB-05 | DELETE 다음 DB | 지운다 | 그 행이 테이블에 없다 |
| API-DB-06 | GET | DB에 `created_at`이 똑같은 행 두 개를 직접 넣는다 | id가 큰 행이 앞 |

## 4. 컴포넌트 테스트

### 4-1. Page (v0.1)

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-PAGE-01 | Page | 그린다 | TodoApp이 그려진다 ("할 일 제목" 입력창과 "추가" 버튼이 보인다) |

### 4-2. ErrorMessage (v0.1)

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-ERR-01 | ErrorMessage | `message={null}` | 아무것도 그리지 않는다. `role="alert"` 요소가 없다 |
| CMP-ERR-02 | ErrorMessage | `message="요청에 실패했습니다. 다시 시도해 주세요."` | `role="alert"` 요소에 그 문구가 보인다 |
| CMP-ERR-03 | ErrorMessage | 「입력 문구」를 보여주다가 「100자 문구」로 바꾼다 | alert는 하나이고 「100자 문구」만 보인다 |

### 4-3. TodoForm

**v0.1**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-FORM-01 | TodoForm | 그린다 | `aria-label="할 일 제목"` 입력창과 "추가" 버튼이 있다 |
| CMP-FORM-02 | TodoForm | "  우유 사기  "를 쓰고 "추가" 클릭 | `onAdd("  우유 사기  ")`가 한 번 불린다 (공백을 자르지 않고 넘긴다) |
| CMP-FORM-03 | TodoForm | "우유 사기"를 쓰고 입력창에서 Enter | `onAdd("우유 사기")`가 한 번 불린다 |
| CMP-FORM-04 | TodoForm | 빈 칸 그대로 "추가" 클릭 | `onAdd("")`가 불린다 (검사는 TodoApp이 한다) |
| CMP-FORM-05 | TodoForm | `onAdd`가 `true`를 돌려준다 | 입력창이 빈다 |
| CMP-FORM-06 | TodoForm | `onAdd`가 `false`를 돌려준다 | 입력창 글자가 그대로이다 |
| CMP-FORM-07 | TodoForm | `가×101`을 쓴다 | 101자가 모두 입력된다 (`maxLength` 없음) |

**v0.2**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-FORM-08 | TodoForm | `disabled={true}` | 입력창과 "추가" 버튼이 잠긴다. 버튼 글자는 "추가" 그대로 |
| CMP-FORM-09 | TodoForm | `disabled={false}` | 입력창과 "추가" 버튼을 쓸 수 있다 |

### 4-4. TodoItem

**v0.1**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-ITEM-01 | TodoItem | 미완료 할 일 "우유 사기" | `<li>` 안에 체크 안 된 체크박스(`aria-label` "우유 사기"), 제목 "우유 사기", "삭제" 버튼 |
| CMP-ITEM-02 | TodoItem | 완료한 할 일 | 체크박스가 체크되어 있다 |
| CMP-ITEM-03 | TodoItem | 미완료 할 일(id 3)의 체크박스 클릭 | `onToggle(3, true)` |
| CMP-ITEM-04 | TodoItem | 완료한 할 일(id 3)의 체크박스 클릭 | `onToggle(3, false)` |
| CMP-ITEM-05 | TodoItem | 체크박스를 클릭했지만 `todo` Props는 그대로이다 | 체크 상태가 바뀌지 않는다 (Props가 바뀌어야 바뀐다) |
| CMP-ITEM-06 | TodoItem | id 3의 "삭제" 클릭 | `onDelete(3)`이 불린다. 확인 창(`window.confirm`)은 불리지 않는다 |

**v0.2**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-ITEM-07 | TodoItem | `isPending={true}` | 체크박스와 "삭제" 버튼이 잠긴다 |
| CMP-ITEM-08 | TodoItem | `isPending={false}` | 체크박스와 "삭제" 버튼을 쓸 수 있다 |

**v0.4 (제목 수정)**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-ITEM-09 | TodoItem | id 3의 제목 더블클릭 | `onStartEdit(3)` |
| CMP-ITEM-10 | TodoItem | `isPending={true}`에서 제목 더블클릭 | `onStartEdit`가 불리지 않는다 |
| CMP-ITEM-11 | TodoItem | `isEditing={true}` | 제목 글자 대신 `aria-label="제목 수정"` 입력창이 지금 제목을 담고 보이고, 포커스가 들어가 있다 |
| CMP-ITEM-12 | TodoItem | 수정 모드, 체크박스와 "삭제" 버튼 | 그대로 보인다 |
| CMP-ITEM-13 | TodoItem | 수정 입력창에 "  두유 사기  "를 쓰고 Enter | `onEdit(3, "  두유 사기  ")` |
| CMP-ITEM-14 | TodoItem | 수정 입력창에서 제목을 그대로 두고 Enter | `onEdit(3, 지금 제목)`이 불린다 |
| CMP-ITEM-15 | TodoItem | `onEdit`가 `{ status: "titleError", message: 「입력 문구」 }` | 수정 입력창 바로 아래에 「입력 문구」. 입력창 글자 그대로, `onCancelEdit`는 불리지 않는다 |
| CMP-ITEM-16 | TodoItem | `onEdit`가 `{ status: "failed" }` | 수정 입력창 아래에 문구가 없다. 입력창 글자 그대로, `onCancelEdit`는 불리지 않는다 |
| CMP-ITEM-17 | TodoItem | 수정 입력창 아래 문구가 있는 상태에서 다시 Enter (`onEdit` 응답 대기 중) | 응답이 오기 전에 수정 입력창 아래 문구가 사라진다 |
| CMP-ITEM-18 | TodoItem | 수정 모드에서 Esc | `onCancelEdit()` |
| CMP-ITEM-19 | TodoItem | 수정 모드에서 입력창 바깥 클릭 (포커스 벗어남) | `onCancelEdit()` |
| CMP-ITEM-20 | TodoItem | `isEditing={true}`, `isPending={true}` | 입력창이 `readOnly`이다 (`disabled`가 아님). 포커스가 그대로 있다. 체크박스와 "삭제" 버튼이 잠긴다 |
| CMP-ITEM-21 | TodoItem | `isEditing={true}`, `isPending={true}`에서 Esc, 바깥 클릭 | `onCancelEdit`가 불리지 않는다 |
| CMP-ITEM-22 | TodoItem | 수정 입력창에 `가×101`을 쓴다 | 101자가 모두 입력된다 (`maxLength` 없음) |
| CMP-ITEM-23 | TodoItem | 글자를 바꾸고 문구가 뜬 뒤 `isEditing`이 `false` → 다시 `true` | 입력창에 지금 제목이 담겨 있고, 수정 입력창 아래 문구가 없다 (`draft`, `editError`를 지움) |

### 4-5. TodoList

**v0.1**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-LIST-01 | TodoList | `todos=[]` | 「빈 목록 문구」가 보인다. 목록 줄(`<li>`)이 없다 |
| CMP-LIST-02 | TodoList | 할 일 3개를 일부러 오래된 순서로 넘긴다 | 받은 순서 그대로 3줄을 그린다 (정렬하지 않는다). 「빈 목록 문구」가 없다 |
| CMP-LIST-03 | TodoList | 제목이 똑같은 할 일 두 개 (id가 다름) | 두 줄 모두 보이고, React `key` 경고가 나지 않는다 |
| CMP-LIST-04 | TodoList | 한 줄의 체크박스와 "삭제" 클릭 | 받은 `onToggle`, `onDelete`가 그 할 일의 id로 불린다 |

**v0.2**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-LIST-05 | TodoList | 할 일 id 1, 2, 3, `pendingIds=[2]` | id 2의 체크박스와 "삭제"만 잠기고, 1과 3은 쓸 수 있다 |

**v0.4**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-LIST-06 | TodoList | `editingId=2` | id 2에만 "제목 수정" 입력창이 있다 |
| CMP-LIST-07 | TodoList | `editingId=null` | "제목 수정" 입력창이 없다 |

### 4-6. FilterBar (v0.4)

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-FILTER-01 | FilterBar | 그린다 | "전체", "진행 중", "완료" 버튼 세 개 |
| CMP-FILTER-02 | FilterBar | `filter="all"` | "전체"만 `aria-pressed="true"`, 나머지는 `"false"` |
| CMP-FILTER-03 | FilterBar | `filter="active"` | "진행 중"만 `aria-pressed="true"` |
| CMP-FILTER-04 | FilterBar | `filter="completed"` | "완료"만 `aria-pressed="true"` |
| CMP-FILTER-05 | FilterBar | "진행 중" 클릭 | `onChange("active")` |
| CMP-FILTER-06 | FilterBar | "완료" 클릭 | `onChange("completed")` |
| CMP-FILTER-07 | FilterBar | `filter="completed"`에서 "전체" 클릭 | `onChange("all")` |

### 4-7. TodoApp

여러 컴포넌트를 함께 그려서 사용자 흐름을 확인한다. "C, B, A"는 A, B, C 순서로 추가해서 C가 맨 위인 목록이다.

**v0.1 — 추가, 목록, 전환, 삭제 (브라우저 메모리)**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-01 | TodoApp | 처음 그린다 | 「빈 목록 문구」가 보인다. 에러 자리에 문구가 없다. 입력창과 "추가" 버튼을 쓸 수 있다 |
| CMP-APP-02 | TodoApp | "우유 사기"를 쓰고 "추가" | 목록에 "우유 사기"가 보이고 「빈 목록 문구」가 사라진다. 입력창이 빈다 |
| CMP-APP-03 | TodoApp | A, B, C 순서로 추가 | C, B, A 순서로 보인다 |
| CMP-APP-04 | TodoApp | "  우유 사기  " 추가 | 제목이 "우유 사기"로 보인다 |
| CMP-APP-05 | TodoApp | "우유 사기"를 두 번 추가 | "우유 사기" 두 줄이 보인다 |
| CMP-APP-06 | TodoApp | `가×100` 추가 | 추가된다 |
| CMP-APP-07 | TodoApp | 앞뒤에 공백 2칸씩 + `가×100` 추가 | `가×100`으로 추가된다 |
| CMP-APP-08 | TodoApp | `😀×50` 추가 | 추가된다 |
| CMP-APP-09 | TodoApp | 빈 칸 그대로 "추가" | 에러 자리에 「입력 문구」. 목록은 그대로 (「빈 목록 문구」) |
| CMP-APP-10 | TodoApp | "   "(공백만)을 쓰고 "추가" | 에러 자리에 「입력 문구」. 추가되지 않고, 입력창 글자는 "   " 그대로 |
| CMP-APP-11 | TodoApp | `가×101`을 쓰고 "추가" | 에러 자리에 「100자 문구」. 추가되지 않고, 입력창 글자 그대로 |
| CMP-APP-12 | TodoApp | 앞뒤에 공백 2칸씩 + `가×101` 추가 | 에러 자리에 「100자 문구」 |
| CMP-APP-13 | TodoApp | `😀×51` 추가 | 에러 자리에 「100자 문구」 |
| CMP-APP-14 | TodoApp | C, B, A 중 B의 체크박스 클릭 | B가 체크되고 순서는 그대로 C, B, A |
| CMP-APP-15 | TodoApp | 완료한 B를 다시 클릭 | B의 체크가 풀리고 순서는 그대로 |
| CMP-APP-16 | TodoApp | C, B, A 중 B의 "삭제" 클릭 | 확인 창 없이 B가 사라지고 C, A가 남는다 |
| CMP-APP-17 | TodoApp | 하나 남은 할 일을 삭제 | 「빈 목록 문구」가 보인다 |
| CMP-APP-18 | TodoApp | 「입력 문구」가 보이는 상태에서 바른 제목을 추가 | 에러 자리 문구가 사라지고 할 일이 추가된다 |
| CMP-APP-19 | TodoApp | 「입력 문구」가 보이는 상태에서 입력창에 글자만 쓴다 | 에러 자리 문구가 그대로 있다 |
| CMP-APP-20 | TodoApp | 「입력 문구」가 보이는 상태에서 체크박스 클릭 | 에러 자리 문구가 사라진다 |
| CMP-APP-21 | TodoApp | 「입력 문구」가 보이는 상태에서 "삭제" 클릭 | 에러 자리 문구가 사라진다 |
| CMP-APP-22 | TodoApp | 「입력 문구」가 보이는 상태에서 `가×101`을 추가 | alert는 하나이고 「100자 문구」만 보인다 |

**v0.2 — 서버 요청 (`fetch` 흉내)**

목록 불러오기

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-23 | TodoApp | GET 응답을 기다리는 중 | 목록 자리에 「로딩 문구」. 입력창과 "추가" 버튼이 잠긴다. 「빈 목록 문구」는 없다 |
| CMP-APP-24 | TodoApp | GET이 할 일 3개를 돌려준다 | 받은 순서대로 3줄이 보인다. 「로딩 문구」가 사라지고 입력창이 풀린다 |
| CMP-APP-25 | TodoApp | GET이 `{ "todos": [] }`를 돌려준다 | 「빈 목록 문구」 |
| CMP-APP-26 | TodoApp | GET이 500을 돌려준다 | 에러 자리에 「실패 문구」. 「빈 목록 문구」와 「로딩 문구」가 없고 목록 자리는 비어 있다. 입력창과 "추가" 버튼을 쓸 수 있다 |
| CMP-APP-27 | TodoApp | GET이 네트워크 오류 | CMP-APP-26과 같다 |
| CMP-APP-28 | TodoApp | GET 실패 뒤 "우유 사기" 추가 성공 | 에러 자리 문구가 사라지고, 목록 자리에 "우유 사기" 한 줄이 보인다 |

추가

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-29 | TodoApp | "우유 사기" 추가, POST가 201을 돌려준다 | POST `/api/todos`를 한 번 보낸다. 응답의 할 일이 목록 맨 위에 보이고 입력창이 빈다 |
| CMP-APP-30 | TodoApp | "   " 또는 `가×101`을 추가 | POST를 보내지 않는다 (화면 검사에서 멈춤). 문구는 CMP-APP-10, 11과 같다 |
| CMP-APP-31 | TodoApp | POST 응답을 기다리는 중 | 입력창과 "추가" 버튼이 잠기고, 버튼 글자는 "추가" 그대로. 새 할 일은 아직 목록에 없다 |
| CMP-APP-32 | TodoApp | POST 응답을 받은 뒤 | 입력창과 "추가" 버튼이 다시 풀린다 (성공, 실패 모두) |
| CMP-APP-33 | TodoApp | 화면 검사는 통과한 제목에 POST가 400 TITLE_TOO_LONG을 돌려준다 | 에러 자리에 응답의 message(「100자 문구」). 목록 그대로, 입력창 글자 그대로 |
| CMP-APP-34 | TodoApp | POST가 400 TITLE_REQUIRED를 돌려준다 | 에러 자리에 「입력 문구」. 입력창 글자 그대로 |
| CMP-APP-35 | TodoApp | POST가 400 INVALID_REQUEST를 돌려준다 | 에러 자리에 「실패 문구」. 입력창 글자 그대로 |
| CMP-APP-36 | TodoApp | POST가 500을 돌려준다 | 에러 자리에 「실패 문구」. 목록 그대로, 입력창 글자 그대로 |
| CMP-APP-37 | TodoApp | POST가 네트워크 오류 | 에러 자리에 「실패 문구」. 목록 그대로, 입력창 글자 그대로 |

완료 전환

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-38 | TodoApp | 미완료 할 일(id 3)의 체크박스 클릭 | PATCH `/api/todos/3`, 본문 `{ "completed": true }` |
| CMP-APP-39 | TodoApp | 완료한 할 일(id 3)의 체크박스 클릭 | 본문 `{ "completed": false }` |
| CMP-APP-40 | TodoApp | PATCH 응답을 기다리는 중 | 그 할 일의 체크박스와 "삭제"가 잠기고 체크 상태는 그대로이다. 다른 할 일은 잠기지 않는다 |
| CMP-APP-41 | TodoApp | PATCH가 200을 돌려준다 | 그 할 일이 응답 값으로 바뀐다(체크됨). 자리 그대로, 잠금이 풀린다 |
| CMP-APP-42 | TodoApp | PATCH가 404를 돌려준다 | 에러 자리에 「실패 문구」. 체크 상태와 목록 그대로, 잠금이 풀린다 |
| CMP-APP-43 | TodoApp | PATCH가 500을 돌려준다 | CMP-APP-42와 같다 |
| CMP-APP-44 | TodoApp | PATCH가 네트워크 오류 | CMP-APP-42와 같다 |

삭제

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-45 | TodoApp | id 3의 "삭제" 클릭 | 확인 창 없이 DELETE `/api/todos/3`을 보낸다 |
| CMP-APP-46 | TodoApp | DELETE 응답을 기다리는 중 | 그 할 일은 목록에 남아 있고 체크박스와 "삭제"가 잠긴다 |
| CMP-APP-47 | TodoApp | DELETE가 204를 돌려준다 | 그 할 일이 목록에서 사라진다 |
| CMP-APP-48 | TodoApp | DELETE가 404를 돌려준다 | 에러 자리에 「실패 문구」. 할 일이 그대로 남고 잠금이 풀린다 |
| CMP-APP-49 | TodoApp | DELETE가 500을 돌려준다 | CMP-APP-48과 같다 |
| CMP-APP-50 | TodoApp | DELETE가 네트워크 오류 | CMP-APP-48과 같다 |

에러 문구

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-51 | TodoApp | 「실패 문구」가 보이는 상태에서 다른 할 일의 전환이 또 실패한다 | alert는 하나만 보인다 |
| CMP-APP-52 | TodoApp | 「실패 문구」가 보이는 상태에서 전환이 성공한다 | 에러 자리 문구가 사라진다 |

**v0.4 — 필터**

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-53 | TodoApp | 목록을 불러온 직후 | FilterBar의 "전체"가 `aria-pressed="true"`이고 모든 할 일이 보인다 |
| CMP-APP-54 | TodoApp | 완료·미완료가 섞인 목록에서 "진행 중" 클릭 | 미완료 할 일만 최신순 그대로 보인다 |
| CMP-APP-55 | TodoApp | "완료" 클릭 | 완료한 할 일만 최신순 그대로 보인다 |
| CMP-APP-56 | TodoApp | "완료"에서 "전체" 클릭 | 모든 할 일이 다시 보인다 |
| CMP-APP-57 | TodoApp | 모두 미완료인데 "완료" 클릭 | 「빈 목록 문구」. FilterBar는 계속 보인다 |
| CMP-APP-58 | TodoApp | 필터 버튼을 누른다 | `fetch`가 불리지 않는다 |
| CMP-APP-59 | TodoApp | "진행 중"에서 할 일을 체크, PATCH 성공 | 그 할 일이 목록에서 사라진다 |
| CMP-APP-60 | TodoApp | "완료"에서 새 할 일 추가 성공 | 새 할 일이 목록에 보이지 않는다. "전체"를 누르면 맨 위에 보인다 |
| CMP-APP-61 | TodoApp | 에러 자리에 문구가 있는 상태에서 필터를 바꾼다 | 문구가 그대로 있다 |
| CMP-APP-62 | TodoApp | GET 응답을 기다리는 중 | FilterBar가 없다 |
| CMP-APP-63 | TodoApp | GET이 실패했고 할 일이 없다 | FilterBar가 없다 |
| CMP-APP-64 | TodoApp | GET 실패 뒤 추가 성공 | FilterBar가 보인다 |
| CMP-APP-65 | TodoApp | "완료"를 고른 뒤 TodoApp을 다시 그린다 (새로고침 흉내) | "전체"로 돌아가 있다 (필터는 저장하지 않음) |

**v0.4 — 제목 수정**

정상

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-66 | TodoApp | "우유 사기"(id 3) 제목 더블클릭 | 제목 자리에 "제목 수정" 입력창이 "우유 사기"를 담고 나타나고 포커스가 있다 |
| CMP-APP-67 | TodoApp | "두유 사기"로 바꾸고 Enter, PATCH 200 | PATCH `/api/todos/3`, 본문 `{ "title": ... }`. 응답의 제목 "두유 사기"가 같은 자리에 보이고 수정 모드가 끝난다 |
| CMP-APP-68 | TodoApp | 제목을 그대로 두고 Enter | PATCH를 보낸다 |
| CMP-APP-69 | TodoApp | 글자를 바꾸고 Esc | 원래 제목으로 돌아가고 수정 모드가 끝난다. 요청을 보내지 않는다 |
| CMP-APP-70 | TodoApp | 글자를 바꾸고 입력창 바깥 클릭 | CMP-APP-69와 같다 |
| CMP-APP-71 | TodoApp | 저장 PATCH 응답을 기다리는 중 | 입력창이 `readOnly`이고 그 할 일의 체크박스와 "삭제"가 잠긴다. Esc나 바깥 클릭을 해도 수정 모드가 유지된다 |
| CMP-APP-72 | TodoApp | A가 수정 모드인 채로(포커스 유지) B 제목에 더블클릭 이벤트가 온다 | B는 수정 모드가 되지 않고 A가 수정 모드를 유지한다 |
| CMP-APP-73 | TodoApp | 수정 모드에서 다른 할 일의 체크박스 클릭 | 수정이 취소되고(원래 제목), 그 할 일의 전환 PATCH를 보낸다 |
| CMP-APP-74 | TodoApp | 에러 자리에 「실패 문구」가 있는 상태에서 수정 모드에 들어간다 | 에러 자리 문구가 그대로 있다 |
| CMP-APP-75 | TodoApp | 수정 취소 후 같은 제목을 다시 더블클릭 | 입력창에 지금 제목이 담겨 있고 문구가 없다 |

에러

| ID | 대상 | 상황 | 기대 결과 |
|------|------|------|------|
| CMP-APP-76 | TodoApp | 수정 입력창을 "   "으로 바꾸고 Enter | 요청을 보내지 않는다. 수정 입력창 아래에 「입력 문구」, 에러 자리는 비어 있다. 수정 모드 유지 |
| CMP-APP-77 | TodoApp | 수정 입력창을 `가×101`로 바꾸고 Enter | 요청을 보내지 않는다. 수정 입력창 아래에 「100자 문구」. 수정 모드 유지 |
| CMP-APP-78 | TodoApp | 수정 입력창을 `😀×51`로 바꾸고 Enter | 수정 입력창 아래에 「100자 문구」 |
| CMP-APP-79 | TodoApp | 수정 입력창 아래 문구가 있는 상태에서 Esc | 문구가 사라지고 원래 제목으로 돌아간다 |
| CMP-APP-80 | TodoApp | 수정 입력창 아래 문구가 있는 상태에서 바른 제목으로 Enter, 성공 | 문구가 사라지고 새 제목이 보인다 |
| CMP-APP-81 | TodoApp | 저장 PATCH가 404를 돌려준다 | 에러 자리에 「실패 문구」. 수정 모드 유지, 목록의 제목은 그대로 |
| CMP-APP-82 | TodoApp | 저장 PATCH가 500을 돌려준다 | CMP-APP-81과 같다 |
| CMP-APP-83 | TodoApp | 저장 PATCH가 네트워크 오류 | CMP-APP-81과 같다 |
| CMP-APP-84 | TodoApp | 화면 검사는 통과한 제목에 저장 PATCH가 400 TITLE_TOO_LONG을 돌려준다 | 에러 자리에 응답의 message(「100자 문구」). 수정 입력창 아래는 비어 있다. 수정 모드 유지 |
| CMP-APP-85 | TodoApp | 에러 자리에 「실패 문구」가 있는 상태에서 "   "으로 Enter | 에러 자리 문구가 사라지고 수정 입력창 아래에만 「입력 문구」. 화면 전체에 에러 문구가 하나 |
| CMP-APP-86 | TodoApp | 수정 입력창 아래에 「입력 문구」가 있는 상태에서 바른 제목으로 Enter, PATCH 500 | 수정 입력창 아래 문구가 사라지고 에러 자리에만 「실패 문구」. 화면 전체에 에러 문구가 하나 |

## 5. 기능별 테스트 찾기

| 기능 | API 테스트 | 컴포넌트 테스트 |
|------|------|------|
| F-01 할 일 추가 | API-POST-01~19 | CMP-FORM-01~09, CMP-APP-02~13, 29~37 |
| F-02 목록 보기 | API-GET-01~05, API-DB-06 | CMP-LIST-02, CMP-APP-03, 24 |
| F-03 완료 전환 | API-PATCH-01~20 | CMP-ITEM-02~05, 07, CMP-APP-14~15, 38~44 |
| F-04 삭제 | API-DEL-01~11 | CMP-ITEM-06, CMP-APP-16~17, 45~50 |
| F-05 빈 목록 문구 | API-GET-01 | CMP-LIST-01, CMP-APP-01, 17, 25, 57 |
| F-06 요청 실패 문구 | 각 표의 에러 줄 | CMP-ERR-01~03, CMP-APP-18~22, 26~28, 35~37, 42~44, 48~52, 81~86 |
| F-07 데이터 유지 | API-DB-01~06 | — |
| F-08 필터 | — | CMP-FILTER-01~07, CMP-APP-53~65 |
| F-09 수정 | API-EDIT-01~22 | CMP-ITEM-09~23, CMP-LIST-06~07, CMP-APP-66~86 |

## 6. 이 문서에 넣지 않은 것
- **배포(v1.0) 확인:** 공개 URL로 접속되는지는 자동 테스트가 아니라 배포 후 직접 열어서 확인한다.
- **범위 밖 기능:** 로그인, 공유, 알림, 마감일, 카테고리는 만들지 않으므로 테스트도 없다 (PRD 5장).
- **명세에 결과가 없는 상황:** 8장 4번처럼 문서에 결과가 정해지지 않은 요청은 넣지 않았다.

## 7. 결정 사항
이 문서를 쓰면서 정한 것이다.
- **나누는 방법:** API 테스트(3장)와 컴포넌트 테스트(4장)로 나누고, 그 안에서 엔드포인트·컴포넌트별, 버전별로 나눈다.
- **표 모양:** 모든 테스트를 ID / 대상 / 상황 / 기대 결과 네 칸으로 적는다.
- **버전 표시:** 표에 칸을 더하지 않고 소제목에 처음 만드는 버전을 적는다.
- **API 테스트 방법:** `route.ts`의 함수를 직접 부른다. 500은 저장 함수가 에러를 던지게 흉내 낸다.
- **컴포넌트 테스트 방법:** TodoApp은 `fetch`를 흉내 내고, 나머지 컴포넌트는 Props 함수를 흉내 함수로 넘긴다.
- **경계값:** 제목 길이는 1자, 100자, 101자, 앞뒤 공백 포함, 이모지(`.length` 2)로 확인한다. id는 0, 1.5, 2,147,483,647, 2,147,483,648로 확인한다.

## 8. 확인이 필요한 것
문서에 정해지지 않았거나, 테스트를 고치지 않는다는 규칙(CLAUDE.md)과 부딪칠 수 있는 것이다. 정해지면 이 장을 고친다.

1. **v0.1 TodoApp 테스트를 v0.2에서 어떻게 할지:** v0.1의 CMP-APP-01~22는 서버 없이 바로 그린다. v0.2부터는 처음에 「로딩 문구」가 보이고 추가에 POST가 필요하므로, 테스트의 **준비 부분**(GET이 빈 목록을 돌려주고 POST가 성공하도록 `fetch` 흉내)을 더해야 한다. 기대 결과는 그대로 둔다. 이렇게 준비 부분만 더하는 것을 허용할지 정해야 한다.
2. **v0.3 API 테스트용 DB:** 3-6(API-DB-01~06)은 실제 Postgres가 필요하다. 테스트용 DB를 따로 둘지(예: Neon의 테스트 전용 브랜치), 어떤 접속 정보를 쓸지 문서에 없다. 3-1~3-5를 v0.3에서 DB에 대고 돌릴지, 저장 함수를 흉내 낼지도 함께 정해야 한다.
3. **API-PATCH-05 (v0.2~v0.3 전용):** v0.2~v0.3에서는 `title`을 무시하지만, v0.4부터는 `title`을 받으므로 결과가 바뀐다. v0.4에서 이 테스트를 API-EDIT-02로 바꾸는 것을 허용할지 정해야 한다.
4. **POST `{ "title": null }`의 결과:** "`title` 필드가 없음"(TITLE_REQUIRED)으로 볼지, "`title`이 문자열이 아님"(INVALID_REQUEST)으로 볼지 API_SPEC에 없다. 정해지기 전까지 테스트에 넣지 않았다.
5. **API_SPEC 3-3의 "본문이 JSON이 아님" 예시 `true`:** `true`는 JSON으로는 올바른 값(객체가 아닌 값)이다. 결과는 어느 쪽이든 INVALID_REQUEST이므로, 이 문서에서는 JSON이 아닌 글자 `완료`를 예시로 썼다. API_SPEC 예시를 고칠지 정해야 한다.

## 9. 용어 설명
- **테스트 케이스:** "이런 상황에서 이렇게 되어야 한다"는 확인 하나이다.
- **기대 결과:** 테스트가 통과하려면 나와야 하는 결과이다.
- **정상 케이스 / 에러 케이스:** 정상 케이스는 성공해야 하는 상황, 에러 케이스는 실패해야 하는(그리고 실패를 알맞게 알려야 하는) 상황이다.
- **경계값:** 규칙이 바뀌는 바로 그 지점의 값이다. 예: 100자는 통과, 101자는 실패. 실수가 가장 많이 나는 곳이라 꼭 확인한다.
- **흉내 (mock):** 진짜 대신 테스트가 정한 대로 움직이는 가짜를 쓰는 것이다. 예: 진짜 서버 대신 "500을 돌려주는 가짜 `fetch`"
- **흉내 함수:** 불렸는지, 무엇을 받고 불렸는지 기록하는 가짜 함수이다. Jest의 `jest.fn()`이다.
- **fetch:** 브라우저에서 서버로 요청을 보내는 함수이다. TodoApp이 API를 부를 때 쓴다.
- **응답을 기다리는 중:** 요청은 보냈지만 서버 응답이 아직 오지 않은 때이다. 테스트에서는 흉내 낸 응답을 일부러 늦게 돌려줘서 만든다.
- **재시작 흉내:** 서버 쪽 코드를 처음부터 다시 불러와서, 서버 메모리에 있던 값이 사라진 상태를 만드는 것이다.
- **확인 창 (`window.confirm`):** "정말 삭제할까요?" 같은 브라우저 기본 창이다. 이 앱은 쓰지 않는다.
- **aria-pressed, role="alert", aria-label:** COMPONENT_SPEC 8장 "접근성과 테스트"를 본다.
- **readOnly / disabled / 포커스:** COMPONENT_SPEC 8장 "HTML과 JSX"를 본다.
