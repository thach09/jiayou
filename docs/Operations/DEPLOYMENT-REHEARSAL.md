# Disposable production-mode deployment rehearsal

Rehearsed source: `a97b694` (full SHA in [the sanitized receipt](release-engineering-evidence/local-rehearsal.json)).
Executed 2026-11-16 using an existing local Linux-container Docker Desktop engine.
No host login, public networking, provider modification or Ganbarou access occurred.

GitHub reproduction: [initial failed run](https://github.com/thach09/jiayou/actions/runs/43864926619)
stopped during Compose startup after five stages. The driver now explicitly declares
the subnet observed from a new owned Docker allocation probe, supporting Linux engine
static peer addresses without guessing a host subnet. [The subsequent run](https://github.com/thach09/jiayou/actions/runs/43865818781)
passed all 21 stages on a disposable GitHub-hosted Ubuntu runner with TLS and the ordinary
Chromium sandbox enabled. Its exact PR merge-snapshot SHA/image IDs and timings are in
[the GitHub receipt](release-engineering-evidence/github-rehearsal.json). Raw runner
diagnostics were not uploaded; this records the observed failure phase and tested remedy,
not an invented daemon error message. The owned empty allocation probe alone is removed;
all preexisting resources remain outside the driver's mutation scope.

All 21 recorded stages passed: canonical Compose, clean production/browser image builds,
private CA issuance, first PostgreSQL initialization/grants, production-profile startup,
private HTTPS edge, actual API/PG datasource binding, real browser desktop/mobile auth,
real API ownership/CSRF/rotation/revocation, PostgreSQL/backend restart, persisted account/
notebook state, repeated initialize/wrong-target/foreign-schema rejection, logical backup,
atomic restore into an absent database, restored application startup and datasource binding,
real restored account/notebook state, controlled configuration rollback, rollback datasource
binding, and real account/notebook state after rollback.

TLS verification and Chromium sandboxing remained enabled. The disposable CA was trusted
only inside QA containers. Cookie acceptance asserted Secure, HttpOnly, SameSite=Lax and
Path=/api/v1/auth; refresh secrets were absent from JSON/persisted browser storage.
The built frontend receipt proved cookie mode, relative API base and source revision.
Two synthetic API identities verified both notebook aliases and cross-owner rejection.
No learner corpus, administrator, publication approval or academic data was fabricated.

Preexisting container images/configurations were preserved. An unrelated container already
in a restart loop changed its runtime timestamp; this is recorded as an observation and
was never a command target. Original attempts' evidence and all private dumps/fixtures stay
outside Git. Only sanitized receipts are suitable for CI artifacts.

Reproduce from a clean immutable checkout using [deployment/qa/README.md](../../deployment/qa/README.md).
The GitHub rehearsal workflow repeats the full test on its own disposable runner and
uploads only summary.json/commands.json. Inspect the actual run before merge.

Limits: configuration rollback returns to the intact original database without a schema
downgrade. Cross-version artifact rollback still needs two compatible approved releases.
This does not test the Arch host, public DNS/TLS/ingress, laptop capacity/suspend/power,
off-host encrypted backups, real-user recovery/session invalidation, content rights or
full SRS/HSK learning flows against an approved corpus.
