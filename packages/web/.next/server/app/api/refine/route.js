"use strict";(()=>{var e={};e.id=437,e.ids=[437],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9491:e=>{e.exports=require("assert")},4300:e=>{e.exports=require("buffer")},2081:e=>{e.exports=require("child_process")},6113:e=>{e.exports=require("crypto")},2361:e=>{e.exports=require("events")},7147:e=>{e.exports=require("fs")},3685:e=>{e.exports=require("http")},5687:e=>{e.exports=require("https")},2037:e=>{e.exports=require("os")},1017:e=>{e.exports=require("path")},3477:e=>{e.exports=require("querystring")},4521:e=>{e.exports=require("readline")},7310:e=>{e.exports=require("url")},3849:e=>{e.exports=require("util")},9796:e=>{e.exports=require("zlib")},6220:(e,r,t)=>{t.r(r),t.d(r,{headerHooks:()=>q,originalPathname:()=>g,patchFetch:()=>v,requestAsyncStorage:()=>h,routeModule:()=>x,serverHooks:()=>m,staticGenerationAsyncStorage:()=>f,staticGenerationBailout:()=>j});var s={};t.r(s),t.d(s,{POST:()=>l,runtime:()=>d});var i=t(2390),n=t(1498),o=t(9308),a=t(7024),u=t(6590),p=t(112),c=t(2261);let d="nodejs";async function l(e){try{let r=await (0,u.getServerSession)(p.authOptions);if(!r?.accessToken)return a.Z.json({error:"Unauthorized"},{status:401});let{feedback:t,currentFiles:s,plan:i}=await e.json(),n={accessToken:r.accessToken},o=`
Context: A project named "${i.projectName}" described as "${i.description}".
Current Code Files:
${Object.entries(s).map(([e,r])=>`--- FILE: ${e} ---
${r}
`).join("\n")}

User Feedback: "${t}"

Task: Update the code files based on the feedback. 
Respond with only the updated files in a JSON format:
{
  "files": {
     "filename.html": "updated content",
     ...
  }
}

Include ONLY the files that need changes. Return valid JSON only.
`,d=(await (0,c.callGeminiAPI)(o,n)).match(/\{[\s\S]*\}/);if(d){let e=JSON.parse(d[0]);return a.Z.json(e)}throw Error("AI failed to return valid JSON for refinement")}catch(e){return a.Z.json({error:e.message},{status:500})}}let x=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/refine/route",pathname:"/api/refine",filename:"route",bundlePath:"app/api/refine/route"},resolvedPagePath:"D:\\Project1\\Jarvis-AI-Assistant-main\\packages\\web\\src\\app\\api\\refine\\route.js",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:f,serverHooks:m,headerHooks:q,staticGenerationBailout:j}=x,g="/api/refine/route";function v(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:f})}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[975,985,51,707],()=>t(6220));module.exports=s})();