const {chromium} = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
 const browser = await chromium.launch({executablePath:(process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"),headless:true});
 const base = process.env.QA_E2E_BASE||"https://client-v2-one.vercel.app";
 const result = {banner:[],modals:[],cards:[],errors:[],apiCalls:[]};
 try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},locale:"ko-KR"});
  const page = await context.newPage();
  page.on("pageerror",e=>result.errors.push(e.message));
  page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))result.apiCalls.push(r.method()+" "+r.url())});
  await page.goto(base+"/login");
  await page.getByRole("button",{name:/로그인 건너뛰기/}).click();
  await page.waitForURL(/\/cover-letters/);
  for(const width of [1440,992,720,390,360]){
   await page.setViewportSize({width,height:1000});
   await page.goto(base+"/interviews");
   const banner = page.locator("p").filter({hasText:"지원 기업을 선택하면"}).first();
   await banner.waitFor();
   const m = await banner.evaluate(e=>{const r=e.getBoundingClientRect(),b=e.closest("section").getBoundingClientRect();return {paragraphWidth:r.width,paragraphHeight:r.height,bannerHeight:b.height}});
   assert(m.paragraphWidth >= Math.min(width<500?100:300,width-210),"banner paragraph too narrow");
   result.banner.push({width,...m});
   await page.goto(base+"/applications");
   await page.getByRole("button",{name:/지원 카드 추가/}).first().click();
   const dialog = page.getByRole("dialog");
   await dialog.waitFor();
   const rect = await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x}});
   assert(rect.width>=Math.min(300,width-40),"modal too narrow at "+width);
   assert(rect.x>=0 && rect.x+rect.width<=width+2,"modal clipped at "+width);
   result.modals.push({width,...rect});
   await dialog.getByRole("button",{name:"닫기"}).click();
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const [stage,label] of [["PLANNED","지원 예정"],["PREPARING","서류 준비"],["SUBMITTED","제출 완료"],["CLOSED","전형 종료"]]){
   await page.goto(base+"/applications");
   const column=page.locator("section[aria-label='"+label+"']");
   await column.getByRole("button",{name:"카드 추가하기"}).click();
   const dialog=page.getByRole("dialog");
   assert.equal(await dialog.getByRole("combobox",{name:"지원 단계"}).inputValue(),stage);
   const company="QA시연"+stage;
   await dialog.getByRole("textbox",{name:"기업명"}).fill(company);
   await dialog.getByRole("textbox",{name:"지원 직무"}).fill("웹 개발자");
   await dialog.getByRole("button",{name:"지원 등록"}).click();
   await dialog.waitFor({state:"hidden"});
   await column.getByText(company,{exact:true}).waitFor();
   await page.reload();
   await page.locator("section[aria-label='"+label+"']").getByText(company,{exact:true}).waitFor();
   result.cards.push({stage,label,company,persisted:true});
  }
  await page.setViewportSize({width:390,height:1000});
  await page.goto(base+"/applications");
  const col=page.locator("section[aria-label='서류 준비']");
  await col.getByText("QA시연PREPARING",{exact:true}).click();
  const detail=page.getByRole("dialog");
  await detail.waitFor();
  assert(await detail.getByText("QA시연PREPARING").count()>0,"card detail");
  await detail.getByRole("button",{name:"상세 닫기"}).click();
  await page.goto(base+"/interviews");
  await page.getByText("QA시연PREPARING",{exact:true}).waitFor({timeout:12000});
  assert.deepEqual(result.errors,[],"page script errors");
  assert.equal(result.apiCalls.length,0,"demo does not contact API");
  console.log("INTERVIEW_KANBAN_E2E_PASS",JSON.stringify(result));
  fs.writeFileSync(__dirname+"/qa_visual_card_live_20261106_results.json",JSON.stringify(result,null,2));
  await context.close();
 } finally { await browser.close(); }
})().catch(e=>{console.error("VISUAL_KANBAN_FAIL",e.stack);process.exitCode=1;});
