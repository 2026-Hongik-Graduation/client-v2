# 자소서 P0 구현 노트 — 2026-11-05

## 작업 브랜치
`feat/cover-letter-p0-20261105` (선행 경험·인증 구현 커밋 `4a34153`에서 분기).

## 사용자 동선
1. `/login` 정상 로그인 또는 개발 환경에서 **개발용 로그인 건너뛰기** 클릭.
2. `/cover-letters`에서 자소서 목록 / 기업명·직무 검색 / 작성상태 필터.
3. `/cover-letters/new`에서 기업·직무·마감일과 공고 URL 또는 공고 원문 입력 → 저장.
4. `/cover-letters/{id}`에서 메타정보·채용공고 수정, 문항 등록·저장·삭제·정렬.
5. 문항마다 **저장한 경험 연결하기**에서 경험을 연결·해제. AI 초안은 이번 범위 밖.
6. **작성 버전 관리**에서 현재 저장된 문항 스냅샷 생성·복원.
7. 자소서 삭제는 확인 대화 후 영구삭제.

## 백엔드 매핑 (노션 '졸업 프로젝트/API 명세서' + 로컬 BE Controller 대조)
- `GET/POST /api/cover-letters`
- `GET/PATCH/DELETE /api/cover-letters/{id}`
- `POST /api/cover-letters/{id}/questions`
- `PATCH/DELETE /api/cover-letters/{id}/questions/{questionId}`
- `PUT /api/cover-letters/{id}/questions/order`
- `GET/PUT /api/cover-letters/{id}/posting`
- `GET/POST /api/cover-letters/{id}/versions`
- `POST /api/cover-letters/{id}/versions/{versionId}/restore`
- `GET/POST /api/cover-letters/{id}/questions/{questionId}/experiences`
- `DELETE /api/cover-letters/{id}/questions/{questionId}/experiences/{experienceId}`
- `GET /api/experiences` — 연결 가능한 경험 목록.

모든 실제 요청은 기존 Next.js 같은 출처 API 프록시를 통하며 토큰을 JS에 노출하지 않는다.

## 로그인 건너뛰기 (개발 전용)
- 개발 서버 `npm run dev`로 **localhost/127.0.0.1**에서 열린 `/login`에만 '개발용 로그인 건너뛰기' 버튼을 표시한다.
- 버튼은 로컬 `pofit_dev_preview` 쿠키를 설정한다. 해당 개발 브랜치의 경험/자소서 레이아웃은 이 쿠키를 개발 모드에서만 미리보기 자격으로 받아들인다.
- 경험/자소서 API 클라이언트가 미리보기 모드에서만 `src/lib/dev-preview.ts`의 브라우저 `localStorage` 기반 구현을 사용한다. **실제 EC2 API에 생성·수정·삭제 요청을 보내지 않는다.**
- 개발 미리보기는 실제 인증·인가·DB·메일 연동 성공을 뜻하지 않는다. 서비스 모드와 명확히 구분해 좌측 내비게이션에 '미리보기' 표시.
- 정상 로그인 성공 시 미리보기 쿠키를 삭제해 실제 API 응답이 표시되도록 한다.
- `NODE_ENV=production` 빌드에서는 개발 건너뛰기 버튼이 나타나지 않고 개발 쿠키도 페이지 인증을 대체할 수 없다. 또한 API 프록시는 JWT를 계속 요구하므로 개발 쿠키로 EC2 인증을 우회할 수 없다.
- 미리보기 데이터는 브라우저에만 있으므로 로그인 계정의 실제 데이터와 연동되지 않는다.

## 주의 및 후속 QA 항목
- 자소서의 `PATCH /cover-letters/{id}`는 null 날짜 초기화를 지원하지 않는다. 기존 마감일을 삭제하는 UI는 성공으로 표시하지 않는다.
- 채용공고 GET 오류를 '원래 빈 공고'로 처리하지 않고, 서버 장애 시 공고 저장 버튼을 비활성화한다.
- 버전 복원은 문항 스냅샷 기준이며 복원 과정에서 추가된 문항과 경험 연결이 소실될 수 있으므로 확인을 받는다.
- 글자 수는 유니코드 코드포인트 기준으로 표시·검증한다. 실제 백엔드와 한국어·이모지 경계 검증은 후속 QA 예정.
- 이 브랜치는 실제 EC2 계정으로 엔드투엔드 CRUD를 수행하지 않았다.
- 다음 종합 QA: 이메일 로그인→경험 생성/답변 저장→자소서 생성→문항 등록/수정→경험 연결→버전 저장/복원→수정·삭제→세션 만료/권한→모바일 시각·접근성.
- AI 기업 분석, 공고 수집, AI 초안·첨삭은 다음 구현 단계이며 이번 화면에서는 자동 생성하지 않는다.
