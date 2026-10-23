# CLAUDE.md - Todo App

## 프로젝트 개요
혼자 쓰는 간단한 할 일 목록 웹 앱 (초보자 학습용)

## 기술 스택
- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS
- DB: Postgres (Neon) + Drizzle ORM
- 검증: Zod
- 테스트: Jest + React Testing Library
- 배포: Vercel

## 폴더 구조
- app/ : 페이지와 API 라우트
- src/components/ : 화면 컴포넌트
- src/lib/ : 서버 로직, DB
- src/types/ : 공유 타입
- docs/ : 명세 문서

## 반드시 참고할 문서
- docs/IDEA.md (아이디어, 세부 규칙, 버전 로드맵)
- docs/PRD.md, docs/TRD.md, docs/DATA_MODEL.md
- docs/API_SPEC.md, docs/COMPONENT_SPEC.md, docs/TEST_CASES.md
- 문서끼리 내용이 다르면 임의로 고르지 말고 먼저 질문할 것

## 핵심 규칙 요약 (docs/IDEA.md 기준)
- 제목: 앞뒤 공백 제거 후 1~100자, 공백만 있으면 추가 안 함, 100자 초과 시 에러 메시지, 중복 허용
- 정렬: 만든 시간 기준 최신순, 완료해도 자리 유지
- 삭제: 확인 창 없이 바로 삭제
- 빈 목록 문구: "할 일이 없습니다"
- 서버 요청 실패 시 에러 메시지 표시
- 지금은 빼는 것: 로그인, 공유, 알림, 마감일, 카테고리
- 공개 배포이므로 개인 정보를 다루는 기능은 만들지 말 것

## 버전 로드맵
- v0.1 화면만 (브라우저 메모리)
- v0.2 API 연결 (서버 메모리)
- v0.3 DB 저장 (새로고침해도 데이터 유지 완성)
- v0.4 필터(전체/진행 중/완료)와 수정
- v1.0 배포
- 현재 버전 범위를 넘는 기능은 미리 만들지 말 것

## 규칙
- 명세에 없는 기능을 임의로 추가하지 말 것
- any 타입 금지
- 한 번에 한 기능만 작업하고, 끝나면 무엇을 바꿨는지 요약할 것
- 테스트를 삭제하거나 skip하지 말 것
- 테스트가 실패하면 테스트가 아닌 구현을 고칠 것
- console.log는 디버깅 후 제거할 것
- 초보자가 이해할 수 있게 주석은 한국어로 짧게
- DB 접속 정보 같은 비밀 값은 .env.local에만 두고 커밋하지 말 것

## 자주 쓰는 명령
- 개발 서버: npm run dev
- 테스트: npm test
