const {chromium}=require("playwright"),AxeBuilder=require("@axe-core/playwright").default,assert=require("node:assert/strict"),fs=require("fs");
(async()=>{const browser=await chromium.launch({executablePath:(process.env.CHROME_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"),headless:true});
const base=process.env.QA_E2E_BASE||"https://client-v2-one.vercel.app",res=[];let page;
try{for(const width of [1440,390,360]){const ctx=await browser.newContext({viewport:{width,height:900}});page=await ctx.newPage();
await page.goto(base+"/login");await page.getByRole("button",{name:/로그인 건너뛰기/}).click();await page.goto(base+"/applications");
const trigger=page.getByRole("button",{name:/\+ 지원 카드 추가/});await trigger.click();const modal=page.getByRole("dialog");await modal.waitFor();
const initial=await page.evaluate(()=>({name:document.activeElement?.getAttribute("placeholder"),tag:document.activeElement?.tagName}));
await page.keyboard.press("Shift+Tab");const prior=await page.evaluate(()=>document.activeElement?.getAttribute("aria-label"));
await page.keyboard.press("Shift+Tab");const wrapped=await page.evaluate(()=>document.activeElement?.textContent?.trim());
await page.keyboard.press("Tab");const back=await page.evaluate(()=>document.activeElement?.getAttribute("aria-label"));
const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
await page.keyboard.press("Escape");const closed=await modal.isHidden();const focusRestored=await trigger.evaluate(e=>document.activeElement===e);
await trigger.click();await modal.getByRole("textbox",{name:"기업명"}).fill("E2E_모달_상세");
await modal.getByRole("textbox",{name:"지원 직무"}).fill("QA");await modal.getByRole("button",{name:"지원 등록"}).click();await modal.waitFor({state:"hidden"});
await page.locator('article[aria-label*="E2E_모달_상세"]').getByRole("button").first().click();
const detail=page.getByRole("dialog");await detail.waitFor();
const detailAxe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
await page.keyboard.press("Escape");const detailClosed=await detail.isHidden();
res.push({width,initial,prior,wrapped,back,axe:axe.violations.map(x=>({id:x.id,nodes:x.nodes.length})),detailAxe:detailAxe.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>({target:n.target,html:n.html.slice(0,220),summary:n.failureSummary?.slice(0,150)}))})),closed,focusRestored,detailClosed});
console.log("DIALOG",JSON.stringify(res.at(-1)));assert.equal(axe.violations.length,0);assert.equal(detailAxe.violations.length,0);assert(closed&&focusRestored&&detailClosed&&initial.name==="예) 네이버"&&prior==="닫기"&&wrapped==="지원 등록"&&back==="닫기");await ctx.close();}
fs.writeFileSync(__dirname+"/dialog-accessibility-20261106.json",JSON.stringify(res,null,2));
}finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
