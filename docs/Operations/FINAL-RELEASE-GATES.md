# Production engineering release gates

Reviewed release source: `ad04ffc185a414035088cc631a79e7e325569060`, merged through PR68/69.
This is repository release acceptance, not public deployment approval.

| Gate | Release result | Scope |
| --- | --- | --- |
| PRODUCTION COMPOSE | PASS | Local and GitHub private executable contract, roles, secrets, budgets, health/startup |
| CLEAN IMAGE BUILD | PASS | Immutable Git source and pinned base digests; actual image IDs in receipts |
| POSTGRESQL BOOTSTRAP | PASS | Disposable PG16, unchanged V1/V2, fail-closed negatives, runtime grants |
| HTTPS AUTH E2E | PASS | Real verified TLS, cookie browser desktop/mobile and API security, local and GitHub |
| DEPLOYMENT REHEARSAL | PASS within stated scope | 21 stages; configuration rollback; cross-version artifacts not yet accepted |
| BACKUP/RESTORE | PASS in disposable QA | Logical dump/checksum and absent independent recovery DB; off-host policy pending |
| GITHUB MAIN/CI | PASS | Approved PR68/69 merged normally; exact release-main check receipt linked below |
| HANDOVER TO ANH HƯNG | READY for engineering handover | Exact GitHub source SHA and executable procedure; actual host activation separately gated |
| PUBLIC RELEASE | NO-GO | Host, corpus/rights, artwork, ingress/TLS, backup and product-policy gates remain |

Evidence: [release main CI](release-engineering-evidence/release-main-ci.json),
[real rehearsal](DEPLOYMENT-REHEARSAL.md), [validation](PRODUCTION-COMPOSE-VALIDATION.md).
The local pass applies to its exact recorded source; GitHub independently executed the
complete merged source. The manual legacy production preflight is intentionally SKIP.
Default H2/PG suites have eight opt-in skips, exercised by dedicated bootstrap/schema jobs;
the separate historical dictionary audit retains one documented skip.
See [the owner-approved design decisions](SECURITY-DESIGN-APPROVAL.md).

Public release blockers: independently authorized read-only Arch discovery/capacity and
actual Ganbarou datasource identification; selected separate hostname and reviewed additive
HTTPS/renewal/Tunnel routing; off-host encrypted backup destination, schedule, RPO/RTO and
restore/session-invalidation acceptance; approved curriculum/content and artwork rights;
account-recovery/privacy/legal decisions. Tailscale does not prove public reachability.
No host/provider/DNS/production database changes or deployment occurred.

The optional additional two-image artifact rollback attempt was interrupted before a receipt
was produced; the local Docker daemon was unavailable on 2026-11-17 and was not started.
It is BLOCKED, not PASS. The completed 21-stage local/GitHub rehearsals prove configuration
rollback to the intact original database. Cross-version artifact compatibility remains a
per-release gate requiring two compatible approved releases; no database downgrade is offered.
