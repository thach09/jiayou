# Anh Hưng: production engineering candidate

Repository: https://github.com/thach09/jiayou.
Approved product baseline: https://github.com/thach09/jiayou/commit/60cf1a02892d851adc7d70cfb194bd8371c35ad4.
Container/bootstrap review: https://github.com/thach09/jiayou/pull/68.
**Do not deploy this unmerged candidate. Final immutable merged release SHA is pending.**

After integration, clone and detach the exact reviewed SHA named in the final release
receipt, then follow [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md). All deployment
source is in Git; private Windows evidence is not required to execute the procedure.

Operator must supply: separately selected Jiayou hostname/origin; verified existing
ingress/TLS arrangement; non-overlapping private subnet/frontend IP/immediate peers;
dedicated project/target UUID/database/three role names; private external config/secrets/
state/backup locations; measured CPU/RAM/PID/disk limits and JVM heap; encrypted off-host
backup destination, RPO/RTO/retention/restore/session-invalidation policy. Never use Ganbarou
secrets, datasource, volume or network. Tailscale is administrative access only.

Sequence: verify host capacity and ownership read-only under separate authorization;
build clean immutable images; provision isolated resources; explicitly initialize once;
start validate-only services; verify built cookie artifact/health; review an additive HTTPS
route without replacing Ganbarou; authorize activation separately; run real smoke and
backup/restore acceptance. Retain known-good images/manifests and keep storage untouched
on rollback. No main push or merge automatically deploys this stack.

Local disposable rehearsal passed; host/public/curriculum/artwork/policy gates remain.
Cross-version artifact rollback requires a separate rehearsal with two approved releases.
