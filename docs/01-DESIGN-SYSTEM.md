# 01. 디자인 시스템과 프론트엔드 기반 구현 계획

상태: **부분 구현(홈·로그인·경험·자소서 시작·칸반에 토큰/에셋 적용됨) / 범용 공통 컴포넌트 추가 필요**. 담당 범위: 홈·인증·경험·자소서·칸반의 일관된 UI.

## Figma 원본 및 근거
- [디자인 시스템 전체](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60404) / [컬러](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60596) / [타이포](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60406)
- [로고](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60551) / [레이아웃](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60576) / [간격](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60848)
- [투명도](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60911) / [padding](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60962) / [아이콘](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60965) / [radius](https://www.figma.com/design/0wZM1igoWTo0vJt4Ncqpgl/Pofit-%ED%8F%AC%ED%95%8F?node-id=1-60992)
- 이번 추출에서는 MCP 호출 제한 때문에 디자인 시스템 시안 PNG를 확보하지 못했으므로 정확한 실측값은 위 링크를 재검증해야 합니다.

## 현재 저장소 기준
- 디자인 토큰: `src/app/globals.css`, Tailwind CSS v4의 `@theme` 방식.
- Pretendard Variable 웹폰트는 `src/app/layout.tsx`의 CDN 링크를 통해 로딩.
- 사용 중인 대표 색상: primary-10 `#f1f9f8`, primary-60 `#267e72`, primary-90 `#0f332f`, text-primary `#2b2b2b` (현재 코드 기준).
- 대표 spacing: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 120, 160px (코드 기준; Figma 재대조 필수).
- 홈 컴포넌트: `Header`, `Footer`, `Reveal`, `Hero`, `IntroStory`, `Steps`.
- 로고, 소셜 아이콘, 기기 목업 등 기본 원본 SVG/PNG: `public/figma/`. 새 UI를 구현할 때 먼저 이 에셋을 확인합니다.

## 구축할 토큰 계층 (제안)
| 그룹 | 구현 방식 | 검증 |
| --- | --- | --- |
| Colors | primary, grayscale, text, background, status + hover/disabled semantic alias | 원본 Figma 변수/HEX 비교 |
| Typography | Pretendard Variable, display/heading/body/caption, weight·line-height·letter-spacing | 한국어 줄바꿈/기준선 |
| Spacing | 토큰 기반 gap/padding/section margin | Auto Layout 값과 대조 |
| Shape | radius, border width, shadow/elevation | 기본·호버·포커스 |
| Layout | 1440/1024/1023/720에 대응하는 content max-width와 breakpoint | 가로 스크롤 금지 |
| Motion | duration/easing, delay, reveal threshold, reduced-motion | 재진입 및 성능 |
| Z-index | sticky header, dropdown, overlay, modal, toast 계층 | 포커스와 스크롤 잠금 |

## 공통 컴포넌트 분해
| 컴포넌트 | 필요한 variant/상태 | 주요 소비자 |
| --- | --- | --- |
| Button / LinkButton | primary/secondary/ghost, sm/md/lg, loading, disabled | 전체 |
| TextField / PasswordField | label, helper, valid/error, eye toggle, required | 로그인·자소서 |
| Checkbox / Radio / Select | 선택/미선택, 오류, keyboard | 가입·필터 |
| Textarea / CharacterCounter | 길이 제한·문항별 카운트·초과 표시 | 경험·자소서 |
| Modal / ConfirmDialog | 열기·닫기·포커스 트랩·ESC·배경 클릭 정책 | 저장·삭제 |
| Toast / InlineAlert | success/error/info, 재시도 | 전체 |
| Chip / Tag / Filter | 단일/다중 선택, 지우기, 검색결과 0건 | 경험·자소서 |
| Tabs / Accordion / Sidebar | active, scroll, narrow view | 자소서·지원관리 |
| Card / Skeleton / EmptyState | 목록·상세·빈 상태·loading | 전체 |
| FileDropzone | 드래그, 용량/형식 검사, 업로드 중/실패 | 경험 가져오기 |
| AppHeader / UserMenu | desktop/compact, 인증 전후 | 전체 |

## 구현 전략
1. Figma 컴포넌트/변수의 실제 스타일을 추출하고 코드와 **diff 목록**을 작성. 이미 구현된 홈 토큰은 검증 후 변경.
2. `src/components/ui/`에 primitive를 구축하고 해당 컴포넌트의 variant를 props로 명확히 표현합니다.
3. React Server Component를 기본으로 하되 UI 상호작용/상태가 있는 요소만 `"use client"`로 분리합니다.
4. 토큰은 가능하면 이름과 목적이 드러나는 semantic alias로 관리하고 프레임별 임의 HEX·매직 넘버 중복을 금지합니다.
5. 원본 PNG/SVG를 보존하고 저장소의 기존 에셋과 중복을 판별합니다. 임시 Figma URL을 코드에 직접 넣지 않습니다.
6. 접근성: 충분한 클릭 영역, 시맨틱 마크업, WCAG 색 대비, focus-visible, keyboard 동작, aria-describedby 연결.
7. Figma 컴포넌트가 공통화 불가능하게 미세하게 다르면 무리한 단일 컴포넌트보다 **조합 패턴**을 사용합니다.

## 기술적 디렉터리 구조 (제안)
```text
src/
  app/globals.css             # Tailwind @theme / 글로벌 reset (기존)
  components/ui/              # Button, Field, Dialog, Tabs...
  components/layout/          # 헤더, 사이드바, 반응형 쉘
  lib/design-tokens.ts        # TS에서 필요한 semantic value만
  lib/utils.ts                # 공통 포맷/병합 함수
public/figma/                 # 실제 원본 PNG/SVG 에셋
```
기존 `src/components/Header.tsx`와 `Footer.tsx`를 일괄 교체하지 않고 변경 필요성을 검증합니다.

## 작업 단위 체크리스트
- [ ] Figma 변수/기본 토큰 표: HEX, font, spacing, radius, shadow, opacity 취합
- [ ] 현재 globals.css 값과 차이표 작성, 디자인 승인 후 토큰 확정
- [ ] font loading 실패/FOIT 대체 폰트 및 CLS 정책
- [ ] Button, IconButton, Field, Select, Checkbox, Radio, Textarea
- [ ] Dialog, Toast, Tabs, Popover/Dropdown, EmptyState, Skeleton
- [ ] responsive header·sidebar·max width·sticky 처리
- [ ] hover/focus/pressed/disabled/loading/error 모든 variant 검증
- [ ] 에셋 매니페스트(파일명, Figma node, 사용처, 치수) 작성
- [ ] Storybook 등 독립 UI 리뷰 도구 도입 필요성 검토
- [ ] 1440, 1024, 1023, 720, 360px 시각·접근성 검수 (360은 임시 UX)

## 완료 판정
- [ ] 각 화면이 정의된 토큰만 사용하고 기존 홈에 시각 회귀 없음.
- [ ] 공통 UI를 키보드만으로 사용 가능하고 에러를 스크린리더가 인지.
- [ ] 디자인과 실제 화면의 margin, padding, font, icon, radius 차이를 검토 완료.
- [ ] `npm run lint` / `npx tsc --noEmit` / `npm run build` 통과.
- [ ] 새 Figma 시안이 들어와도 컴포넌트/토큰 변경으로 여러 화면에 반영 가능.

## 의사결정 및 위험
- 일부 Figma variant/정확한 컬러 시스템은 세부 추출 전입니다. **현재 코드 값을 완전한 Figma 명세로 단정하지 않습니다.**
- CDN 폰트는 네트워크에 영향을 받으므로 배포 정책(셀프 호스팅/허용 출처)을 팀에서 결정.
- 브레이크포인트는 CSS의 범위 규칙과 Figma가 구분하는 1024/1023 경계를 모두 테스트하여 결정.
