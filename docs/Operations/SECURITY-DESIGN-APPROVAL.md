# Production engineering decisions awaiting owner approval

Review [PR68](https://github.com/thach09/jiayou/pull/68) and its dependent HTTPS QA PR.
These are repository implementation decisions, not authorization to operate the Arch host.
Workstream 5 requires owner approval before merge of new security/infrastructure decisions.
Status: **OWNER APPROVED**, 2026-11-16, explicit task response: approve these decisions
and merge only when every applicable CI/provider gate passes. Passing CI alone does not
supply that approval. The approval does not authorize production activation.

1. Independent PostgreSQL16 instance and external volume, a cluster operator, a separate
   migration owner, and a runtime role without schema creation or protected metadata writes.
   V1/V2 and their checksums remain unchanged; no seed admin/curriculum or implicit upgrade.
2. Service-scoped external file secrets; read-only nonroot app containers; explicit resource
   budgets and target/project labels. Compose publishes no host ports. Host-specific values
   remain operator inputs. No existing Ganbarou resource is adopted.
3. Target-bound one-shot bootstrap exits without HTTP; normal startup validates only.
   Production refresh cookies are always Secure and the frontend build must use cookie mode.
4. Additive outer HTTPS ingress with explicit immediate peer trust. Forwarded headers are
   overwritten, spoofed direct HTTP is rejected, management/detail routes are blocked. The
   existing aggregate `/api/v1/health` contract remains accessible through trusted HTTPS so
   the approved UI can report readiness accurately. No public route is activated by this PR.
5. Logical backup outside PGDATA; restore only into an absent independent database; no
   overwrite/repair/clean/downgrade. Restored production activation separately requires a
   session invalidation/key-rotation plan. Rollback verifies complete local image identities.
6. PR65 smoke isolation protections remain; replace its obsolete fixed baseline SHA with
   an explicit immutable source SHA bound to independently inspected disposable API/PG
   evidence. Add sessionStorage checks and real TLS/browser/API/recovery tests. No TLS or
   Chromium sandbox bypass; no production account creation; sanitized CI artifacts only.

No visual components, dependency versions, SQL migrations or publication policy change.
Public release remains NO-GO pending host/ingress/capacity/off-host backup acceptance,
curriculum/content rights, artwork provenance and account-recovery/privacy/legal decisions.
