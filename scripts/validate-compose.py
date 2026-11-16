"""Validate all production/operation contracts with synthetic inputs; never start Docker services."""
from pathlib import Path
import json,subprocess,tempfile
root=Path(__file__).resolve().parents[1]
values={line.split('=',1)[0]:'fixture' for line in (root/'.env.example').read_text(encoding='utf-8').splitlines() if line and not line.startswith('#') and '=' in line}
values.update(JIAYOU_COMPOSE_PROJECT='jiayou-validation',JIAYOU_DATABASE_VOLUME='jiayou-validation_database',JIAYOU_APPLICATION_NETWORK='jiayou-validation_application',JIAYOU_RELEASE_SHA='a'*40,JIAYOU_FRONTEND_IP='192.0.2.10',JIAYOU_PUBLIC_HOST='fixture.invalid',JIAYOU_PUBLIC_ORIGIN='https://fixture.invalid',JIAYOU_DATABASE_USER='jiayou_runtime',JIAYOU_MIGRATION_USER='jiayou_migrator',JIAYOU_POSTGRES_OPERATOR='jiayou_operator')
for key in values:
 if key.endswith('_MEMORY_LIMIT'):values[key]='256m'
 if key.endswith('_CPU_LIMIT'):values[key]='0.5'
 if key.endswith('_PIDS_LIMIT'):values[key]='128'
with tempfile.TemporaryDirectory(prefix='jiayou-compose-check-') as temp:
 for k in ('JIAYOU_SECRETS_DIR','JIAYOU_CONFIG_DIR','JIAYOU_STATE_DIR','JIAYOU_BACKUP_DIR'):values[k]=Path(temp).as_posix()
 env=Path(temp)/'fixture.env';env.write_text('\n'.join(f'{key}={value}' for key,value in values.items()),encoding='utf-8')
 data=json.loads(subprocess.check_output(['docker','compose','--env-file',str(env),'-f',str(root/'docker-compose.yml'),'--profile','operations','config','--format','json'],text=True))
 for service in data['services'].values():
  assert not service.get('ports') and not service.get('container_name')
  assert all(m.startswith('/') and 'nosuid,nodev' in m for m in service.get('tmpfs', []))
 assert data['volumes']['jiayou_database']['external']
 assert data['networks']['database']['internal']
 assert data['services']['backend']['environment']['JIAYOU_BOOTSTRAP_MODE']=='validate'
 assert data['services']['bootstrap']['environment']['JIAYOU_BOOTSTRAP_MODE']=='initialize'
 assert data['services']['bootstrap']['environment']['JIAYOU_BOOTSTRAP_AUTHORIZATION']==''
 assert 'JIAYOU_DATABASE_PASSWORD' not in data['services']['backend']['environment']
 assert 'JIAYOU_JWT_SECRET' not in data['services']['backend']['environment']
 assert data['services']['backend']['environment']['JIAYOU_DATABASE_USER']!=data['services']['bootstrap']['environment']['JIAYOU_DATABASE_USER']
 assert {s['source'] for s in data['services']['backend']['secrets']}=={'runtime_password','jwt_key'}
 assert {s['source'] for s in data['services']['bootstrap']['secrets']}=={'migration_password','jwt_key'}
 assert data['services']['frontend']['depends_on']['backend']['condition']=='service_healthy'
 for file in (root/'backend/Dockerfile',root/'frontend/Dockerfile'):
  assert all('@sha256:' in line for line in file.read_text().splitlines() if line.startswith('FROM '))
print('Compose PASS: private ports, scoped external storage/secrets, separate roles, explicit bootstrap, validate-only runtime, health ordering and digest-pinned base images. No services started.')
