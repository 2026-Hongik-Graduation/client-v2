# POFIT — 프런트엔드·백엔드 통합 QA 결과 (2026-11-06)

## 결론
**데모 E2E와 별도로 실제 Spring Boot 4.1.1 + Next.js 16.4.3 API 프록시 + H2 메모리 DB를 연결한 인증/CRUD 통합 검증 29/29 통과.** 이 결과는 **격리된 로컬 백엔드** 검증이며 EC2 운영 DB 쓰기 검증이 아니다.

| 검증 대상 | 실행 환경 | 결과 |
|---|---|---|
| 프런트 ↔ Next 프록시 ↔ 실제 Spring Boot 인증·CRUD·화면 통합 | 로컬 프로덕션 Next / Spring / H2 / 루프백 SMTP | **29/29 PASS** |
| 백엔드 JUnit/MockMvc/통합 테스트 | 백엔드 Maven test, H2 | **104/104 PASS**, 실패·오류·스킵 0 |
| 프런트·백엔드 API 계약 46 메서드 비교 | 로컬 Spring OpenAPI | **46/46 일치** |
| EC2 공개 OpenAPI 계약 46 메서드 비교 | 43-203-204-29.sslip.io HTTPS GET | **46/46 일치** |
| 배포 사이트 및 비인증 프록시 동작 | client-v2-one.vercel.app (GET/HEAD만) | **7/7 PASS** |
| ESLint · TypeScript · Next 프로덕션 빌드 | 프런트 저장소 | **3/3 PASS** |
| 기존 배포 데모 브라우저 E2E | 2026-11-06 이전 QA 6개 스위트 | **60/60 PASS** (별도 증거 문서) |

## 실제 백엔드와 연결하여 실행한 내용
- 루프백 SMTP의 실제 이메일 전송 요청과 인증코드 검증 → 회원가입 → 비밀번호 오류 401 → 브라우저에서 정상 로그인.
- Next의 HttpOnly Access/Refresh 쿠키 발급, JWT Refresh rotation, 로그아웃 쿠키 삭제 및 재접근 401.
- 회원 프로필 나이/성별/학교/희망 직군을 실제 H2 데이터베이스에 저장하고 다시 조회.
- 경험 등록 → 태그별 문항 조회 → 답변 저장 → 완료 상태 처리 및 재조회.
- 자기소개서와 문항 저장, 이모지 답변 확인, 경험 연결, 작성 버전 관리.
- 지원 카드 4단계(예정→준비→제출→종료) 이동 및 데이터 유지, 면접일·서류 결과·이력서/포트폴리오 상태 저장.
- **Playwright 사용자 화면에서 직접** 경험 생성/임시저장, 자소서 생성/문항 저장, 카드 이동/상세 저장을 수행하고 각각 Spring API·DB 응답과 대조.
- 서로 다른 테스트 계정의 경험·자소서·연결 자료 GET 및 지원 카드 수정에 403/404 접근 제어 확인. 기존 소유자의 자료는 유지.
- 실제 Spring DB의 지원/자소서 데이터를 면접 UI에서 불러와 브라우저에 기록 보존.
- AI_PROVIDER=mock, AI_ENABLED=false로 고정해 유료/외부 AI 호출 없이 응답이 모의 표시 또는 명시적 실패인지 확인.

## 운영 EC2/Vercel의 읽기 전용 검증
- EC2 OpenAPI `/v3/api-docs` 200, 경로 59개, 프런트 계약에서 확인한 46개 메서드 누락 0.
- Vercel 홈·로그인 200; 비로그인 경험·자소서·지원 보드·프로필 및 토큰 갱신 API 401.
- 비인증 상태의 401은 **백엔드 연결 및 접근 통제의 기본 동작**이며, 실계정 성공을 뜻하지 않는다.
- 운영 서버를 향한 계정 등록·생성·수정·삭제·AI 요청 **0회**.

## 이번 반영 사항
- `qa/integration/spring-e2e.cjs`: 진짜 로컬 Spring 통합 E2E 29개, 세션·소유권·DB 영속성·UI 확인.
- `qa/integration/smtp-sink.cjs`: 외부 메일 없이 루프백에서 인증메일 수신.
- `qa/integration/openapi-contract.cjs`: 로컬·EC2 OpenAPI와 API 메서드 계약 자동 비교.
- `qa/integration/deployed-readonly.cjs`: 운영 배포의 안전한 읽기 검사.
- `package.json` 명령 3종 추가; `.github/workflows/integration-readonly.yml` 수동 읽기 전용 QA 워크플로 추가.
- `qa/integration/README.md`에 격리 실행법과 안전 가드 설명.
- 검증한 기능 범위에서 새 프런트 구현 결함이 발견되지 않아 기존 정상 동작을 임의로 변경하지 않음.

## 남은 BLOCKED / 비대상
- 운영 EC2 실계정 JWT 로그인, 실운영 DB CRUD, 실 SMTP 송수신, 실제 외부 AI 모델 성능 및 과금 경로는 **승인된 별도 QA 계정/환경이 없어 미실행**.
- Figma 픽셀 일치, 수동 스크린리더, 실제 API 장애 주입은 별도 검증이 필요.
- 실서버 테스트를 완료했다고 주장하거나 출시 승인을 자동으로 부여하지 않음.

## 재현 및 증거
- 재실행 절차: [qa/integration/README.md](../qa/integration/README.md)
- 테스트 결과: `docs/qa-evidence/20261106/integration/local-spring-e2e.json`, `backend-tests.json`, `openapi-contract.json`, `vercel-readonly.json`.
- 기존 데모 배포 E2E: [QA-E2E-DEEP-20261106.md](./QA-E2E-DEEP-20261106.md)
