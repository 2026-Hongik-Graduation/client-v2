// Read-only: compare FE integration API surface with actual EC2 OpenAPI and local Spring.
const fs=require("node:fs");
const targets=[
 ["isolated-local","http://127.0.0.1:18080/v3/api-docs"],
 ["ec2","https://43-203-204-29.sslip.io/v3/api-docs"]
];
if(process.env.QA_SKIP_LOCAL_OPENAPI==="1")targets.shift();
const expected=[
 "POST /api/auth/email/send","POST /api/auth/email/verify","POST /api/auth/signup","POST /api/auth/login","POST /api/auth/refresh","POST /api/auth/logout",
 "GET /api/members/me/profile","PUT /api/members/me/profile/basic","PUT /api/members/me/profile/job",
 "GET /api/experience-tags","GET /api/experience-tags/{tagCode}/questions",
 "GET /api/experiences","POST /api/experiences","GET /api/experiences/{experienceId}","PATCH /api/experiences/{experienceId}","DELETE /api/experiences/{experienceId}",
 "PUT /api/experiences/{experienceId}/answers","PATCH /api/experiences/{experienceId}/status",
 "GET /api/cover-letters","POST /api/cover-letters","GET /api/cover-letters/{coverLetterId}","PATCH /api/cover-letters/{coverLetterId}","DELETE /api/cover-letters/{coverLetterId}",
 "POST /api/cover-letters/{coverLetterId}/questions","PATCH /api/cover-letters/{coverLetterId}/questions/{questionId}","DELETE /api/cover-letters/{coverLetterId}/questions/{questionId}",
 "PUT /api/cover-letters/{coverLetterId}/questions/order",
 "GET /api/cover-letters/{coverLetterId}/posting","PUT /api/cover-letters/{coverLetterId}/posting","DELETE /api/cover-letters/{coverLetterId}/posting",
 "GET /api/cover-letters/{coverLetterId}/versions","POST /api/cover-letters/{coverLetterId}/versions","POST /api/cover-letters/{coverLetterId}/versions/{versionId}/restore",
 "GET /api/cover-letters/{coverLetterId}/questions/{questionId}/experiences","POST /api/cover-letters/{coverLetterId}/questions/{questionId}/experiences","DELETE /api/cover-letters/{coverLetterId}/questions/{questionId}/experiences/{experienceId}",
 "GET /api/application-board","PATCH /api/application-board/{coverLetterId}/status",
 "GET /api/cover-letters/{coverLetterId}/application-detail","PUT /api/cover-letters/{coverLetterId}/application-detail",
 "POST /api/cover-letters/{coverLetterId}/questions/{questionId}/analyze",
 "POST /api/cover-letters/{coverLetterId}/questions/{questionId}/strategy",
 "POST /api/cover-letters/{coverLetterId}/questions/{questionId}/draft",
 "POST /api/cover-letters/{coverLetterId}/questions/{questionId}/revise",
 "GET /api/cover-letters/{coverLetterId}/questions/{questionId}/ai-chat/turns",
 "POST /api/cover-letters/{coverLetterId}/questions/{questionId}/ai-chat/turns",
];
const canonical=p=>p.replace(/\{[^/}]+\}/g,"{}");
const out={checks:expected.length,targets:[]};
(async()=>{for(const [label,url] of targets){
 try{
 const res=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:"application/json"}});
 if(!res.ok)throw new Error("HTTP "+res.status);
 const spec=await res.json();
 const actual=new Set(Object.entries(spec.paths||{}).flatMap(([path,methods])=>
  Object.keys(methods).filter(m=>["get","post","put","patch","delete"].includes(m)).map(method=>method.toUpperCase()+" "+canonical(path))));
 const missing=expected.filter(x=>!actual.has(x.slice(0,x.indexOf(" ")+1)+canonical(x.slice(x.indexOf(" ")+1))));
 out.targets.push({label,http:res.status,paths:Object.keys(spec.paths||{}).length,methods:actual.size,expected:expected.length,missing});
 console.log("CONTRACT",label,"paths",Object.keys(spec.paths||{}).length,"missing",missing.length,missing.join("; ").slice(0,900));
 }catch(e){out.targets.push({label,error:String(e.message||e).slice(0,220)});console.log("CONTRACT_UNAVAILABLE",label,String(e.message||e).slice(0,200));}
}
fs.writeFileSync(__dirname+"/openapi-contract-results.json",JSON.stringify(out,null,2));
if(out.targets.some(x=>x.error||x.missing?.length))process.exitCode=2;
})().catch(e=>{console.error(e.stack);process.exitCode=1});
