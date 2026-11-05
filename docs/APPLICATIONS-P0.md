# 지원현황 칸반 P0 — 실제 구현 (2026-11-05)

## 설계 기준
- Figma 1440: https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-53162
- Figma 1023: https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-58838
- 기존 `src/components/applications`의 통계 카드, 배너, 검색 아이콘과 228px 내부 카드 폭/16px 여백, 4열 좌우 스크롤 패턴을 재사용.
- 리팩터링 후 `src/components/applications/kanban-data.ts`의 정적 예시 데이터 사용 안 함.

## 실제 지원 데이터 모델
Spring Backend의 지원 카드 모델은 **자소서(CoverLetter) 하나**이다. 별도 독립 지원 카드/커스텀 컬럼 API는 없다.

- `GET /api/application-board`: `{stages, columns}`로 자소서 그룹 조회.
- `PATCH /api/application-board/{coverLetterId}/status`: `{status}`로 지원 단계 변경.
- `GET/PUT /api/cover-letters/{coverId}/application-detail`: `deadline`, `interviewDate`, `documentResult`, `hasResume`, `hasPortfolio` 조회·저장.
- `POST /api/cover-letters`: 신규 지원/자소서 함께 생성 (항상 PLANNED 시작).
- `DELETE /api/cover-letters/{id}`: 지원 카드와 자소서, 문항, 버전 등 함께 삭제. UI에 삭제 영향 명시.
- 문항 편집은 기존 `/cover-letters/{id}`로 이동.

**서버 지원 상태는 딱 4개:** PLANNED 지원 예정 / PREPARING 서류 준비 / SUBMITTED 제출 완료 / CLOSED 전형 종료. Figma 시안의 '제출/서류/면접/최종' 칼럼명은 현재 API 계약과 다르므로 영구 저장 가능한 상태를 우선하고 Figma의 카드·색·레이아웃을 재현했다.

**의도적으로 미지원:**
- 사용자 지정 컬럼 생성/변경/삭제
- 동일 컬럼 안에서 사용자 지정 카드 순서 서버 영속화
- 전형별 무제한 세부 상태, 지원서 파일 업로드/알림
이 항목은 백엔드 계약 확장 후 구현. 화면에는 가짜 저장 기능을 넣지 않았다.

## 구현
- `/applications` 접근 인증: HttpOnly JWT 쿠키, 개발 환경에서는 로컬 미리보기 쿠키만 허용.
- 보드: 단계별 실데이터, 실시간 수치, 검색·필터, 빈 상태, 오류·재시도.
- 카드: 드래그로 단계 이동, 접근 가능한 선택 메뉴로 이동. 이동 성공 후만 UI 갱신; 실패 시 이전 열 유지.
- 상세 패널: 면접 일정, 지원 마감일, 서류 결과, 이력서/포트폴리오 준비 상태를 전체 PUT 저장.
- 캘린더: 마감일 기준 월 이동 및 해당 날짜 지원 카드에서 상세 열기.
- 카드는 자소서와 연결되므로 상세에서 자소서 편집으로 바로 이동.
- 로그인 패스: 개발 localhost 전용 미리보기. 기존 `src/lib/dev-preview.ts`의 localStorage 스키마에 지원 보드와 지원 상세를 추가. 이 모드에서 EC2로 쓰기 요청을 전송하지 않는다.
- 리소스: `public/figma`의 원본 통계 아이콘, 배너 일러스트, 검색/추가 아이콘을 그대로 활용.

## 이번 검증의 범위
- 변경 코드의 ESLint, TypeScript 및 Next.js production build.
- 기존 Figma 에셋 파일 존재 여부 확인.
- **실제 EC2 로그인/CRUD 통합 QA와 픽셀 단위 스크린샷 검증은 실행하지 않음**. 사용자 지시대로 구현 이후 통합 QA 별도 진행.

## 다음 QA 시나리오
1. 사용자 로그인 → 자소서 생성 → 지원 보드 카드 자동 반영.
2. 카드 추가 → 새 자소서 목록과 일치.
3. 드래그/셀렉트 단계 이동 → 새로고침 후 동일.
4. 마감일/면접일/서류결과/이력서/포트폴리오 상태 저장 → 새로고침/재방문 후 유지.
5. 달력 마감 표시·월 경계·마감임박 계산 검증.
6. 서버 401/404/500·중복 클릭·응답 지연 시 UI 보존, 카드 삭제 시 자소서 연관 삭제 경고 확인.
7. 1440/1023/720/360 디자인 비교 및 키보드/터치/스크린리더 점검.
8. 개발 미리보기와 실제 EC2 데이터가 완전히 분리되는지 검증.
