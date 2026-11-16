#!/usr/bin/env python3
"""Real disposable Compose/HTTPS/PostgreSQL rehearsal; no production host or public route.

Supported execution surfaces are an existing local Docker Desktop engine or a GitHub-hosted
runner. Every run allocates a new labelled project/UUID/volume/network. Never adopts resources.
Only sanitized summary.json/commands.json are suitable for CI artifacts. *.private files,
TLS keys, database dumps and the API fixture contain disposable secrets and must stay private.
"""
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import importlib.util
import ipaddress
import json
import os
import secrets
import subprocess
import sys
import tarfile
import tempfile
import time
import uuid

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('jiayou_release',ROOT/'deployment/jiayou.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--context',required=True)
 parser.add_argument('--output',required=True,type=Path)
 parser.add_argument('--source-sha',required=True)
 args=parser.parse_args()
 output=args.output.resolve();release.require(not output.exists() and not output.is_relative_to(ROOT),'A new private external QA output directory is required')
 output.mkdir(parents=True,mode=0o700)
 commands=[];summary={'purpose':'disposable-production-mode-release-rehearsal','sourceSha':args.source_sha,'startedAt':release.timestamp(),'stages':[],'productionAccess':False,'publicNetworking':False,'curriculumPublication':'NOT PERFORMED'}
 real_run=release.run
 def audited(command,**kwargs):
  expected_failure=kwargs.pop('allow_failure',False)
  started=time.monotonic();result=real_run(command,**kwargs,allow_failure=True)
  sanitized=[str(x).replace(str(output),'<QA_DIR>').replace(str(ROOT),'<CLEAN_SOURCE>')for x in command]
  for i,item in enumerate(sanitized):
   if 'AUTHORIZATION='in item:sanitized[i]=item.split('=',1)[0]+'=<TARGET_BOUND_ACK>'
  commands.append({'command':sanitized,'exitCode':result.returncode,'phase':kwargs.get('phase','operation'),'seconds':round(time.monotonic()-started,3)})
  release.write_json(output/'commands.json',commands)
  if result.returncode and not expected_failure:
   if not kwargs.get('binary'):
    text=(result.stdout or '')+'\n'+(result.stderr or '')
    (output/'failed-command.private.log').write_text(text,encoding='utf-8')
    # Fixed labels only: never copy raw daemon/application diagnostics to public artifacts.
    for pattern,label in [('user specified IP address is supported only','STATIC_IP_REQUIRES_EXPLICIT_SUBNET'),('permission denied','FILESYSTEM_PERMISSION_DENIED'),('unknown flag','COMPOSE_FEATURE_UNSUPPORTED'),('unhealthy','SERVICE_HEALTH_REJECTED')]:
     if pattern in text.lower():summary['sanitizedDiagnosticClass']=label
   raise release.ReleaseError(str(kwargs.get('phase','operation'))+' failed; private diagnostics recorded')
  return result
 release.run=audited
 def command(*items,**kw):return audited(items,**kw).stdout.strip()
 def stage(name,fn):
  started=time.monotonic();value=fn();summary['stages'].append({'name':name,'status':'PASS','seconds':round(time.monotonic()-started,3),'evidence':value});release.write_json(output/'summary.json',summary);print(name+' PASS',flush=True);return value
 docker=['docker','--context',args.context]
 def d(*items,**kw):return audited([*docker,*items],**kw)
 env_path=output/'release.env';r=None;baseline={};values={}
 try:
  head=command('git','-C',ROOT,'rev-parse','HEAD')
  release.require(head==args.source_sha and not command('git','-C',ROOT,'status','--porcelain=v1','--untracked-files=all'),'Clean immutable source identity mismatch')
  context=json.loads(command('docker','context','inspect',args.context))[0]
  release.require(context['Endpoints']['docker']['Host'].startswith(('unix://','npipe://')),'Only local context is allowed')
  engine=json.loads(d('info','--format','{{json .}}').stdout)
  hosted=os.environ.get('GITHUB_ACTIONS')=='true'and os.environ.get('RUNNER_ENVIRONMENT')=='github-hosted'
  release.require(engine['OSType']=='linux'and ('Docker Desktop'in engine['OperatingSystem'] or hosted),'Verified Docker Desktop or GitHub-hosted disposable runner required; never default to a production Linux host')
  release.require(engine['MemTotal']>=6*1024**3,'Insufficient verified QA capacity')
  ids=d('ps','-aq').stdout.splitlines();baseline['containers']={}
  for cid in ids:
   item=json.loads(d('inspect',cid).stdout)[0];baseline['containers'][item['Id']]={'image':item['Image'],'startedAt':item['State']['StartedAt'],'status':item['State']['Status'],'configurationSha256':hashlib.sha256(json.dumps({'Config':item['Config'],'HostConfig':item['HostConfig']},sort_keys=True).encode()).hexdigest()}
  baseline['networks']=d('network','ls','-q','--no-trunc').stdout.splitlines();baseline['volumes']=d('volume','ls','-q').stdout.splitlines()
  release.write_json(output/'baseline.private.json',baseline)
  summary['engineEvidence']={'localEndpoint':True,'linuxContainers':True,'verifiedSurface':'GitHub-hosted runner'if hosted else'Docker Desktop','preexistingContainers':len(ids),'memoryBytes':engine['MemTotal']}
  project='jiayou-releaseqa-'+secrets.token_hex(6);target=str(uuid.uuid4());network=project+'_application'
  labels={'io.jiayou.managed':release.CONTRACT,'io.jiayou.target':target,'io.jiayou.project':project}
  command_args=['network','create']
  for k,v in labels.items():command_args+=['--label',k+'='+v]
  # Observe the engine allocator, then explicitly declare that actual subnet. Older Linux
  # engines reject static frontend/edge IPs on an implicitly allocated IPAM network.
  probe=d(*command_args,project+'_allocator').stdout.strip();release.require(probe not in baseline['networks'],'New namespace required')
  network_data=json.loads(d('network','inspect',probe).stdout)[0];subnet=ipaddress.ip_network(network_data['IPAM']['Config'][0]['Subnet'])
  release.require(not network_data.get('Containers')and all(network_data.get('Labels',{}).get(k)==v for k,v in labels.items()),'Only the newly allocated empty owned probe may be removed')
  d('network','rm',probe,phase='Remove only newly owned empty allocation probe')
  nid=d(*command_args,'--subnet',str(subnet),network).stdout.strip();release.require(nid not in baseline['networks'],'New application namespace required')
  values={'JIAYOU_DOCKER_CONTEXT':args.context,'JIAYOU_RELEASE_SHA':head,'JIAYOU_COMPOSE_PROJECT':project,'JIAYOU_TARGET_ID':target,'JIAYOU_DATABASE_NAME':'jiayou_rehearsal','JIAYOU_POSTGRES_OPERATOR':'jiayou_operator','JIAYOU_MIGRATION_USER':'jiayou_migrator','JIAYOU_DATABASE_USER':'jiayou_runtime','JIAYOU_DATABASE_VOLUME':project+'_database','JIAYOU_APPLICATION_NETWORK':network,'JIAYOU_APPLICATION_SUBNET':str(subnet),'JIAYOU_FRONTEND_IP':str(subnet.network_address+10),'JIAYOU_PUBLIC_HOST':'jiayou-qa.test','JIAYOU_PUBLIC_ORIGIN':'https://jiayou-qa.test:8443','JIAYOU_INGRESS_PEERS':str(subnet.network_address+11)+'/32','JIAYOU_JAVA_TOOL_OPTIONS':'-Xms128m -Xmx512m -XX:+ExitOnOutOfMemoryError','JIAYOU_QA_DIR':output.as_posix(),'JIAYOU_QA_EDGE_IP':str(subnet.network_address+11),'JIAYOU_QA_SECCOMP_PATH':(ROOT/'deployment/qa/chromium-seccomp.json').as_posix()}
  for key,folder in [('JIAYOU_SECRETS_DIR','secrets'),('JIAYOU_CONFIG_DIR','config'),('JIAYOU_STATE_DIR','state'),('JIAYOU_BACKUP_DIR','backups')]:values[key]=(output/folder).as_posix()
  for component,memory,cpu,pids in [('DB','256m','0.5','128'),('BACKEND','1024m','2','256'),('FRONTEND','128m','0.5','128')]:
   for suffix,value in [('MEMORY_LIMIT',memory),('CPU_LIMIT',cpu),('PIDS_LIMIT',pids)]:values['JIAYOU_'+component+'_'+suffix]=value
  def save_env():env_path.write_text('\n'.join(k+'='+v for k,v in values.items())+'\n',encoding='utf-8');os.chmod(env_path,0o600)
  save_env();c=release.Config(env_path);c.make_secrets();r=release.Release(c)
  stage('canonical Compose validation',lambda:(r.prepare_config(),r.contract(),{'privatePorts':True,'externalSecretFiles':True})[-1])
  stage('clean immutable production image builds',lambda:(r.build(),r.image_receipt())[-1])
  def build_browser():
   # Canonical Git bytes prevent checkout CRLF, untracked data or private env files entering QA images.
   with tempfile.TemporaryDirectory(prefix='jiayou-qa-build-')as temporary:
    archive=Path(temporary)/'source.tar';archive.write_bytes(audited(['git','-c','core.autocrlf=false','-C',ROOT,'archive','--format=tar',head],binary=True).stdout)
    source=Path(temporary)/'source';source.mkdir()
    with tarfile.open(archive)as tar:tar.extractall(source,filter='data')
    return d('build','--build-arg','RELEASE_SHA='+head,'-t','jiayou-qa-browser:'+head,'-f',str(source/'deployment/qa/Dockerfile.browser'),str(source),phase='QA browser image build').returncode
  stage('sandboxed QA browser image build',build_browser)
  tls_dir=output/'tls';tls_dir.mkdir(mode=0o700);browser_output=output/'output';browser_output.mkdir(mode=0o700)
  # Private parent remains 0700; only the sandboxed QA container gets this bind mount.
  os.chmod(tls_dir,0o777);os.chmod(browser_output,0o777)
  issuer_script='''set -eu
openssl req -x509 -newkey rsa:2048 -nodes -keyout /qa-tls/ca.key -out /qa-tls/ca.crt -days 2 -subj /CN=JiayouDisposableQARoot
openssl req -newkey rsa:2048 -nodes -keyout /qa-tls/server.key -out /qa-tls/server.csr -subj /CN=jiayou-qa.test -addext subjectAltName=DNS:jiayou-qa.test
openssl x509 -req -in /qa-tls/server.csr -CA /qa-tls/ca.crt -CAkey /qa-tls/ca.key -CAcreateserial -days 2 -copy_extensions copy -out /qa-tls/server.crt
chmod 0444 /qa-tls/ca.crt /qa-tls/server.crt /qa-tls/server.key
openssl verify -CAfile /qa-tls/ca.crt /qa-tls/server.crt
'''
  issuer=['run','--rm','--network','none','--user','root']
  for k,v in labels.items():issuer+=['--label',k+'='+v]
  stage('private QA CA issuance',lambda:d(*issuer,'--mount','type=bind,source='+str(tls_dir)+',target=/qa-tls','--entrypoint','sh','jiayou-qa-browser:'+head,'-c',issuer_script,phase='Ephemeral QA certificate issuance').returncode)
  (output/'edge.conf').write_text('''server {
 listen 8443 ssl;
 server_name jiayou-qa.test;
 ssl_certificate /run/secrets/tls_cert;
 ssl_certificate_key /run/secrets/tls_key;
 ssl_protocols TLSv1.2 TLSv1.3;
 server_tokens off;
 access_log off;
 location ~ ^/(api/v1/actuator|_jiayou_health)(/|$) { return 404; }
 location / {
  proxy_pass http://frontend:8080;
  proxy_set_header Host $http_host;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header Forwarded "";
  proxy_set_header X-Real-IP "";
  proxy_set_header CF-Connecting-IP "";
 }
}
server { listen 127.0.0.1:8081; location = /_edge_health { return 200 "ready\\n"; } }
''',encoding='utf-8');os.chmod(output/'edge.conf',0o444)
  stage('first PostgreSQL bootstrap and least-privilege grants',lambda:(r.initialize(),{'schemaVersion':2,'runtimeDdl':False,'protectedMetadataWrites':False,'noAdminOrCurriculumSeed':True})[-1])
  stage('production-profile Compose startup',lambda:(r.up(),r.verify())[-1])
  r=release.Release(c,overrides=(ROOT/'deployment/qa/compose.yml',))
  stage('same-origin HTTPS ingress startup',lambda:r.compose('up','-d','--wait','--wait-timeout','120','edge',phase='QA TLS ingress startup').returncode)
  def isolation_record():
   backend=r.container('backend');pg=r.container('postgres');r.verify()
   db_network=next(x for x in backend['NetworkSettings']['Networks']if x.endswith('_database'));backend_ip=backend['NetworkSettings']['Networks'][db_network]['IPAddress']
   connections=r.sql("SELECT count(*) FROM pg_stat_activity WHERE datname="+release.literal(c.database)+" AND usename="+release.literal(c.v['JIAYOU_DATABASE_USER'])+" AND client_addr="+release.literal(backend_ip)+"::inet;")
   release.require(int(connections)>0,'Actual API/database network binding not proven')
   now=dt.datetime.now(dt.timezone.utc);record={'purpose':'jiayou-disposable-auth-cookie-qa','mainSha':head,'webUrl':values['JIAYOU_PUBLIC_ORIGIN']+'/','apiUrl':values['JIAYOU_PUBLIC_ORIGIN']+'/api/v1','disposablePostgresql':True,'productionConnectionsExcluded':True,'verifiedBy':'Authorized rehearsal driver: inspected local engine, new project labels, resource IDs, image revisions and actual SQL connections','apiIdentity':backend['Id']+' image='+backend['Image'],'postgresIdentity':pg['Id']+' database='+c.database+' target='+target,'apiDatabaseBindingEvidence':'Runtime-role pg_stat_activity client_addr matches inspected backend endpoint on the new private database network; actual target marker/history verified','verifiedAt':now.isoformat(),'expiresAt':(now+dt.timedelta(hours=2)).isoformat()}
   raw=json.dumps(record,indent=2).encode();record_path=browser_output/'isolation.json'
   if record_path.exists():os.chmod(record_path,0o600)
   record_path.write_bytes(raw);os.chmod(record_path,0o444);values['JIAYOU_QA_ISOLATION_SHA256']=hashlib.sha256(raw).hexdigest();save_env()
   return {'actualDatasourceConnection':True,'newProject':project,'targetId':target,'recordSha256':values['JIAYOU_QA_ISOLATION_SHA256']}
  stage('independent API/PostgreSQL binding verification',isolation_record)
  def browser(mode,*extra):
   result=r.compose('--profile','acceptance','run','--rm','--no-deps','browser',mode,*extra,phase='Real HTTPS '+mode+' acceptance')
   # Scripts suppress operands/credentials; still publish only PASS markers, never raw errors.
   lines=[line for line in result.stdout.splitlines()if line.startswith('{')or line.startswith('Cookie browser smoke passed')]
   return {'exitCode':result.returncode,'safeSummary':lines}
  stage('real HTTPS auth browser desktop/mobile',lambda:browser('smoke'))
  stage('real HTTPS ownership CSRF rotation and revocation',lambda:browser('api','setup'))
  before=r.sql('SELECT count(*) FROM public.users;')+'|'+r.sql('SELECT count(*) FROM public.vocab_notebooks;')
  stage('controlled PostgreSQL/backend restart',lambda:(r.compose('restart','postgres','backend',phase='Owned service restart'),r.up(),r.verify())[-1])
  release.require(before==r.sql('SELECT count(*) FROM public.users;')+'|'+r.sql('SELECT count(*) FROM public.vocab_notebooks;'),'Persistence changed after restart')
  stage('real API persistence after restart',lambda:browser('api','resume'))
  def rejection_tests():
   repeated=r.compose('--profile','operations','run','--rm','--no-deps','bootstrap',env={'JIAYOU_INITIALIZE_AUTHORIZATION':'initialize:Jiayou:production:'+target},allow_failure=True,phase='Expected repeated initialization rejection');release.require(repeated.returncode!=0,'Repeated initialize unexpectedly passed')
   wrong=str(uuid.uuid4());mismatch=r.compose('--profile','operations','run','--rm','--no-deps','-e','JIAYOU_TARGET_ID='+wrong,'-e','JIAYOU_BOOTSTRAP_MODE=validate','-e','JIAYOU_BOOTSTRAP_AUTHORIZATION=validate:Jiayou:production:'+wrong,'bootstrap',allow_failure=True,phase='Expected wrong-target rejection');release.require(mismatch.returncode!=0,'Wrong identity unexpectedly passed')
   r.sql('CREATE DATABASE jiayou_foreign OWNER '+release.ident(c.v['JIAYOU_MIGRATION_USER'])+';');r.sql('CREATE TABLE forbidden_fixture(id integer);','jiayou_foreign')
   unsupported=r.compose('--profile','operations','run','--rm','--no-deps','-e','JIAYOU_DATABASE_NAME=jiayou_foreign','-e','JIAYOU_DATABASE_URL=jdbc:postgresql://postgres:5432/jiayou_foreign','bootstrap',env={'JIAYOU_INITIALIZE_AUTHORIZATION':'initialize:Jiayou:production:'+target},allow_failure=True,phase='Expected foreign-schema rejection');release.require(unsupported.returncode!=0,'Foreign schema unexpectedly passed')
   release.require(before==r.sql('SELECT count(*) FROM public.users;')+'|'+r.sql('SELECT count(*) FROM public.vocab_notebooks;'),'Negative bootstrap test altered active data')
   return {'repeatedInitialize':'REJECTED','wrongTarget':'REJECTED','foreignSchema':'REJECTED','activeDataUnchanged':True}
  stage('fail-closed bootstrap negative cases',rejection_tests)
  backup=stage('independent logical backup',lambda:str(r.backup()))
  restored='jiayou_restored'
  stage('atomic restore into absent independent database',lambda:r.restore(Path(backup),restored))
  original_db=values['JIAYOU_DATABASE_NAME'];values['JIAYOU_DATABASE_NAME']=restored;save_env();c=release.Config(env_path);r=release.Release(c,overrides=(ROOT/'deployment/qa/compose.yml',))
  stage('restored database application validation',lambda:(r.up(recreate=True),r.verify())[-1]);stage('restored API binding',isolation_record);stage('real restored account/notebook state',lambda:browser('api','resume'))
  # Controlled configuration rollback to the intact original database, no schema downgrade.
  values['JIAYOU_DATABASE_NAME']=original_db;save_env();c=release.Config(env_path);r=release.Release(c,overrides=(ROOT/'deployment/qa/compose.yml',))
  stage('controlled configuration rollback to known-good state',lambda:(r.up(recreate=True),r.verify())[-1]);stage('rollback API binding',isolation_record);stage('real account/notebook state after rollback',lambda:browser('api','resume'))
  summary['result']='PASS';summary['limitations']=['No authorized learner corpus; SRS/HSK/curriculum E2E BLOCKED','No Arch host/live ingress/capacity/off-host backup acceptance','Configuration rollback rehearsed; cross-version artifact rollback requires two compatible approved releases','Raw dumps and QA credentials must not be uploaded; sanitized reports only']
 except Exception as error:
  summary['result']='FAIL';summary['failure']={'type':type(error).__name__,'phase':commands[-1]['phase']if commands else'preflight','diagnostics':'Private output retained locally; no secret/response operands published'};print('Rehearsal FAIL; private diagnostics retained.',flush=True)
 finally:
  if r is not None:
   try:
    for service in ('edge','frontend','backend','postgres'):
     try:r.container(service)
     except release.ReleaseError:continue
     r.compose('stop',service,phase='Stop owned QA service only',allow_failure=True)
   except Exception:summary['cleanup']='Owned partial resources retained for inspection; no global cleanup attempted'
  if baseline.get('containers'):
   differences=[];observations=[]
   for cid,expected in baseline['containers'].items():
    result=d('inspect',cid,allow_failure=True)
    if result.returncode:differences.append({'id':cid,'field':'missing'});continue
    item=json.loads(result.stdout)[0];actual={'image':item['Image'],'startedAt':item['State']['StartedAt'],'status':item['State']['Status'],'configurationSha256':hashlib.sha256(json.dumps({'Config':item['Config'],'HostConfig':item['HostConfig']},sort_keys=True).encode()).hexdigest()}
    if actual!=expected:
     if expected['status']=='restarting'and actual['image']==expected['image']and actual['configurationSha256']==expected['configurationSha256']:observations.append({'id':cid,'observation':'Already-restarting external container changed runtime timestamp; image/configuration unchanged; no command targeted it'})
     else:differences.append({'id':cid,'field':'external state changed'})
   summary['preexistingContainerPreservation']={'count':len(baseline['containers']),'differences':differences,'observations':observations}
   if differences:summary['result']='FAIL'
  if baseline.get('networks'):
   release.require(set(baseline['networks']).issubset(set(d('network','ls','-q','--no-trunc').stdout.splitlines())), 'Preexisting network missing')
   release.require(set(baseline['volumes']).issubset(set(d('volume','ls','-q').stdout.splitlines())), 'Preexisting volume missing')
  summary['finishedAt']=release.timestamp();release.write_json(output/'summary.json',summary)
 print(json.dumps({'result':summary.get('result'),'stagesPassed':sum(s['status']=='PASS'for s in summary['stages']),'evidence':str(output/'summary.json')}),flush=True)
 return 0 if summary.get('result')=='PASS'else 1

if __name__=='__main__':raise SystemExit(main())
