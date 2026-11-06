# POFIT 통합 QA 결과 — 2026-11-05

**릴리스 판정: 통합 QA 미완료 / 승인 보류.** 23개 로컬 미리보기 브라우저 E2E는 실제 EC2 인증, DB 저장, 모델 품질을 검증하지 않는다.

## 1. 환경 및 증거

- 기준 문서: docs/QA-HANDOFF-20261105.md, G0~G6 41개 항목과 P0/P1 기능 문서.
- 저장소: 2026-Hongik-Graduation/client-v2. 최초 검증 시 로컬 main = origin/main = b7a8e9a9941b716a7645894f18be015fae4e9f5c. 수정 브랜치: fix/qa-20261105.
- Windows / Node 24.13.1 / npm 11.8.0 / Next 16.4.3 / Chrome headless + 저장소 외부 임시 Playwright.
- 개발 서버 localhost:3000, 빌드 테스트 localhost:3001. 서버 프록시는 QA_BACKEND_ORIGIN으로 연결. 로컬 .env.local은 내용 비출력, Git ignore 확인.
- 개발 전용 패스 데이터는 pofit_dev_preview 쿠키 및 브라우저 localStorage에만 존재한다. 테스트에 QA 접두사의 가상 데이터만 사용.
- QA EC2: https://43-203-204-29.sslip.io. 실제 쓰기·유료 AI를 허가받은 QA 계정이 제공되지 않아 인증/변경/AI 호출 전부 미실시.
- 증거: docs/qa-evidence/20261105/의 before-fix probe-results.json, accessibility-results.json, flow-results.json, extra-results.json, production-results.json 및 24개 preview-화면-너비.png 캡처.
- Figma 파일 0wZM1igoWTo0vJt4Ncqpgl 직접 조회는 Starter MCP 호출 제한으로 차단. 원본 픽셀 비교는 미완료, 면접 전용 확정 프레임 없음.

## 2. 사전 게이트 및 브라우저 E2E

| 범위 | 결과 | 관측 |
| --- | --- | --- |
| Git main 및 origin/main 확인 | PASS | b7a8e9a 일치, 시작 시 작업 트리 깨끗함 |
| npm ci | PASS | 처음 lightningcss EPERM 잠금; 프로젝트 기존 개발 서버 종료 후 재시도 성공 |
| npm run lint | PASS | ESLint exit 0 |
| npm run build | PASS | Next.js production build 성공 |
| npx tsc --noEmit | PASS | 타입 검사 성공 |
| EC2 익명 GET /v3/api-docs | PASS | HTTPS 200, application/json (연결성만 검증) |
| 익명 GET 경험/자소서/칸반/프로필/경험태그 | PASS | 모두 401 (미인증 접근 차단) |
| 실제 EC2 인증, DB 변경, AI 요청 | BLOCKED | 전용 QA 계정·쓰기/사용량 승인 없음 |
| 프로덕션 보안 스모크 | PASS | 패스 버튼 없음, 위조 preview 쿠키 거부, refresh 토큰 없음 401, cross-origin POST 403 |
| Figma 최신 원본 | BLOCKED | Starter MCP 호출 한도 |

**개발 미리보기 E2E: 18/18 PASS.** 개발 패스와 쿠키, 경험 QUICK/STAR 생성·임시저장·완료·새로고침, 자소서 생성·문항 저장·한글/이모지·자수 제한·경험 연결·버전, 칸반 생성 연계·4단계 전환·보존, 모의 AI 분석·초안·대화 이력, 면접 브라우저 저장·TXT 내보내기, 로그아웃/Origin 거부. Playwright가 모든 /api/** 변형 요청을 차단했고 요청 관측 수는 0건.

**보충 E2E: 5/5 PASS.** 추가 자소서 생성, 모의 AI 첨삭, 제안문을 입력란에만 반영하고 새로고침하면 원래 서버 본문에 해당하는 미리보기 저장값 유지, 지원 상세 면접일·서류결과·이력서·포트폴리오 저장 및 재조회, 면접 타이머 조작 버튼 확인. 실제 타이머 1/2/3분 정확도는 미검증.

## 3. 인수인계 G0~G6 체크리스트 (최초 발견 시점)

**41개 항목 중 PASS 10 / FAIL 2 / BLOCKED 29.** PASS의 개발 미리보기 결과와 EC2 실서버 결과는 절대 혼용하지 않는다. FAIL은 아래 수정 및 재검증 결과와 구분한다.

| ID | 최초 판정 | 확인 사항 / 남은 테스트 |
| --- | --- | --- |
| G0-01 | BLOCKED | 홈·가입·암호 찾기·로그인 진입 확인; Tab/Enter/Escape 전체 이동 미검증 |
| G0-02 | BLOCKED | 개발 패스 성공; 실계정 로그인 성공·실패, 유지 로그인, 만료 미검증 |
| G0-03 | BLOCKED | SMTP·인증 전용 테스트 계정 미제공; OTP 전송·재발송·만료 미검증 |
| G0-04 | BLOCKED | 실제 온보딩 프로필 단계별 저장·복귀 미검증 |
| G0-05 | BLOCKED | 미리보기 로그아웃 후 보호화면 재접근 차단 확인; 실계정 타인 자료 소유권 미검증 |
| G0-06 | BLOCKED | 프로덕션 패스 제거/위조 쿠키 거부/Origin 거부 확인; 실제 HttpOnly JWT 흐름 미검증 |
| G0-07 | BLOCKED | 토큰 없는 refresh 401; 만료/403/404/429/5xx/지연 실서비스 미검증 |
| G1-01 | BLOCKED | 목록과 빈 상태 확인; 키워드·태그·상태 조합 미검증 |
| G1-02 | PASS | QUICK + STAR 경험 생성·임시저장·새로고침 보존 |
| G1-03 | PASS | 필수 STAR 답변+요약·작성완료·재조회 |
| G1-04 | BLOCKED | 답변 저장 확인; 메타 수정/질문 삭제/확인 취소 전수 미검증 |
| G1-05 | PASS | 기존 경험이 자소서 문항 연결 선택에 나타나고 연결됨 |
| G1-06 | BLOCKED | 요약 없음 상태에서 실제 AI 초안 서버 오류와 데이터 보존 미검증 |
| G2-01 | BLOCKED | 기업/직무 생성; 공고 URL·원문·마감일 오류 복구 미검증 |
| G2-02 | BLOCKED | 문항 추가·저장·새로고침 확인; 정렬/삭제 전수 미검증 |
| G2-03 | PASS | 한글/이모지/줄바꿈 답변 보존, 글자수 초과 저장 차단 |
| G2-04 | BLOCKED | 경험 연결 확인; 중복·해제·새로고침 재확인 미검증 |
| G2-05 | BLOCKED | 버전 생성·목록 보존 확인; 복원/소실 안내 검증 미완료 |
| G2-06 | BLOCKED | AI 제안 미저장 본문 보존 확인; 일반 편집 이탈·서버 오류 미검증 |
| G2-07 | BLOCKED | 자소서 삭제 및 지원 카드 연쇄 영향 실제 테스트 미실시 |
| G3-01 | PASS | 자소서 생성→칸반 카드 표시 |
| G3-02 | BLOCKED | 4단계 select 이동·리로드 보존; 드래그·키보드·실패 롤백 미검증 |
| G3-03 | PASS | 면접일/서류결과/이력서/포트폴리오 저장·리로드 |
| G3-04 | BLOCKED | 통계·캘린더 UI 확인; 정확한 검색·D-Day·월 경계 미검증 |
| G3-05 | BLOCKED | 삭제 영향 안내 코드 확인; 삭제·취소 및 연쇄삭제 미검증 |
| G4-01 | PASS | 미리보기 분석과 LOCAL_PREVIEW/isMock 표기 확인 |
| G4-02 | BLOCKED | 연결 경험 모의 초안 확인; 전략·요약 누락/비연결 서버 오류 미검증 |
| G4-03 | PASS | 기존 답변 모의 첨삭 및 원문과 제안 영역 구분 확인 |
| G4-04 | BLOCKED | 미리보기 대화 저장·재조회 확인; 실제 서버 이력·requestId 중복 재시도 미검증 |
| G4-05 | BLOCKED | 제안문 반영 후 미저장 원문 보존 확인; 길이 초과/확인 취소 미검증 |
| G4-06 | PASS | isMock=true 결과에 모의 AI 결과 및 공급자 표시 |
| G4-07 | BLOCKED | AI 429/5xx/타임아웃·잘못된 출력 시 데이터 보존 미검증 |
| G5-01 | BLOCKED | 미리보기 자소서 기반 면접 진입 확인; 실제 서버 목록·검색 미검증 |
| G5-02 | BLOCKED | 답변/완료 진행률·타이머 UI 확인; 타이머 시간 계측·전체 질문 탐색 미검증 |
| G5-03 | BLOCKED | 로컬 수동 저장→새로고침 및 TXT 다운로드 확인; 초기화/파일 한글 재파싱 미검증 |
| G5-04 | BLOCKED | 코드상 사용자별 저장 범위 확인; 계정 전환·이탈 경고·로컬 평문 보호 미검증 |
| G6-01 | PASS | 홈/로그인/경험/자소서/지원/면접 6개 화면 × 1440/1023/720/360 = 24 캡처 |
| G6-02 | FAIL | 홈 전체 너비와 경험 목록 360px 가로 넘침 확인; Figma 픽셀 비교 별도 BLOCKED |
| G6-03 | FAIL | axe WCAG 2/2.1 A·AA 자동 검사에서 명도 대비 위반. 키보드/스크린리더 전수 미검증 |
| G6-04 | BLOCKED | 기본·빈 화면 확인; 장문·느린 망·중복 제출·콘솔 전수 미완료 |
| G6-05 | BLOCKED | 프로덕션 패스 부재·위조 preview 쿠키 거부 및 env ignored 확인; 번들 보안 전수 미완료 |

## 4. 버그 재현·실제 원인·우선순위

**QA-001 (P1 / FE 반응형)** — 경험 목록 360px. 미리보기 로그인→/experiences→viewport 360. 초기 document.scrollWidth **453px** (> 360, +93). CategoryDistribution의 TopPanels.tsx 고정 min-w-[457px]과 추가 경험 패널의 min-w-[285px]가 부모의 좁은 여백보다 큼. 기대: 페이지 전체 가로 넘침 0. 증거: preview-experiences-360.png, probe-results.json. 수정: 작은 화면에서 패널 가변 최소너비 적용.

**QA-002 (P2 / FE 홈 반응형)** — / 에서 1440/1023/720/360 뷰포트의 최초 문서 폭은 **1460/1079/776/416px**. 원인 조사: Steps.tsx Reveal 좌우 진입 애니메이션이 영역 외부로 이동하고 부모가 clip하지 않아 문서가 확장됨. Hero 내부 일러스트는 자체 컨테이너에 overflow-hidden 되어 있어 화면 전체 넘침의 단독 원인이 아님. 수정: Steps 섹션 overflow-x-clip과 모바일 Hero 타이틀/CTA 줄바꿈 처리. 기대: 네 너비 전체 넘침 0. 증거: preview-home-*.png, probe-results.json.

**QA-003 (P1 / FE 접근성)** — axe-core WCAG 2/2.1 A/AA. 최초 color-contrast serious 위반 노드 수(1440/360): 로그인 2/2, 경험 추가 3/3, 자소서 추가 5/5, 지원현황 1/11, 면접 목록 0/0. 예: #b2b2b2 on #fafbfb 대비 **2.04:1** (기대 최소 4.5:1). 주 원인: text-tertiary와 배경 토큰, 비활성 탭·상태 문구 색 조합. 수정: 텍스트 토큰과 문제 컴포넌트 대비 조정. 증거: accessibility-results.json. 원본 Figma 대비 디자인 승인 미완료.

**QA-004 (P2 / FE 폼 라벨)** — /experiences/new의 '경험 제목' 표시 label이 input과 형제이면서 htmlFor/id가 없었음. 보이는 라벨과 접근성 이름이 연결되지 않음. 수정: input id와 label htmlFor 연결. 스크린리더 수동 검증은 남음.

## 5. 구현 불가와 BLOCKED (제품 FAIL 아님)

- 실제 EC2 QA 전용 계정·사용 허가 없으므로 로그인/권한/DB CRUD/AI 생성·저장 요청 미실행. 서버 GET 401은 인증을 요구하는 정상 동작일 수 있음.
- 면접 연습은 고정 템플릿과 브라우저 localStorage 평문 저장. 면접 AI 생성/피드백/서버 세션 API 미지원.
- 지원현황 상태는 PLANNED / PREPARING / SUBMITTED / CLOSED 4종. 커스텀 열과 같은 열 내부 정렬 영속화는 서버 미지원. Figma 차이는 디자인/API 차이로 처리.
- LOCAL_PREVIEW와 MOCK_ONLY는 실제 모델 성능/요금/DB를 대표하지 않음.
- Figma Starter MCP 조회 제한 재확인. 면접 전용 프레임 미확정; 원본 픽셀 정합성 완료 주장 금지.
- 임시 환경 장애: 첫 npm ci의 lightningcss EPERM은 기존 실행 중인 Next 서버 파일 점유. localhost 대신 127.0.0.1 사용 시 Next 개발 HMR 요청 차단. 모두 환경 조정으로 회복; 제품 버그로 분류하지 않음.

## 6. 후속 조치·배포 조건

- P1: 모바일 경험 카테고리 패널 너비, 색 대비 개선 후 네 너비 및 axe 재검증.
- P2: 홈 진입 애니메이션 가로 넘침, 경험 제목 label 수정 후 회귀.
- BLOCKED: QA 전용 계정으로 실제 EC2 로그인→경험→자소서→지원→면접과 실제 AI 분석·초안·첨삭·대화 이력 검증. 쓰기/삭제/AI 요금 허가 필수.
- BLOCKED: Figma 호출 한도 해소 및 확정 면접 시안 후 1440/1023/720/360 정밀 비교.
- 품질: 삭제 취소/버전 복원/드래그·키보드/타이머 시간 계측/네트워크 지연/429/5xx/공용 PC 개인정보 보호/키보드 포커스 수동 테스트.

**보안:** EC2에 실제 쓰기·AI 요청을 전송하거나 기존 사용자 데이터를 건드리지 않음. 계정·토큰·암호·키를 채팅/문서/Git에 출력하지 않음. 테스트 스크립트의 Playwright 등은 저장소 밖 임시 디렉터리에 설치했고 테스트용 모의 데이터로만 화면을 검증함.

## 7. 수정 후 회귀 및 병합 기록

2026-11-06 로컬 브랜치 `fix/qa-20261105`에서 수정 8개 파일의 diff/공백 오류를 검토하고 다음 기술 검증을 수행했다.

- `npm run lint`: PASS
- `npm run build`: PASS (Next.js 16.4.3, 서버 프록시 포함)
- `npx tsc --noEmit`: PASS
- `.env.local`: `.gitignore`의 `.env*` 규칙으로 Git 추적 제외
- **브라우저 수정 후 재검증: PASS (한정 범위)**. Chrome/Playwright에서 홈·로그인·경험 목록·자소서 목록·지원현황·면접 목록의 1440/1023/720/360px **24조합**을 다시 측정했고, 문서 가로 넘침 **0건**. 최초 경험 목록 360px `scrollWidth=453`에서 최종 `360`, 홈의 최초 1460/1079/776/416px에서 최종 뷰포트와 일치.
- **자동 접근성 수정 후 재검증: PASS (한정 범위)**. 로그인·경험 추가·자소서 추가·지원현황·면접 목록 × 1440/360px **10조합**에 대해 axe-core WCAG 2/2.1 A·AA 위반 **0건**. 경험 제목 `label[for=experience-title]`의 접근성 이름도 확인. 이는 전면적인 수동 키보드·스크린리더·모달 포커스 검증이나 Figma 픽셀 검증을 대체하지 않음.
- **기능 회귀: PASS**. 별도 신규 브라우저 컨텍스트의 로컬 미리보기 E2E 기본 18/18, 보충 5/5 = **23/23**. 인증 패스·경험 STAR·자소서·모의 AI·칸반·면접 로컬 저장/내보내기 포함. `/api/**` 변형 요청 0건(테스트 라우팅 안전장치).
- 1차 패치로 경험 목록의 가로 넘침은 453→394→378px까지 개선됐으나 미해결. 최종 원인은 `TopPanels`가 좁은 화면에서도 두 패널을 같은 flex 행에 배치해 범주 막대를 지나치게 축소하는 것임을 DOM 체인에서 확인. `sm` 미만에서 세로 배치, 작은 화면 패딩/간격 축소로 360px 복구. 자소서 생성의 비활성 탭 대비 잔여 1건도 `text-text-primary`로 해결.
- 증거: `docs/qa-evidence/20261105/regression-results.json`(수정 후 실측 24+10), `flow-results.json`, `extra-results.json`. 기존 `probe-results.json`과 `accessibility-results.json` 및 24개 기존 캡처는 **수정 전 결과**로 남기므로 혼동하지 말 것.
- **실계정 EC2 CRUD/AI 및 Figma 원본 대조: BLOCKED**. 전용 QA 계정/쓰기·AI 과금 허가와 Figma 호출 한도 해제가 필요. 검증하지 못한 항목은 PASS로 바꾸지 않음. 수동 접근성·오류 주입도 BLOCKED.
- **릴리스 판정: 보류**. 이번 병합은 확인된 FE 반응형/대비 수정 및 QA 기록 병합이지 프로덕션 전체 E2E 검증 통과나 배포 승인 아님.

병합·푸시 커밋은 최종 Git 확인 결과와 함께 별도 기록한다. 운영 릴리스 전에 실제 서버 및 수동 브라우저 QA 승인이 필요하다.
