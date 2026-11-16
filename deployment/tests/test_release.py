import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

spec=importlib.util.spec_from_file_location('jiayou_release',Path(__file__).resolve().parents[1]/'jiayou.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class ReleaseSafetyTest(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  self.values={k:'fixture' for k in module.REQUIRED}
  self.values.update(JIAYOU_DOCKER_CONTEXT='default',JIAYOU_RELEASE_SHA='a'*40,JIAYOU_COMPOSE_PROJECT='jiayou-safety-fixture',JIAYOU_TARGET_ID='ac023fee-43f0-4eab-a025-1c6f20c337cf',JIAYOU_DATABASE_NAME='jiayou_fixture',JIAYOU_DATABASE_USER='jiayou_app',JIAYOU_MIGRATION_USER='jiayou_migrator',JIAYOU_POSTGRES_OPERATOR='jiayou_operator',JIAYOU_DATABASE_VOLUME='jiayou-safety-fixture_database',JIAYOU_APPLICATION_NETWORK='jiayou-safety-fixture_application',JIAYOU_APPLICATION_SUBNET='172.30.240.0/24',JIAYOU_FRONTEND_IP='172.30.240.10',JIAYOU_PUBLIC_HOST='fixture.invalid',JIAYOU_PUBLIC_ORIGIN='https://fixture.invalid',JIAYOU_INGRESS_PEERS='172.30.240.11/32',JIAYOU_JAVA_TOOL_OPTIONS='-Xms64m -Xmx128m')
  for key in module.REQUIRED:
   if key.endswith('_MEMORY_LIMIT'):self.values[key]='256m'
   if key.endswith('_CPU_LIMIT'):self.values[key]='0.5'
   if key.endswith('_PIDS_LIMIT'):self.values[key]='128'
  for key in ('JIAYOU_SECRETS_DIR','JIAYOU_CONFIG_DIR','JIAYOU_STATE_DIR','JIAYOU_BACKUP_DIR'):self.values[key]=(self.root/key).as_posix()
  self.env=self.root/'release.env'
 def config(self,**overrides):
  values={**self.values,**overrides};self.env.write_text('\n'.join(k+'='+v for k,v in values.items()),encoding='utf-8');return module.Config(self.env)
 def test_missing_input_names_are_reported_without_values(self):
  self.env.write_text('JIAYOU_DOCKER_CONTEXT=default\n');
  with self.assertRaisesRegex(module.ReleaseError,'Missing mandatory deployment inputs'):module.Config(self.env)
 def test_foreign_project_volume_origin_and_broad_trust_rejected(self):
  for values in [{'JIAYOU_COMPOSE_PROJECT':'ganbarou'},{'JIAYOU_DATABASE_VOLUME':'shared'},{'JIAYOU_PUBLIC_HOST':'heyganba.site','JIAYOU_PUBLIC_ORIGIN':'https://heyganba.site'},{'JIAYOU_INGRESS_PEERS':'0.0.0.0/0'},{'JIAYOU_DATABASE_USER':'jiayou_migrator'},{'JIAYOU_FRONTEND_IP':'10.0.0.10'},{'JIAYOU_JAVA_TOOL_OPTIONS':'-Xms64m -Xmx1024m'}]:
   with self.subTest(values=values),self.assertRaises(module.ReleaseError):self.config(**values)
 def test_independent_secret_files_never_overwritten(self):
  c=self.config();c.make_secrets();before={p.name:p.read_bytes() for p in c.secret_dir.iterdir()};c.secret_check()
  with self.assertRaises(module.ReleaseError):c.make_secrets()
  self.assertEqual(before,{p.name:p.read_bytes()for p in c.secret_dir.iterdir()})
 def test_existing_foreign_volume_rejected_before_any_mutation(self):
  c=self.config();c.make_secrets();r=object.__new__(module.Release);r.c=c
  r.d=Mock(return_value=Mock(returncode=0,stdout=json.dumps([{'Labels':{'io.jiayou.target':'foreign'}}])))
  with self.assertRaisesRegex(module.ReleaseError,'ownership'):r.provision()
  self.assertEqual(r.d.call_count,1);self.assertEqual(r.d.call_args.args[:2],('volume','inspect'))
 def test_target_ack_required(self):
  c=self.config()
  with self.assertRaises(module.ReleaseError):c.ack('wrong')
  c.ack(c.target)
 def test_ingress_config_only_trusts_supplied_peer(self):
  c=self.config();r=object.__new__(module.Release);r.c=c;r.prepare_config();text=(c.config_dir/'trusted-ingress.conf').read_text()
  self.assertIn('172.30.240.11/32',text);self.assertIn('default 0;',text);self.assertNotIn('0.0.0.0/0',text)
 def test_restore_never_overwrites_active_database(self):
  c=self.config();r=object.__new__(module.Release);r.c=c;r.d=Mock()
  with self.assertRaisesRegex(module.ReleaseError,'another independent'):r.restore(self.root/'absent.dump',c.database)
  r.d.assert_not_called()
 def test_command_failure_suppresses_raw_output(self):
  import sys
  with self.assertRaises(module.ReleaseError)as error:module.run([sys.executable,'-c',"import sys;print('DO_NOT_LOG_SECRET');sys.exit(7)"],phase='fixture')
  self.assertNotIn('DO_NOT_LOG_SECRET',str(error.exception));self.assertIn('exit 7',str(error.exception))

if __name__=='__main__':unittest.main()
