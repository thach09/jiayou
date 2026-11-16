# Production Compose validation

Baseline: `60cf1a02892d851adc7d70cfb194bd8371c35ad4` (PR66/67).
Container/bootstrap candidate: [PR68](https://github.com/thach09/jiayou/pull/68).
The production operator procedure is [PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md).

New local validation on 2026-11-16:

| Check | Actual result |
| --- | --- |
| Canonical Compose/static contract | PASS; no services started by validator |
| Release safety unit tests | 12 PASS, including foreign volume, target ACK, non-activating ingress, stopped-stack startup and incomplete rollback rejection |
| Maven clean verify | 566 total, 558 PASS, 8 opt-in SKIP, no failures/errors |
| Secure-cookie guard class | 22 PASS |
| Runtime dependency audit | 104 audited; two existing reachability exceptions retained |
| Node24 npm ci / full npm audit | PASS; zero vulnerabilities |
| npm audit --omit=dev | PASS; zero vulnerabilities |
| Frontend lint / normal build | PASS |
| Frontend tests | 323 Vitest + 19 Node PASS |
| Clean production image build | PASS from canonical Git source; pinned bases and actual IDs recorded |
| Real PostgreSQL/HTTPS/recovery | PASS in the explicitly scoped local rehearsal; see below |

The eight default backend skips are the opt-in PostgreSQL schema/bootstrap rehearsals;
the dedicated GitHub jobs must execute their actual database cases. The manually gated
legacy production source-history preflight intentionally does not run automatically.
No source check is proof of a live legacy database's compatibility.

Existing runtime exceptions: Spring MVC6.2.19 `GHSA-j9f9-w8pj-32f8` (SSE view fragments
disabled) and `GHSA-pc63-qcmh-9cmg` (XsltView disabled). No advisory suppression or dependency
upgrade is added. Existing Actions Node20/action-runtime deprecation and Node deprecation
warnings must be reported with the actual GitHub runs; they are not silently resolved here.

Docker Desktop was already running; no daemon was started. A new labelled UUID/project,
external volume and private networks were allocated per rehearsal. No database or app
host port was published. Three original QA attempts were retained as failures: Windows
BOM/CRLF packaging; a fetch-normalized Host header in a negative test; and rewriting a
read-only evidence file on Windows. Each was corrected, then a fresh full run executed.
The fourth clean run passed 21 stages. These are disposable-target results, not Arch host
or public production acceptance. See [DEPLOYMENT-REHEARSAL.md](DEPLOYMENT-REHEARSAL.md).
