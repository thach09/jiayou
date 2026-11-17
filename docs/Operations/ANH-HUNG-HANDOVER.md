# Anh Hưng: reviewed production engineering source

Repository: https://github.com/thach09/jiayou.
Approved product baseline: https://github.com/thach09/jiayou/commit/60cf1a02892d851adc7d70cfb194bd8371c35ad4.
Merged engineering: [PR68](https://github.com/thach09/jiayou/pull/68) and
[PR69](https://github.com/thach09/jiayou/pull/69), normal merge commits after owner approval and CI.
Immutable release source: [`ad04ffc185a414035088cc631a79e7e325569060`](https://github.com/thach09/jiayou/tree/ad04ffc185a414035088cc631a79e7e325569060).
**Repository handover is ready; production activation still requires separate approval.**

Clone and detach that exact reviewed SHA, then follow [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md):

```sh
git clone https://github.com/thach09/jiayou.git jiayou-release
cd jiayou-release
git checkout --detach ad04ffc185a414035088cc631a79e7e325569060
git status --porcelain=v1 --untracked-files=all
```

Set the external `JIAYOU_RELEASE_SHA` to the same full SHA. All deployment
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

Self-hosting readiness: the stack is private and provider-independent. Before any activation,
discover the existing Arch laptop's actual Docker/systemd/ingress/datasource setup read-only
under separate authorization. Preserve Ganbarou's services, route at heyganba.site, storage,
roles and networks. Reserve Ganbarou/OS/thermal/backup headroom; one laptop is a shared power,
disk and network failure domain. Choose public HTTPS routing only after host evidence.
