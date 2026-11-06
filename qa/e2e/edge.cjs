const {chromium}=require("playwright");
const assert=require("node:assert/strict"),fs=require("node:fs");
const base=process.env.QA_E2E_BASE||"https://client-v2-one.vercel.app";
const results=[],errors=[],network=[];
const test=async(name,fn)=>{try{await fn();results.push({name,status:"PASS"});console.log("PASS",name)}catch(e){const reason=String(e.message||e).slice(0,260);results.push({name,status:"FAIL",reason});console.log("FAIL",name,reason)}};
let browser,context,page,coverId,expId;
const go=async(path)=>{await page.goto(base+path,{waitUntil:"domcontentloaded"});await page.waitForTimeout(180)};
const company="E2E_경계_기업_20261106",position="QA 테스트 엔지니어";
const answer="한국어 🧩\n줄바꿈과 특수문자 <> & 텍스트";
(async()=>{
browser=await chromium.launch({executablePath:(process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"),headless:true});
context=await browser.newContext({viewport:{width:1440,height:1000},locale:"ko-KR",acceptDownloads:true});
page=await context.newPage();page.setDefaultTimeout(8500);
page.on("pageerror",e=>errors.push(e.message.slice(0,190)));
page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))network.push({method:r.method(),path:new URL(r.url()).pathname})});
page.on("dialog",d=>d.accept());
await test("SEC-guest-protected-paths",async()=>{
 for(const route of ["/experiences","/cover-letters","/applications","/interviews","/experiences/00000000-0000-4000-8000-000000000000"]){
  await go(route);await page.waitForURL(/\/login\?next=/,{timeout:9000});assert.equal(new URL(page.url()).pathname,"/login");
 }});
await test("SEC-unauth-refresh-401",async()=>assert.equal((await context.request.get(base+"/api/auth/refresh")).status(),401));
await test("SEC-cross-origin-write-403",async()=>assert.equal((await context.request.post(base+"/api/auth/refresh",{headers:{origin:"https://example.invalid"},data:{}})).status(),403));
await test("SEC-demo-entry-no-auth-cookies",async()=>{
 await go("/login");await page.getByRole("button",{name:/로그인 건너뛰기/}).click();await page.waitForURL(/cover-letters/);
 const cookies=await context.cookies();assert(cookies.some(c=>c.name==="pofit_dev_preview"));assert(!cookies.some(c=>c.name==="pofit_qa_access"||c.name==="pofit_qa_refresh"));
});
await test("SEC-demo-api-get-and-write-denied",async()=>{
 for(const [method,path] of [["GET","experiences"],["POST","cover-letters"],["PATCH","experiences/111"],["DELETE","cover-letters/111"],["GET","auth/refresh"]]){
 const r=await context.request.fetch(base+"/api/"+path,{method,headers:{"Content-Type":"application/json"},data:method==="GET"?undefined:{}});
 assert.equal(r.status(),403,method+" "+path);
 }});
await test("G1-empty-experience-rejected",async()=>{await go("/experiences/new");await page.getByRole("button",{name:/다음단계로/}).click();await page.getByRole("alert").first().waitFor();assert(new URL(page.url()).pathname.endsWith("/experiences/new"))});
await test("G1-experience-create",async()=>{await page.getByPlaceholder("경험 제목을 입력해주세요.").fill("E2E 추가질문 포함 경험");await page.getByLabel("경험 시작일").fill("2026-10-01");await page.getByLabel("경험 종료일").fill("2026-10-30");
 await page.getByRole("button",{name:/다음단계로/}).click();await page.waitForURL(/\/experiences\/[a-f0-9-]{36}/);expId=page.url().split("/").pop();assert(expId)});
if(expId){
 await test("G1-incomplete-completion-blocked",async()=>{await page.getByRole("button",{name:"작성 완료"}).click();await page.getByRole("alert").first().waitFor();await page.reload();assert(page.url().endsWith(expId))});
 await test("G1-custom-question-save-and-reload",async()=>{await page.getByRole("button",{name:/질문 추가하기/}).click();await page.getByPlaceholder("추가 질문을 입력해 주세요.").fill("추가 의견?");await page.getByPlaceholder("답변을 입력해 주세요.").fill(answer);
 const q=page.locator('section[aria-label="경험별 질문"] textarea');for(let i=0;i<await q.count();i++)await q.nth(i).fill("QA 결과 "+i);
 await page.getByRole("button",{name:"임시저장"}).click();await page.getByText("임시저장되었습니다.").waitFor();await page.reload();
 assert.equal(await page.getByPlaceholder("답변을 입력해 주세요.").inputValue(),answer);assert.equal(await page.getByPlaceholder("추가 질문을 입력해 주세요.").inputValue(),"추가 의견?")});
 await test("G1-cancel-experience-delete",async()=>{page.removeAllListeners("dialog");page.once("dialog",d=>d.dismiss());await page.getByRole("button",{name:"경험 삭제"}).click();await page.waitForTimeout(200);assert(page.url().endsWith(expId));page.on("dialog",d=>d.accept())});
}
await test("G2-cover-create",async()=>{await go("/cover-letters/new");
 await page.getByPlaceholder("ex) 토스뱅크").fill(company);await page.getByPlaceholder("ex) 백엔드 개발자").fill(position);
 await page.getByRole("button",{name:/저장하고 문항 작성하기/}).click();await page.waitForURL(/\/cover-letters\/[0-9a-f-]{36}/);
 coverId=page.url().split("/").pop();assert(coverId)});
if(coverId){
 await test("G2-posting-url-rejection",async()=>{await page.getByRole("button",{name:/채용공고 원문/}).click();await page.getByPlaceholder("https://company.com/jobs/123").fill("javascript:alert(1)");await page.getByRole("button",{name:"채용공고 저장"}).click();
 await page.getByText("공고 링크는 올바른 http(s) URL이어야 합니다.").waitFor()});
 await test("G2-posting-text-persists",async()=>{await page.getByPlaceholder("https://company.com/jobs/123").fill("https://example.com/jobs/123");await page.locator('textarea[rows="6"]').fill("테스트 공고 <script>alert(1)</script>\n연봉 1원");
 await page.getByRole("button",{name:"채용공고 저장"}).click();await page.getByText("채용공고를 저장했습니다.").waitFor();await page.reload();
 await page.getByRole("button",{name:/채용공고 원문/}).click();assert((await page.locator('textarea[rows="6"]').inputValue()).includes("<script>"))});
 await test("G2-question-empty-validation",async()=>{await page.getByRole("button",{name:"새 문항 등록"}).click();await page.getByText("문항 내용은 1~10,000자입니다.").waitFor()});
 await test("G2-two-questions-created",async()=>{for(const q of ["첫 문항 QA","둘째 문항 QA"]){await page.getByPlaceholder("지원 동기를 서술해 주세요.").fill(q);await page.getByRole("button",{name:"새 문항 등록"}).click();await page.getByText("문항이 추가되었습니다.").waitFor()}assert.equal(await page.locator("article").count(),2)});
 await test("G2-emoji-count-and-limit",async()=>{const card=page.locator("article").first();await card.getByPlaceholder("연결된 경험을 참고해 직접 답변을 작성하세요.").fill(answer);await card.locator('input[type="number"]').fill("5");
 assert(await card.getByRole("button",{name:"이 문항 저장"}).isDisabled());await card.locator('input[type="number"]').fill("100");await card.getByRole("button",{name:"이 문항 저장"}).click();await card.getByText("문항과 답변을 저장했어요.").waitFor();await page.reload();
 assert.equal(await page.locator("article").first().getByPlaceholder("연결된 경험을 참고해 직접 답변을 작성하세요.").inputValue(),answer)});
 await test("G2-reorder-question-and-persist",async()=>{const cards=page.locator("article");await cards.first().getByRole("button",{name:/아래로/}).click();await page.getByText("문항 순서가 저장되었습니다.").waitFor();await page.reload();
 assert.equal(await page.locator("article").first().getByPlaceholder("지원 동기와 직무 역량을 설명해 주세요.").inputValue(),"둘째 문항 QA")});
 await test("G2-version-create",async()=>{await page.getByRole("button",{name:/작성 버전 관리/}).click();await page.getByPlaceholder("예: 제출 직전 최종본").fill("E2E 백업 v1");
 await page.getByRole("button",{name:"버전 저장"}).click();await page.getByText("E2E 백업 v1").waitFor()});
 await test("G2-remove-one-question",async()=>{const cards=page.locator("article");assert.equal(await cards.count(),2);
 await cards.last().getByRole("button",{name:"문항 삭제"}).click();await page.getByText("문항이 삭제되었습니다.").waitFor();
 assert.equal(await page.locator("article").count(),1)});
 await test("G2-version-restore",async()=>{await page.getByRole("button",{name:"이 버전 복원"}).click();await page.getByText("버전을 복원했습니다. 연결된 경험도 다시 확인해 주세요.").waitFor();assert.equal(await page.locator("article").count(),2);
 await page.reload();await page.locator("article").first().waitFor();assert.equal(await page.locator("article").count(),2)});
 await test("G2-save-metadata-and-board-consistency",async()=>{await page.getByLabel("직무명",{exact:true}).fill(position+" 수정");
 await page.getByRole("button",{name:"기본 정보 저장"}).click();await page.getByText("기본 정보를 저장했습니다.").waitFor();
 await go("/applications");await page.locator("article[aria-label*='"+company+"']").waitFor();assert((await page.locator("article[aria-label*='"+company+"']").innerText()).includes(position+" 수정"))});
}
await test("G3-stage-list-select-and-filter",async()=>{await go("/applications");const card=page.locator("article[aria-label*='"+company+"']");await card.getByRole("combobox").selectOption("PREPARING");await page.waitForTimeout(300);
 await page.reload();const c=page.locator("article[aria-label*='"+company+"']");assert.equal(await c.getByRole("combobox").inputValue(),"PREPARING");
 await page.getByRole("combobox",{name:"단계",exact:true}).selectOption("SUBMITTED");await page.waitForTimeout(300);assert.equal(await c.count(),0);
 await page.getByRole("combobox",{name:"단계",exact:true}).selectOption("PREPARING");assert.equal(await c.count(),1)});
await test("G3-search-then-clear",async()=>{await page.getByPlaceholder("기업명, 직무명으로 검색...").fill("절대로없는회사");await page.getByRole("button",{name:"검색하기"}).click();await page.getByText("검색 조건과 일치하는 지원 카드가 없어요.").waitFor();await page.getByRole("button",{name:"필터 초기화"}).click();
 assert.equal(await page.getByPlaceholder("기업명, 직무명으로 검색...").inputValue(),"")});
await test("G3-calendar-month-switch-and-card",async()=>{await page.getByRole("button",{name:"캘린더"}).click();const cal=page.locator('section[aria-label="지원 일정 캘린더"]');
 await cal.waitFor();const title=await cal.locator("h2").textContent();await cal.getByRole("button",{name:"다음 달"}).click();assert.notEqual(await cal.locator("h2").textContent(),title);
 await cal.getByRole("button",{name:"이전 달"}).click();assert.equal(await cal.locator("h2").textContent(),title);await page.getByRole("button",{name:"칸반보드"}).click()});
await test("G3-card-modal-keyboard-escape",async()=>{await page.getByRole("button",{name:/지원 카드 추가/}).first().click();await page.getByRole("dialog").waitFor();await page.keyboard.press("Escape");
 await page.getByRole("dialog").waitFor({state:"hidden",timeout:2500})});
await test("G3-modal-close-without-save",async()=>{const d=page.getByRole("dialog");if(!await d.count())await page.getByRole("button",{name:/지원 카드 추가/}).first().click();
 await d.getByRole("textbox",{name:"기업명"}).fill("취소 후 유실돼야하는 값");await d.getByRole("button",{name:"닫기"}).click();await d.waitFor({state:"hidden"});
 assert(!await page.getByText("취소 후 유실돼야하는 값").count())});
await test("G3-per-column-create-and-persist",async()=>{const column=page.locator('section[aria-label="제출 완료"]');await column.getByRole("button",{name:"카드 추가하기"}).click();
 const d=page.getByRole("dialog");assert.equal(await d.getByRole("combobox",{name:"지원 단계"}).inputValue(),"SUBMITTED");
 await d.getByRole("textbox",{name:"기업명"}).fill("E2E_지원완료_테스트");await d.getByRole("textbox",{name:"지원 직무"}).fill("품질 검증");
 await d.getByRole("button",{name:"지원 등록"}).click();await d.waitFor({state:"hidden"});
 await column.getByText("E2E_지원완료_테스트",{exact:true}).waitFor();await page.reload();
 await page.locator('section[aria-label="제출 완료"]').getByText("E2E_지원완료_테스트",{exact:true}).waitFor()});
await test("G3-stage-drag-drop",async()=>{const before=page.locator("article[aria-label*='"+company+"']");await before.waitFor();
 await before.dragTo(page.locator('section[aria-label="전형 종료"]'));
 await page.waitForTimeout(300);await page.reload();
 assert.equal(await page.locator("article[aria-label*='"+company+"']").getByRole("combobox").inputValue(),"CLOSED")});
if(coverId){
 await test("G5-question-persistence-and-clear",async()=>{await go("/interviews/"+coverId);const box=page.locator("#interview-answer");await box.fill(answer);
 await page.getByRole("checkbox",{name:"이 질문 연습 완료"}).check();await page.getByRole("button",{name:"이 브라우저에 저장"}).click();
 await page.reload();assert.equal(await page.locator("#interview-answer").inputValue(),answer);assert(await page.getByRole("checkbox",{name:"이 질문 연습 완료"}).isChecked());
 await page.getByRole("button",{name:"내 연습 기록 초기화"}).click();assert.equal(await page.locator("#interview-answer").inputValue(),"");await page.reload();
 assert.equal(await page.locator("#interview-answer").inputValue(),"")});
 await test("G5-timer-start-pause-reset",async()=>{const t=page.getByRole("region",{name:"면접 답변 타이머"});
 await t.getByRole("combobox",{name:"타이머 시간 설정"}).selectOption("60");assert.equal((await t.locator("output").textContent()).trim(),"01:00");
 await t.getByRole("button",{name:"시작"}).click();await page.waitForTimeout(2300);const running=await t.locator("output").textContent();assert.notEqual(running,"01:00");
 await t.getByRole("button",{name:"일시정지"}).click();const paused=await t.locator("output").textContent();await page.waitForTimeout(1600);
 assert.equal(await t.locator("output").textContent(),paused);await t.getByRole("button",{name:"초기화"}).click();assert.equal(await t.locator("output").textContent(),"01:00")});
}
await test("SEC-browser-context-isolation",async()=>{const isolated=await browser.newContext();const isolatedPage=await isolated.newPage();
 await isolatedPage.goto(base+"/cover-letters");await isolatedPage.waitForURL(/\/login\?next=/);
 assert.equal(await isolatedPage.getByRole("button",{name:/로그인 건너뛰기/}).count(),1);
 await isolatedPage.close();await isolated.close();});
await test("SEC-demo-survives-reload",async()=>{await go("/applications");await page.reload();assert.equal(new URL(page.url()).pathname,"/applications");
 assert((await context.cookies()).some(c=>c.name==="pofit_dev_preview"))});
await test("G0-logout-and-relogin",async()=>{await page.getByRole("button",{name:"로그아웃"}).click();await page.waitForURL(/\/login/);
 assert(!(await context.cookies()).some(c=>c.name==="pofit_dev_preview"));
 await go("/applications");await page.waitForURL(/\/login\?next=/);
 await page.getByRole("button",{name:/로그인 건너뛰기/}).click();await page.waitForURL(/\/cover-letters/);
 await go("/applications");await page.locator("article[aria-label*='"+company+"']").waitFor()});
await test("G2-delete-cover-and-remove-application",async()=>{
 await go("/cover-letters/"+coverId);
 await page.getByRole("button",{name:"자소서 삭제"}).click();
 await page.waitForURL(/\/cover-letters(?:\?|$)/);
 await go("/applications");
 await page.locator('section[aria-label="지원 예정"]').waitFor();
 assert.equal(await page.locator("article[aria-label*='"+company+"']").count(),0);
});
await test("G1-delete-experience-persistently",async()=>{
 await go("/experiences/"+expId);
 await page.getByRole("button",{name:"경험 삭제"}).click();
 await page.waitForURL(/\/experiences(?:\?|$)/);
 await page.getByRole("heading",{name:"경험 대시보드"}).waitFor();
 await page.getByText("표시할 경험이 없습니다.").waitFor();
 await page.reload();
 await page.getByText("표시할 경험이 없습니다.").waitFor();
});
await test("SEC-no-pageerrors",async()=>assert.deepEqual(errors,[]));
await test("SEC-no-unexpected-api-traffic",async()=>{
 const unwanted=network.filter(n=>!["/api/auth/refresh","/api/experiences","/api/cover-letters","/api/experiences/111","/api/cover-letters/111"].includes(n.path));
 assert.deepEqual(unwanted,[])});
await browser.close();
const totals={pass:results.filter(x=>x.status==="PASS").length,fail:results.filter(x=>x.status==="FAIL").length};
fs.writeFileSync(__dirname+"/edge-live-results-20261106.json",JSON.stringify({base,results,totals,errors,network},null,2));
console.log("EDGE_SUMMARY",JSON.stringify(totals));
if(totals.fail)process.exitCode=2;
})().catch(async e=>{console.error("EDGE_FATAL",e.stack);await browser?.close();process.exitCode=1});
