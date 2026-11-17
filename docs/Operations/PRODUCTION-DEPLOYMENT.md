# Jiayou production deployment - executable contract v1

This is the canonical deployment path: `docker-compose.yml` plus `deployment/jiayou.py`.
Build locally from one clean, immutable Git commit. No registry publishing is required.
V8.1 is already approved/merged through PR66/67; do not re-merge historical UI branches.
Actual activation on the shared Arch host still requires separate owner authorization.

Reviewed immutable release source after [PR68](https://github.com/thach09/jiayou/pull/68)
and [PR69](https://github.com/thach09/jiayou/pull/69):
[`ad04ffc185a414035088cc631a79e7e325569060`](https://github.com/thach09/jiayou/commit/ad04ffc185a414035088cc631a79e7e325569060).
The subsequent handover receipt is documentation only; it does not change application or
deployment source. See [release gates](FINAL-RELEASE-GATES.md) and the short
[Anh Hưng handover](ANH-HUNG-HANDOVER.md). Actual deployment remains unauthorized.

## Required host-owned inputs

Prepare Git, Python >=3.12, a Linux Docker engine with Compose, sufficient measured
CPU/RAM/PID/disk budgets, and protected external configuration/secret/backup directories.
Docker privileges are host-administrative privileges. Do not run this on an unverified
remote context or an unrelated application project. The tool accepts explicit local
unix/npipe contexts only; it does not SSH, discover or modify the Arch host.

Discover the actual Ganbarou ingress/services/datasource privately before activation.
Choose a distinct Jiayou hostname, non-overlapping application subnet, reserved frontend
address and narrowly scoped immediate ingress peer CIDRs. Do not invent these values.
Tailscale is private administration, not proof of public reachability. Keep Ganbarou's
existing 80/443 listeners, database, roles, networking and volumes unchanged.

Copy `.env.example` to an absolute path outside the checkout and fill every required
value. Values are literal, unquoted, without shell expansion. Set three distinct roles
(operator, migration owner, runtime); one canonical target UUID; database name beginning
`jiayou_`; project beginning `jiayou-`; volume `<project>_database`; external network
`<project>_application`. The external network subnet and frontend address must match.
The exact public origin is HTTPS with no trailing slash; it must not be heyganba.site.

Each secret directory is private (0700 on Linux). Files `operator_password`,
`migration_password`, `runtime_password` contain distinct random Base64url strings
>=32 characters without newline; `jwt_key` contains Base64 of >=32 random bytes.
Compose mounts only the individual required files read-only into each service.
Non-root readability is provided by file mode 0444 within the private parent directory;
Compose file secrets are bind mounts, not an encrypted secret store. Protect the host,
Docker access and encrypted off-host secret backups. Never put passwords/keys in env files,
VITE variables, Git, image build args, process arguments or public diagnostics.

## Clone, configure and build

Use the exact reviewed release SHA from the release handover, never an old local branch:

```sh
git clone https://github.com/thach09/jiayou.git jiayou-release
cd jiayou-release
git checkout --detach <REVIEWED_FULL_RELEASE_SHA>
git status --porcelain=v1 --untracked-files=all
# Set JIAYOU_RELEASE_SHA in the external env file to that same full SHA.
python3 deployment/jiayou.py --env /absolute/external/release.env secrets
python3 deployment/jiayou.py --env /absolute/external/release.env check
python3 deployment/jiayou.py --env /absolute/external/release.env build
```

`secrets` is an optional first-time generator and refuses to overwrite existing files.
`check` renders the peer contract and validates Compose without starting services.
`build` requires a clean matching checkout, exports only tracked canonical Git source,
uses digest-pinned multi-platform bases, locks npm with `npm ci`, pins Maven 3.9.11/JDK21,
and fixes JAR timestamps to the source commit time. Tags are `jiayou-backend:<SHA>` and
`jiayou-frontend:<SHA>`; external `build.json` records actual immutable local image IDs.
No Docker registry push occurs. Retain previous tested images; do not prune them.
Production frontend build rejects cookie mode false and emits an inspectable build receipt.
Runtime env cannot change Vite flags in an already-built image.

## Explicit first bootstrap

Replace `<TARGET_UUID>` below with the exact configured UUID. Initialization is a deliberate
operator action against a positively verified empty independent database. The owner must
have authorized this target; a URL or localhost alone is not isolation evidence.

```sh
python3 deployment/jiayou.py --env /absolute/external/release.env provision --ack-target <TARGET_UUID>
python3 deployment/jiayou.py --env /absolute/external/release.env initialize --ack-target <TARGET_UUID>
python3 deployment/jiayou.py --env /absolute/external/release.env up --ack-target <TARGET_UUID>
python3 deployment/jiayou.py --env /absolute/external/release.env verify --ack-target <TARGET_UUID>
```

Provisioning refuses existing resources without matching project/product-contract/target
labels. It never adopts shared Ganbarou storage or networking. PostgreSQL creates only its
configured operator/database. Initialization checks emptiness, creates two non-superuser
roles without overwriting credentials, transfers database ownership to the migration role,
then invokes the same backend image with `--jiayou-bootstrap-only`. This process imports
only datasource/Flyway configuration, runs the existing JiayouBootstrapGuard and pinned
V1/V2, closes its pool and exits; it starts no HTTP server. No admin/curriculum is seeded.

The runtime role receives application DML/sequence use and read-only access to roles,
identity and schema history; it cannot create objects or mutate protected metadata.
Runtime has no operator/migration password mount. Normal startup remains validate-only;
repeated initialize, wrong target, unsupported schema and migration overrides fail closed.
No repair, baseline, clean, legacy import or implicit upgrade command exists in this tool.
A future versioned migration requires its own review and explicitly authorized rollout.

## HTTPS additive ingress

Canonical services publish no host ports. Database uses only its internal Docker network.
Attach a separately reviewed HTTPS route to the frontend through the dedicated application
network, or a separately authorized loopback binding after existing port ownership is known.
Do not replace Ganbarou's proxy and do not publish PostgreSQL/backend/management ports.

The outer TLS ingress must overwrite Host with the Jiayou host (preserving a nonstandard
port when applicable), X-Forwarded-Proto with literal `https` and X-Forwarded-For with the
actual client address. Strip Forwarded/X-Real-IP/CF-Connecting-IP from untrusted requests.
Forward only from the immediate peers declared in JIAYOU_INGRESS_PEERS. The generated
Nginx peer map accepts HTTPS assertions only from those physical peers; backend trusts
only the reserved frontend IP/32. Host mismatches and untrusted API forwarding are rejected.
Do not use /0 or broad catch-all proxy trust. Reserve the frontend IP across restarts.

```sh
python3 deployment/jiayou.py --env /absolute/external/release.env ingress
```

This renders `jiayou-nginx-location.conf` outside Git for review inside the separately
approved HTTPS virtual host. It contains no listen/certificate/DNS/activation directives.
A host Nginx must be able to reach the dedicated frontend bridge address; a containerized
ingress needs a separately authorized attachment to Jiayou's dedicated application network.
Never attach Jiayou to Ganbarou's application/database network merely for convenience.
If the actual ingress is Caddy/Tunnel/another proxy, preserve the same exact host/header/
peer/private-upstream contract and review that implementation before activation. QA uses
an independent Nginx TLS edge to test this same forwarding pattern.

Block `/api/v1/actuator`, health subpaths and `/_jiayou_health` at the public edge.
Allow exactly `/api/v1/health`, the existing public aggregate readiness response used
by the UI (UP/DOWN, service/version/time; no datasource/component details). Internal
container probes still use private actuator. `/api/v1` stays same-origin; no external
production API is embedded in the frontend. Preserve no-store on auth/API responses.
TLS certificates/renewal, hostname ownership and any Cloudflare Tunnel connector are
host-owned inputs. Review the exact additive ingress diff, validation and rollback before
activation; this repository never takes host 80/443 ownership automatically.

## Verification and restart

`verify` checks real health, labels, target identity/history, actual runtime-role datasource
connections and the built frontend cookie receipt. Independently validate real HTTPS using
normal certificate validation, then registration/login, Secure/HttpOnly/SameSite=Lax/
Path=/api/v1/auth cookies, refresh, reload recovery, logout/revocation, CSRF/origin checks
and notebook ownership. Run PR65's fail-closed smoke only against verified disposable QA.
An empty independent schema has no authorized learner corpus; empty-state/API health is
not full learning-feature/content acceptance.

```sh
python3 deployment/jiayou.py --env /absolute/external/release.env restart --ack-target <TARGET_UUID>
python3 deployment/jiayou.py --env /absolute/external/release.env verify --ack-target <TARGET_UUID>
```

Restart is scoped to this labelled project's PostgreSQL/backend. Named storage persists.
Health ordering gates startup, not permanent recovery. A sleeping laptop, disk/power/network
failure or exhausted shared host cannot be repaired by restart policies. Budget with
Ganbarou/OS/backup/thermal headroom before choosing limits.

## Independent backup and empty-target restore

```sh
python3 deployment/jiayou.py --env /absolute/external/release.env backup --ack-target <TARGET_UUID>
python3 deployment/jiayou.py --env /absolute/external/release.env restore --ack-target <TARGET_UUID>   --backup /absolute/external/backups/<STAMP>.dump --database jiayou_recovery_<SUFFIX>
```

Custom-format logical dumps and target/schema/hash receipts live outside Git and PGDATA.
They contain sensitive user data/password hashes: keep mode 0600 in a private directory,
encrypt before off-host transfer, define recipient/storage/RPO/RTO/retention and verify
freshness. This tool does not upload to an unspecified external destination. Same-volume
copies alone are not a production backup policy. Back up roles/config/secrets independently.

Restore verifies the hash and logical target UUID, creates only an absent independent
recovery database, restores atomically without clean/drop/overwrite, reapplies least-privilege
grants and verifies identity/history. It never changes the active database selection.
Use a separately reviewed recovery env pointing at the restored database to start validation
and verify users/notebooks/counts/FKs/publication states. Record recovery time. Before any
restored production activation, explicitly plan session invalidation/key rotation: restoring
old auth data can resurrect sessions revoked since the snapshot. Changing a file secret
requires backend recreation; it is not a hot-reload mechanism. No live restore is authorized
by these development tests.

## Updates and rollback

Back up first. Clone/check out the next reviewed immutable commit, build and verify its
images, keep the same explicit target/private resources and run validate-only up. New schema
work is separate; no automatic downgrade or migration is performed. Keep external state and
known-good manifests. To roll back to a tested compatible image set:

```sh
python3 deployment/jiayou.py --env /absolute/external/release.env rollback   --ack-target <TARGET_UUID> --manifest /absolute/external/state/previous-release.json
python3 deployment/jiayou.py --env /absolute/external/release.env verify --ack-target <TARGET_UUID>
```

Rollback checks target, schema-contract version and exact local image IDs/revisions before
recreating only this application. It never restores/downgrades the database. Cross-version
rollback requires the prior image set to be compatible with the current V1/V2 lineage and
actually rehearsed. Never fall back to a historical Heyganba/Japanese image. Keep the
external env release SHA aligned with the selected manifest for subsequent commands.

## Independent release gates

Actual host discovery/capacity/ingress/TLS/off-host backup acceptance, artwork provenance,
academic/curriculum/publication rights, legal/account-recovery decisions and public release
remain separate. No fake APPROVED rows/receipts are created. No Ganbarou account, notebook,
SRS/exam/streak history or production secret is reused. Vercel/Render are not Jiayou's intended
production hosts; Git auto-deploy isolation must remain verified before any source release.
No deployment follows automatically from a PR/main merge.
