# Jiayou repository review and safe P2 candidate — 13/11/2026

## Decision and source identity

**VERIFIED: the two November 8 P2 fixes exist locally, apply cleanly to current
remote main, and pass the checks below.** No duplicate implementation was written.
Four backend regression cases and two frontend cases were added to cover the
acceptance gaps. No additional production-code change was necessary after review.
This is an uncommitted review candidate, not a release or production-readiness claim.

| Item | Current evidence / state |
| --- | --- |
| Repository | VERIFIED `https://github.com/thach09/jiayou.git`; GitHub default branch `main`, public, not archived |
| Remote main / candidate HEAD | VERIFIED `acfd49e7de6bf0daf7983bfa1c66abc5b73e0e85`; public GitHub branch API confirms `protected: true` |
| Local main | `ce80be4b9adf780aee2bb387bb26e93770df7243`, two commits behind remote; deliberately not moved |
| Source worktree | `D:\GitHub\jiayou-ui-refinement`, `Update_UI/UX-Refinement`, clean at `530b4f2da17357200b9261e2771ed7d27fd35bf1` |
| Original fix | VERIFIED `e812976` (`fix(security): validate password bytes and protect notebook alias`), parent `b7038f4585fdd004f786e9674abbaa1139e5883b` |
| Candidate | `D:\GitHub\jiayou-audit-review`, branch `review/jiayou-master-audit-fixes`, based directly on the remote main SHA above; no upstream, no new commit |
| Candidate changes | Seven tracked files modified and six new source/test files, plus this report and sanitized review evidence; deliberately left unstaged |
| Remote UI Master | VERIFIED `a44e175c87272aed82ac3253d801a3dcd2758647`; diverges from main, six ahead / one behind; not merged or reset |
| Remote refinement | No such ref in the live `git ls-remote --heads origin` result; source branch is local only |
| Original November 8 report | VERIFIED at source worktree `docs/Operations/MASTER-PRODUCT-SECURITY-AUDIT-20261108.md`, committed in `530b4f2`; private evidence directory also exists |

The full refinement diff is 85 files ahead of remote main. This candidate instead
copies only the original 13-file P2 commit as an uncommitted patch. Before adding
tests, all 13 files matched that commit's content after line-ending normalization.
UI layout, PRODUCT/DESIGN, other branch histories and historical SQL were not imported.
There is no new candidate commit SHA: **HEAD identifies its base, not its full diff**.
The evidence manifest records SHA-256 values for the review files.

Inspection covered the required AGENTS/product/design/handover/audit/bootstrap documents,
the three workflows, auth/session/error handling, notebook controller/service ownership,
regression suites, pinned Flyway resources and Docker/Compose/proxy contracts. The main
tree inventory contains 1,009 tracked files, including 223 backend Java files, 78 backend
test files, 89 frontend source files, 51 frontend test files and 28 DB resources. These
counts precede the candidate additions; they are not feature-coverage claims. Untracked
and ignored directories in every worktree were inventoried privately. Existing ignored
environments/caches/build artifacts were not deleted or mistaken for a clean-room build;
new Node dependencies were installed by `npm ci` and backend verification used a new output
directory. New Python caches were retained outside the checkout after the tests.

## Reproduced findings and retained fixes

### MASTER-01 — P2: BCrypt UTF-8 byte boundary

The separate, disposable main-source reproduction ran the same ten focused backend
tests against unmodified main. Seven tests failed as expected, including all password
boundary failures and guest notebook access; three passed. See
[the sanitized baseline result](repository-review-20261113/baseline-p2-reproduction.json).

The password cases prove that a 25-Han-character / 75-byte value reaches an encoder
failure on registration/password replacement, while a valid 72-byte prefix plus a
suffix can be accepted by password matching. The latter also affects current-password
reauthentication and admin 2FA reset. It requires knowledge of the valid prefix; this
is not evidence of arbitrary-account access without credentials.

The retained reusable Jakarta validator rejects values above 72 UTF-8 bytes before
controller/service execution. Register, login, both change-password fields and admin
confirmation use it; the frontend helper applies the same byte boundary before POST.
BCrypt encoder, stored hashes, existing character-length rules and token protocol remain
unchanged. Exactly 72 bytes are accepted when the existing character rules also hold:
24 Han characters and 18 four-byte emoji are tested. This does not raise the existing
50-character registration/replacement policy to permit 72 ASCII characters.

New regressions verify emoji, rejection of an overlong current password without hash
or session changes, and admin rejection without disabling 2FA or clearing its secret.
Exact-boundary admin confirmation still succeeds. Frontend login/current-password
rejections make no API request or session-change callback. Existing tests cover invalid
replacement invariance and successful replacement revoking the old session.

### MASTER-02 — P2: legacy private notebook matcher

The broad public `/vocab/**` matcher previously admitted the private notebook alias;
its controller then dereferenced an absent principal and returned 500. No private-data
disclosure was observed in these probes. The retained explicit authenticated matcher
for `/vocab/notebooks` and `/vocab/notebooks/**` precedes the public matcher.

Regression coverage exercises nine actual operations under each alias (18 guest
requests): list/detail/create/delete, item add/update/remove, clone and practice result.
Guests receive 401 before controller execution. Owner create/read/delete works; another
user cannot read/delete, add/remove/edit items, practice against or clone a private
notebook. Both alias paths resolve the same owned record. Denials preserve owner data.
Public catalog GET remains 200. No new approved vocabulary fixture was added to make
an item-write test appear successful; existing service/historical tests cover that path.

## Changed source/test files

The following is the complete code/test scope relative to main; documentation and
sanitized result files are listed in the review manifest alongside it.

- `backend/src/main/java/com/heyganba/common/validation/BcryptPassword.java` — new annotation.
- `backend/src/main/java/com/heyganba/common/validation/BcryptPasswordValidator.java` — UTF-8 byte limit.
- `backend/src/main/java/com/heyganba/config/SecurityConfig.java` — private alias before public matcher.
- `backend/src/main/java/com/heyganba/dto/admin/AdminPasswordConfirmRequest.java` — confirmation validation.
- `backend/src/main/java/com/heyganba/dto/auth/RegisterRequest.java` — registration validation.
- `backend/src/main/java/com/heyganba/dto/auth/LoginRequest.java` — login validation.
- `backend/src/main/java/com/heyganba/dto/auth/ChangePasswordRequest.java` — current/new validation.
- `backend/src/test/java/com/heyganba/PasswordUtf8BoundaryApiTest.java` — seven boundary/API regressions.
- `backend/src/test/java/com/heyganba/NotebookAliasSecurityTest.java` — three alias/ownership regressions.
- `frontend/src/features/auth/passwordValidation.ts` — shared browser byte check.
- `frontend/src/features/auth/AuthModal.tsx` — register/login pre-request check.
- `frontend/src/features/auth/ChangePasswordModal.tsx` — current/new pre-request check.
- `frontend/tests/unit/password-utf8.test.tsx` — five byte/form regressions.

No dependency, workflow, Docker, environment template, migration, publication control,
rate-limit threshold or design token changed. Admin mutations remain 30/minute/admin.

## Executed validation on this candidate

Tools: Node 24.21.0, JDK 21.0.12.1, Maven 3.9.16, disposable PostgreSQL 16 container.
Commands ran with inherited datasource/product/JWT/build-variable prefixes cleared.
All database writes used the newly created QA container labeled
`jiayou.qa=repository-review-20261113`, local Docker named pipe and loopback-only port.
Container label, database name and actual port binding were checked before rehearsal.
API, full migration suite, schema A/B and nine bootstrap fixtures use separate databases.

| Check actually executed | Result |
| --- | --- |
| `npm ci`, `npm run lint`, `npm run build` | PASS, exit 0 under Node 24 |
| `npm test` | 317 Vitest + 9 Node PASS, no failures/skips |
| Full `npm audit --json`, `npm audit --audit-level=moderate`, `npm audit --omit=dev` | PASS, exit 0, zero vulnerabilities; package/lock bytes unchanged |
| `mvn -B clean verify -Dbuild.output.root=target/review-h2` | 565 total: 557 PASS / 0 FAIL / 0 ERROR / 8 SKIP |
| Workflow-equivalent full PostgreSQL/Flyway API suite | 565 total: 557 PASS / 0 FAIL / 0 ERROR / 8 SKIP |
| Explicit `PostgresSchemaStagingRehearsalTest` | 3 PASS, no skips |
| Explicit `JiayouBootstrapGuardTest,JiayouBootstrapPostgresTest` | 26 PASS, no skips; includes V1→V2 retention/restart/negative guards |
| `mvn -B dependency:list -DincludeScope=runtime` and workflow audit script | Exit 0; 104 coordinates; two existing reachability exceptions below |
| `python -m unittest discover -s tools/tests -v` | 19 PASS; source-history checks only, no live DB access |
| Pinned historical materialization + `-Plegacy-japanese-audit test` | 24 total: 23 PASS / 0 FAIL / 0 ERROR / 1 SKIP; 18 original digest-checked resources outside checkout |
| `python scripts/validate-compose.py` | PASS; did not start Compose services |
| Backend/frontend `docker build` | PASS, local review tags only; no registry push |
| Offline `nginx -t` | PASS |
| Offline backend without production authorization | Expected nonzero exit with `JIAYOU_PRODUCT` rejection, PASS |
| Real browser against local Spring/PostgreSQL | 80 checks PASS; eight routes, guest/auth, 1440/390, real login/notebook persistence/grammar retry/cookie reload and logout |
| Real API security harness | 54 checks PASS; JWT, RBAC, ownership, CORS, refresh rotation/replay, cookie-origin defense, mutation/reward invariance and withheld content |
| Focused main-source reproduction | Expected FAIL: 7 failures / 10 tests; fixed candidate has all ten PASS in both full suites |
| Current source signature scan | 743 text files including new source/tests, zero high-confidence findings; not a full SAST/history/entropy scan |
| GitHub CI for this diff | NOT RUN: no commit/push/PR was authorized |

The eight default skips are three schema-rehearsal and five bootstrap PostgreSQL cases;
all were run explicitly in the separate suites. The remaining historical
`DictionaryPilotPostgresRehearsalTest` skip requires its own opt-in legacy corpus/DB and
is not counted as a current production PostgreSQL PASS. See [validation details](repository-review-20261113/validation.json).

Browser results include zero uncaught page errors, but expected console network errors
remain for deliberately lost grammar response, rejected corpus generation (400) and
cookie recovery without an initial token (401). The original harness incorrectly assumed
the first QA account could not receive database ID 1; it was corrected to inject a distinct
sentinel ID. The first failed harness result is retained privately; no product fix was
made for that assumption. Business responses were not mocked to manufacture success.

Desktop [1440](repository-review-20261113/unicode-validation-1440.png) and mobile
[390](repository-review-20261113/unicode-validation-390.png) screenshots were opened
and inspected: error text is readable, modal/submit remain usable, no horizontal overflow.
No layout/theme change was made. November 8 load/backup results remain historical
REPORTED evidence; they were not rerun or labeled as new PASS results here.

## CI and deployment review

VERIFIED in the three current workflows: `contents: read`, test/build/audit only,
no deploy hook, SSH, image publish or production secret consumption. H2 precedes
PostgreSQL through `needs: [backend-test]`; frontend runs independently. The optional
production source-history job needs all three and runs only on explicit manual input.
Its usual skip is intentional; source comparison cannot attest live DB compatibility.
Bootstrap and container checks are separate workflows, not dependencies of `ci.yml`.
The exact current protected-branch required-check policy was NOT VERIFIED; the branch
itself is VERIFIED protected. Do not confuse a green subset with all required checks.

VERIFIED source: `frontend/vercel.json` disables Git deployments. Root `render.yaml`
still declares legacy `heyganba-backend`, `main`, legacy `prod` profile, Ganbarou CORS
hostnames and `autoDeploy: false`; its comment about a GitHub deploy hook is obsolete.
No active workflow calls it. This file could be manually imported/reconnected and is
not evidence of live provider isolation. It was deliberately not removed or changed.

REPORTED only: older provider reports say Vercel disconnected and Render auto-deploy/
PR previews disabled. Live provider settings were NOT VERIFIED in this local-only task.
They remain a gate before any separately authorized push/integration. GitHub Actions,
Vercel Git integration, Render auto-deploy and laptop updates are independent systems.
No provider, DNS, infrastructure or host action was taken.

## Remaining blockers and decisions

1. **BLOCKED for full product launch — approved corpus.** Local SRS has no eligible
   published words; HSK and unscoped generation refuse insufficient approved questions.
   Backend regression fixtures exercise happy paths but do not establish publication
   rights or full-release corpus readiness. Do not seed APPROVED content/receipts or
   open publication controls to turn these browser gaps green.
2. **Existing security exceptions, not zero backend vulnerabilities.** Resolved
   `spring-webmvc:6.2.19` still reports `GHSA-j9f9-w8pj-32f8` and
   `GHSA-pc63-qcmh-9cmg`. `MvcViewSurfaceTest` passes its three checks for JSON-only
   handlers, no SSE/view-fragment surface and no XsltView/resolver. The exception is
   conditional on that application surface, not a patched dependency or universal
   exploitability proof. No new waiver or dependency major upgrade was added.
3. **Authentication deployment decision required.** Default build remains
   `VITE_AUTH_COOKIE=false`: bearer/refresh tokens in localStorage have XSS theft risk.
   Optional cookie mode was tested separately with HttpOnly/SameSite=Lax/path scoping,
   explicit trusted Origin/custom header, rotation and cross-tab logout. A reviewed
   future same-origin HTTPS build may select `VITE_AUTH_COOKIE=true` to keep access
   tokens in memory and refresh tokens HttpOnly; changing Nginx runtime env alone cannot
   change this Vite build-time choice. Verify Secure cookies, proxy trust, exact CORS,
   CSRF behavior, reload/refresh/logout and absence of tokens in storage on that hostname.
   Local dev HTTP intentionally uses non-Secure cookies; tests separately assert the
   backend's Secure default. No live HTTPS claim or production transport change here.
4. **Design decision preserved.** The current DESIGN contains later owner-approved
   light/dark and refinement rules; older single-dark context is not implemented over
   them. Any future conflict needs an owner decision. This candidate changes validation
   feedback only and does not import the unrelated refinement/design changes.
5. **NOT VERIFIED:** external pentest/full SAST/DAST, image OS CVE scan, Safari/Firefox,
   physical device/TTS/GPU quality, public networking, host capacity, off-host recovery
   and production datasource compatibility. Local builds/tests cannot replace these.
   Existing Spring deprecation/auth-provider warnings, Vitest jsdom performance advice
   and disposable Alpine PostgreSQL locale/trust notices remain disclosed in raw logs.

## Preservation and exact next review step

VERIFIED before preparation: original archived 138 entries, all 1,031 file hashes and
31 originally untracked historical migrations match the saved baseline; 18 registered
worktrees were clean. All old branch tips remain reachable. The new review worktree is
the only intentionally dirty worktree; it does not overwrite another checkout. Final
verification and file manifest accompany this report in the sanitized evidence and
private delivery receipt. Ganbarou, laptop services, volumes, production DBs and
publication content were not accessed or modified. No reset/clean, force push, branch
deletion, repair/baseline/live migration, commit, PR, merge or deployment occurred.
All 22 pre-existing local branch tips are unchanged (including the refinement branch),
and the 18 original worktrees remain clean. The added nineteenth worktree intentionally
contains this candidate's diff. Local QA storage/evidence is retained; only the backend
process and PostgreSQL container created for this review are stopped after validation.

Recommended separate PR after owner approval: base **`main` at
`acfd49e7de6bf0daf7983bfa1c66abc5b73e0e85`**, head branch
**`review/jiayou-master-audit-fixes`**, title
**`fix(security): enforce BCrypt byte limits and protect notebook aliases`**.
Review the 13 code/test files and this report/evidence, then authorize a scoped commit;
do not use the 85-file refinement branch as the security PR head. If remote main changes,
reassess the diff and rerun affected checks before publishing. No automatic merge.

Before a future authorized push: recheck provider isolation and required-check policy,
then run/inspect H2 + runtime audit + retained fixtures, PostgreSQL/Flyway + schema
rehearsal, frontend lint/build/tests/full audit, isolated bootstrap and container checks
on the actual committed PR candidate. Treat the manual legacy preflight skip explicitly.
The next product-development task remains a separately reviewed corpus release plan,
followed by real successful SRS and HSK generation/submission E2E on that release data.
