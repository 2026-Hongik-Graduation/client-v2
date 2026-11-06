// Read-only deployment-to-EC2 wiring smoke; no accounts, tokens, or mutations.
const fs=require("node:fs");
const base="https://client-v2-one.vercel.app",requests=[
 "/", "/login", "/api/experiences", "/api/cover-letters", "/api/application-board",
 "/api/members/me/profile", "/api/auth/refresh"
];
(async()=>{
 const results=[];
 for(const path of requests){
  try{
   const res=await fetch(base+path,{redirect:"manual",signal:AbortSignal.timeout(30000)});
   const status=res.status;
   const expected=path.startsWith("/api/")?status===401:status===200;
   results.push({path,status,expected});
   console.log("DEPLOY_READONLY",path,status,expected?"PASS":"FAIL");
  }catch(e){results.push({path,error:String(e.message||e).slice(0,140),expected:false});}
 }
 const totals={pass:results.filter(x=>x.expected).length,fail:results.filter(x=>!x.expected).length};
 fs.writeFileSync(__dirname+"/deployed-readonly-results.json",JSON.stringify({base,totals,results},null,2));
 console.log("DEPLOY_READONLY_SUMMARY",JSON.stringify(totals));
 if(totals.fail)process.exitCode=2;
})().catch(e=>{console.error(e.message);process.exitCode=1});
