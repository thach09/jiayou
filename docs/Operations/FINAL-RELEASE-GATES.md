# Production engineering release gates

This candidate is a repository release review, not a public deployment approval.

| Gate | State at candidate preparation | Scope |
| --- | --- | --- |
| PRODUCTION COMPOSE | PASS locally | Private executable contract, roles, secrets, budgets, health/startup |
| CLEAN IMAGE BUILD | PASS locally | Immutable Git source and pinned base digests; actual image IDs in receipt |
| POSTGRESQL BOOTSTRAP | PASS locally | Fresh disposable PG16, unchanged V1/V2, fail-closed negatives, runtime grants |
| HTTPS AUTH E2E | PASS locally | Real verified TLS, cookie browser desktop/mobile and API security |
| DEPLOYMENT REHEARSAL | PASS within stated scope | 21 stages; configuration rollback; cross-version artifacts not yet accepted |
| BACKUP/RESTORE | PASS locally | Logical dump/checksum and absent independent recovery DB; off-host policy pending |
| GITHUB MAIN/CI | BLOCKED pending final integration | PR68 merged normally; owner approved design; final QA head must pass checks and merge before final-main verification |
| HANDOVER TO ANH HƯNG | BLOCKED pending integration | Procedure implemented; immutable merged release SHA/CI receipt still required |
| PUBLIC RELEASE | NO-GO | Host, corpus/rights, artwork, ingress/TLS, backup and product-policy gates remain |

The local pass evidence applies to the exact source in the rehearsal receipt. GitHub must
execute the complete candidate tree before any merge. Main/final checkout must not be
declared updated until remote ancestry, actual SHA and clean tree have been verified.
See [the owner-approved design decisions](SECURITY-DESIGN-APPROVAL.md).
