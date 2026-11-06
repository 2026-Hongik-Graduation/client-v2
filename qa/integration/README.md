# POFIT 격리된 Spring Boot ↔ Next.js 통합 QA

**실제 EC2/운영 DB 대상 실행 금지.** 이 테스트는 로컬 Spring Boot, 임시 H2 메모리 DB, 루프백 SMTP만 사용합니다. 기존 로컬 DB(`data/hongik-graduate`)도 건드리지 않습니다. 실계정·실제 SMTP·모델 과금 요청은 하지 않습니다.

## 준비
- 프런트 `npm ci`, `npm run build`, JDK 17+, Chrome 설치
- 백엔드 저장소(예: `C:\Users\1234\Desktop\hongik-graduate-BE\be`)
- 다음 포트가 **모두 비어 있어야 함**: 25250(SMTP), 31080(로컬 수신함), 18080(Spring), 3008(Next)

### 터미널 1 — 루프백 메일 수신함
```powershell
cd "C:\Users\1234\Desktop\졸프_FE"
node qa/integration/smtp-sink.cjs
```

### 터미널 2 — 완전히 격리된 백엔드
```powershell
cd "C:\Users\1234\Desktop\hongik-graduate-BE\be"
.\mvnw.cmd -q -DskipTests package
$env:SPRING_CONFIG_IMPORT="optional:file:./__qa_isolated_config_none.env"
$env:SPRING_PROFILES_ACTIVE="local"
$env:SPRING_DATASOURCE_URL="jdbc:h2:mem:pofit_isolated_integration;DB_CLOSE_DELAY=-1"
$env:SPRING_JPA_HIBERNATE_DDL_AUTO="create-drop"
$env:SPRING_H2_CONSOLE_ENABLED="false"
$env:SERVER_PORT="18080"
$env:SERVER_ADDRESS="127.0.0.1"
$env:JWT_SECRET=[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:AI_PROVIDER="mock"
$env:AI_ENABLED="false"
$env:AI_API_KEY=""
$env:MAIL_HOST="127.0.0.1"
$env:MAIL_PORT="25250"
$env:MAIL_SMTP_AUTH="false"
$env:MAIL_SMTP_STARTTLS="false"
$env:MAIL_FROM="pofit-qa@local.invalid"
java -jar target/graduate-be-0.0.1-SNAPSHOT.jar
```

### 터미널 3 — 실제 Next.js 프로덕션 빌드
```powershell
cd "C:\Users\1234\Desktop\졸프_FE"
$env:QA_BACKEND_ORIGIN="http://127.0.0.1:18080"
npm run build
npm run start -- -p 3008
```

### 터미널 4 — 통합 QA와 공개 API 읽기 검사
```powershell
cd "C:\Users\1234\Desktop\졸프_FE"
$env:QA_FE_ORIGIN="http://localhost:3008"
$env:QA_BACKEND_ORIGIN="http://127.0.0.1:18080"
$env:QA_ISOLATED_H2="1"
npm run qa:integration:local
npm run qa:integration:contract
npm run qa:integration:deploy
```

로컬 통합 E2E에는 보호 장치가 있어 위 플래그 및 루프백 주소가 아니면 중단합니다. 테스트 계정·인증코드·비밀번호는 메모리에서 임의 생성하며 로그·Git에 기록하지 않습니다. SMTP 수신함은 127.0.0.1에만 바인딩됩니다.

`qa:integration:contract`는 로컬과 EC2의 공개 OpenAPI를 읽기만 하며, `qa:integration:deploy`는 Vercel 공개 페이지/비인증 GET만 검사합니다. **실제 EC2 계정의 쓰기 E2E와 AI 모델 호출 검증은 별도 허가가 필요합니다.**

## 종료
테스트가 끝나면 해당 터미널의 Node, Spring, Next 프로세스를 각각 `Ctrl+C`로 종료합니다. H2 `mem:` DB는 Spring 종료 시 소멸합니다.
