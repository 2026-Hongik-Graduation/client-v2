# POFIT Frontend — GitHub / Vercel 배포 가이드

## 배포 대상
- GitHub: `2026-Hongik-Graduation/client-v2`, 앱 루트는 저장소 루트.
- Next.js 16 App Router의 `/api/[...path]` 서버 프록시와 부분 사전 렌더링을 사용하므로 GitHub Pages 정적 배포를 사용하지 않는다.
- 권장: `fix/qa-20261105` 같은 개발 브랜치를 **Vercel Preview**로 검증하고, QA 승인 후 `main`을 Production으로 배포한다.
- `.env.local`, 쿠키, 사용자 정보, API 키를 GitHub에 올리지 않는다.

## Vercel 프로젝트 연결 (최초 1회)
1. 팀의 Vercel 계정으로 로그인하고 [New Project](https://vercel.com/new)를 연다.
2. GitHub 조직 `2026-Hongik-Graduation`을 연결하고 `client-v2` 저장소를 Import한다. 조직 관리자의 GitHub App 설치 승인이 필요할 수 있다.
3. Framework Preset `Next.js`, Root Directory `./`, Install Command `npm ci`, Build Command `npm run build`로 설정한다.
4. Settings → Environment Variables에 **Preview 전용** `QA_BACKEND_ORIGIN`을 설정한다. 값은 팀에서 승인한 HTTPS QA API origin(예: `https://43-203-204-29.sslip.io`)이며 `/api` 경로를 붙이지 않는다.
5. 배포한 Preview URL에서 `/`, `/login`, `/experiences`, `/cover-letters`, `/applications`, `/interviews`를 점검한다. 실제 CRUD/AI는 허가된 격리 테스트 계정과 데이터로만 수행한다.

## 운영 배포 승인 조건
- `npm ci`, `npm run lint`, `npm run build`, `npx tsc --noEmit` 통과 및 CI 성공.
- `docs/QA-RESULTS-20261105.md`의 미완료 통합 QA·보안/접근성/모바일 항목 점검 및 릴리스 담당자 승인.
- Production에는 **운영 전용** HTTPS 백엔드 origin을 `QA_BACKEND_ORIGIN` 키에 설정해야 한다(코드의 환경변수 이름 유지). QA EC2 주소를 승인 없이 운영 환경에 사용하지 않는다.
- Vercel Git Integration이 연결되면 PR/브랜치 push마다 Preview, 운영 브랜치 병합 시 Production 배포가 생성된다.
- 배포 후 브라우저 콘솔, `/api` 프록시의 미인증 401/보안 동작, 서버 로그를 확인한다. 실제 사용자 데이터로 테스트하지 않는다.

## CLI 대안
`vercel login` → `vercel link` → `vercel deploy`로 Preview를 생성할 수 있다. Production 배포 `vercel deploy --prod`는 QA 승인 후에만 사용한다.
