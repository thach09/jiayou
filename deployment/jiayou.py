#!/usr/bin/env python3
"""Jiayou release contract v1. Local Docker context; no registry publish or live-host discovery.

All mutating commands are scoped to labelled resources and an explicit target UUID.
Secrets, dumps and operator state stay outside the checkout. Never print subprocess output
on failure: database/browser diagnostics can contain credentials.
"""
from __future__ import annotations
import argparse
import base64
import datetime as dt
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import tarfile
import tempfile
import time
import uuid
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = 'release-v1'
PROTECTED = {'roles', 'jiayou_database_identity', 'jiayou_schema_history'}
REQUIRED = {line.split('=', 1)[0] for line in (ROOT / '.env.example').read_text(encoding='utf-8').splitlines() if line and not line.startswith('#') and '=' in line}
SECRET_NAMES = ('operator_password', 'migration_password', 'runtime_password', 'jwt_key')

class ReleaseError(Exception):
    pass

def require(condition, message):
    if not condition:
        raise ReleaseError(message)

def ident(value):
    require(bool(re.fullmatch(r'[a-z_][a-z0-9_]{0,62}', value)), 'Invalid database identifier')
    return '"' + value + '"'

def literal(value):
    return "'" + value.replace("'", "''") + "'"

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as out:
        os.chmod(out.name, 0o600)
        json.dump(value, out, indent=2)
        temporary = out.name
    os.replace(temporary, path)

def timestamp():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def run(args, *, data=None, binary=False, env=None, output=None, timeout=1200, phase='Docker operation', allow_failure=False):
    settings = {k: v for k, v in os.environ.items() if not k.startswith(('COMPOSE_', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'SPRING_', 'JIAYOU_', 'VITE_', 'DB_', 'JWT_'))}
    settings.update(env or {})
    result = subprocess.run([str(x) for x in args], input=data, stdout=output if output else subprocess.PIPE,
                            stderr=subprocess.PIPE, text=not binary, env=settings, timeout=timeout)
    if result.returncode and not allow_failure:
        raise ReleaseError(f'{phase} failed (exit {result.returncode}); sensitive diagnostics suppressed')
    return result

class Config:
    def __init__(self, path):
        self.path = Path(path).resolve()
        require(self.path.is_file() and not self.path.is_relative_to(ROOT), 'Use an external absolute environment file')
        self.v = {}
        for line in self.path.read_text(encoding='utf-8-sig').splitlines():
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            key, separator, value = line.partition('=')
            require(separator and key == key.strip() and key not in self.v, 'Invalid or duplicate environment key')
            require(key in REQUIRED or key.startswith('JIAYOU_QA_'), 'Unknown deployment variable')
            require(value == value.strip() and not any(c in value for c in ('$','\r','\n','"',"'")), 'Use literal unquoted environment values')
            self.v[key] = value
        missing = sorted(k for k in REQUIRED if not self.v.get(k))
        require(not missing, 'Missing mandatory deployment inputs: ' + ', '.join(missing))
        self.project = self.v['JIAYOU_COMPOSE_PROJECT']
        require(bool(re.fullmatch(r'jiayou-[a-z0-9][a-z0-9-]{3,48}', self.project)), 'Use an independent jiayou- project name')
        require(not any(word in self.project for word in ('ganbarou','heyganba')), 'Foreign project identity rejected')
        self.target = self.v['JIAYOU_TARGET_ID']
        require(str(uuid.UUID(self.target)) == self.target, 'Canonical target UUID required')
        self.sha = self.v['JIAYOU_RELEASE_SHA']
        require(bool(re.fullmatch(r'[a-f0-9]{40}', self.sha)), 'Immutable release SHA required')
        self.database = self.v['JIAYOU_DATABASE_NAME']
        require(bool(re.fullmatch(r'jiayou_[a-z0-9_]+', self.database)), 'Dedicated database name required')
        for key in ('JIAYOU_POSTGRES_OPERATOR','JIAYOU_MIGRATION_USER','JIAYOU_DATABASE_USER'):
            ident(self.v[key])
        require(len({self.v[k] for k in ('JIAYOU_POSTGRES_OPERATOR','JIAYOU_MIGRATION_USER','JIAYOU_DATABASE_USER')}) == 3, 'Operator, migration owner and runtime role must differ')
        require(self.v['JIAYOU_DATABASE_VOLUME'] == self.project + '_database', 'Volume must belong to this project')
        require(self.v['JIAYOU_APPLICATION_NETWORK'] == self.project + '_application', 'Network must belong to this project')
        subnet = ipaddress.ip_network(self.v['JIAYOU_APPLICATION_SUBNET'], strict=True)
        address = ipaddress.ip_address(self.v['JIAYOU_FRONTEND_IP'])
        require(subnet.version == 4 and subnet.is_private and 16 <= subnet.prefixlen <= 28, 'Reviewed private IPv4 /16 through /28 application subnet required')
        require(address in subnet and address not in (subnet.network_address, subnet.broadcast_address, subnet.network_address + 1), 'Reserved frontend address must be inside its subnet')
        origin = urlsplit(self.v['JIAYOU_PUBLIC_ORIGIN'])
        host = self.v['JIAYOU_PUBLIC_HOST']
        require(bool(re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', host)), 'Selected hostname required')
        require(host not in ('heyganba.site','www.heyganba.site'), 'Ganbarou hostname rejected')
        require(origin.scheme == 'https' and origin.hostname == host and not origin.username and not origin.password
                and not origin.query and not origin.fragment and not origin.path, 'Exact same-origin HTTPS URL required (no trailing slash)')
        peers = self.v['JIAYOU_INGRESS_PEERS'].split(',')
        for peer in peers:
            network = ipaddress.ip_network(peer, strict=False)
            require(network.prefixlen >= (24 if network.version == 4 else 64), 'Ingress trust must be narrowly scoped, never a default route')
        self.peers = peers
        for key in ('JIAYOU_SECRETS_DIR','JIAYOU_CONFIG_DIR','JIAYOU_STATE_DIR','JIAYOU_BACKUP_DIR'):
            p = Path(self.v[key])
            require(p.is_absolute() and not p.resolve().is_relative_to(ROOT), 'Secrets/config/state/backup directories must be absolute and outside source')
        for component in ('DB','BACKEND','FRONTEND'):
            for suffix in ('CPU_LIMIT','PIDS_LIMIT','MEMORY_LIMIT'):
                value = self.v['JIAYOU_' + component + '_' + suffix]
                if suffix == 'MEMORY_LIMIT':
                    require(bool(re.fullmatch(r'[1-9][0-9]*[mMgG]', value)), 'Explicit MiB/GiB memory budget required')
                elif suffix == 'PIDS_LIMIT':
                    require(value.isdigit() and int(value) >= 32, 'Explicit PID budget >=32 required')
                else:
                    require(bool(re.fullmatch(r'[0-9]+(?:\.[0-9]+)?', value)) and float(value) > 0, 'Positive CPU budget required')
        require(bool(re.fullmatch(r'-Xms[1-9][0-9]*[mMgG] -Xmx[1-9][0-9]*[mMgG](?: -XX:\+ExitOnOutOfMemoryError)?', self.v['JIAYOU_JAVA_TOOL_OPTIONS'])), 'Explicit bounded JVM heap required')
        def size(value):
            return int(value[:-1]) * (1024 ** (3 if value[-1].lower() == 'g' else 2))
        heap = self.v['JIAYOU_JAVA_TOOL_OPTIONS'].split()
        require(size(heap[0][4:]) <= size(heap[1][4:]) <= size(self.v['JIAYOU_BACKEND_MEMORY_LIMIT']) * 0.75, 'Heap must leave at least 25 percent backend memory for non-heap/native use')
        self.secret_dir = Path(self.v['JIAYOU_SECRETS_DIR'])
        self.config_dir = Path(self.v['JIAYOU_CONFIG_DIR'])
        self.state_dir = Path(self.v['JIAYOU_STATE_DIR'])
        self.backup_dir = Path(self.v['JIAYOU_BACKUP_DIR'])

    def ack(self, target):
        require(target == self.target, 'Explicit --ack-target must match the configured target UUID')

    def secret_check(self):
        if os.name == 'posix':
            require(self.secret_dir.is_dir() and self.secret_dir.stat().st_mode & 0o077 == 0, 'Protect secret parent directory with mode 0700')
        values = []
        for name in SECRET_NAMES:
            p = self.secret_dir / name
            require(p.is_file(), 'Missing external secret file: ' + name)
            value = p.read_text(encoding='utf-8')
            if name == 'jwt_key':
                try:
                    valid = len(base64.b64decode(value, validate=True)) >= 32
                except ValueError:
                    valid = False
                require(valid, 'JWT secret must be Base64 of >=32 random bytes, without newline')
            else:
                require(bool(re.fullmatch(r'[A-Za-z0-9_-]{32,128}', value)), 'Database secrets must be independent random Base64url values without newline')
            values.append(value)
        require(len(set(values)) == 4, 'Independent secrets required')

    def update(self, key, value):
        require(key in ('JIAYOU_RELEASE_SHA',), 'Only explicit release selection may be updated automatically')
        lines = self.path.read_text(encoding='utf-8-sig').splitlines()
        lines = [key + '=' + value if line.startswith(key + '=') else line for line in lines]
        self.path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        os.chmod(self.path, 0o600)
        self.v[key] = value

    def make_secrets(self):
        self.secret_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        if os.name == 'posix':
            require(self.secret_dir.stat().st_mode & 0o077 == 0, 'Protect secret directory before generation')
        require(not any((self.secret_dir / n).exists() for n in SECRET_NAMES), 'Never overwrite existing secrets')
        for name in SECRET_NAMES:
            value = base64.b64encode(secrets.token_bytes(48)).decode() if name == 'jwt_key' else secrets.token_urlsafe(36)
            p = self.secret_dir / name
            p.write_text(value, encoding='utf-8')
            # Directory is 0700; service-scoped read-only bind mounts need non-root readability.
            os.chmod(p, 0o444)
        self.secret_check()

class Release:
    def __init__(self, config, *, verify_engine=True, overrides=()):
        self.c = config
        self.context = config.v['JIAYOU_DOCKER_CONTEXT']
        self.docker = ['docker', '--context', self.context]
        context = json.loads(run(['docker','context','inspect',self.context], phase='Context inspection').stdout)[0]
        endpoint = context['Endpoints']['docker']['Host']
        require(endpoint.startswith(('unix://','npipe://')), 'Only an explicitly selected local Docker context is supported')
        if verify_engine:
            self.engine = json.loads(self.d('info','--format','{{json .}}').stdout)
            require(self.engine.get('OSType') == 'linux', 'Linux container engine required')
        self.compose_args = [*self.docker,'compose','--project-name',config.project,'--env-file',str(config.path),'-f',str(ROOT/'docker-compose.yml')]
        for override in overrides:
            self.compose_args += ['-f',str(override)]
        self.overrides = overrides

    def d(self, *args, **kwargs):
        return run([*self.docker,*args], **kwargs)

    def compose(self, *args, **kwargs):
        return run([*self.compose_args,*args], **kwargs)

    def labels(self):
        return {'io.jiayou.managed': CONTRACT, 'io.jiayou.target':self.c.target,'io.jiayou.project':self.c.project}

    def own(self, labels):
        require(all(labels.get(k) == v for k,v in self.labels().items()), 'Resource ownership/target mismatch; refusing to adopt it')

    def prepare_config(self):
        self.c.config_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        lines = ['# Generated from explicit immediate ingress peers; no broad default trust.',
                 'geo $realip_remote_addr $jiayou_trusted_ingress {', '    default 0;']
        lines += ['    ' + p + ' 1;' for p in self.c.peers]
        lines += ['}', *['set_real_ip_from ' + p + ';' for p in self.c.peers],
                  'real_ip_header X-Forwarded-For;', 'real_ip_recursive off;',
                  'map "$jiayou_trusted_ingress:$http_x_forwarded_proto" $jiayou_forwarded_proto {',
                  '    default "";', '    "1:https" https;', '}']
        path = self.c.config_dir / 'trusted-ingress.conf'
        content = '\n'.join(lines) + '\n'
        if path.exists() and path.read_text(encoding='utf-8') == content:
            return
        if path.exists():
            os.chmod(path, 0o600)
        path.write_text(content, encoding='utf-8')
        os.chmod(path, 0o444)

    def contract(self):
        data = json.loads(self.compose('--profile','operations','config','--format','json',phase='Compose validation').stdout)
        for service in data['services'].values():
            require(not service.get('ports') and not service.get('container_name'), 'Canonical stack must not publish host ports or global container names')
        require(data['networks']['database']['internal'], 'Private database network required')
        require(data['volumes']['jiayou_database']['external'], 'Independent external database volume required')
        require(data['services']['backend']['environment']['JIAYOU_BOOTSTRAP_MODE'] == 'validate', 'Runtime must validate only')
        require(data['services']['bootstrap']['environment']['JIAYOU_DATABASE_USER'] != data['services']['backend']['environment']['JIAYOU_DATABASE_USER'], 'Separate migration and runtime role required')
        require('JIAYOU_DATABASE_PASSWORD' not in data['services']['backend']['environment'], 'Runtime password must come from a scoped file secret')
        return data

    def ingress_contract(self):
        self.prepare_config()
        path = self.c.config_dir/'jiayou-nginx-location.conf'
        content = '# Review only: insert in the separately approved HTTPS virtual host for ' + self.c.v['JIAYOU_PUBLIC_HOST'] + '.\n'
        content += '# No listen, certificate, DNS or activation directive is generated.\n'
        content += 'location ~ ^/(api/v1/actuator|_jiayou_health)(/|$) { return 404; }\n'
        content += 'location / {\n    proxy_pass http://' + self.c.v['JIAYOU_FRONTEND_IP'] + ':8080;\n'
        content += '    proxy_set_header Host $http_host;\n    proxy_set_header X-Forwarded-Proto https;\n'
        content += '    proxy_set_header X-Forwarded-For $remote_addr;\n    proxy_set_header Forwarded "";\n'
        content += '    proxy_set_header X-Real-IP "";\n    proxy_set_header CF-Connecting-IP "";\n}\n'
        if path.exists(): os.chmod(path,0o600)
        path.write_text(content,encoding='utf-8');os.chmod(path,0o444)
        return path

    def provision(self):
        self.c.secret_check()
        volume = self.c.v['JIAYOU_DATABASE_VOLUME']
        existing = self.d('volume','inspect',volume,allow_failure=True)
        if existing.returncode == 0:
            self.own(json.loads(existing.stdout)[0].get('Labels') or {})
        else:
            args = ['volume','create']
            for k,v in self.labels().items(): args += ['--label',k+'='+v]
            self.d(*args,volume,phase='Owned volume provisioning')
        network = self.c.v['JIAYOU_APPLICATION_NETWORK']
        existing = self.d('network','inspect',network,allow_failure=True)
        if existing.returncode == 0:
            data = json.loads(existing.stdout)[0]
            self.own(data.get('Labels') or {})
            require(data['IPAM']['Config'][0]['Subnet'] == self.c.v['JIAYOU_APPLICATION_SUBNET'], 'Existing network subnet mismatch')
        else:
            args = ['network','create','--subnet',self.c.v['JIAYOU_APPLICATION_SUBNET']]
            for k,v in self.labels().items(): args += ['--label',k+'='+v]
            self.d(*args,network,phase='Independent application network provisioning')
        self.prepare_config()
        self.contract()

    def build(self):
        head = run(['git','-C',ROOT,'rev-parse','HEAD']).stdout.strip()
        require(head == self.c.sha, 'Checkout must match immutable release SHA before building')
        require(not run(['git','-C',ROOT,'status','--porcelain=v1','--untracked-files=all']).stdout, 'Build requires a clean checkout')
        epoch = run(['git','-C',ROOT,'show','-s','--format=%ct',head]).stdout.strip()
        with tempfile.TemporaryDirectory(prefix='jiayou-build-') as temp:
            archive = run(['git','-c','core.autocrlf=false','-C',ROOT,'archive','--format=tar',head], binary=True).stdout
            archive_path = Path(temp)/'source.tar';archive_path.write_bytes(archive)
            source = Path(temp)/'source';source.mkdir()
            with tarfile.open(archive_path) as tar:
                tar.extractall(source, filter='data')
            for component in ('backend','frontend'):
                self.d('build','--build-arg','RELEASE_SHA='+head,'--build-arg','SOURCE_DATE_EPOCH='+epoch,
                       '--build-arg','VITE_AUTH_COOKIE=true','-t','jiayou-'+component+':'+head,str(source/component),phase=component+' image build')
        self.c.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        write_json(self.c.state_dir/'build.json',self.image_receipt())

    def image_receipt(self):
        images = {}
        for component in ('backend','frontend'):
            ref = 'jiayou-'+component+':'+self.c.sha
            image = json.loads(self.d('image','inspect',ref,phase='Release image inspection').stdout)[0]
            labels = image['Config'].get('Labels') or {}
            require(labels.get('org.opencontainers.image.revision') == self.c.sha and labels.get('io.jiayou.deployment.contract') == '1' and labels.get('io.jiayou.component') == component, 'Unexpected image revision/component/contract')
            if component == 'frontend': require(labels.get('io.jiayou.auth-transport') == 'cookie', 'Cookie-mode production image required')
            images[component] = {'reference':ref,'id':image['Id']}
        return {'releaseSha':self.c.sha,'targetId':self.c.target,'project':self.c.project,'database':self.c.database,'schemaVersion':2,'contract':1,'images':images,'atUtc':timestamp()}

    def container(self, service):
        cid = self.compose('ps','-q',service,phase='Owned service lookup').stdout.strip()
        require(bool(cid) and '\n' not in cid, 'Exactly one owned service instance required: '+service)
        data = json.loads(self.d('inspect',cid).stdout)[0]
        self.own(data['Config'].get('Labels') or {})
        return data

    def sql(self, query, database=None):
        db = database or self.c.database
        ident(db)
        cid = self.container('postgres')['Id']
        return self.d('exec','-i',cid,'psql','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-U',self.c.v['JIAYOU_POSTGRES_OPERATOR'],'-d',db,
                      data=query+'\n',phase='Scoped PostgreSQL operation').stdout.strip()

    def grants(self, database=None):
        runtime = ident(self.c.v['JIAYOU_DATABASE_USER'])
        tables = self.sql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;",database).splitlines()
        require(PROTECTED.issubset(tables), 'Expected pinned schema missing before grants')
        clauses = ['REVOKE ALL ON DATABASE '+ident(database or self.c.database)+' FROM PUBLIC;',
                   'GRANT CONNECT ON DATABASE '+ident(database or self.c.database)+' TO '+runtime+';',
                   'REVOKE CREATE ON SCHEMA public FROM PUBLIC;', 'GRANT USAGE ON SCHEMA public TO '+runtime+';']
        for table in tables:
            verbs = 'SELECT' if table in PROTECTED else 'SELECT,INSERT,UPDATE,DELETE'
            clauses += ['REVOKE ALL ON TABLE public.'+ident(table)+' FROM '+runtime+';', 'GRANT '+verbs+' ON TABLE public.'+ident(table)+' TO '+runtime+';']
        sequences = self.sql("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='S' AND c.relname <> 'roles_id_seq';",database).splitlines()
        for name in sequences: clauses += ['GRANT USAGE,SELECT ON SEQUENCE public.'+ident(name)+' TO '+runtime+';']
        self.sql('\n'.join(clauses),database)
        roles = self.sql("SELECT count(*) FROM pg_roles WHERE rolname="+literal(self.c.v['JIAYOU_DATABASE_USER'])+" AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication;",database)
        require(roles == '1', 'Runtime role privilege boundary violated')
        runtime_name = literal(self.c.v['JIAYOU_DATABASE_USER'])
        require(self.sql('SELECT has_schema_privilege('+runtime_name+",'public','CREATE');",database) == 'f', 'Runtime DDL must be forbidden')
        for table in PROTECTED:
            require(self.sql('SELECT has_table_privilege('+runtime_name+','+literal('public.'+table)+",'INSERT,UPDATE,DELETE');",database) == 'f','Protected metadata must be read-only to runtime')

    def initialize(self):
        self.image_receipt()
        self.provision()
        self.compose('up','-d','--wait','--wait-timeout','120','postgres',phase='Dedicated PostgreSQL startup')
        require(self.sql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp_%';") == '0', 'First initialization requires an empty database; never repeat or repair it')
        migration = self.c.v['JIAYOU_MIGRATION_USER'];runtime = self.c.v['JIAYOU_DATABASE_USER']
        for role,secret in ((migration,'migration_password'),(runtime,'runtime_password')):
            require(self.sql('SELECT count(*) FROM pg_roles WHERE rolname='+literal(role)+';') == '0', 'Role already exists; refusing to overwrite credentials')
            password = (self.c.secret_dir/secret).read_text(encoding='utf-8')
            self.sql('CREATE ROLE '+ident(role)+' LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION PASSWORD '+literal(password)+';')
        self.sql('ALTER DATABASE '+ident(self.c.database)+' OWNER TO '+ident(migration)+'; REVOKE CREATE ON SCHEMA public FROM PUBLIC;')
        self.compose('--profile','operations','run','--rm','--no-deps','bootstrap',env={'JIAYOU_INITIALIZE_AUTHORIZATION':'initialize:Jiayou:production:'+self.c.target},phase='Pinned one-shot bootstrap')
        self.grants()
        self.identity()
        write_json(self.c.state_dir/'initialized.json',{'targetId':self.c.target,'database':self.c.database,'schemaVersion':2,'releaseSha':self.c.sha,'atUtc':timestamp()})

    def identity(self, database=None):
        rows = self.sql('SELECT product,environment,target_id::text,lineage FROM public.jiayou_database_identity WHERE singleton;',database)
        require(rows == 'Jiayou|production|'+self.c.target+'|jiayou-schema-only-v1', 'Actual database target/lineage mismatch')
        require(self.sql('SELECT count(*) FROM public.jiayou_schema_history WHERE success;',database) == '2', 'Unexpected schema history')
        return rows

    def up(self, recreate=False):
        self.c.secret_check()
        self.provision()
        self.identity()
        image = self.image_receipt()
        state = self.c.state_dir/'build.json'
        require(state.is_file() and json.loads(state.read_text())['images'] == image['images'], 'Build manifest/image identities missing or changed')
        args = ['up','-d','--wait','--wait-timeout','240']
        active = self.c.state_dir/'release.json'
        ingress = hashlib.sha256((self.c.config_dir/'trusted-ingress.conf').read_bytes()).hexdigest()
        if active.exists() and json.loads(active.read_text()).get('ingressContractSha256') != ingress:
            recreate = True
        if recreate: args += ['--force-recreate']
        self.compose(*args,'backend','frontend',phase='Validate-only application startup')
        self.verify()
        previous = self.c.state_dir/'release.json'
        if previous.exists():
            write_json(self.c.state_dir/'previous-release.json',json.loads(previous.read_text()))
        write_json(previous,{**image,'ingressContractSha256':ingress})

    def verify(self):
        for service in ('postgres','backend','frontend'):
            data = self.container(service)
            require(data['State'].get('Health',{}).get('Status') == 'healthy', 'Service is not healthy: '+service)
            require(not data['HostConfig'].get('PortBindings'), 'Canonical services must not publish host ports')
        self.identity()
        backend = self.container('backend')
        settings = dict(x.split('=',1) for x in backend['Config']['Env'] if '=' in x)
        require(settings.get('JIAYOU_DATABASE_USER') == self.c.v['JIAYOU_DATABASE_USER'] and settings.get('JIAYOU_BOOTSTRAP_MODE') == 'validate', 'Actual runtime role/mode mismatch')
        require('JIAYOU_DATABASE_PASSWORD' not in settings and 'JIAYOU_JWT_SECRET' not in settings, 'Secrets must not appear as Docker environment values')
        require(self.sql('SELECT count(*) FROM pg_stat_activity WHERE datname='+literal(self.c.database)+' AND usename='+literal(self.c.v['JIAYOU_DATABASE_USER'])+';') != '0', 'No actual runtime-role datasource connection')
        frontend = self.container('frontend')['Id']
        built = json.loads(self.d('exec',frontend,'cat','/usr/share/nginx/html/jiayou-build.json').stdout)
        require(built == {'revision':self.c.sha,'authTransport':'cookie','apiBase':'/api/v1'}, 'Built frontend artifact contract mismatch')
        return {'targetId':self.c.target,'releaseSha':self.c.sha,'healthy':['postgres','backend','frontend'],'runtimeRoleBound':True,'frontendCookieArtifactVerified':True}

    def backup(self):
        self.identity()
        self.c.backup_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        name = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+secrets.token_hex(4)+'.dump'
        path = self.c.backup_dir/name
        cid = self.container('postgres')['Id']
        with path.open('xb') as out:
            os.chmod(path,0o600)
            self.d('exec',cid,'pg_dump','-U',self.c.v['JIAYOU_POSTGRES_OPERATOR'],'-d',self.c.database,'--format=custom','--no-owner','--no-acl',binary=True,output=out,phase='Independent logical backup')
        metadata = {'targetId':self.c.target,'database':self.c.database,'releaseSha':self.c.sha,'schemaVersion':2,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'atUtc':timestamp()}
        write_json(path.with_suffix('.json'),metadata)
        return path

    def restore(self, path, database):
        ident(database)
        require(database.startswith('jiayou_') and database != self.c.database, 'Restore only into another independent database, never overwrite the active database')
        path = Path(path).resolve()
        metadata = json.loads(path.with_suffix('.json').read_text())
        require(metadata['targetId'] == self.c.target and metadata['schemaVersion'] == 2 and hashlib.sha256(path.read_bytes()).hexdigest() == metadata['sha256'], 'Backup identity/checksum mismatch')
        exists = self.sql('SELECT count(*) FROM pg_database WHERE datname='+literal(database)+';')
        require(exists == '0', 'Restore target must not exist; no clean/drop/overwrite behavior')
        self.sql('CREATE DATABASE '+ident(database)+' OWNER '+ident(self.c.v['JIAYOU_MIGRATION_USER'])+' TEMPLATE template0;')
        cid = self.container('postgres')['Id']
        self.d('exec','-i',cid,'pg_restore','--exit-on-error','--single-transaction','--no-owner','--no-privileges','--role',self.c.v['JIAYOU_MIGRATION_USER'],'-U',self.c.v['JIAYOU_POSTGRES_OPERATOR'],'-d',database,data=path.read_bytes(),binary=True,phase='Restore into empty independent database')
        self.identity(database)
        self.grants(database)
        return {'restoredDatabase':database,'targetId':self.c.target,'backupSha256':metadata['sha256'],'activeDatabaseUnchanged':True}

    def rollback(self, manifest):
        receipt = json.loads(Path(manifest).read_text())
        require(receipt.get('targetId') == self.c.target and receipt.get('project') == self.c.project and receipt.get('database') == self.c.database and receipt.get('contract') == 1 and receipt.get('schemaVersion') == 2, 'Rollback manifest target/schema mismatch')
        self.identity()
        for component,value in receipt['images'].items():
            d = json.loads(self.d('image','inspect',value['reference']).stdout)[0]
            require(d['Id'] == value['id'] and d['Config']['Labels'].get('org.opencontainers.image.revision') == receipt['releaseSha'], 'Rollback image identity unavailable/mismatched')
        self.compose('up','-d','--wait','--wait-timeout','240','backend','frontend',env={'JIAYOU_RELEASE_SHA':receipt['releaseSha']},phase='Scoped application artifact rollback')
        # No database downgrade, restore or migration is performed by rollback.
        self.c.v['JIAYOU_RELEASE_SHA'] = receipt['releaseSha'];self.c.sha = receipt['releaseSha']
        self.verify()
        self.c.update('JIAYOU_RELEASE_SHA', receipt['releaseSha'])
        write_json(self.c.state_dir/'build.json',receipt)
        write_json(self.c.state_dir/'release.json',receipt)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env',required=True,type=Path)
    parser.add_argument('command',choices=['secrets','check','ingress','build','provision','initialize','up','verify','backup','restore','restart','rollback','stop'])
    parser.add_argument('--ack-target')
    parser.add_argument('--backup',type=Path)
    parser.add_argument('--database')
    parser.add_argument('--manifest',type=Path)
    parser.add_argument('--recreate',action='store_true')
    args = parser.parse_args()
    try:
        config = Config(args.env)
        if args.command == 'secrets':
            config.make_secrets();print('Independent secret files generated; values suppressed.');return
        release = Release(config,verify_engine=args.command not in ('check','ingress'))
        if args.command == 'check': config.secret_check();release.prepare_config();release.contract()
        elif args.command == 'ingress': release.ingress_contract()
        elif args.command == 'build': release.build()
        else:
            config.ack(args.ack_target)
            if args.command == 'provision': release.provision()
            elif args.command == 'initialize': release.initialize()
            elif args.command == 'up': release.up(args.recreate)
            elif args.command == 'verify': release.verify()
            elif args.command == 'backup': print('Backup created:',release.backup().name)
            elif args.command == 'restore':
                require(args.backup and args.database,'--backup and --database required');release.restore(args.backup,args.database)
            elif args.command == 'rollback':
                require(args.manifest,'--manifest required');release.rollback(args.manifest)
            elif args.command == 'restart':
                release.container('backend');release.container('postgres');release.compose('restart','postgres','backend',phase='Owned service restart');release.up()
            elif args.command == 'stop':
                for service in ('postgres','backend','frontend'):release.container(service)
                release.compose('stop','frontend','backend','postgres',phase='Owned stack stop')
        print('Jiayou '+args.command+' PASS; no production activation or content approval is implied.')
    except ReleaseError as error:
        print('Jiayou operation BLOCKED: ' + str(error), file=__import__('sys').stderr)
        raise SystemExit(1)
    except (ValueError,KeyError,FileNotFoundError,subprocess.TimeoutExpired):
        print('Jiayou operation BLOCKED: invalid/missing input, target, artifact or command failure. Sensitive diagnostics suppressed.',file=__import__('sys').stderr)
        raise SystemExit(1)

if __name__ == '__main__':
    main()
