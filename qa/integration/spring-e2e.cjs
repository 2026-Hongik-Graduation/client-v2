// True Next.js proxy + isolated local Spring Boot/H2 + loopback SMTP end-to-end QA.
const {chromium}=require("playwright"),assert=require("node:assert/strict"),crypto=require("node:crypto"),fs=require("node:fs");
const base=process.env.QA_FE_ORIGIN||"http://localhost:3008";
if(!/^http:\/\/localhost:\d+$/.test(base)||
   process.env.QA_BACKEND_ORIGIN!=="http://127.0.0.1:18080" ||
   process.env.QA_ISOLATED_H2!=="1")
  throw new Error("Safety guard: use localhost Next + explicit isolated H2 backend only");
const results=[],errors=[],requests=[];
let browser,context,page;
const email="qa-integration-"+crypto.randomBytes(6).toString("hex")+"@example.test";
const password=crypto.randomBytes(18).toString("base64url")+"Aa1!";
const test=async(name,fn)=>{try{await fn();results.push({name,status:"PASS"});console.log("PASS",name)}catch(e){const reason=(e.message||String(e)).slice(0,360);results.push({name,status:"FAIL",reason});console.log("FAIL",name,reason)}};
async function api(method,path,data){
 const res=await context.request.fetch(base+"/api/"+path,{
  method,headers:{"Content-Type":"application/json"},...((data!==undefined)?{data}:{})
 });
 let out=await res.json().catch(()=>null);
 return {status:res.status(),body:out,headers:res.headers()};
}
(async()=>{
browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
context=await browser.newContext({viewport:{width:1440,height:1000},locale:"ko-KR"});
page=await context.newPage();page.setDefaultTimeout(13000);
page.on("pageerror",e=>errors.push(e.message.slice(0,200)));
page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))requests.push({method:r.method(),path:new URL(r.url()).pathname})});
let experienceId="",coverId="",questionId="",uiCoverId="",uiExperienceId="";
await test("G0-isolated-backend-openapi",async()=>{
 const res=await fetch("http://127.0.0.1:18080/v3/api-docs");
 assert.equal(res.status,200);const docs=await res.json();
 assert(docs.paths["/api/auth/login"]&&docs.paths["/api/cover-letters"]&&docs.paths["/api/experiences"]);
});
await test("G0-real-backend-anonymous-401",async()=>{
 const r=await api("GET","experiences?size=5");assert.equal(r.status,401);
});
await test("G0-signup-local-smtp",async()=>{
 const send=await api("POST","auth/email/send",{email});
 assert.equal(send.status,200,"send status="+send.status+" error="+send.body?.errorCode);
 let code=null;for(let i=0;i<15;i++){
 const r=await fetch("http://127.0.0.1:31080/code?email="+encodeURIComponent(email));
 const payload=await r.json();if(payload.received){code=payload.code;break}
 await new Promise(r=>setTimeout(r,250));
 }
 assert(code&&code.length===5,"QA SMTP did not receive code");
 const verified=await api("POST","auth/email/verify",{email,code});
 assert.equal(verified.status,200,"verify="+verified.status+" error="+verified.body?.errorCode);
 const created=await api("POST","auth/signup",{email,password});
 assert.equal(created.status,201,"signup="+created.status+" error="+created.body?.errorCode);
});
await test("G0-invalid-login-rejected",async()=>{
 const r=await api("POST","auth/login",{email,password:"invalid-pw"});
 assert.equal(r.status,401);
});
await test("G0-browser-login-proxy-cookies",async()=>{
 await page.goto(base+"/login");await page.getByPlaceholder("example@email.com").fill(email);
 await page.getByPlaceholder("password").fill(password);
 await page.getByRole("button",{name:"로그인하기"}).click();
 await page.waitForURL(/\/onboarding|\/experiences/, {timeout:16000});
 const cookies=await context.cookies();const names=cookies.map(c=>c.name);
 assert(names.includes("pofit_qa_access")&&names.includes("pofit_qa_refresh"),"missing session cookies");
 assert(!names.includes("pofit_dev_preview"),"real login shadowed by preview cookie");
 assert(cookies.filter(c=>c.name.startsWith("pofit_qa_")).every(c=>c.httpOnly));
});
await test("G0-profile-read-from-Spring",async()=>{
 const r=await api("GET","members/me/profile");
 assert.equal(r.status,200,"status="+r.status+" error="+r.body?.errorCode);
 assert.equal(r.body?.success,true);
});
await test("G0-profile-onboarding-DB-persistence",async()=>{
 const basic=await api("PUT","members/me/profile/basic",{age:25,gender:"OTHER",school:"홍익대학교"});
 assert.equal(basic.status,200,"basic="+basic.status+" error="+basic.body?.errorCode);
 const job=await api("PUT","members/me/profile/job",{desiredJob:"프론트엔드 개발자"});
 assert.equal(job.status,200,"job="+job.status+" error="+job.body?.errorCode);
 const read=await api("GET","members/me/profile");
 assert.equal(read.status,200);assert.equal(read.body?.data?.school,"홍익대학교");
 assert.equal(read.body?.data?.desiredJob,"프론트엔드 개발자");
});
await test("G1-real-experience-create",async()=>{
 const created=await api("POST","experiences",{title:"Spring 통합 QA 경험",tagCode:"STAR",creationMethod:"QUICK",startedAt:"2026-09-01",endedAt:"2026-10-01"});
 assert.equal(created.status,200,"status="+created.status+" error="+created.body?.errorCode);
 experienceId=created.body?.data?.id;assert(experienceId);
 const found=await api("GET","experiences/"+experienceId);
 assert.equal(found.status,200);assert.equal(found.body?.data?.experience?.title,"Spring 통합 QA 경험");
});
await test("G1-real-experience-answer-complete",async()=>{
 const qr=await api("GET","experience-tags/STAR/questions");assert.equal(qr.status,200);
 const questions=qr.body?.data||[];assert(questions.length>=4,"STAR required questions missing");
 const input={answers:questions.map((q,i)=>({questionId:q.id,content:"실제 Spring 테스트 응답 "+i,displayOrder:i}))};
 const a=await api("PUT","experiences/"+experienceId+"/answers",input);
 assert.equal(a.status,200,"answers="+a.status+" error="+a.body?.errorCode);
 const status=await api("PATCH","experiences/"+experienceId+"/status",{status:"COMPLETED"});
 assert.equal(status.status,200,"status="+status.status+" error="+status.body?.errorCode);
 const detail=await api("GET","experiences/"+experienceId);
 assert.equal(detail.body?.data?.experience?.status,"COMPLETED");
});
await test("G1-experience-browser-from-real-backend",async()=>{
 await page.goto(base+"/experiences");await page.getByText("Spring 통합 QA 경험",{exact:true}).first().waitFor();
 await page.reload();await page.getByText("Spring 통합 QA 경험",{exact:true}).first().waitFor();
});
await test("G2-real-cover-create",async()=>{
 const r=await api("POST","cover-letters",{companyName:"Spring 통합 QA 회사",positionName:"개발자",deadline:"2027-01-01",jdUrl:null});
 assert.equal(r.status,200,"status="+r.status+" error="+r.body?.errorCode);
 coverId=r.body?.data?.id;assert(coverId);
 const detail=await api("GET","cover-letters/"+coverId);
 assert.equal(detail.status,200);assert.equal(detail.body?.data?.coverLetter?.companyName,"Spring 통합 QA 회사");
});
await test("G2-real-question-persist",async()=>{
 const created=await api("POST","cover-letters/"+coverId+"/questions",{questionText:"내 경험을 설명해 주세요",characterLimit:1000});
 assert.equal(created.status,200,"question="+created.status+" error="+created.body?.errorCode);
 questionId=created.body?.data?.id;assert(questionId);
 const changed=await api("PATCH","cover-letters/"+coverId+"/questions/"+questionId,{questionText:"협업 경험을 설명해 주세요",answerText:"한글 이모지 🧪 답변",characterLimit:1000});
 assert.equal(changed.status,200,"patch="+changed.status+" error="+changed.body?.errorCode);
 const data=await api("GET","cover-letters/"+coverId);assert.equal(data.status,200);
 assert.equal(data.body?.data?.questions?.[0]?.answerText,"한글 이모지 🧪 답변");
});
await test("G2-real-experience-link",async()=>{
 const link=await api("POST","cover-letters/"+coverId+"/questions/"+questionId+"/experiences",{experienceId});
 assert.equal(link.status,200,"link="+link.status+" error="+link.body?.errorCode);
 const list=await api("GET","cover-letters/"+coverId+"/questions/"+questionId+"/experiences");
 assert.equal(list.status,200);assert(list.body?.data?.some(x=>x.experienceId===experienceId));
});
await test("G2-real-cover-version",async()=>{
 const saved=await api("POST","cover-letters/"+coverId+"/versions",{label:"통합 QA 버전"});
 assert.equal(saved.status,200,"version="+saved.status+" error="+saved.body?.errorCode);
 const list=await api("GET","cover-letters/"+coverId+"/versions");
 assert.equal(list.status,200);assert(list.body?.data?.some(x=>x.label==="통합 QA 버전"));
});
await test("G3-real-board-create-sync",async()=>{
 const b=await api("GET","application-board");assert.equal(b.status,200);
 assert(b.body?.data?.columns?.PLANNED?.some(x=>x.id===coverId));
});
await test("G3-real-board-move-persist",async()=>{
 for(const stage of ["PREPARING","SUBMITTED","CLOSED"]){
  const changed=await api("PATCH","application-board/"+coverId+"/status",{status:stage});
  assert.equal(changed.status,200,"move to "+stage+" status="+changed.status+" error="+changed.body?.errorCode);
  const board=await api("GET","application-board");
  assert(board.body?.data?.columns?.[stage]?.some(x=>x.id===coverId),"missing in "+stage);
 }
});
await test("G3-real-application-detail-persist",async()=>{
 const update={deadline:"2027-01-03",interviewDate:"2027-01-15",documentResult:"PASSED",hasResume:true,hasPortfolio:true};
 const r=await api("PUT","cover-letters/"+coverId+"/application-detail",update);
 assert.equal(r.status,200,"detail update="+r.status+" error="+r.body?.errorCode);
 const read=await api("GET","cover-letters/"+coverId+"/application-detail");
 assert.equal(read.status,200);
 assert.equal(read.body?.data?.interviewDate,update.interviewDate);
 assert.equal(read.body?.data?.hasResume,true);
});
await test("G3-board-browser-real-backend",async()=>{
 await page.goto(base+"/applications");
 await page.locator('article[aria-label*="Spring 통합 QA 회사"]').waitFor();
 await page.reload();await page.locator('section[aria-label="전형 종료"]').getByText("Spring 통합 QA 회사").first().waitFor();
});
await test("G5-interview-browser-real-cover",async()=>{
 await page.goto(base+"/interviews");
 await page.getByText("Spring 통합 QA 회사").first().waitFor();
 await page.goto(base+"/interviews/"+coverId);
 await page.locator("#interview-answer").waitFor();
 await page.locator("#interview-answer").fill("실제 Spring 응답을 사용한 면접 QA");
 await page.getByRole("button",{name:"이 브라우저에 저장"}).click();
 await page.reload();
 assert.equal(await page.locator("#interview-answer").inputValue(),"실제 Spring 응답을 사용한 면접 QA");
});
await test("G1-ui-create-real-DB-entity",async()=>{
 await page.goto(base+"/experiences/new");
 await page.getByPlaceholder("경험 제목을 입력해주세요.").fill("UI 로컬 Spring 저장 검증");
 await page.getByLabel("경험 시작일").fill("2026-10-01");
 await page.getByLabel("경험 종료일").fill("2026-10-10");
 await page.getByRole("button",{name:/다음단계로/}).click();
 await page.waitForURL(/\/experiences\/[a-f0-9-]{36}/,{timeout:13000});
 uiExperienceId=new URL(page.url()).pathname.split("/").pop();
 const detail=await api("GET","experiences/"+uiExperienceId);
 assert.equal(detail.status,200);assert.equal(detail.body?.data?.experience?.title,"UI 로컬 Spring 저장 검증");
});
await test("G1-ui-save-real-DB-answers",async()=>{
 const a=page.locator('section[aria-label="경험별 질문"] textarea');await a.first().fill("화면에서 저장한 Spring 답변");
 await page.getByRole("button",{name:"임시저장"}).click();
 await page.getByText("임시저장되었습니다.").waitFor();
 const detail=await api("GET","experiences/"+uiExperienceId);
 assert.equal(detail.status,200);assert(detail.body?.data?.answers?.some(a=>a.content==="화면에서 저장한 Spring 답변"));
 await page.reload();assert.equal(await page.locator('section[aria-label="경험별 질문"] textarea').first().inputValue(),"화면에서 저장한 Spring 답변");
});
await test("G2-ui-create-real-DB-cover",async()=>{
 await page.goto(base+"/cover-letters/new");
 await page.getByPlaceholder("ex) 토스뱅크").fill("UI Spring 통합 회사");
 await page.getByPlaceholder("ex) 백엔드 개발자").fill("실제 DB 검증");
 await page.getByRole("button",{name:/저장하고 문항 작성하기/}).click();
 await page.waitForURL(/\/cover-letters\/[a-f0-9-]{36}/,{timeout:16000});
 uiCoverId=new URL(page.url()).pathname.split("/").pop();
 const detail=await api("GET","cover-letters/"+uiCoverId);assert.equal(detail.status,200);
 assert.equal(detail.body?.data?.coverLetter?.companyName,"UI Spring 통합 회사");
});
await test("G2-ui-save-question-real-DB",async()=>{
 await page.getByPlaceholder("지원 동기를 서술해 주세요.").fill("통합 검증 문항");
 await page.getByRole("button",{name:"새 문항 등록"}).click();
 const card=page.locator("article").first();await card.getByPlaceholder("연결된 경험을 참고해 직접 답변을 작성하세요.").fill("사용자 화면에서 저장한 한글 🧪 답변");
 await card.getByRole("button",{name:"이 문항 저장"}).click();await card.getByText("문항과 답변을 저장했어요.").waitFor();
 const detail=await api("GET","cover-letters/"+uiCoverId);assert(detail.body?.data?.questions?.some(q=>q.answerText==="사용자 화면에서 저장한 한글 🧪 답변"));
});
await test("G3-ui-real-card-move-and-detail",async()=>{
 await page.goto(base+"/applications");
 const card=page.locator('article[aria-label*="UI Spring 통합 회사"]');await card.waitFor();
 await card.getByRole("combobox").selectOption("PREPARING");
 await page.reload();
 const after=page.locator('article[aria-label*="UI Spring 통합 회사"]');await after.waitFor();
 assert.equal(await after.getByRole("combobox").inputValue(),"PREPARING");
 await after.getByRole("button").first().click();
 const dialog=page.getByRole("dialog");await dialog.waitFor();
 await dialog.getByLabel("면접 예정일").fill("2027-03-02");
 await dialog.getByLabel("이력서 준비 완료").check();
 await dialog.getByRole("button",{name:"지원 상세 저장"}).click();
 await dialog.getByText("지원 상세 정보를 저장했습니다.").waitFor();
 const detail=await api("GET","cover-letters/"+uiCoverId+"/application-detail");
 assert.equal(detail.body?.data?.interviewDate,"2027-03-02");
 assert.equal(detail.body?.data?.hasResume,true);
 await dialog.getByRole("button",{name:"상세 닫기"}).click();
});
await test("SEC-account-isolation-on-real-Spring",async()=>{
 const second=await browser.newContext();
 const mail="qa-isolation-"+crypto.randomBytes(6).toString("hex")+"@example.test";
 const pass=crypto.randomBytes(16).toString("base64url")+"Aa1!";
 const secondApi=async(method,path,data)=>{
  const res=await second.request.fetch(base+"/api/"+path,{method,headers:{"Content-Type":"application/json"},...(data!==undefined?{data}:{})});
  return {status:res.status(),body:await res.json().catch(()=>null)};
 };
 try{
  assert.equal((await secondApi("POST","auth/email/send",{email:mail})).status,200);
  let code=null;for(let i=0;i<16;i++){
   const x=await (await fetch("http://127.0.0.1:31080/code?email="+encodeURIComponent(mail))).json();
   if(x.received){code=x.code;break;} await new Promise(r=>setTimeout(r,200));
  }
  assert(code,"isolated SMTP capture failed");
  assert.equal((await secondApi("POST","auth/email/verify",{email:mail,code})).status,200);
  assert.equal((await secondApi("POST","auth/signup",{email:mail,password:pass})).status,201);
  assert.equal((await secondApi("POST","auth/login",{email:mail,password:pass})).status,200);
  for(const path of ["experiences/"+experienceId,"cover-letters/"+coverId,
                      "cover-letters/"+coverId+"/questions/"+questionId+"/experiences"]){
   const res=await secondApi("GET",path);
   assert([403,404].includes(res.status),"cross-user GET "+path+" status="+res.status);
  }
  const write=await secondApi("PATCH","application-board/"+coverId+"/status",{status:"SUBMITTED"});
  assert([403,404].includes(write.status),"cross-user mutation status="+write.status);
  assert.equal((await api("GET","cover-letters/"+coverId)).status,200);
 }finally{await second.close();}
});
await test("G4-Spring-mock-provider-safety",async()=>{
 const r=await api("POST","cover-letters/"+coverId+"/questions/"+questionId+"/analyze",{});
 // AI is disabled in the isolated environment: either a mock-marked response or explicit rejection.
 if(r.status===200){assert.equal(r.body?.data?.isMock,true,"unlabelled real AI result");}
 else assert([400,403,422,429,503].includes(r.status),"unexpected AI error "+r.status);
});
await test("G0-refresh-rotation-proxy",async()=>{
 const before=(await context.cookies()).find(c=>c.name==="pofit_qa_access")?.value;
 const refresh=await api("POST","auth/refresh",{});
 assert.equal(refresh.status,200,"refresh="+refresh.status+" code="+refresh.body?.errorCode);
 const after=(await context.cookies()).find(c=>c.name==="pofit_qa_access")?.value;
 assert(before&&after&&before!==after,"access token not rotated");
 const profile=await api("GET","members/me/profile");assert.equal(profile.status,200);
});
await test("G0-logout-revokes-session",async()=>{
 const logout=await api("POST","auth/logout",{});
 assert.equal(logout.status,200,"logout status="+logout.status);
 const names=(await context.cookies()).map(c=>c.name);
 assert(!names.includes("pofit_qa_access")&&!names.includes("pofit_qa_refresh"));
 const protectedR=await api("GET","experiences?size=5");assert.equal(protectedR.status,401);
 await page.goto(base+"/applications");await page.waitForURL(/\/login\?next=/,{timeout:12000});
});
await test("G0-no-token-in-JS-no-preview",async()=>{
 assert.deepEqual(errors,[]);
 const cookies=(await context.cookies()).map(c=>c.name);
 assert(!cookies.includes("pofit_dev_preview"));
});
await browser.close();
const counts={pass:results.filter(r=>r.status==="PASS").length,fail:results.filter(r=>r.status==="FAIL").length};
fs.writeFileSync(__dirname+"/spring-integration-results.json",JSON.stringify({target:"isolated-local-spring-h2",counts,results,requests,errors},null,2));
console.log("SPRING_INTEGRATION_SUMMARY",JSON.stringify(counts));
if(counts.fail)process.exitCode=2;
})().catch(async e=>{console.error("FATAL",String(e.stack||e).slice(0,1100));await browser?.close();process.exitCode=1});
