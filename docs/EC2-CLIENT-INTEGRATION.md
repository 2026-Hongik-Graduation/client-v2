# POFIT — EC2 QA 프론트 연동 가이드 (2026-11-05)

## 기준 문서
- Notion 졸업 프로젝트 / API 명세서: https://app.notion.com/p/40b1e87e9a8e81f1aab1f7252c410b4f
- 레포 공통 프록시 설명: [QA-API.md](./QA-API.md)
- EC2 공개 Swagger API: https://43-203-204-29.sslip.io/v3/api-docs

## 프론트 로컬 연결
기존 `src/app/api/[...path]/route.ts` 서버 측 프록시를 그대로 사용한다. 토큰을 브라우저 JavaScript에 노출하지 않는다.

`C:\Users\1234\Desktop\졸프_FE\.env.local` (Git에 커밋하지 않음):

```dotenv
QA_BACKEND_ORIGIN=https://43-203-204-29.sslip.io
```

프론트 루트에서 `npm install`, `npm run dev`. 브라우저는 `http://localhost:3000/login`으로 접속한다.

프론트는 **같은 출처의** `/api/auth/login`을 호출하며, Next 서버가 EC2 백엔드 `/api/auth/login`으로 전달한다. 인증·갱신·로그아웃 쿠키는 기존 Next 프록시에서 관리한다.

## 지원되는 기본 사용자 흐름
1. `/signup`: 이메일 인증코드 발송/검증, 계정 생성, 로그인 (실제 메일 발송은 SMTP 설정 필요).
2. `/onboarding`: `GET /api/members/me/profile`로 진행 상태 복원, 기본정보 `PUT /basic`, 희망 직군 `PUT /job`.
3. `/login`: 쿠키 기반 로그인, 온보딩 상태 확인, 로그인 후 경험 화면 복귀.
4. `/experiences`: 사용자 경험 목록, 키워드/태그/상태 검색, 빈 화면과 오류 처리.
5. `/experiences/new`: 제목·기간·태그 선택 후 `POST /api/experiences`. 작성 방식은 QUICK만 활성.
6. `/experiences/{id}`: 태그별 질문 GET → 답변 PUT → 상태 PATCH, 수정·삭제.

## 2026-11-05 읽기 전용 검증
- HTTPS `/v3/api-docs`: HTTP 200, 인증서 검증 통과.
- `GET /api/experience-tags`: 로그인하지 않았을 때 HTTP 401 (의도된 보안 동작).
- EC2 OpenAPI에 `/api/experiences`, `/api/experiences/{id}`, `/answers`, `/status` 등록 확인.
- 실제 계정 인증 및 DB CRUD 검증은 **미실시**. 테스트 전용 계정으로 별도 확인 필요.
- EC2 IP는 서버 재시작 시 바뀔 수 있으므로 HTTPS 호스트 변경 시 `.env.local`과 Vercel 설정을 갱신한다.

## 테스트 계정으로 검증할 순서
1. 로그인하고 `/experiences`로 이동, 로그인 유지·로그아웃 확인.
2. 새 경험 만들기 → STAR 선택 → 제목/기간 지정 → 생성.
3. 빈 답변으로 임시저장 → 새로고침해도 유지되는지 확인.
4. 질문 모두 작성 → 완료 → 목록 표시/검색/필터 확인.
5. 상세에서 제목/답변 수정 → 재접속/새로고침으로 저장 확인.
6. 질문 추가/삭제 및 보존 확인 → 기존 경험 삭제 → 목록에서 사라지는지 확인.
7. 로그아웃 후 경험 페이지 접근 차단과 타 계정 소유권 차단 확인.
8. 백엔드 장애·401·400·404 등 오류 안내와 모바일/키보드 접근성 확인.

실제 개인정보·기존 사용자 경험으로 테스트하지 말 것. 운영/QA DB에 영향을 주는 POST/PUT/PATCH/DELETE는 **테스트 계정과 허가된 격리 데이터**로 실행할 것.

## 남은 과제
- EC2 SMTP와 신규 가입 메일 실제 발송 검증.
- QA 테스트 계정 실 로그인 후 E2E 통합 테스트.
- Google OAuth 프론트 콜백 안전한 연계 (현재 UI는 준비 중).
- Figma 360/720/1023/1440 정밀 시각 검증 및 자동화 테스트.
- 서비스 전체 도메인/운영 Vercel 환경에 `QA_BACKEND_ORIGIN` 적용.
