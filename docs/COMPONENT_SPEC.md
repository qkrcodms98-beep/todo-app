# COMPONENT_SPEC - Todo 앱

> 상태: 초안
> 근거 문서: docs/PRD.md, docs/API_SPEC.md, docs/DATA_MODEL.md, docs/TRD.md
> 화면을 어떤 컴포넌트로 나누고, 각 컴포넌트가 무엇을 받고(Props), 사용자가 무엇을 하면 어떻게 되는지 정리한다.

## 1. 컴포넌트 트리

```
Page (app/page.tsx)
└─ TodoApp                 ← 상태를 모두 가지고, 서버에 요청을 보낸다
   ├─ TodoForm             ← 입력창 + "추가" 버튼
   ├─ ErrorMessage         ← 에러 자리
   ├─ FilterBar            ← 전체 / 진행 중 / 완료 (v0.4)
   └─ (목록 자리)
      ├─ "불러오는 중..."   ← 목록을 불러오는 동안 (v0.2~)
      └─ TodoList          ← 불러오기가 끝나면
         └─ TodoItem × N   ← 할 일 한 줄. 할 일 개수(N)만큼 그린다
```

**화면에서 보이는 자리**

```
[ 할 일 제목 입력창          ] [추가]          ← TodoForm
요청에 실패했습니다. 다시 시도해 주세요.        ← 에러 자리 (ErrorMessage)
[전체] [진행 중] [완료]                        ← FilterBar (v0.4)
☐ 우유 사기                    [삭제]          ← 목록 자리 (TodoList 안의 TodoItem)
☑ 책 반납하기                  [삭제]
```

- **에러 자리:** 입력창 바로 아래, ErrorMessage가 문구를 보여주는 곳이다.
- **목록 자리:** 할 일 목록이 보이는 곳이다. 상황에 따라 "불러오는 중...", 할 일 목록, "할 일이 없습니다" 중 하나가 보인다.

| 컴포넌트 | 파일 | 하는 일 | 도입 버전 |
|------|------|------|------|
| Page | app/page.tsx | TodoApp 하나만 그린다 | v0.1 |
| TodoApp | src/components/TodoApp.tsx | 목록·에러·요청 중·수정 중 상태를 가진다. 제목 검사와 서버 요청을 맡는다 | v0.1 |
| TodoForm | src/components/TodoForm.tsx | 제목 입력창과 "추가" 버튼 | v0.1 |
| ErrorMessage | src/components/ErrorMessage.tsx | 에러 문구를 보여준다 | v0.1 |
| FilterBar | src/components/FilterBar.tsx | 필터 버튼 세 개 | v0.4 |
| TodoList | src/components/TodoList.tsx | 할 일 목록. 비었으면 "할 일이 없습니다" | v0.1 |
| TodoItem | src/components/TodoItem.tsx | 할 일 한 줄 (체크박스, 제목, "삭제" 버튼, v0.4부터 제목 수정) | v0.1 |

**역할 나누기 원칙**
- 서버에 요청을 보내는 곳은 **TodoApp 하나뿐**이다. 다른 컴포넌트는 Props로 받은 함수만 부른다 (7장 "함수를 Props로 넘기기").
- 제목 검사(src/lib의 Zod 규칙)도 TodoApp이 한다. 추가와 수정이 같은 규칙, 같은 문구를 쓰게 하기 위해서다 (TRD 5장).
- TodoApp은 상태(useState)를 쓰므로 파일 맨 위에 `"use client"`를 적는다. Page는 서버 컴포넌트로 둔다.

## 2. 공유 타입

### 2-1. 이미 정한 타입
- `Todo`: src/types/todo.ts (DATA_MODEL.md 4-2)
- API 요청·응답 타입: src/types/api.ts (API_SPEC.md 4장)

### 2-2. 화면 전용 타입 (src/types/ui.ts, v0.4)

화면에서만 쓰는 타입도 src/types/에 둔다 (CLAUDE.md 폴더 구조).

```ts
// 필터 종류. 화면 글자는 전체 / 진행 중 / 완료
export type TodoFilter = "all" | "active" | "completed";

// 제목 수정 결과
export type EditResult =
  | { status: "saved" } // 저장 성공
  | { status: "titleError"; message: string } // 제목 규칙에 걸림. 수정 입력창 아래에 보여줄 문구
  | { status: "failed" }; // 그 밖의 실패. 문구는 TodoApp이 에러 자리에 보여준다
```

- 두 타입 모두 v0.4에서 만든다. v0.1~v0.3에서는 만들지 않는다.

## 3. 컴포넌트별 명세

- Props 코드는 **v0.1 기준**으로 적는다. v0.2와 v0.4에서 더하는 Props는 4장 표에 따로 모았다.
- FilterBar는 v0.4에 처음 만드는 컴포넌트이므로 v0.4 기준으로 적는다.

### 3-1. Page (app/page.tsx)

- **Props:** 없음
- `<TodoApp />` 하나만 그린다.

### 3-2. TodoApp (src/components/TodoApp.tsx)

- **Props:** 없음

**가지고 있는 상태**

| 상태 | 타입 | 처음 값 | 설명 | 도입 버전 |
|------|------|------|------|------|
| todos | `Todo[]` | `[]` | 전체 할 일 목록 (최신순) | v0.1 |
| loadStatus | `"loading"`, `"ready"`, `"failed"` 중 하나 | v0.1: `"ready"`, v0.2~: `"loading"` | 목록 불러오기 상태 | v0.1 |
| errorMessage | `string` 또는 `null` | `null` | 에러 자리에 보여줄 문구. 없으면 `null` | v0.1 |
| isAdding | `boolean` | `false` | 추가 요청 중인지 | v0.2 |
| pendingIds | `number[]` | `[]` | 전환·삭제·수정 요청 중인 할 일의 id | v0.2 |
| editingId | `number` 또는 `null` | `null` | 수정 모드인 할 일의 id. 없으면 `null` | v0.4 |
| filter | `TodoFilter` | `"all"` | 고른 필터 | v0.4 |

- 표 안의 "`A`, `B` 중 하나"와 "`A` 또는 `B`"는 코드에서 `A | B`로 쓴다. 표 칸을 나누는 기호 `|`와 헷갈리지 않게 표에서는 말로 적었다.
- v0.1은 서버 요청이 없으므로 `loadStatus`는 항상 `"ready"`이다. `isAdding`과 `pendingIds`는 v0.2에서 만든다.
- `editingId`가 하나뿐이므로 수정 모드는 한 번에 한 할 일만 될 수 있다.
- `filter`는 저장하지 않는다. 새로고침하면 "전체"로 돌아간다 (DATA_MODEL.md 3장).

**화면에 그리는 것**

| loadStatus | TodoForm | ErrorMessage | 목록 자리 |
|------|------|------|------|
| `"loading"` | 잠금 | errorMessage (이때는 `null`) | "불러오는 중..." |
| `"ready"` | 추가 요청 중이면 잠금 | errorMessage | TodoList (필터를 건 목록) |
| `"failed"` | 추가 요청 중이면 잠금 | errorMessage | `todos`가 비었으면 아무것도 없음, 있으면 TodoList |

- 불러오기에 실패하면 errorMessage에 "요청에 실패했습니다. 다시 시도해 주세요."를 넣는다. 다른 실패와 똑같이 에러 자리 한 곳에 보이고, 다음 동작을 시작하면 지워진다 (3-4).
- 불러오기에 실패하면 "할 일이 없습니다"를 보여주지 않는다. 할 일이 정말 없는지 알 수 없기 때문이다.
- 불러오기에 실패해도 추가는 막지 않는다. 추가에 성공하면 목록 자리에 TodoList가 나타나 새로 추가한 할 일이 보인다. 서버에 원래 있던 할 일은 새로고침해서 불러오기에 성공해야 보인다.
- FilterBar(v0.4)는 목록 자리에 TodoList를 그릴 때만 보여준다.

**TodoApp이 자식에게 넘기는 함수**

| 함수 | 하는 일 | 도입 버전 |
|------|------|------|
| `handleAdd(title)` | ① 에러 문구를 지운다 ② Zod로 검사한다. 걸리면 문구를 정하고 `false`를 돌려준다 ③ `isAdding`을 true로 하고 POST ④ 성공하면 목록 맨 앞에 넣고 `true`, 실패하면 문구를 정하고 `false`를 돌려준다 ⑤ `isAdding`을 false로 되돌린다 | v0.1 |
| `handleToggle(id, completed)` | ① 에러 문구를 지운다 ② `pendingIds`에 id를 넣고 PATCH `{ completed }` ③ 성공하면 같은 자리의 할 일을 응답 값으로 바꾼다. 실패하면 문구를 정한다 ④ `pendingIds`에서 id를 뺀다 | v0.1 |
| `handleDelete(id)` | ① 에러 문구를 지운다 ② `pendingIds`에 id를 넣고 DELETE ③ 204를 받으면 목록에서 뺀다. 실패하면 문구를 정한다 ④ `pendingIds`에서 id를 뺀다 | v0.1 |
| `handleStartEdit(id)` | 다른 할 일이 수정 모드면 아무것도 하지 않는다. 아니면 `editingId`를 id로 한다. 에러 문구는 지우지 않는다 | v0.4 |
| `handleCancelEdit()` | `editingId`를 `null`로 한다 | v0.4 |
| `handleEdit(id, title)` | ① 에러 문구를 지운다 ② Zod로 검사한다. 걸리면 요청을 보내지 않고 `titleError`를 돌려준다 ③ `pendingIds`에 id를 넣고 PATCH `{ title }` ④ 성공하면 같은 자리의 할 일을 응답 값으로 바꾸고, `editingId`를 `null`로 하고, `saved`를 돌려준다. 실패하면 에러 자리 문구를 정하고 `failed`를 돌려준다 ⑤ `pendingIds`에서 id를 뺀다 | v0.4 |

- `isAdding`, `pendingIds`를 바꾸는 단계는 v0.2부터 있다. v0.1에서는 POST·PATCH·DELETE 대신 `todos` 상태를 바로 바꾼다. 새 할 일의 `id`와 `createdAt`은 DATA_MODEL.md 5장대로 만든다.
- 모든 요청은 **응답을 받은 뒤에** 화면을 바꾼다. 실패하면 목록은 그대로 둔다.
- 응답의 error code를 보고 문구를 고른다 (API_SPEC.md 2-3). `TITLE_REQUIRED`, `TITLE_TOO_LONG`이면 응답의 message를 쓴다. 그 밖의 모든 실패와 네트워크 오류는 "요청에 실패했습니다. 다시 시도해 주세요."이다.
- 화면 검사와 서버 검사가 같은 Zod 규칙을 쓰므로, 화면 검사를 통과한 제목은 서버에서도 제목 규칙에 걸리지 않는다. 그래서 `handleEdit`은 ②에서만 `titleError`를 돌려준다. 그래도 서버가 제목 규칙 code를 돌려주면 추가와 똑같이 응답의 message를 에러 자리에 보여주고 `failed`를 돌려준다.
- v0.1에서도 `handleAdd`는 `Promise<boolean>`을 돌려준다. 그래서 v0.2에서 서버 요청으로 바꿔도 TodoForm은 고치지 않아도 된다.

### 3-3. TodoForm (src/components/TodoForm.tsx)

**Props (v0.1)**

```ts
type TodoFormProps = {
  // 입력한 제목을 그대로(공백을 자르지 않고) 넘긴다. 추가에 성공하면 true
  onAdd: (title: string) => Promise<boolean>;
};
```

- v0.2에서 `disabled`를 더한다 (4장).
- 입력 중인 글자는 TodoForm이 자기 상태로 가진다.
- 입력창: `aria-label="할 일 제목"`, 버튼 글자: "추가"
- 입력창에 `maxLength`를 걸지 않는다. 걸면 100자를 넘게 쓸 수 없어서 "제목은 100자 이하로 입력해 주세요."를 볼 수 없다.
- `<form>`으로 감싼다. 그래서 입력창에서 Enter를 눌러도 "추가" 버튼을 누른 것과 같다.

**사용자 동작과 결과**

| 동작 | 결과 |
|------|------|
| 제목을 쓰고 "추가" 클릭 (또는 Enter) | `onAdd(입력한 글자)`를 부른다 |
| → 추가 성공 | 입력창을 비운다. 새 할 일이 목록 맨 위에 보인다 (v0.4: 지금 필터에 맞을 때만) |
| → 빈 칸 / 공백만 있음 | 요청을 보내지 않는다. 에러 자리에 "제목을 입력해 주세요." 입력창 글자는 그대로 둔다 |
| → 공백을 자른 뒤 100자 초과 | 요청을 보내지 않는다. 에러 자리에 "제목은 100자 이하로 입력해 주세요." 입력창 글자는 그대로 둔다 |
| → 서버가 제목 규칙으로 거부 | 위 두 줄과 같은 문구. 입력창 글자는 그대로 둔다 |
| → 그 밖의 실패 (v0.2~) | 에러 자리에 "요청에 실패했습니다. 다시 시도해 주세요." 입력창 글자는 그대로 둔다 |
| 추가 요청 중, 목록 불러오는 중 (v0.2~) | 입력창과 "추가" 버튼이 잠긴다. 버튼 글자는 "추가" 그대로이다 |

### 3-4. ErrorMessage (src/components/ErrorMessage.tsx)

**Props (v0.1)**

```ts
type ErrorMessageProps = {
  // 보여줄 문구. null이면 아무것도 그리지 않는다
  message: string | null;
};
```

- 문구가 있을 때 `role="alert"`를 붙인다.

**에러 문구 규칙**

에러 문구가 보이는 곳은 두 군데이다.

| 곳 | 보이는 문구 | 누가 가지고 있나 |
|------|------|------|
| 에러 자리 (입력창 아래) | 추가할 때의 제목 규칙 문구, 모든 요청 실패 문구 (불러오기 실패 포함) | TodoApp의 `errorMessage` |
| 수정 입력창 아래 (v0.4) | 수정할 때의 제목 규칙 문구 | 수정 모드인 TodoItem의 `editError` |

1. 에러 자리에는 문구가 많아야 하나 보인다. `errorMessage`가 하나뿐이기 때문이다.
2. 수정 입력창 아래에도 문구가 많아야 하나 보인다. 수정 모드는 한 번에 한 할 일만 될 수 있기 때문이다.
3. **화면 전체로 보면 에러 문구는 한 번에 많아야 하나만 보인다.**
   - 수정 저장(Enter)을 시작하면 에러 자리 문구와 수정 입력창 아래 문구를 **둘 다** 지운다. 결과에 따라 둘 중 한 곳에만 새 문구가 나온다.
   - 수정 입력창 아래 문구는 수정 모드가 끝나면 사라진다. 추가, 전환, 삭제를 하려면 수정 입력창 바깥을 누르게 되므로 수정이 먼저 취소되고 문구도 사라진다.
   - 수정 모드에 들어가도 에러 자리 문구는 지우지 않는다. 이때 수정 입력창 아래에는 아직 문구가 없으므로 하나만 보인다.
4. **에러 자리 문구가 사라지는 때:** 다음 동작(추가, 완료 전환, 삭제, 수정 저장)을 시작할 때 지운다. 그 동작이 또 실패하면 새 문구가 보인다.
   - 입력창에 글자를 치거나, 필터를 바꾸거나, 수정 모드에 들어가는 것만으로는 지우지 않는다.

### 3-5. FilterBar (src/components/FilterBar.tsx, v0.4)

**Props (v0.4)**

```ts
type FilterBarProps = {
  // 지금 고른 필터
  filter: TodoFilter;
  // 다른 필터를 눌렀을 때
  onChange: (filter: TodoFilter) => void;
};
```

- 버튼 세 개: "전체"(`"all"`), "진행 중"(`"active"`), "완료"(`"completed"`)
- 고른 버튼에는 `aria-pressed="true"`, 나머지는 `"false"`를 붙인다.

**사용자 동작과 결과**

| 동작 | 결과 |
|------|------|
| "전체" 클릭 | 모든 할 일을 보여준다 |
| "진행 중" 클릭 | `completed`가 `false`인 할 일만 보여준다 |
| "완료" 클릭 | `completed`가 `true`인 할 일만 보여준다 |
| 걸러진 결과가 비었음 | "할 일이 없습니다" (PRD F-05) |

- 필터는 서버에 요청하지 않는다. TodoApp이 가진 `todos`를 화면에서 거른다 (API_SPEC.md 5장).
- 필터를 건 상태에서 완료를 전환하면, 그 할 일이 조건에서 벗어나 목록에서 안 보이게 될 수 있다. 예: "진행 중"에서 체크하면 사라진다.
- 걸러도 순서는 그대로(최신순)이다.

### 3-6. TodoList (src/components/TodoList.tsx)

**Props (v0.1)**

```ts
type TodoListProps = {
  // 보여줄 할 일 (v0.4부터는 필터를 건 뒤의 목록)
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
};
```

- v0.2, v0.4에서 더하는 Props는 4장에 있다. TodoList는 받은 Props를 TodoItem에 나눠 넘긴다. 예: `pendingIds`에 그 할 일의 id가 있으면 TodoItem에 `isPending={true}`를 넘긴다.
- `todos`가 비었으면 "할 일이 없습니다"를 보여준다 (`<p>`).
- 비어 있지 않으면 `<ul>` 안에 받은 순서 그대로 TodoItem을 그린다. 정렬은 하지 않는다 (서버가 최신순으로 주고, 새 할 일은 TodoApp이 맨 앞에 넣는다).
- 각 TodoItem의 `key`는 `todo.id`이다. 제목은 중복될 수 있어서 `key`로 쓰지 않는다.

### 3-7. TodoItem (src/components/TodoItem.tsx)

**Props (v0.1)**

```ts
type TodoItemProps = {
  todo: Todo;
  // 바꾼 뒤의 값(지금의 반대)을 넘긴다
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
};
```

- v0.2, v0.4에서 더하는 Props는 4장에 있다.

**그리는 것**
- `<li>` 안에 체크박스, 제목, "삭제" 버튼
- 체크박스: `checked={todo.completed}`, `aria-label`은 할 일 제목
- 제목은 글자 그대로 보여준다.
- `isPending`(v0.2~)이 true면 체크박스와 "삭제" 버튼을 잠근다. 다른 할 일은 잠그지 않는다.

**사용자 동작과 결과 (v0.1~)**

| 동작 | 결과 |
|------|------|
| 체크박스 클릭 | `onToggle(todo.id, !todo.completed)`. 성공하면 체크 상태가 바뀌고 자리는 그대로이다 (PRD F-03) |
| "삭제" 클릭 | 확인 창 없이 `onDelete(todo.id)`. 성공하면 목록에서 사라진다 (PRD F-04) |
| 요청 중 (v0.2~) | 체크박스와 "삭제" 버튼이 잠긴다. 응답이 오기 전까지 체크 상태는 바뀌지 않는다 |
| 요청 실패 (v0.2~) | 할 일은 그대로 남고, 에러 자리에 "요청에 실패했습니다. 다시 시도해 주세요." (찾는 할 일이 없음 404도 같다) |

**제목 수정 (v0.4)**

- 수정 모드인지는 부모가 넘기는 `isEditing`으로 안다. 저장 요청 중인지는 부모가 넘기는 `isPending`으로 안다 (`handleEdit`이 `pendingIds`에 id를 넣기 때문이다).
- 수정 중인 글자(`draft`)와 수정 입력창 아래 문구(`editError`)는 TodoItem이 자기 상태로 가진다. 수정 모드가 끝나면 둘 다 지운다.

| 동작 | 결과 |
|------|------|
| 제목 더블클릭 | `onStartEdit(todo.id)`를 부른다. `isPending`이면 무시한다. 다른 할 일이 수정 모드면 부모가 무시한다 |
| → 수정 모드가 됨 | 제목 자리에 입력창(`aria-label="제목 수정"`)이 지금 제목을 담고 나타나고, 커서가 들어간다 |
| Enter | `editError`를 지우고 `onEdit(todo.id, draft)`를 부른다 |
| → `"saved"` | 부모가 수정 모드를 끝낸다. 새 제목이 같은 자리에 보인다 |
| → `"titleError"` | 수정 모드 유지. 수정 입력창 바로 아래에 받은 문구("제목을 입력해 주세요." / "제목은 100자 이하로 입력해 주세요.") |
| → `"failed"` | 수정 모드 유지. 에러 자리에 문구가 보인다 |
| Esc | `onCancelEdit()`를 부른다. 원래 제목으로 돌아간다 |
| 입력창 바깥 클릭 (포커스 벗어남) | Esc와 같다 (취소) |
| 저장 요청 중 (`isPending`이 true) | 입력창을 `readOnly`로 둔다. 이때는 Esc와 바깥 클릭을 무시한다. 체크박스와 "삭제" 버튼도 잠긴다 |

- **저장 요청 중에 `disabled` 대신 `readOnly`를 쓰는 이유:** 입력창을 `disabled`로 바꾸면 브라우저가 그 입력창에서 커서를 빼낸다. 커서가 빠지는 것은 "입력창 바깥 클릭"과 똑같이 "포커스 벗어남"으로 처리된다. 그러면 저장 결과를 기다리는 중인데 취소가 실행되어 버린다. `readOnly`는 커서를 그대로 두므로 이런 일이 없다.
- 수정 입력창에도 `maxLength`를 걸지 않는다 (3-3과 같은 이유).
- 제목이 그대로여도 Enter를 누르면 저장 요청을 보낸다. 규칙을 단순하게 두기 위해서다.
- 수정 모드에서도 체크박스와 "삭제" 버튼은 그대로 보인다. 누르면 입력창에서 커서가 빠지므로 수정은 취소되고, 누른 동작이 실행된다.

## 4. 버전별로 더하는 Props

3장의 Props 코드는 v0.1 기준이다. 아래 Props는 그 버전이 되었을 때 더한다. 그 전 버전에서는 만들지 않는다.

### 4-1. v0.2에서 더하는 Props (서버 요청)

| 컴포넌트 | Props | 타입 | 설명 |
|------|------|------|------|
| TodoForm | disabled | `boolean` | true면 입력창과 "추가" 버튼을 잠근다. 추가 요청 중이거나 목록을 불러오는 중일 때 true |
| TodoList | pendingIds | `number[]` | 요청 중인 할 일의 id 목록 |
| TodoItem | isPending | `boolean` | true면 이 할 일의 요청(전환, 삭제, v0.4부터 수정 저장)이 진행 중이다 |

### 4-2. v0.4에서 더하는 Props (필터, 수정)

| 컴포넌트 | Props | 타입 | 설명 |
|------|------|------|------|
| TodoList | editingId | `number` 또는 `null` | 수정 모드인 할 일의 id. 없으면 `null` |
| TodoList | onStartEdit | `(id: number) => void` | TodoItem에 그대로 넘긴다 |
| TodoList | onCancelEdit | `() => void` | TodoItem에 그대로 넘긴다 |
| TodoList | onEdit | `(id: number, title: string) => Promise<EditResult>` | TodoItem에 그대로 넘긴다 |
| TodoItem | isEditing | `boolean` | true면 이 할 일이 수정 모드이다. TodoList가 `todo.id === editingId`로 정한다 |
| TodoItem | onStartEdit | `(id: number) => void` | 제목을 더블클릭하면 부른다 |
| TodoItem | onCancelEdit | `() => void` | Esc를 누르거나 입력창 바깥을 누르면 부른다 |
| TodoItem | onEdit | `(id: number, title: string) => Promise<EditResult>` | Enter를 누르면 부른다 |

- FilterBar는 v0.4에 처음 만드는 컴포넌트이다. Props는 3-5에 있다.

## 5. 화면 상태별 문구

문구 자체는 PRD 7장 "화면 문구" 표에 모아 두었다. 이 표는 그 문구가 **언제, 어디에** 보이는지 정리한다.

| 상황 | 문구 | 보이는 곳 | 도입 버전 |
|------|------|------|------|
| 목록을 불러오는 중 | 불러오는 중... | 목록 자리 | v0.2 |
| 할 일이 하나도 없음 | 할 일이 없습니다 | 목록 자리 | v0.1 |
| 필터 결과가 비었음 | 할 일이 없습니다 | 목록 자리 | v0.4 |
| 추가: 빈 칸 / 공백만 있음 | 제목을 입력해 주세요. | 에러 자리 | v0.1 |
| 추가: 100자 초과 | 제목은 100자 이하로 입력해 주세요. | 에러 자리 | v0.1 |
| 수정: 빈 칸 / 공백만 있음 | 제목을 입력해 주세요. | 수정 입력창 아래 | v0.4 |
| 수정: 100자 초과 | 제목은 100자 이하로 입력해 주세요. | 수정 입력창 아래 | v0.4 |
| 목록 불러오기 실패 | 요청에 실패했습니다. 다시 시도해 주세요. | 에러 자리 (목록 자리는 할 일이 없으면 비움) | v0.2 |
| 추가·전환·삭제·수정 요청 실패 (제목 규칙 제외) | 요청에 실패했습니다. 다시 시도해 주세요. | 에러 자리 | v0.2 (수정은 v0.4) |

- 제목 규칙 문구는 src/lib의 Zod 규칙에 적힌 문구를 가져다 쓴다. 컴포넌트 안에 같은 글자를 다시 적지 않는다.
- 요청 실패 문구와 "할 일이 없습니다", "불러오는 중..."은 각각 한 곳에 상수로 두고 가져다 쓴다.

## 6. 버전별로 만드는 범위

| 버전 | 만드는 것 | 만들지 않는 것 |
|------|------|------|
| v0.1 | Page, TodoApp, TodoForm, ErrorMessage, TodoList, TodoItem (추가, 전환, 삭제, 빈 목록, 제목 규칙 문구) | 로딩 문구, 요청 실패 문구, 요청 중 잠금, FilterBar, 수정 |
| v0.2 | 서버 요청, "불러오는 중...", 요청 실패 문구, 요청 중 잠금 (`isAdding`, `pendingIds`, 4-1의 Props) | FilterBar, 수정 |
| v0.3 | 컴포넌트는 바꾸지 않는다 (저장 위치만 DB로 바뀐다) | FilterBar, 수정 |
| v0.4 | FilterBar, 제목 수정 (`editingId`, `filter`, `TodoFilter`, `EditResult`, 4-2의 Props) | — |
| v1.0 | 컴포넌트는 바꾸지 않는다 (배포) | — |

## 7. 결정 사항
PRD와 API_SPEC에 없던 화면 동작을 정한 것이다. 질문해서 정한 것과, 이 문서를 쓰면서 정하고 검토 후 받아들인 것을 모두 적는다.

**화면 동작**
- **로딩 문구:** 목록을 불러오는 동안 목록 자리에 "불러오는 중..."을 보여준다 (v0.2~). 그동안 입력창과 "추가" 버튼은 잠근다.
- **화면 바꾸는 때:** 추가·전환·삭제·수정 모두 서버 응답을 받은 뒤에 화면을 바꾼다. 실패하면 목록은 그대로이다.
- **요청 중 잠금:** 추가 요청 중에는 입력창과 "추가" 버튼을, 전환·삭제·수정 요청 중에는 그 할 일의 체크박스와 "삭제" 버튼을 잠근다. 같은 요청이 두 번 가지 않게 하기 위해서다.
- **불러오기 실패:** 실패 문구를 `errorMessage`에 넣어 에러 자리 한 곳에 보여준다. "할 일이 없습니다"는 보여주지 않는다. 추가는 막지 않고, 추가에 성공하면 목록 자리에 새 할 일이 보인다.

**에러 문구**
- **보이는 곳:** 에러 자리(입력창 바로 아래) 한 곳에 보여준다. 수정할 때의 제목 규칙 문구만 수정 입력창 아래에 보여준다.
- **보이는 개수:** 화면 전체에서 에러 문구는 한 번에 많아야 하나만 보인다 (3-4).
- **지우는 때:** 다음 동작(추가, 전환, 삭제, 수정 저장)을 시작할 때 지운다.

**제목 수정 (v0.4)**
- **조작:** Enter는 저장, Esc와 입력창 바깥 클릭은 취소이다. 저장·취소 버튼은 따로 두지 않는다.
- **수정 모드는 한 번에 하나:** TodoApp의 `editingId`로 정한다. 다른 할 일이 수정 모드면 더블클릭을 무시한다.
- **저장 요청 중인지 아는 방법:** 부모가 넘기는 `isPending`으로 안다. `handleEdit`이 요청 동안 `pendingIds`에 id를 넣는다.
- **저장 요청 중 입력창:** `disabled`가 아니라 `readOnly`로 둔다. 커서가 빠져서 취소가 잘못 실행되는 것을 막기 위해서다.
- **제목이 그대로일 때:** Enter를 누르면 그래도 저장 요청을 보낸다.

**입력창**
- **`maxLength`:** 추가 입력창과 수정 입력창 모두 걸지 않는다. 걸면 100자 초과 문구를 볼 수 없다.

**이름 (aria-label, 글자, role)**

| 요소 | 이름 |
|------|------|
| 추가 입력창 | `aria-label="할 일 제목"` |
| 추가 버튼 | 글자 "추가" |
| 체크박스 | `aria-label`은 할 일 제목 |
| 삭제 버튼 | 글자 "삭제" |
| 수정 입력창 (v0.4) | `aria-label="제목 수정"` |
| 필터 버튼 (v0.4) | 글자 "전체", "진행 중", "완료". 고른 버튼에 `aria-pressed="true"` |
| 에러 문구 | `role="alert"` |

**구조**
- **요청과 검사 담당:** 서버 요청과 제목 검사는 TodoApp만 한다. 다른 컴포넌트는 Props로 받은 함수만 부른다.
- **화면 전용 타입 위치:** `TodoFilter`, `EditResult`는 src/types/ui.ts에 둔다.
- **Props 적는 방법:** Props 코드는 v0.1 기준으로 적고, v0.2와 v0.4에서 더하는 Props는 4장 표에 따로 적는다.
- **문구 모으는 곳:** 화면 문구는 PRD 7장에 모은다. 이 문서는 문구가 보이는 때와 곳만 적는다.

## 8. 용어 설명

**React와 컴포넌트**
- **컴포넌트:** 화면을 이루는 작은 조각이다. 함수 하나가 화면 한 조각을 그린다. 예: 할 일 한 줄(TodoItem)
- **컴포넌트 트리:** 어떤 컴포넌트가 어떤 컴포넌트를 안에 그리는지 나무 모양으로 그린 것이다. 위가 부모, 아래가 자식이다.
- **× N (컴포넌트 트리):** 그 컴포넌트를 여러 번 그린다는 뜻이다. N은 할 일 개수이다. 할 일이 3개면 TodoItem을 3번 그린다.
- **Props:** 부모 컴포넌트가 자식 컴포넌트에게 넘겨주는 값이다. 자식은 받은 Props를 바꾸지 않고 쓰기만 한다.
- **상태 (useState):** 컴포넌트가 기억하는 값이다. 값이 바뀌면 화면이 다시 그려진다.
- **"use client":** 이 파일의 컴포넌트가 브라우저에서 동작한다는 표시이다. 상태나 클릭 처리를 쓰려면 필요하다.
- **서버 컴포넌트:** "use client"가 없는 컴포넌트이다. Next.js가 서버에서 미리 화면(HTML)을 만들어 브라우저에 보낸다. Page는 TodoApp을 그리기만 하고 클릭이나 상태가 없으므로 서버 컴포넌트로 충분하다. TodoApp은 클릭할 때마다 화면을 바꿔야 하므로 브라우저에서 동작해야 하고, 그래서 "use client"를 붙인다.
- **key:** React가 목록의 각 줄을 구분하는 이름표이다. 줄마다 달라야 해서 id를 쓴다.

**함수를 Props로 넘기기**

부모는 값뿐 아니라 **함수도** Props로 넘길 수 있다. 자식이 그 함수를 부르면 **부모 쪽 코드가 실행된다.**

할 일 목록(`todos` 상태)은 TodoApp(부모)만 가지고 있다. TodoItem(자식)의 "삭제" 버튼은 목록을 직접 바꿀 수 없다. 그래서 부모가 "삭제할 때 이 함수를 불러 줘"라며 함수를 넘겨주고, 자식은 버튼이 눌리면 그 함수를 부른다.

```tsx
// 부모: TodoApp
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 실제로 지우는 함수. todos 상태는 부모만 바꿀 수 있다
  function handleDelete(id: number) {
    setTodos(todos.filter((todo) => todo.id !== id));
  }

  // 함수를 onDelete라는 이름으로 넘긴다 (중간의 TodoList는 생략)
  return <TodoItem todo={todos[0]} onDelete={handleDelete} />;
}

// 자식: TodoItem
function TodoItem({ todo, onDelete }: TodoItemProps) {
  // 버튼을 누르면 부모가 넘겨준 함수를 부른다
  return <button onClick={() => onDelete(todo.id)}>삭제</button>;
}
```

1. 사용자가 "삭제" 버튼을 누른다.
2. TodoItem이 `onDelete(todo.id)`를 부른다. `onDelete`의 정체는 부모의 `handleDelete`이다.
3. 부모의 `handleDelete`가 실행되어 `todos` 상태에서 그 할 일을 뺀다.
4. 상태가 바뀌었으므로 화면이 다시 그려지고, 그 할 일이 사라진다.

- 리모컨에 비유할 수 있다. 자식은 리모컨 버튼(`onDelete`)만 가지고 있고, 실제로 화면(상태)을 바꾸는 것은 부모이다.
- Props 이름은 `on` + 동작 이름(`onAdd`, `onDelete`)으로 짓는 것이 React의 관례이다. "이 일이 일어나면(on) 부를 함수"라는 뜻이다.
- `todos.filter(...)`는 조건에 맞는 것만 남긴 새 배열을 만든다. `todo.id !== id`는 "id가 다르다"는 뜻이므로, 지울 할 일만 빠진다.

**TypeScript 표기**
- **함수 타입 `(title: string) => Promise<boolean>`:** "글자(`title`) 하나를 받아서, 나중에 true나 false를 돌려주는 함수"라는 뜻이다. `=>` 왼쪽은 받는 값, 오른쪽은 돌려주는 값이다.
- **`() => void`:** 아무것도 받지 않고, 돌려주는 값도 없는 함수이다.
- **void:** 돌려주는 값이 없다는 뜻이다.
- **Promise:** 지금 바로가 아니라 나중에 결과가 오는 값이다. 서버 응답처럼 기다려야 하는 일에 쓴다. `Promise<boolean>`은 나중에 true나 false가 온다는 뜻이다.
- **null:** "값이 없음"을 뜻하는 값이다. `string | null`은 "글자이거나, 값이 없음"이다.
- **`number[]`:** 숫자 여러 개를 담은 배열이다.
- **`EditResult`의 맨 앞 `|`:** 여러 줄로 나눠 쓸 때 줄 모양을 맞추려고 첫 줄 앞에도 `|`를 붙인 것이다. 뜻은 없고, 빼도 같다.
- **`status`로 경우 나누기:** `EditResult`는 세 모양 중 하나이다. 받는 쪽은 `result.status`가 `"saved"`, `"titleError"`, `"failed"` 중 무엇인지 보고 어느 경우인지 안다. `message`는 `"titleError"`일 때만 있다.
- **표 안의 "`A`, `B` 중 하나" / "`A` 또는 `B`":** 코드로는 `A | B`이다. 표 칸을 나누는 `|`와 헷갈리지 않게 말로 적었다.
- **`!` (값 앞):** 반대 값을 뜻한다. `!true`는 `false`이다.

**HTML과 JSX**
- **`<form>`:** 입력창과 버튼을 묶는 태그이다. 안에서 Enter를 누르면 제출 버튼을 누른 것과 같다.
- **`<input>`:** 글자를 입력하는 칸이다. 체크박스도 `<input type="checkbox">`로 만든다.
- **`<button>`:** 누를 수 있는 버튼이다.
- **`<p>`:** 문단 하나이다. 여기서는 "할 일이 없습니다" 같은 문구 한 줄에 쓴다.
- **`<ul>`, `<li>`:** `<ul>`은 목록 전체, `<li>`는 목록의 한 줄이다.
- **JSX 중괄호 `{ }`:** 태그 안에서 JavaScript 값을 쓰는 자리이다. `checked={todo.completed}`는 "체크 여부를 `todo.completed` 값으로 정한다"는 뜻이다.
- **잠금 (disabled):** 버튼이나 입력창을 누르거나 쓸 수 없게 막는 것이다.
- **readOnly:** 입력창을 볼 수는 있지만 글자를 바꿀 수 없게 하는 것이다. disabled와 달리 커서가 빠지지 않는다.
- **포커스:** 지금 키보드 입력을 받는 곳이다. 입력창 안에 커서가 깜빡이면 포커스가 있는 것이다.
- **포커스 벗어남:** 커서가 입력창에서 빠지는 것이다. 입력창 바깥을 누르거나, 입력창이 disabled가 될 때 일어난다.
- **maxLength:** 입력창에 쓸 수 있는 글자 수를 막는 HTML 속성이다.

**접근성과 테스트**
- **화면 읽기 프로그램 (스크린 리더):** 화면의 글자를 소리로 읽어 주는 프로그램이다. 눈이 불편한 사람이 쓴다.
- **aria-label:** 요소에 붙이는 이름이다. 화면 읽기 프로그램과 테스트가 이 이름으로 요소를 찾는다.
- **aria-pressed:** 버튼이 눌린 상태인지 알려 주는 표시이다.
- **role="alert":** 중요한 문구라는 표시이다. 화면 읽기 프로그램이 문구가 나타나자마자 읽어 준다. **IDEA.md "지금은 빼는 것"의 알림 기능과는 관계없다.** 휴대폰 알림이나 메일을 보내는 것이 아니라, 화면 안의 에러 문구에 붙이는 표시일 뿐이다.
- **getByRole:** React Testing Library의 함수이다. 역할(role)과 이름으로 화면의 요소를 찾는다. 예: `getByRole("alert")`는 에러 문구를, `getByRole("button", { name: "추가" })`는 "추가" 버튼을 찾는다.

**이 문서에서 쓰는 말**
- **에러 자리, 목록 자리:** 1장 "화면에서 보이는 자리" 그림을 본다.
- **응답 값으로 바꾼다:** 서버가 돌려준 `{ "todo": {...} }`의 `todo`를, 목록에서 같은 id를 가진 할 일 자리에 넣는 것이다. 자리는 그대로이고 내용만 바뀐다.
- **204:** 서버가 "성공했고, 돌려줄 본문은 없다"고 알려주는 상태 코드이다. 삭제가 성공하면 온다 (API_SPEC.md 6장).
- **수정 모드:** 제목을 더블클릭해서 제목 자리에 입력창이 나타난 상태이다 (v0.4).
- **필터를 건 목록:** 전체 할 일 중 조건에 맞는 것만 남긴 목록이다. 원래 목록은 그대로 두고 화면에만 걸러서 보여준다.
- **상수:** 한 번 정하면 바뀌지 않는 값이다. 같은 문구를 여러 곳에 적지 않고 한 곳에서 가져다 쓴다.
