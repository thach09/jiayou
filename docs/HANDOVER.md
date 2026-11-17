# Jiayou — handover to anh Hưng

Reviewed production engineering source: [`ad04ffc185a414035088cc631a79e7e325569060`](https://github.com/thach09/jiayou/tree/ad04ffc185a414035088cc631a79e7e325569060),
merged through PR68/69. Start with the short [operator handover](Operations/ANH-HUNG-HANDOVER.md)
and [release gates](Operations/FINAL-RELEASE-GATES.md). Engineering handover does not authorize
host access, production activation or public content publication.

Ganbarou remains a separate running application at heyganba.site. The owner confirms
this repository is not a source/update dependency of that running laptop deployment.
No host login, deployment, public route, DNS change or live DB write is part of repository
handover. Jiayou has no selected domain and must use its own hostname and stack.

## Source and build contract

The repository is https://github.com/thach09/jiayou. The owner-approved V8.1 visual
scope was integrated through [PR66](https://github.com/thach09/jiayou/pull/66).
`frontend/DESIGN.md` is the current visual contract; its dated V8.1 section takes
precedence over retained earlier design notes. The fixed dark theme, compact streak,
expanded 365-day tracker, account/sidebar/artwork and station companion-dock removal
do not change backend qualification, restoration, ownership or publication controls.
All HSK levels remain selectable; the detail link opens the selected level.
PR62 security and PR65 fail-closed HTTPS smoke checks remain intact. Browser visual
fixtures do not establish real HTTPS/PostgreSQL authentication or production readiness.
Earlier dashboard, streak and account acceptance remains historical evidence in
`docs/Operations/JIAYOU-DASHBOARD-STREAK-RELEASE.md`.
The earlier brand/account baseline is `docs/Operations/LOCAL-UX-AND-ACCOUNT-QA.md`. Also read
`docs/Operations/FINAL-ENGINEERING-AUDIT.md` and its evidence index for the reviewed
release; verify the current main SHA with Git, not an uncommitted research worktree.
Frontend lives in frontend/, backend in
backend/, immutable SQL under backend/src/main/resources/db/, CI in .github/workflows/,
current operations guidance in docs/Operations/. Historical reports are not release gates.

Use Node24, JDK21, Maven3.9 and PostgreSQL16. In frontend run npm ci, full npm audit,
npm run lint, npm run build and npm test. In backend run mvn -B clean verify and the
runtime dependency audit. PostgreSQL and bootstrap rehearsals use disposable loopback
fixtures only; see the independent bootstrap guide and the dedicated CI job.

The backend artifact is jiayou-backend-0.0.1-SNAPSHOT.jar. Frontend output is frontend/dist.
Build images only from the final clean clone with its lockfile. The Dockerfiles and
Compose pin upstream image digests; application images are labelled/tagged with the full
source SHA and their actual local IDs recorded externally. The target laptop's hardware
budgets remain operator inputs. Follow [the executable production procedure](Operations/PRODUCTION-DEPLOYMENT.md).

## Production profile and initialization

Default/required Jiayou profile is jiayou-prod. Explicit product, production environment,
target UUID, datasource coordinates/role/secret, JWT key, HTTPS CORS origin and target-bound
authorization are mandatory. Missing/misspelled Jiayou settings fail closed. Never use
the legacy prod profile to make startup pass. No default administrator or curriculum is
created; review-status constraints block APPROVED publication in this initial lineage.

Read [the full contract](Operations/jiayou-independent-bootstrap.md) before bootstrap.
One-time initialize requires an explicitly approved empty new target and acknowledgement;
it installs pinned V1 + V2. An existing Jiayou V1 needs the explicitly authorized,
target/version-bound 1→2 upgrade; ordinary starts remain validate-only and refuse
to upgrade implicitly. No repair/baseline/clean, legacy history import or arbitrary
content SQL is authorized. PR48's source-history checker remains available as an explicit
read-only manual CI check; it is not a first-bootstrap or live-schema authorization.

## Shared Arch Linux + Docker boundary

The owner confirms Ganbarou already runs on the Arch laptop and Tailscale is administrative
access. Keep Ganbarou untouched. Use a distinct Compose project, images, secrets, networks,
DB instance/roles/history and external volume; never reuse its database or Compose project.
No database or backend host port is published by the canonical stack. The frontend is also
private until an explicitly approved ingress adapter is configured. No actual domain,
host port, subnet, storage path or TLS proxy choice is embedded here.

Measure shared CPU/RAM/disk/thermal/backup peaks before filling resource variables; reserve
Ganbarou and OS headroom. External volumes must be provisioned deliberately and not deleted
by rollout/rollback. Image/user/project names are Jiayou-scoped; avoid global container_name.
The same physical laptop remains a common power/disk/kernel/network failure domain.

`deployment/jiayou.py` and docker-compose.yml provide the executable procedure, not host
deployment authorization. Normal backend startup validates only. The one-shot bootstrap
uses a migration owner distinct from both the cluster operator and runtime role, applies
the existing pinned V1/V2 through the existing guard, and exits without an HTTP listener.
No curriculum or admin seed is installed. Secrets are external service-scoped read-only
files imported through Spring configtree, never plaintext environment values or build args.
Protect their private parent directory and Docker access; local Compose secrets are bind
mounts, not an encrypted vault. Do not commit actual .env files or recovery dumps.

The frontend proxies same-origin /api/v1. The existing aggregate `/api/v1/health` readiness
response is allowed only through the trusted HTTPS ingress; actuator/detail routes remain
blocked. An outer
HTTPS proxy or optional Cloudflare Tunnel must sanitize forwarded headers and set trusted
peer CIDRs, cookies, TLS/renewal, body/time limits and cache exclusions. Do not infer public
connectivity from Tailscale. Discover the existing ingress before planning any additive route;
do not replace the Ganbarou proxy or contend for its ports. Health/dependency checks are
startup gates, not guarantees of continuous recovery. Restart policies cannot wake a sleeping
host, restore a failed disk or make an unapproved schema compatible.

## Backups and later activation sequence

1. Select Jiayou's hostname and confirm shared-host capacity/ingress/storage ownership.
2. Provision dedicated roles, external volume and immutable images/secrets in a separately
   authorized host task. Define an initial bootstrap invocation and switch to validate mode
   afterward; the bootstrap command exits, while the application is a long-running server.
3. Define RPO/RTO/retention; schedule encrypted logical backups plus required role metadata,
   retain copies off the laptop, monitor freshness/disk and test restore to a separate empty
   target. Verify migration checksums, row/FK integrity, content statuses and application reads.
   A live PGDATA copy or backup in the same data volume is insufficient.
4. Rehearse full bootstrap/restart/restore and guest/auth/ownership/SRS/admin behavior in an
   isolated environment. Keep pending curriculum hidden; no synthetic completeness claims.
5. Review the exact ingress/TLS/Tunnel diff and rollback, then obtain activation approval.
   Rollback only Jiayou routes/services/artifacts; never remove volumes or touch Ganbarou data.

## CI/CD and known limitations

CI is validation-only, with contents:read permissions; it does not deploy to Render,
Vercel or the laptop. The legacy Render hook workflow is archived, not invoked, and stored
production secrets are not deleted merely for cleanup. Vercel Git disconnection/provider
isolation must be confirmed in the final report; vercel.json also disables Git deployments.
Do not reconnect old integrations automatically after the repository rename.

Future deployment should be a separate explicit operator approval against an immutable
reviewed main artifact, after all required CI/audits pass. No push/main merge should itself
deploy to the laptop. Repository rename redirects are not evidence that integrations or
image references have been updated safely.

No legacy users, notes, SRS/exam history or rewards are transferred. Curriculum/provenance
work retained on the archive branch/private backup needs separate review and content rights;
do not cherry-pick publication migrations merely because tests pass. The new bootstrap
intentionally has no learner-visible corpus and no default administrator. Full teaching
coverage, account recovery/email, privacy/legal policy and production performance still need
owner decisions. Remaining compatibility identifiers are listed in Operations/legacy-identifiers.md.
