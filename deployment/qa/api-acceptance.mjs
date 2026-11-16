import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import tls from 'node:tls';

let phase='verified QA target preflight';
try {
 assert.notEqual(process.env.NODE_TLS_REJECT_UNAUTHORIZED,'0');
 const api=new URL(process.env.AUDIT_API_URL);assert.equal(api.protocol,'https:');assert.equal(api.hostname,'jiayou-qa.test');
 const bytes=readFileSync(process.env.AUDIT_ISOLATION_FILE);assert.equal(createHash('sha256').update(bytes).digest('hex'),process.env.AUDIT_ISOLATION_SHA256);
 const isolation=JSON.parse(bytes);assert.equal(isolation.mainSha,process.env.AUDIT_SOURCE_SHA);assert.equal(isolation.productionConnectionsExcluded,true);assert.equal(isolation.disposablePostgresql,true);assert.ok(Date.now()<Date.parse(isolation.expiresAt));
 const origin=api.origin;const base=api.href;let checks=0;
 async function request(route,{token,cookie,body,method='GET',headers={}}={}) {
  const response=await fetch(base+route,{method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(cookie?{Cookie:cookie}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  let data;try{data=await response.json()}catch{data=null}return {response,data};
 }
 const browserHeaders={'Origin':origin,'X-Auth-Transport':'cookie'};
 function refreshCookie(response){const c=response.headers.getSetCookie().find(x=>x.startsWith('heyganba_refresh='));assert.ok(c);assert.match(c,/;\s*Secure/i);assert.match(c,/;\s*HttpOnly/i);assert.match(c,/;\s*SameSite=Lax/i);assert.match(c,/;\s*Path=\/api\/v1\/auth(?:;|$)/i);return c.split(';')[0]}
 async function login(user){const r=await request('/auth/login',{method:'POST',headers:browserHeaders,body:{email:user.email,password:user.password}});assert.equal(r.response.status,200);assert.equal(r.data.data.refreshToken,null);return {token:r.data.data.accessToken,cookie:refreshCookie(r.response)}}
 const mode=process.argv[2]||'setup';let state;
 if(mode==='setup'){
  phase='real registration';state={};
  for(const key of ['a','b']){const user={email:'release-'+randomBytes(10).toString('hex')+'@jiayou.test',password:randomBytes(24).toString('base64url'),fullName:'Release QA '+key.toUpperCase()};const r=await request('/auth/register',{method:'POST',headers:browserHeaders,body:user});assert.equal(r.response.status,201);assert.equal(r.data.data.refreshToken,null);state[key]={...user,id:r.data.data.userId};const cookie=refreshCookie(r.response);await request('/auth/logout',{method:'POST',headers:browserHeaders,token:r.data.data.accessToken,cookie});checks++}
 }else{phase='recovered private QA fixture';state=JSON.parse(readFileSync('/qa-output/api-state.private.json','utf8'))}
 phase='normal TLS verification';
 await new Promise((resolve,reject)=>{const req=https.get(origin+'/jiayou-build.json',{ca:tls.rootCertificates},()=>reject(new Error('untrusted CA accepted')));req.on('error',()=>resolve());});checks++;
 await assert.rejects(fetch('https://edge:8443/jiayou-build.json',{signal:AbortSignal.timeout(10000)}));checks++;
 phase='real aggregate readiness and no public management';
 let r=await request('/health');assert.equal(r.response.status,200);assert.equal(r.data.data.status,'UP');assert.deepEqual(Object.keys(r.data.data).sort(),['service','status','timestamp','version']);checks++;
 r=await request('/actuator/health');assert.equal(r.response.status,404);checks++;
 phase='reject spoofed HTTPS from untrusted physical peer';
 // Core HTTP preserves the explicit Host header; fetch normalizes it to its URL host.
 const internalStatus=await new Promise((resolve,reject)=>{const req=http.get('http://frontend:8080/api/v1/users/me',{headers:{Host:'jiayou-qa.test','X-Forwarded-Proto':'https'},timeout:10000},response=>{response.resume();resolve(response.statusCode)});req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('timeout')))});assert.equal(internalStatus,400);checks++;
 phase='cookie login and authorization';const a=await login(state.a),b=await login(state.b);
 r=await request('/users/me',{token:a.token});assert.equal(r.response.status,200);assert.equal(r.data.data.id,state.a.id);checks++;
 for(const prefix of ['/notebooks','/vocab/notebooks']){r=await request(prefix);assert.equal(r.response.status,401);checks++}
 if(mode==='setup'){r=await request('/notebooks',{method:'POST',token:a.token,body:{title:'Disposable persistence fixture'}});assert.equal(r.response.status,201);state.notebookId=r.data.data.id}
 for(const prefix of ['/notebooks','/vocab/notebooks']){
  r=await request(prefix+'/'+state.notebookId,{token:a.token});assert.equal(r.response.status,200);assert.equal(r.data.data.title,'Disposable persistence fixture');checks++;
  r=await request(prefix+'/'+state.notebookId,{token:b.token});assert.equal(r.response.status,404);checks++;
  r=await request(prefix+'/'+state.notebookId+'/items',{method:'POST',token:b.token,body:{vocabularyId:1,customNote:'denied'}});assert.equal(r.response.status,404);checks++;
 }
 phase='CSRF and origin defenses';
 for(const headers of [{'Origin':'https://untrusted.invalid','X-Auth-Transport':'cookie'},{'X-Auth-Transport':'cookie'}]){r=await request('/auth/refresh',{method:'POST',cookie:a.cookie,headers,body:{}});assert.equal(r.response.status,403);checks++}
 r=await request('/auth/refresh',{method:'POST',cookie:a.cookie,headers:{Origin:origin},body:{}});assert.ok([400,401,403].includes(r.response.status));checks++;
 phase='refresh rotation';r=await request('/auth/refresh',{method:'POST',cookie:a.cookie,headers:browserHeaders,body:{}});assert.equal(r.response.status,200);assert.equal(r.data.data.refreshToken,null);const rotated=refreshCookie(r.response);assert.notEqual(rotated,a.cookie);checks++;
 phase='logout and server revocation';r=await request('/auth/logout',{method:'POST',cookie:rotated,token:r.data.data.accessToken,headers:browserHeaders,body:{}});assert.equal(r.response.status,200);assert.ok(r.response.headers.get('cache-control')?.includes('no-store'));checks++;
 for(const cookie of [a.cookie,rotated]){r=await request('/auth/refresh',{method:'POST',cookie,headers:browserHeaders,body:{}});assert.equal(r.response.status,401);checks++}
 await request('/auth/logout',{method:'POST',cookie:b.cookie,token:b.token,headers:browserHeaders,body:{}});
 if(mode==='setup')writeFileSync('/qa-output/api-state.private.json',JSON.stringify(state),{mode:0o600});
 console.log(JSON.stringify({suite:'Real HTTPS API ownership/CSRF/rotation/revocation/persistence',mode,checks,status:'PASS',contentPublication:'NOT PERFORMED'}));
}catch{console.error('Real HTTPS acceptance failed during '+phase+'. Sensitive diagnostics suppressed.');process.exitCode=1;}
