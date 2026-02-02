"use strict";exports.id=707,exports.ids=[707],exports.modules={4698:(e,t,r)=>{r(5044).config(),e.exports={geminiApiKey:process.env.GEMINI_API_KEY,API_DELAY:3e3,MAX_RETRIES:5,GEMINI_DEBOUNCE_MS:1e3,PROJECTS_DIR:"projectsByJarvis",VOICE_ENABLED:!0,VOICE_RATE:1,VOICE_VOLUME:100,colors:{reset:"\x1b[0m",bright:"\x1b[1m",dim:"\x1b[2m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",blue:"\x1b[34m",magenta:"\x1b[35m",cyan:"\x1b[36m",white:"\x1b[37m"}}},2261:(e,t,r)=>{let n=r(9638),a=r(1058),i=r(6076),{callGeminiAPI:o}=r(2161),s=r(1986),c=r(4698),l=r(2147);e.exports={Jarvis:n,FileGenerator:a,ProjectPlanner:i,callGeminiAPI:o,voiceService:s,config:c,logger:l,log:l.log,delay:l.delay,displayProgress:l.displayProgress}},9638:(e,t,r)=>{let n=r(Object(function(){var e=Error("Cannot find module './models/ProjectPlanner'");throw e.code="MODULE_NOT_FOUND",e}())),a=r(Object(function(){var e=Error("Cannot find module './models/FileGenerator'");throw e.code="MODULE_NOT_FOUND",e}()));class i{constructor(e){this.planner=new n,this.generator=new a(e)}async createPlan(e,t){return await this.planner.createProjectPlan(e,t)}async generate(e,t){await this.generator.generateProjectFiles(e,t)}}e.exports=i},1058:(e,t,r)=>{let n=r(1017),{callGeminiAPI:a}=r(2161),{log:i,delay:o,displayProgress:s}=r(2147),{API_DELAY:c,PROJECTS_DIR:l}=r(4698);class p{constructor(e){if(!e)throw Error("FileGenerator requires a StorageAdapter (DiskAdapter or InMemoryAdapter)");this.adapter=e,this.templates={html:this.getHTMLTemplate,css:this.getCSSTemplate,javascript:this.getJSTemplate}}async generateProjectFiles(e,t={}){i("\n\uD83D\uDE80 Code Generation Phase Started...","green"),i("━".repeat(50),"dim"),await this.adapter.ensureDir(l),i(`📁 Created projects directory: ${l}`,"green");let r=n.join(l,e.projectName);await this.adapter.ensureDir(r),i(`📁 Created project directory: ${e.projectName}`,"green");let a=[...e.fileStructure].sort((e,t)=>"directory"===e.type&&"file"===t.type?-1:"file"===e.type&&"directory"===t.type?1:0),p=a.length,d=0;for(let n of a)if(d++,"directory"===n.type)s(d,p,`Creating directory: ${n.name}`),await this.createDirectory(r,n),i(`📁 Created directory: ${n.name}`,"green");else{s(d,p,`Generating file: ${n.name}`);try{await this.generateSingleFile(r,n,e,t),i(`✅ Generated: ${n.name}`,"green"),d<p&&await o(c)}catch(t){i(`❌ Failed to generate ${n.name}: ${t.message}`,"red"),await this.createFallbackFile(r,n,e)}}await this.createProjectMetadata(r,e),i("\n\uD83C\uDF89 PROJECT CREATION COMPLETED!","green"),i("━".repeat(50),"dim"),i(`📁 Location: ${r}`,"cyan"),i(`🌐 Open: ${n.join(r,"index.html")}`,"cyan"),i("━".repeat(50),"dim")}async createDirectory(e,t){let r=n.join(e,t.name);try{await this.adapter.ensureDir(r)}catch(e){i(`⚠️ Warning: Could not create directory ${t.name}: ${e.message}`,"yellow")}}async generateSingleFile(e,t,r,i){if(!t.fileType||!this.shouldGenerateContent(t.fileType)){await this.createFallbackFile(e,t,r);return}let o=this.buildPromptForFile(t,r),s=await a(o,i),c=this.extractCodeFromResponse(s,t.fileType),l=n.join(e,t.name);await this.adapter.saveFile(l,c)}shouldGenerateContent(e){return["html","css","javascript","js","json"].includes(e.toLowerCase())}buildPromptForFile(e,t){return`
Generate ${e.fileType.toUpperCase()} code for a ${t.description} project.

File: ${e.name}
Purpose: ${e.description}
Features to implement: ${t.features.join(", ")}

Requirements:
- Modern, clean, and responsive design
- Follow best practices for ${e.fileType}
- Make it production-ready
- Include comments for complex parts

${this.getSpecificRequirements(e.fileType,t)}

Return ONLY the code, no explanations or markdown formatting.
`}getSpecificRequirements(e,t){switch(e.toLowerCase()){case"html":return`
- Use semantic HTML5 elements
- Include proper meta tags for mobile
- Link to styles.css and script.js appropriately
- Add accessibility features (alt texts, ARIA labels)
- Modern structure with header, main, footer if applicable
        `;case"css":return`
- Use CSS Grid and Flexbox for layouts
- Implement CSS custom properties (variables)
- Add smooth transitions and hover effects
- Make it fully responsive (mobile-first)
- Use modern CSS features (clamp, min/max, etc.)
- Include loading states and micro-animations
        `;case"javascript":case"js":return`
- Use modern ES6+ syntax
- Implement all planned features: ${t.features.join(", ")}
- Add proper error handling and validation
- Include smooth animations and transitions
- Make it interactive and user-friendly
- Use async/await for any asynchronous operations
- Add proper event listeners and cleanup
        `;case"json":return`
- Valid JSON format
- Include all necessary configuration
- Follow JSON best practices
        `;default:return"- Follow modern development best practices"}}extractCodeFromResponse(e,t){let r=RegExp(`\`\`\`${t}?[\\s\\S]*?\`\`\``,"gi"),n=e.match(r);if(n)return n[0].replace(/```[a-z]*\n?/gi,"").replace(/```\n?$/gi,"").trim();if("html"===t){let t=e.match(/<!DOCTYPE[\s\S]*<\/html>/i);if(t)return t[0]}return e.trim()}async createFallbackFile(e,t,r){let a;let o=n.join(e,t.name);a=t.fileType&&this.templates[t.fileType]?this.templates[t.fileType](r):this.getGenericFallback(t,r),await this.adapter.saveFile(o,a),i(`⚠️ Created fallback: ${t.name}`,"yellow")}getGenericFallback(e,t){switch(n.extname(e.name).toLowerCase()){case".js":return`// ${e.name}
// ${e.description}

console.log('${e.name} loaded');`;case".css":return`/* ${e.name} */
/* ${e.description} */

:root {
  --primary-color: #007bff;
}`;case".html":return this.getHTMLTemplate(t);case".json":return"{}";case".md":return`# ${e.name}

${e.description}`;default:return`# ${e.name}

${e.description}

Generated by Jarvis AI`}}getHTMLTemplate(e){return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${e.projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>${e.description}</h1>
        </header>
        <main>
            <div class="content">
                <p>Welcome to your ${e.description}!</p>
                <!-- Add your content here -->
            </div>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`}getCSSTemplate(e){return`/* ${e.projectName} Styles */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #333;
    --bg-color: #f8fafc;
    --border-radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background: var(--bg-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

header h1 {
    text-align: center;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 2rem;
}

.content {
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
}

@media (max-width: 768px) {
    .container {
        padding: 0.5rem;
    }
}`}getJSTemplate(e){return`// ${e.projectName} JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('${e.description} loaded successfully!');
    
    // Initialize the application
    init();
});

function init() {
    // Add your initialization code here
    console.log('Application initialized');
    
    // Add event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Add your event listeners here
    console.log('Event listeners set up');
}

// Add your custom functions here`}async createProjectMetadata(e,t){let r={name:t.projectName,version:"1.0.0",description:t.description,main:"index.html",scripts:{start:"open index.html",dev:"live-server .",build:"echo 'Build script here'"},keywords:t.features,author:"Jarvis AI",dependencies:{},devDependencies:{}};t.dependencies&&t.dependencies.length>0&&t.dependencies.forEach(e=>{r.dependencies[e]="latest"}),await this.adapter.saveFile(n.join(e,"package.json"),JSON.stringify(r,null,2));let a=`# ${t.projectName}

${t.description}

## Features
${t.features.map(e=>`- ${e}`).join("\n")}

## Tech Stack
${t.techStack.map(e=>`- ${e.toUpperCase()}`).join("\n")}

## File Structure
\`\`\`
${this.generateFileTreeString(t.fileStructure)}
\`\`\`

## Getting Started
1. Clone or download this project
2. Open \`index.html\` in your web browser
3. Start using the application!

## Development
- For local development with live reload: \`npm run dev\` (requires live-server)
- For production build: \`npm run build\`

## Architecture
${t.architecture}

## Dependencies
${t.dependencies.length>0?t.dependencies.map(e=>`- ${e}`).join("\n"):"No external dependencies"}

---
*Generated by Jarvis AI*
`;await this.adapter.saveFile(n.join(e,"README.md"),a);let o=`# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock
`;await this.adapter.saveFile(n.join(e,".gitignore"),o),i("\uD83D\uDCC4 Created project metadata (package.json, README.md, .gitignore)","cyan")}generateFileTreeString(e,t=""){let r="";return e.forEach((n,a)=>{let i=a===e.length-1,o="directory"===n.type?"\uD83D\uDCC1":"\uD83D\uDCC4";r+=`${t}${i?"└── ":"├── "}${o} ${n.name}
`}),r}}e.exports=p},6076:(e,t,r)=>{let{callGeminiAPI:n}=r(2161),{log:a}=r(2147);class i{constructor(){this.currentProject=null}async createProjectPlan(e,t={}){a("\n\uD83E\uDDE0 AI Planning Phase Started...","magenta"),a("━".repeat(50),"dim");let r=`
You are an expert software architect. Create a detailed project plan for: "${e}"

Respond with a JSON object containing:
{
  "projectName": "kebab-case-name",
  "description": "Brief description",
  "features": ["feature1", "feature2", ...],
  "techStack": ["html", "css", "javascript"],
  "fileStructure": [
    {"name": "index.html", "type": "file", "fileType": "html", "description": "Main HTML file"},
    {"name": "styles.css", "type": "file", "fileType": "css", "description": "Styling"},
    {"name": "script.js", "type": "file", "fileType": "javascript", "description": "Main functionality"},
    {"name": "assets", "type": "directory", "description": "Static assets folder"},
    {"name": "components", "type": "directory", "description": "Reusable components"}
  ],
  "dependencies": ["any external libraries needed"],
  "architecture": "Brief explanation of how components work together"
}

For complex projects, include nested directory structures like:
{"name": "src/components/auth", "type": "directory", "description": "Authentication components"},
{"name": "src/components/auth/Login.js", "type": "file", "fileType": "javascript", "description": "Login component"}

Make it modern, responsive, and feature-complete. Focus on clean code and good UX.
`;try{let e=(await n(r)).match(/\{[\s\S]*\}/);if(e)return this.currentProject=JSON.parse(e[0]),this.displayPlan(),this.currentProject;throw Error("Could not parse project plan")}catch(t){return a(`❌ Planning failed: ${t.message}`,"red"),this.createFallbackPlan(e)}}createFallbackPlan(e){let t=e.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");return this.currentProject={projectName:t,description:e,features:["Core functionality","Responsive design","Modern UI"],techStack:["html","css","javascript"],fileStructure:[{name:"index.html",type:"file",fileType:"html",description:"Main HTML file"},{name:"styles.css",type:"file",fileType:"css",description:"Styling"},{name:"script.js",type:"file",fileType:"javascript",description:"Main functionality"},{name:"assets",type:"directory",description:"Static assets folder"}],dependencies:[],architecture:"Simple single-page application"},a("\uD83D\uDCCB Using fallback plan...","yellow"),this.displayPlan(),this.currentProject}displayPlan(){let e=this.currentProject;a("\n\uD83D\uDCCB PROJECT PLAN GENERATED","green"),a("━".repeat(50),"dim"),a(`📁 Project: ${e.projectName}`,"bright"),a(`📝 Description: ${e.description}`,"white"),a("\n✨ Features:","cyan"),e.features.forEach(e=>a(`  • ${e}`,"white")),a("\n\uD83D\uDEE0️ Tech Stack:","yellow"),e.techStack.forEach(e=>a(`  • ${e.toUpperCase()}`,"white")),a("\n\uD83D\uDCC2 File Structure:","blue"),e.fileStructure.forEach(e=>{let t="directory"===e.type?"\uD83D\uDCC1":"\uD83D\uDCC4";a(`  ${t} ${e.name} - ${e.description}`,"white")}),e.dependencies.length>0&&(a("\n\uD83D\uDCE6 Dependencies:","magenta"),e.dependencies.forEach(e=>a(`  • ${e}`,"white"))),a(`
🏗️ Architecture: ${e.architecture}`,"green"),a("━".repeat(50),"dim")}}e.exports=i},2161:(e,t,r)=>{let n=r(5687),{geminiApiKey:a,API_DELAY:i,MAX_RETRIES:o,GEMINI_DEBOUNCE_MS:s}=r(4698),{log:c,delay:l}=r(2147),p={},d={};async function u(e,t={}){let r=0,i=a,l=null;if("number"==typeof t?r=t:(r=t.retries||0,i=t.apiKey||a,l=t.accessToken||null),p[e])return Promise.resolve(p[e]);if(d[e])return d[e];let m=new Promise((t,a)=>{let s=JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.7,topK:40,topP:.95,maxOutputTokens:2048}}),d="/v1beta/models/gemini-2.5-flash:generateContent",m={"Content-Type":"application/json","Content-Length":Buffer.byteLength(s)};l?(m.Authorization=`Bearer ${l}`,m["x-goog-user-project"]=process.env.GOOGLE_PROJECT_ID):d+=`?key=${i}`;let h={hostname:"generativelanguage.googleapis.com",port:443,path:d,method:"POST",headers:m},y=n.request(h,n=>{let s="";n.on("data",e=>{s+=e}),n.on("end",()=>{try{let n=JSON.parse(s);if(n.error){if(r<o){let s=1e3*Math.pow(2,r);c(`⚠️ API Error (retry ${r+1}/${o}): ${n.error.message}`,"yellow"),setTimeout(()=>{u(e,{retries:r+1,apiKey:i,accessToken:l}).then(t).catch(a)},s);return}a(Error(n.error.message));return}let d=n.candidates?.[0]?.content?.parts?.[0]?.text;d?(p[e]=d,t(d)):(console.error("Unexpected response:",s),a(Error("Unexpected response format or empty candidate")))}catch(n){if(r<o){setTimeout(()=>{u(e,{retries:r+1,apiKey:i,accessToken:l}).then(t).catch(a)},1e3*Math.pow(2,r));return}a(n)}})});y.on("error",n=>{if(r<o){setTimeout(()=>{u(e,{retries:r+1,apiKey:i,accessToken:l}).then(t).catch(a)},1e3*Math.pow(2,r));return}a(n)}),y.setTimeout(3e4),y.write(s),y.end()});return d[e]=m,setTimeout(()=>{delete d[e]},s),m}e.exports={callGeminiAPI:u}},1986:(e,t,r)=>{let{exec:n}=r(2081),{VOICE_ENABLED:a}=r(4698),{log:i}=r(2147);e.exports={speakText:function(e){if(a)try{let t=e.replace(/'/g,"''").replace(/"/g,'""').replace(/\n/g," "),r=`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 0; $speak.Volume = 100; $speak.Speak('${t}')"`;n(r,e=>{if(e){let e=`powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${t}')"`;n(e,e=>{if(e){let e=`powershell -Command "Start-Process -FilePath 'powershell' -ArgumentList '-Command', 'Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(\\'${t}\\')' -WindowStyle Hidden"`;n(e,e=>{e&&(i("⚠️ Voice output not available. Voice features disabled.","yellow"),i("\uD83D\uDCA1 To enable voice: Enable Windows Speech Recognition in Settings > Privacy > Speech","cyan"))})}})}})}catch(e){i("⚠️ Voice output error. Continuing without voice.","yellow")}},startVoiceInput:function(){return new Promise(e=>{i("\uD83C\uDFA4 Voice Input Mode","cyan"),i("\uD83D\uDCA1 Type your message or use voice commands:","yellow"),i('   • "hello" - Greeting',"white"),i('   • "create project [description]" - Create new project',"white"),i('   • "list files" - Show directory contents',"white"),i('   • "help" - Show commands',"white"),i('   • "exit voice" - Return to normal mode',"white"),i("   • Or ask any question for AI response","white"),i("   • Note: Voice input uses text input for reliability","dim");let t=r(4521).createInterface({input:process.stdin,output:process.stdout});t.question("\uD83D\uDCAC Your message: ",r=>{t.close(),r.trim()?(i(`💬 Input: "${r}"`,"green"),e(r)):e(null)})})},checkVoiceAvailability:function(){return new Promise(e=>{e(!0)})}}},2147:(e,t,r)=>{let{colors:n}=r(4698);function a(e,t="white"){console.log(`${n[t]}${e}${n.reset}`)}e.exports={log:a,delay:function(e){return new Promise(t=>setTimeout(t,e))},displayProgress:function(e,t,r){let n=Math.round(e/t*100),i="█".repeat(Math.floor(n/5))+"░".repeat(20-Math.floor(n/5));a(`[${i}] ${n}% - ${r}`,"cyan")}}},112:(e,t,r)=>{r.r(t),r.d(t,{GET:()=>o,POST:()=>o,authOptions:()=>i});var n=r(7345),a=r.n(n);let i={providers:[(0,r(4569).Z)({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,authorization:{params:{scope:"openid email profile https://www.googleapis.com/auth/generative-language",access_type:"offline",prompt:"consent"}}})],callbacks:{jwt:async({token:e,account:t})=>(t&&(e.accessToken=t.access_token),e),session:async({session:e,token:t})=>(e.accessToken=t.accessToken,e)},secret:process.env.NEXTAUTH_SECRET},o=a()(i)}};