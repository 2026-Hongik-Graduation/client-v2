# POFIT — main 병합 이후 통합 QA 인수인계 (2026-11-05)

> **QA는 이 문서 작성 시점에 실행하지 않았다.** 과거 완료 표시는 ESLint/TypeScript/Next 빌드에 한정한다.
> 이 문서는 **새 ChatGPT 세션에서 로컬 PC의 실제 소스를 열어 통합 QA를 진행**하기 위한 기준이다.
> 병합 결과 / 최종 커밋은 이 문서가 포함된 `main`의 `git log -1` 및 원격 `origin/main`을 확인한다.

## 1. 리포지토리 / 참고
- 로컬 FE: `C:\Users\1234\Desktop\졸프_FE`
- 원격 FE: https://github.com/2026-Hongik-Graduation/client-v2
- QA 시작 기준: `main` (후속 `feat/cover-letter-ai-20261105`의 모든 누적 기능 포함)
- 로컬 BE 소스: `C:\Users\1234\Desktop\hongik-graduate-BE\be`
- EC2 QA 호스트: `https://43-203-204-29.sslip.io` (동적 IP/인증서 변경 가능, 무조건 재확인)
- HTTPS OpenAPI: `https://43-203-204-29.sslip.io/v3/api-docs`
- Figma 디자인 원본: https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=0-1
- Notion API 명세: https://app.notion.com/p/40b1e87e9a8e81f1aab1f7252c410b4f
- 가이드: `docs/EC2-CLIENT-INTEGRATION.md`, `docs/COVER-LETTER-P0.md`,
  `docs/APPLICATIONS-P0.md`, `docs/INTERVIEWS-P0.md`, `docs/COVER-LETTER-AI-P1.md`,
  `docs/07-INTEGRATION-QA.md`, `docs/QA-API.md`.
- 참고: 오래된 `README.md`와 `docs/07-INTEGRATION-QA.md`의 **2026-11-01 main 기준 미구현 표**는
  당시 로드맵이며 **현재 main 구현 상태를 반영하지 않을 수 있음**. 개별 P0/P1 구현 문서를 우선.

## 2. 히스토리 / 기능
이하 기능 커밋은 `feat/cover-letter-ai-20261105` 브랜치에 순차 포함되어 있다.
- `4a34153`: 인증·가입·온보딩 및 경험 CRUD + EC2 same-origin API 프록시 연동
- `6a8dae4`: 자소서 CRUD/문항/경험 연결/버전 + **개발용 로그인 패스**
- `ae6f7c4`: 지원 칸반/단계 이동/일정 캘린더/지원 상세
- `cf0acf1`: 면접 연습 질문·타이머·브라우저 로컬 저장/내보내기
- `d72bbdb`: 자소서 AI 문항 분석/전략/초안/첨삭/대화형 첨삭
- 본 문서 커밋은 위 누적 기능 이후 추가됨. 실제 `main` HEAD는 QA 시작 시 확인.

## 3. 시작 전 준비 / 명령 (Windows PowerShell)
```powershell
cd "C:\Users\1234\Desktop\졸프_FE"
git status -sb
git fetch origin main
git switch main
git pull --ff-only origin main
git status -sb
git log -7 --oneline
node -v
npm -v
npm ci
npm run lint
npm run build
```
- 새 세션의 assistant가 실제 PC 파일/터미널에 접근해야 하므로 연결된 **Local Desktop Commander**를 사용.
- `node_modules/next/dist/docs` 및 루트 `AGENTS.md` 지침 확인 후 Next 코드 수정.
- 최소 `.env.local` 설정 (파일은 이미 로컬에 있을 수 있음, 커밋 금지):
```dotenv
QA_BACKEND_ORIGIN=https://43-203-204-29.sslip.io
```
- `npm run dev` 실행 후 `http://localhost:3000/login` 접속. 서버가 이미 실행 중이면 포트/프로세스 확인.
- 환경 변수는 `QA_BACKEND_ORIGIN`이며 **NEXT_PUBLIC_ 접두사 사용 금지**.
- `/api/[...path]`의 Next 서버 프록시는 JWT를 HttpOnly 쿠키로 다루고 로그인·갱신·로그아웃 처리.
  EC2 호스트가 교체되면 공개 OpenAPI와 실제 TLS/연결을 재검증한 후 `.env.local`을 업데이트.
- `npm run lint`, `npm run build`는 이번 병합 전에도 통과한 **정적 검사**이다.
  테스트 스크립트(`npm test`)는 아직 `package.json`에 없다. 브라우저 자동화 설치 여부 먼저 확인.

## 4. 테스트의 두 모드 — 반드시 구분
### A. 개발용 로그인 패스/로컬 미리보기
- `NODE_ENV=development` + `localhost`/`127.0.0.1`에서만 `/login`의
  **개발용 로그인 건너뛰기** 버튼 표시.
- 쿠키: `pofit_dev_preview=1`; 브라우저 localStorage의
  `pofit_dev_preview_store_v1`에 경험/자소서/지원/AI 모의 데이터를 보관.
- 이 모드는 **EC2 API로 CRUD를 보내지 않아야 한다**. Developer Tools/네트워크로 검증.
- AI 응답은 `LOCAL_PREVIEW`, `isMock=true`, `MOCK_ONLY` — AI 성능 검증 대상으로 취급 금지.
- 미리보기에서의 저장, 지원/첨삭 대화 기록, 새로고침, 로그아웃을 점검.
- **미리보기 데이터와 실제 사용자 데이터가 섞이면 P0**. 정상 로그인하면 preview cookie 제거.
- 프로덕션 `npm run build && npm start`에서는 패스 버튼이 없어야 하고 가짜 쿠키만으로 서버 API 불가.

### B. 실 EC2 인증·쓰기
- 실제 E2E는 **사용자가 허가한 QA 전용 계정과 테스트 데이터**로만 수행.
  실사용자 계정/문서/경험을 임의 변경·삭제하지 말 것.
- 테스트 계정/SMTP/AI 과금·쿼터 접근 권한이 없다면, 해당 케이스는 **BLOCKED**로 기록.
  ID/PW/API 키/인증코드를 코드·채팅 로그·스크린샷·Git·이슈에 노출하지 말 것.
- 로그인 → `pofit_dev_preview` 미설정 확인 → 쿠키 기반 API → 실제 EC2 반환 `isMock` 확인.
- 오류 시 백엔드 로그가 필요할 수 있으나 개인정보·토큰 마스킹 필수.

## 5. 통합 QA 케이스 — 우선순위 높은 순서
### G0: 로그인/기본 보안 (실계정/미리보기 각각)
- [ ] [G0-01] `/`, `/signup`, `/find-password`, `/login` 진입/탭 이동.
- [ ] [G0-02] 로그인 성공/실패, 인증 만료, 유지 로그인, 새로고침 후 상태 보존.
- [ ] [G0-03] 신규 가입 이메일 OTP의 정상/만료/재발송 처리 (SMTP 가능할 때만).
- [ ] [G0-04] 온보딩 나이·성별·학교·희망 직군 단계 저장 및 복귀.
- [ ] [G0-05] 로그아웃 후 `/experiences`, `/cover-letters`, `/applications`,
  `/interviews` 직접 접근 시 로그인으로 유도. 존재하는 ID도 타인 문서 접근 불가.
- [ ] [G0-06] HttpOnly 쿠키를 통해서만 실제 토큰 전달, JS/URL에 토큰 노출 없음;
  cross-origin 쓰기 차단, 생산 빌드에서 preview bypass 비노출.
- [ ] [G0-07] `/api/auth/refresh` 처리, 401/403/404/429/5xx와 네트워크 지연/중단 확인.

### G1: 경험 정리 (`/experiences`, `/experiences/new`, `/experiences/{id}`)
- [ ] [G1-01] 목록/빈 상태/키워드·태그·상태 검색·필터.
- [ ] [G1-02] **QUICK** 작성: 제목·기간·경험 태그별 질문, 임시저장→새로고침.
- [ ] [G1-03] STAR(상황/과제/행동/결과) 입력→완료 전환/유효성 검사.
- [ ] [G1-04] 문항 답변·메타 수정, 보존 여부, 삭제 확인/취소.
- [ ] [G1-05] 완료한 경험이 자소서 문항 경험 선택 목록에 나타나는지.
- [ ] [G1-06] 요약 생성 없이 AI 초안을 요청했을 때 서버 오류가 데이터 손상 없이 표시되는지.
- 범위 주의: AI 대화형 경험 작성 및 PDF/텍스트 가져오기 UI는 현재 단계에서 완전 기능이라고
  가정하지 말 것. 각 활성화 버튼과 API를 실제로 확인하고 BLOCKED/NOT IMPLEMENTED 구분.

### G2: 자소서 P0 (`/cover-letters`, `/cover-letters/new`, `/cover-letters/{id}`)
- [ ] [G2-01] 기업·직무·마감일·공고 URL/원문 입력; 공고 조회 실패 후 재저장.
- [ ] [G2-02] 문항 추가→내용/자수 제한/답변 저장→새로고침→정렬/삭제.
- [ ] [G2-03] 한글·이모지·줄바꿈 포함 자수 제한, 초과 저장 차단.
- [ ] [G2-04] 연결 경험 목록→추가/중복 차단/연결 해제→재방문 시 유지.
- [ ] [G2-05] 저장된 문항 A→B 버전 생성/목록/복원, 확인 팝업,
  복원 시 문항 ID/연결 경험 소실 가능성을 사용자가 이해하는지.
- [ ] [G2-06] 미저장 편집 이탈 경고, 서버 오류 발생 시 원본 보존.
- [ ] [G2-07] 자소서 삭제 및 지원 카드 동시 삭제 영향 안내(테스트 데이터만).

### G3: 지원현황 (`/applications`)
- [ ] [G3-01] 자소서 생성이 지원 카드에 나타나고 반대 방향으로도 일치.
- [ ] [G3-02] 4단계 `PLANNED`→`PREPARING`→`SUBMITTED`→`CLOSED` 이동:
  데스크톱 Drag/Drop, 모바일/키보드용 select, 실패 시 롤백, 새로고침 후 유지.
- [ ] [G3-03] 지원 상세 마감/면접일/서류결과/이력서/포트폴리오 저장·재조회.
- [ ] [G3-04] 검색/단계 필터, 통계 수치, 마감일 및 D-Day/월 경계/캘린더 표시.
- [ ] [G3-05] 지원 카드 삭제→연결 자소서도 삭제됨을 명확히 경고.
- 지원 단계 4개는 API 계약이므로 Figma 시안의 기타 칼럼이 없는 것을 기능 실패로 기록하지 말고
  디자인/API **차이**로 기록. 사용자 지정 칼럼/드래그 내 순서 서버 저장은 미지원.

### G4: 자소서 AI P1 (실계정에서 AI 요청은 비용·사용량 허가를 받은 뒤)
- [ ] [G4-01] 저장된 문항에서 **분석**→유형/평가 의도/관련 역량/모의 제공자 표시.
- [ ] [G4-02] 연결·요약된 경험 선택→작성 전략/초안 생성; 비연결·요약없음 오류.
- [ ] [G4-03] 기존 답변→논리/간결/문법 등 첨삭→답변과 제안문 구분.
- [ ] [G4-04] 대화형 첨삭 전송/이력 조회, 새로고침 후 서버 이력 유지,
  중복 요청 ID 재시도/연결 경험 범위 확인.
- [ ] [G4-05] AI 제안문을 반영하기 전 확인, 자수 초과 반영 금지,
  **입력란 반영 이후 기존 '이 문항 저장' 없이는 서버 본문 미변경**.
- [ ] [G4-06] 응답 `isMock=true`이면 '모의 AI 결과' 표시. 모델 품질 결과로 평가 금지.
- [ ] [G4-07] AI 요청 실패·타임아웃·잘못된 출력·429에도 현재 답변 보존.
- 분석/초안/첨삭 결과는 기본적으로 **preview-only**,
  실제 `ai-chat` 이력은 서버에 저장될 수 있으므로 개인정보 취급 주의.

### G5: 면접 연습 (`/interviews`, `/interviews/{coverLetterId}`)
- [ ] [G5-01] 실제 자소서/지원 데이터로 기업·직무 목록/검색/선택/예상 질문 표시.
- [ ] [G5-02] 답변 작성, 이전/다음, 완료 체크/진행률, 1·2·3분 타이머.
- [ ] [G5-03] 수동 로컬 저장→새로고침/재접속 복원, TXT 한글 내보내기, 초기화.
- [ ] [G5-04] 미저장 이탈 경고 및 사용자별 scope 분리; 공용 PC의 localStorage 평문 위험.
- 면접 질문은 **고정 템플릿 + 자소서 내용**, 서버 AI 생성/피드백 기능이 아님.
  면접 연습 답변은 **브라우저 로컬 저장만** 지원하고 EC2에는 쓰지 않음.

### G6: 레이아웃·접근성·품질
- [ ] [G6-01] 1440 / 1023 / 720 / 360px 스크린샷: 홈/로그인/경험/자소서/지원/면접.
- [ ] [G6-02] Figma 대비 카드·그리드·글꼴·텍스트 넘침/가로 스크롤 차이 기록.
- [ ] [G6-03] Tab/Shift+Tab/Enter/Escape/포커스 복귀, 모달 닫기, aria-live 오류.
- [ ] [G6-04] 긴 기업명/직무/본문, 빈 목록, 느린 API, 중복 제출, 콘솔 오류.
- [ ] [G6-05] production build에서 개발용 로그인 패스 부재,
  `.env.local`/토큰/개인정보가 번들/로그/Git에 포함되지 않음.
- Figma MCP Starter 호출 한도 문제가 있었음. 연결 가능 여부부터 확인하고,
  불가능하면 기존 `docs/figma-previews`와 링크를 근거로 가능한 범위만 시각 QA.
- Figma 참고: 자소서 1:52114 / 1:52210 / 1:52307, 지원 1:53162 / 1:58838,
  면접 전용 원본은 **확인되지 않았음**. 면접 픽셀 QA를 완료로 표시하지 말 것.

## 6. QA 산출물 / 다음 세션의 작업 원칙
- `docs/QA-RESULTS-YYYYMMDD.md` 생성 권장:
  환경·브랜치·커밋·실계정/미리보기 구분, 각 테스트의 PASS/FAIL/BLOCKED,
  재현 절차, 기대/실제 결과, 네트워크 상태 코드, 개인정보 제거한 스크린샷 파일 경로.
- P0: 로그인 우회/사용자 데이터 혼합·손상, 실제 저장 실패, 권한 문제, 화면 진입 불가.
  P1: 주요 CRUD/UI 결함, AI 적용/버전 복원 실패. P2: 디자인 편차/문구/비핵심 UX.
- 실패는 먼저 재현하고 **원인 분류**: FE 버그 / BE 미지원 또는 장애 /
  배포·환경 문제 / Figma 미확정. 실제 서버 미지원 항목을 프론트 버그로 오분류하지 말 것.
- QA 자동화 도구가 없다면 설치를 임의로 가정하지 말고 현재 package scripts를 먼저 확인.
- **수정이 필요하면 main을 직접 고치지 않고 `fix/qa-...` 별도 브랜치 사용**,
  사용자의 승인/작업 범위를 확인. 시크릿·테스트 계정은 절대 커밋하지 말 것.
- 테스트 종료 시 변경된 **QA 데이터만** 사용자 승인 하에 삭제.
  팀원의 데이터, 운영 DB, 실계정과 연관된 데이터를 청소하지 말 것.
- 통합 QA가 끝나기 전에는 배포 품질·실서비스 준비 완료라고 선언하지 말 것.

## 7. 다음 세션으로 그대로 전달할 요청 예시
```text
POFIT 졸업 프로젝트 통합 QA를 진행해 줘.
Windows 로컬 프론트: C:\Users\1234\Desktop\졸프_FE
GitHub: 2026-Hongik-Graduation/client-v2, 대상 branch=main
백엔드 소스: C:\Users\1234\Desktop\hongik-graduate-BE\be
최우선 문서: docs/QA-HANDOFF-20261105.md (꼭 먼저 읽기)
기존 EC2 같은 출처 프록시, 인증, 경험, 자소서, 지원현황,
면접 로컬 연습, 자소서 AI까지 전부 대상이야.
먼저 git/main 상태와 lint/build, .env.local(시크릿은 출력하지 말기),
QA 백엔드 HTTPS/OpenAPI를 확인하고 개발 미리보기 모드에서
재현 가능한 UI 기능을 직접 테스트해 줘.
실제 EC2 계정 기반 쓰기/AI 호출은 **테스트 전용 계정 및 명시적 허가가 있을 때만** 수행하고
미리보기와 실데이터를 구분해 줘.
1440/1023/720/360 반응형 및 Figma 비교도 확인하되,
Figma 연결 한도가 있으면 정밀 비교를 완료했다고 주장하지 마.
G0~G6 케이스별 PASS/FAIL/BLOCKED 기록, 재현 절차, 중요도,
프론트/백엔드 원인과 개선 순서를 문서로 정리해 줘.
QA에서 발견한 문제를 고쳐야 한다면 별도 fix/qa 브랜치를 사용하고,
main 강제 푸시/팀 데이터 삭제/시크릿 공개는 금지해 줘.
```
