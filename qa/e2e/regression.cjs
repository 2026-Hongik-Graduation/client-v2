const { chromium }=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
const base=process.env.QA_E2E_BASE||'https://client-v2-one.vercel.app';
(async()=>{
 const browser=await chromium.launch({executablePath:(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'),headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'ko-KR'});
 const page=await ctx.newPage();page.setDefaultTimeout(12000);
 const res={timestamp:new Date().toISOString(),ref:'fix/e2e-hardening-20261106',widths:[],axe:[],label:{},warnings:[]};
 page.on('pageerror',e=>res.warnings.push({type:'pageerror',msg:e.message.slice(0,170)}));
 try{
 await page.goto(base+'/login',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:/로그인 건너뛰기/}).click();
 await page.waitForURL(/\/cover-letters/,{timeout:20000});
 for(const width of [1440,1023,720,360]){
   await page.setViewportSize({width,height:900});
   for(const route of ['/','/login','/experiences','/cover-letters','/applications','/interviews']){
      await page.goto(base+route,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(320);
      const measure=await page.evaluate(()=>({screen:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      res.widths.push({route,width,...measure,overflow:Math.max(0,measure.doc-width)});
   }
 }
 for (const width of [1440,360]){
   await page.setViewportSize({width,height:900});
   for(const route of ['/login','/experiences/new','/cover-letters/new','/applications','/interviews']){
     await page.goto(base+route,{waitUntil:'domcontentloaded'});
     await page.waitForTimeout(320);
     const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
     res.axe.push({route,width,violations:a.violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length,targets:v.nodes.slice(0,6).map(n=>n.target[0])}))});
   }
 }
 await page.goto(base+'/experiences/new',{waitUntil:'domcontentloaded'});
 res.label.titleAccessName=await page.locator('#experience-title').evaluate(e=>e.labels?.[0]?.textContent?.trim()||null);
 }finally{await browser.close()}
 fs.writeFileSync(__dirname+'/regression-hardening-20261106.json',JSON.stringify(res,null,2));
 console.log('POST_FIX',JSON.stringify({badWidth:res.widths.filter(x=>x.overflow>0),badAxe:res.axe.filter(x=>x.violations.length>0),label:res.label,warnings:res.warnings.slice(0,5)}));
 if(res.widths.some(x=>x.overflow>1)||res.axe.some(x=>x.violations.length>0)||!res.label.titleAccessName)process.exitCode=2;
})().catch(e=>{console.error('ERROR',e.stack?.slice(0,850)||e.message);process.exitCode=1});