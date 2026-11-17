import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

function attempt(change={}) {
 const dir=mkdtempSync(join(tmpdir(),'jiayou-cookie-preflight-'));
 try {
  const source='a'.repeat(40),web='https://qa.invalid/';
  const record={purpose:'jiayou-disposable-auth-cookie-qa',mainSha:source,webUrl:web,apiUrl:web+'api/v1',disposablePostgresql:true,productionConnectionsExcluded:true,verifiedBy:'offline negative fixture; no actual target',apiIdentity:'not a real service',postgresIdentity:'not a real database',apiDatabaseBindingEvidence:'negative preflight fixture only',verifiedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),...(change.record||{})};
  const path=join(dir,'record.json'),bytes=JSON.stringify(record);writeFileSync(path,bytes);
  const env={PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,TEMP:process.env.TEMP,TMP:process.env.TMP,AUDIT_WEB_URL:web,AUDIT_API_URL:web+'api/v1',AUDIT_SOURCE_SHA:source,AUDIT_ISOLATION_FILE:path,AUDIT_ISOLATION_SHA256:createHash('sha256').update(bytes).digest('hex'),CHROME_PATH:join(dir,'BROWSER_MUST_NOT_EXIST'),...(change.env||{})};
  for(const key of change.remove||[])delete env[key];
  return spawnSync(process.execPath,['tests/auth-cookie-smoke.mjs'],{encoding:'utf8',env,cwd:process.cwd()});
 }finally{assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep)&&basename(dir).startsWith('jiayou-cookie-preflight-'));rmSync(dir,{recursive:true,force:true});}
}
for(const [name,change]of [
 ['missing explicit source SHA',{remove:['AUDIT_SOURCE_SHA']}],
 ['invalid explicit source SHA',{env:{AUDIT_SOURCE_SHA:'main'}}],
 ['mismatched source identity',{record:{mainSha:'b'.repeat(40)}}],
 ['digest mismatch',{env:{AUDIT_ISOLATION_SHA256:'0'.repeat(64)}}],
 ['expired verification',{record:{expiresAt:new Date(Date.now()-1000).toISOString()}}],
 ['unverified database binding',{record:{apiDatabaseBindingEvidence:''}}],
 ['HTTP target',{env:{AUDIT_WEB_URL:'http://qa.invalid/'}}],
 ['different API origin',{env:{AUDIT_API_URL:'https://different.invalid/api/v1'}}],
 ['TLS verification bypass',{env:{NODE_TLS_REJECT_UNAUTHORIZED:'0'}}]
])test('cookie smoke fails before browser/accounts: '+name,()=>{const r=attempt(change);assert.equal(r.status,1);assert.match(r.stderr,/QA isolation preflight/);assert.doesNotMatch(r.stderr,/isolated browser startup|synthetic registration/);});
test('complete fixture reaches only nonexistent browser; never a real target',()=>{const r=attempt();assert.equal(r.status,1);assert.match(r.stderr,/isolated browser startup/);});
