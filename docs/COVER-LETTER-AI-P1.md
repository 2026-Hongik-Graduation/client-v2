# 자소서 AI P1 — 문항 분석·작성 전략·초안·첨삭

작성일: 2026-11-05. 후속 로컬 기능 브랜치 `feat/cover-letter-ai-20261105`.

## 사용자 흐름
1. `/cover-letters` → 자소서 상세 `/cover-letters/{id}` → 기존 문항 카드의 **AI 분석·초안·첨삭** 버튼.
2. **문항 분석**: 저장된 문항 내용을 기준으로 질문 유형, 평가 의도, 요구 역량과 신뢰도 관련 경고 표시. 분석 결과의 질문 유형을 선택값에 반영하지만 답변 자체를 변경하지 않음.
3. **작성 전략**: 문항 유형과 연결 경험(선택)을 바탕으로 강점, 증거 부족 부분, 다음 할 일 미리보기.
4. **AI 초안**: 문항에 이미 연결한 **요약된** 경험을 1개 이상 선택해야 실제 백엔드의 생성 요청 가능(최대 10개). AI가 결과를 제안으로만 반환.
5. **첨삭**: 현재 답변을 입력하고 방향(논리·간결·직무 적합·맞춤법 등)과 추가 지시로 첨삭 미리보기.
6. **대화형 첨삭**: 편집 요청을 서버에 보내고 요청·제안 이력 조회/선택. 백엔드는 이 대화 자체를 저장하므로 민감한 정보 전송 안내를 확인할 것.
7. **반영**: AI 제안을 선택하면 기존 답변 교체 확인 → **브라우저 입력란에만 반영** → 기존 **이 문항 저장**을 눌러야 실제 본문에 반영됨.
8. 저장한 자소서는 기존 **작성 버전 관리**로 별도 스냅샷 저장 가능.

## 실제 EC2 API
2026-11-05, `https://43-203-204-29.sslip.io/v3/api-docs` 및 로컬 Spring 컨트롤러에서 조회 확인.

- `POST /api/cover-letters/{coverId}/questions/{questionId}/analyze`: 무본문. `questionType`, `evaluationIntent`, `evidenceQuote`, `recommendedSkills`, `warnings`, `provider`, `isMock`, `promptVersion`.
- `POST .../strategy`: `{questionType,experienceIds}` → `strengths/evidenceGaps/nextActions`.
- `POST .../draft`: 동일 요청 → `text/characterCount/characterLimit/warnings/usedExperienceIds`. **서버는 초안 자동 저장하지 않음**.
- `POST .../revise`: `{questionType,experienceIds,originalText,revisionType,instruction}` → 첨삭 `text`와 수정 이유.
- `GET .../ai-chat/turns?page=0&size=50` 및 `page=1`: 최대 100개 대화 이력 읽기.
- `POST .../ai-chat/turns`: `{questionType,experienceIds,currentDraft,revisionType,instruction,requestId}` → 변경 제안 및 이력 기록. 같은 requestId 재시도 시 서버에서 중복을 방지.
- 본문 저장은 기존 `PATCH /api/cover-letters/{coverId}/questions/{questionId}`의 `answerText`. AI 호출과 구분.
- 실제 HTTP는 기존 Next.js same-origin 프록시를 통과. JWT는 브라우저 JS에 직접 노출하지 않음.

## 개발 전용 미리보기
- `src/lib/dev-preview.ts`에 위 경로들의 **로컬 시뮬레이션** 추가. localhost+development+preview-cookie 세 조건을 만족해야 동작.
- 예시 결과에는 `provider=LOCAL_PREVIEW, isMock=true, warnings=[MOCK_ONLY]` 표시.
- 모의 초안/첨삭은 **실제 생성이 아닌 설명용 텍스트**다. 기존 경험의 사실/수치를 가공하거나 실제 AI 결과라고 주장하지 않음.
- 모의 대화 이력은 브라우저의 별도 localStorage에만 남는다. **EC2에 보내지 않음**.

## 제약 및 안전 장치
- 문항 내용·글자수 제한이 미저장 상태면 AI 요청 차단. 저장된 실제 문항 내용 기준으로 분석하기 위함.
- 경험 선택 전에 연결된 경험 목록을 읽고(최대 10개) 선택. 경험 원문/요약이 누락된 경우 백엔드에서 거절할 수 있음. UI는 오류를 명확히 표시.
- AI 응답의 `isMock`와 경고 코드 표시. **모의 결과를 실서비스 생성으로 착각하지 않도록 표시**.
- 제안문에 최대 글자 수를 넘는 글이 오면 답변 반영 버튼 비활성화. 기존 원문 무단 변경 안 함.
- 첨삭 요청 중 답변이 수정되었다면 적용 시 확인, 현재 본문이 있다면 교체 전 추가 확인.
- AI 실패 시 기존 답변과 기존 미리보기 텍스트 유지. 대화 전송은 고정 requestId로 중복 제출 피해 최소화.
- 대화 내역은 실제 백엔드에 저장되지만 **자소서 저장과는 별도**. 개인식별·민감정보를 무분별하게 넣지 말 것.
- 이번 범위 **미포함**: 기업 분석/공고 자동 파싱, AI 비용·사용량 제한 표시, 원클릭 PDF 내보내기, 단위/브라우저 E2E 전체 QA.

## Figma 근거
- [초안 생성 프레임 1:52210](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-52210)
- [대화형 첨삭 1:52307](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-52307)
- [문항 분석 1:52114](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-52114)
- [기존 이미지 미리보기](./figma-previews/cover-letter-editor.png)
- 이번 구현은 **기존 확보한 Figma 시안·디자인 토큰을 재사용**했으며 Figma MCP 호출 제한으로 현재 레이어의 신규 캡처와 실측값 재대조는 하지 못함. **원본 픽셀 단위 일치 미검증**.

## 검증 계획
- `npm run lint`, `npm run build` 후 결과 확인.
- 본격 QA는 별도 단계: 초안 생성 성공/실패, 연결된 경험 요약 없음, 모의 제공자 배지, 한국어/이모지 글자수 초과, 이전 답변 교체/미저장 보호, AI 대화 이력 재조회, 중복 requestId, 실제 사용자의 401/403/429/5xx, 피그마 1440/1023/720, 시각/접근성 검토.
- 실제 EC2 테스트 계정을 이용한 AI 요청/자소서 본문 변경은 이번 구현 단계에서는 수행하지 않음.
