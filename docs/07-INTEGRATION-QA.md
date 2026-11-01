# 07. 통합 아키텍처, API, QA·배포 계획

상태: **계획**. 기존 홈 화면을 유지하면서 인증·경험·자기소개서·지원 현황을 안정적으로 통합하는 작업 기준입니다.
개별 화면 요구는 [문서 인덱스](./README.md)에서 해당 기능 문서를 우선 확인합니다.

## 1. 기존 기술과 확장 원칙
- 기존 코드: Next.js 16.4.3 (App Router), React 19.3.0, TypeScript, Tailwind 4, Motion.
- 현재 라우트: `/`, `/login`, `/find-password`, `/experiences`, `/experiences/new`, `/cover-letters/new`, `/applications` 기본 화면 구현. `src/app/layout.tsx`, `page.tsx`, `globals.css`와 기존 화면 컴포넌트는 보존.
- 설치·타입·빌드 기준은 저장소 `AGENTS.md` 및 설치된 `node_modules/next/dist/docs/` 지침에 맞춥니다.
- 기존 `@theme`/Pretendard/assets 및 Motion 컴포넌트를 먼저 확인한 뒤 공통 UI 도입.
- 사용자 데이터·비밀키는 클라이언트에 직접 넣지 않고 필요한 서버 API를 통해서만 접근.

## 2. 제안 폴더/라우트 구조 (일부 화면·컴포넌트는 이미 구현됨; route group 이동은 선택사항)
```text
src/
  app/
    page.tsx                     # 기존 홈
    layout.tsx                   # 기존 전역 layout
    globals.css                  # 기존 @theme 토큰
    (auth)/
      layout.tsx
      login/page.tsx
      signup/page.tsx
      find-password/page.tsx
    (workspace)/
      layout.tsx                 # 인증 헤더/쉘
      experiences/page.tsx
      experiences/new/page.tsx
      experiences/[id]/page.tsx
      cover-letters/page.tsx
      cover-letters/new/page.tsx
      cover-letters/[id]/page.tsx
      applications/page.tsx
  components/
    Header.tsx, Footer.tsx, Reveal.tsx   # 기존 유지
    sections/*                   # 기존 홈 섹션
    ui/*                         # 공유 버튼·폼·다이얼로그
    layout/*                     # 인증/워크스페이스 쉘
    experiences/*
    cover-letters/*
    applications/*
  features/
    auth/{api,hooks,schema,types}/
    experiences/{api,hooks,schema,types}/
    cover-letters/{api,hooks,schema,types}/
    applications/{api,hooks,schema,types}/
  lib/{api-client,routes,utils}/
  types/
  mocks/
public/figma/                   # 기존 로고·일러스트 + 검증된 추가 에셋
docs/                           # 화면별 계획과 디자인 캡처
```

Route group은 URL을 늘리지 않으며, 인증 여부는 서버 데이터/라우트 접근제어에서 검사해야 합니다.

## 3. 모듈 간 의존 관계
| 의존 기능 | 소비 기능 | 개발 순서 |
| --- | --- | --- |
| 공통 UI·디자인 토큰 | 전 기능 | 최초 기반 / 이후 점진 개선 |
| 인증·프로필 | 경험/자소서/지원 개인정보 영역 | 기본 인증 UI→실제 세션 |
| 경험 모델·목록 API | 자소서 문항의 경험 선택/연결 | 경험 P0 먼저 |
| 채용공고·자소서 모델 | 지원 카드의 연관 문서 | 문서 초안 후 연결 |
| AI 대화·분석 API | 경험 대화, 자기소개서 초안/첨삭 | CRUD 안정화 후 |
| 파일 저장·검증 | PDF 가져오기, 이력서/포폴 첨부 | 정책 확정 후 |
| 통합 오류/권한 처리 | 전 기능 | 매 Phase 점진 적용 |

## 4. API·서버 계약서에 꼭 들어갈 항목
- **공통**: base URL, 엔드포인트/메서드, 요청·응답 JSON 스키마, 오류 코드, pagination, cache-control.
- **인증**: 쿠키/세션/OAuth, 자동 갱신, 만료, 로그아웃, CSRF, redirect allowlist.
- **사용자 데이터**: 소유권, ID 형식, 403 vs 404 정책, 삭제/복원, 동시 수정 정책.
- **날짜**: ISO 8601/UTC 저장, 사용자 타임존 표시, 기한 날짜 포함/제외 규칙.
- **파일**: 확장자/MIME/크기·검사/저장·보존·삭제·서명 URL 만료.
- **AI**: 스트리밍/비스트리밍, 요청 상관 ID, 취소, 재시도, 요청 제한, 과금/사용량, 프롬프트 데이터 보호.
- **응답 상태**: idle/loading/success/empty/error, 필드 유효성 에러와 일반 시스템 에러 분리.
- **관측**: 로그에 이메일/암호/OTP/자소서 원문 등이 노출되지 않는 개인정보 마스킹 정책.

## 5. 상태 관리 / 폼 라이브러리 제안
| 영역 | 제안 | 참고 |
| --- | --- | --- |
| 서버 비동기 데이터 | TanStack Query 또는 Next 서버 fetch | 캐시/무효화/접근권한 정책 합의 |
| 입력 폼 | React Hook Form + Zod | 등록 단계·문항 글자수·오류 상태 |
| UI 일시 상태 | 컴포넌트 state / Context | 전역 라이브러리 도입 최소화 |
| DnD | dnd-kit | 지원 칸반/자소서 경험 연결 |
| 고정 정보 | 라우트/카테고리/옵션 상수 | UI 텍스트와 API enum 분리 |
| API mock | mock adapter 또는 MSW | 실제 연동 완료로 오해하지 않도록 표기 |
| 에러 표시 | Toast + Inline Error + Global Error boundary | 각 화면에서 반복 구현 금지 |

이 테이블의 라이브러리는 **선택 제안**이며 현재 원격 패키지에 전부 설치된 것은 아닙니다.

## 6. 보안/개인정보 점검
- 인증 정보: 사용자별 데이터는 서버에서 소유권 검증. 화면 숨김만으로 접근제어 대체 금지.
- 업로드: 서버 MIME/크기/바이러스 검증, 파일명 정규화, 다운로드 권한 검사.
- AI: API 키 서버 전용 보관, 데이터 사용 동의/저장·삭제 정책, 민감한 문장 로그 최소화.
- HTML: 생성 텍스트의 unsafe HTML 삽입 금지, URL protocol 검증.
- 개인정보: 이메일·학력·경험·자소서 원문은 저장/전송/로그/공유 링크 처리 기준 수립.
- Git: `.env.local`, 인증 토큰, Figma 단기 presigned URL을 저장소에 커밋하지 않음.
- 이벤트/에러 로깅: 식별 정보 제거, 오류와 실제 운영 모니터링 연결.

## 7. UI 상태·반응형 검증 매트릭스
| 기능 | 기본 | 로딩 | 오류 | 빈 상태 | 완료/확인 | 1440 | 1023 | 720 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 홈 | ✓ | 이미지 로딩 | 이미지 누락 | 해당 없음 | CTA | ✓ | ✓ | ✓ |
| 인증 | ✓ | 제출중 | 인증/입력 | 해당 없음 | 가입/재설정 | ✓ | ✓ | ✓ |
| 경험 | ✓ | 업로드/AI | 파싱/AI | 검색/목록 | 저장/삭제 | ✓ | ✓ | ✓ |
| 자소서 | ✓ | 분석/생성 | AI/저장 | 목록/문항 | 버전/출력 | ✓ | ✓ | ✓ |
| 지원 | ✓ | 이동/저장 | 롤백/삭제 | 보드/카드 | 전형 갱신 | ✓ | ✓ | ✓ |

- 1024/1023 경계는 별도로 점검, 360px는 Figma 시안 없는 임시 UX 점검.
- 폰트·SVG/이미지 위치/크기를 Figma 화면의 실제 위치와 비교.
- 모든 비동기 화면에 진입/이탈 반복, 중복 클릭, 재시도, 네트워크 지연·실패 시나리오 검증.

## 8. 테스트 레이어
- **단위 테스트:** 글자수 계산, 날짜·상태 enum 변환, 폼 검증, 변경 사항 감지, 데이터 매퍼.
- **컴포넌트 테스트:** 입력 에러, 모달 포커스, 토글, 드래그 대체 조작, 태그 필터.
- **통합 테스트:** 인증/경험 CRUD, 자소서 버전, 지원 상태 저장, 서버 오류/권한 만료.
- **E2E 사용자 흐름:** 회원가입→경험 STAR→자소서 문항 연결→버전 저장→지원 카드 관리.
- **시각 회귀:** 1440/1024/1023/720 비교, 폰트·테마·에셋 변형, 화면별 Figma 참조.
- **접근성:** 모든 주요 UI 탭/Enter/ESC, focus management, aria-live, 모달 포커스 트랩, reduced motion.
- **성능:** 이미지 크기/LCP, hydration, Motion 스크롤, 긴 카드·문항 렌더링, 리스너 정리.
- **기술 게이트:** `npm run lint`, `npm run build`, `npx tsc --noEmit` (Next 타입 생성 후), 테스트 명령은 도입 시 추가.

## 9. 단계별 PR/릴리스 전략
1. feature 브랜치에서 1가지 화면/컴포넌트 흐름만 구현하고 Figma 노드 참조.
2. PR 본문에 변경 영역, 스크린샷(1440/1023/720), 기능 시나리오, 남은 API 미연동 항목 정리.
3. README와 해당 `docs/*.md` 체크리스트를 실제 완료 상태에 맞춰 수정.
4. 빌드/린트/타입/테스트, 에셋 정확성, 개인정보·보안 체크 통과 후 코드 리뷰.
5. 스테이징 통합 확인 → 배포 담당자 승인 → 프로덕션 배포 및 오류 모니터링.
6. 메인 브랜치에 새 변경이 들어오면 병합/리베이스로 최신 상태 반영, 강제 푸시 금지.

## 10. 작업 착수 순서
- [ ] Figma 연결/권한 및 필요한 프레임 캡처 재확보 (호출 제한 해제 후)
- [ ] 디자인 시스템과 기존 홈의 시각적 차이 조사
- [ ] 공통 Button/Input/Dialog/Loading/EmptyState 만들기
- [ ] Phase 2 인증 UI를 우선 목 동작으로 작성
- [ ] 경험 STAR CRUD 구현 → 자소서 문항/버전 연결 → 지원 칸반
- [ ] 외부 AI/파일/로그인 API 계약 확정 후 통합
- [ ] 모든 기능의 단위/통합/E2E/시각 검증 및 접근성·보안 점검
- [ ] 팀 기준 CI/릴리스 문서화

## 11. 완료 정의(Definition of Done)
- [ ] Figma의 지정 프레임과 실제 렌더 결과를 비교하고 이미지/아이콘 누락이 없음.
- [ ] 정상이용·빈 상태·입력 오류·네트워크 오류·키보드 사용의 결과가 테스트로 검증됨.
- [ ] 코드가 현재 Next 버전의 API와 맞고 의존성 잠금 파일이 일치함.
- [ ] 민감 데이터 저장/로그/전송 정책을 따르며 권한 우회가 불가능함.
- [ ] README/기능별 문서의 체크 표시가 실제 결과와 일치함.

## 알려진 제약
- Figma MCP 조회 한도에 도달하여 일부 미리보기 추출은 미완료. 정확한 화면 링크는 각 문서에 포함.
- 백엔드 상세 계약, AI 공급자·과금, 720px 미만 시안, 면접 화면은 미확정.
- 이 파일은 **설계·검증 계획**이고, 앱 기능이 추가됐다는 뜻이 아닙니다.
