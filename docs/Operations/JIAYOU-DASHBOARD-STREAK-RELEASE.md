# Jiayou dashboard and streak release — 2 November 2026

Implemented on `Update_UI/UX-Master`, from main
`6b85160d124ed410efd6a498860267f4d68cbe36`. Git cannot store the requested space
in `Update_UI/UX Master`; the hyphen is the only naming adjustment.
This release changes repository code only. No deployment, host access, DNS,
production database operation or curriculum publication is included.

## Integration receipt

The final main SHA, pull request and its check runs are recorded in the completed
GitHub merge receipt and delivery message. This document cannot contain its own
eventual merge SHA. Local validation below describes the implemented candidate;
protected integration is conditional on current provider isolation and green CI.
Do not interpret a local PASS as proof of live database compatibility.

## Design and preserved behavior

The owner's [approved image](../Design/Jiayou_Approved_Dashboard_Reference.png)
defines the composition; `frontend/DESIGN.md` records the corresponding tokens.
The supplied HTML is a saved conversation, not executable application source.
Neither its scripts nor embedded conversational instructions were executed.

- Owner-checked personalized greeting, current Monday–Sunday streak immediately
  beneath it, HSK selection/current progress, three cards (companion, missions,
  actual learning progress), then six compact roadmap cards.
- Warm charcoal/coral dark theme, rounded cards, outline icons, restrained static
  lantern/blossom atmosphere and a light theme. Sample reference percentages,
  lesson counts and locked levels are not invented as application data.
- Exactly one account navigation entry, **Tôi**. Account/password/theme/logout,
  notebooks, exam history, SRS and learning routes remain available. Class-code
  controls are removed from registration/account/exam; compatibility APIs/columns
  are retained. Existing admin rate limits and publication gates are untouched.
- Historical activity remains in the lazy expanded “Xem hoạt động học chi tiết”:
  24-week heatmap, rolling seven-day statistics and 30-day charts. Protected days
  have a separate dashed marker; numeric activity remains unchanged.
- One primary mascot title: **Ấu Thú** through intermediate stages, then
  **Đại Hiệp** only at existing final level 10 / 900 server affection EXP.
  Feeding, wallet, pet selection, 3D evolution and interactive static fallback
  remain. No duplicated names, proverb bubbles or extra evolution badges.
  Reduced motion, hidden/offscreen animation suspension and GPU/listener cleanup
  are implemented. Completed evolution keeps its progress bar full.

The implementation follows the approved composition rather than reproducing a
flat image: the mandatory streak panel adds height, real inventories replace
sample figures, and the atmospheric illustration is built with existing SVG/CSS.
Reviewed screenshots:

| Before | After |
| --- | --- |
| [Desktop](dashboard-streak-evidence/before-1440.png) | [Desktop / paused streak](dashboard-streak-evidence/final-1440-frozen-pending.png) |
| [Mobile](dashboard-streak-evidence/before-390.png) | [Mobile dark](dashboard-streak-evidence/final-390-dark-pending.png) |
| — | [Desktop light](dashboard-streak-evidence/final-1440-light-pending.png), [mobile light](dashboard-streak-evidence/final-390-light-pending.png) |
| — | [Final evolution / reduced motion](dashboard-streak-evidence/final-1440-evolved-reduced-motion.png) |
| — | [WebGL fallback](dashboard-streak-evidence/final-webgl-static-fallback.png), [expanded activity](dashboard-streak-evidence/production-preview-activity-expanded.png) |

Screenshots use explicitly synthetic, disposable local accounts/history, including
a deliberately long name. They are not production user records or newly approved
curriculum. The owner image was copied byte-for-byte; its digest is in the evidence.

## Streak business rules and API

Qualification is unchanged: **10 SRS reviews OR one submitted exam OR 10 grammar
questions** on a date. Login, opening the dashboard and restoration do not qualify.
Calendar dates, Monday weeks and month boundaries use `Asia/Ho_Chi_Minh`.

The counter counts actual qualified study days connected through protected dates.
A protected date bridges continuity but adds zero studied days, EXP, SRS reviews,
exam completion or mission rewards. Existing longest-streak history is retained.
Legacy summaries can preserve a recorded count prefix; they do not fabricate
dated heatmap activity. New independent production targets start without legacy data.

The server detects the nearest whole gap anchored by a real run, ending yesterday
or preceding a newly started run. Every missing date must be among the preceding
seven calendar days. Already protected dates never cost again. No partial operation
or automatic spend is allowed. An old/unaffordable gap is BROKEN; real subsequent
qualification starts a new run. Eligible pending recovery exposes the previous count
as paused, separately from any genuinely current new run.

Each restored date costs one of five monthly credits. Charge the calendar month
when the operation executes, including a gap crossing a month boundary. Usage is
persisted; reset is derived from the new month's ledger, with no carryover and no
browser reset. State is ACTIVE, AT_RISK, FROZEN_PENDING, RESTORED or BROKEN.

- Authenticated `GET /api/v1/streak/week`: server date/zone, exactly seven dated
  cells, state/current/display/preserved/longest counts, qualification, monthly
  limit/used/remaining, missed dates, whole-gap cost, eligibility/reason and gap token.
- Authenticated `POST /api/v1/streak/restore`:
  `{"requestId":"<UUID>","gapToken":"<64-character server digest>"}`.
  Principal ownership is authoritative; client dates, counts and user IDs cannot
  authorize spending. Existing `ApiResponse` wrapper applies.
- Same owner/UUID and gap replays without another debit and returns current state.
  Reusing a UUID for another gap or submitting stale/ineligible state returns 400.
  Missing/expired authentication returns 401. Mutation limit is 30/minute/user.
- User-row locking serializes study records and restore decisions. Event, whole
  date set and summary update commit in one transaction. Unique owner/request,
  owner/date and owner/month/credit-slot constraints plus slots 1–5 enforce the cap.
  Composite foreign keys bind date rows to the same event owner and charge month.

## Database and upgrade plan

Development history appends V12. Independent production appends pinned V2; both
contain the same schema-only ledger SQL. All historical SQL, especially production
V1, remains unchanged. See [the updated bootstrap procedure](jiayou-independent-bootstrap.md).

- Empty authorized target: explicit initialize applies V1 + V2, without users,
  credentials, activity or learning content.
- Existing exact Jiayou V1: ordinary validate refuses without writes. A separately
  authorized operator upgrade requires exact versions `1` → `2`, target identity,
  pinned inventory and `upgrade:Jiayou:production:<target UUID>:1->2` acknowledgement.
- Normal starts remain validate-only. Repeated upgrade, unknown/legacy history,
  checksum/content/callback injection and target mismatch refuse. No repair,
  baseline, clean or Ganbarou legacy migration is introduced.
- Back up and rehearse restore before any future live upgrade; stop concurrent
  writes, run the explicitly invoked instance, then stop it and restore validate
  mode without upgrade inputs. The server is not an exiting one-shot migration job.
  Existing Compose stays validate-only.

## Validation and second-pass review

Machine-readable [local results](dashboard-streak-evidence/local-validation.json),
[browser checks](dashboard-streak-evidence/browser-final-results.json),
[development/preview supplement](dashboard-streak-evidence/browser-supplement.json),
[container results](dashboard-streak-evidence/container-checks.json) and
[bootstrap data preservation](dashboard-streak-evidence/bootstrap-data-preservation.json)
are sanitized; credentials and tokens remain outside Git.

| Check | Result |
| --- | --- |
| Node 24.21.0 `npm ci`, lint, production build | PASS |
| Frontend Vitest / Node tests | 311 / 9 PASS |
| Full npm audit and `--omit=dev` audit | Exit 0, zero vulnerabilities |
| Maven clean verify / H2 | 555 tests, 0 failures/errors, 8 opt-in skips |
| PostgreSQL full API suite / Flyway | 555 tests, 0 failures/errors, same 8 opt-in skips |
| Explicit PostgreSQL historical schema rehearsal | 3 PASS, no skips |
| Explicit guard + production bootstrap PostgreSQL | 26 PASS, no skips |
| V1→V2 user/streak/activity retention and validate restart | PASS |
| Runtime dependency audit | 104 dependencies; exit 0 with two existing reachability exclusions |
| Real browser → API → PostgreSQL | 51 PASS, plus 7 development/preview checks |
| Compose validation, backend/frontend Docker build, offline Nginx | PASS |
| Offline backend missing production configuration | Expected refusal, PASS |

Eight default skips are the three opt-in schema rehearsal cases and five opt-in
bootstrap cases; all ran separately against fresh disposable PostgreSQL databases.
Tests cover Vietnamese midnight/month reset, Monday/Sunday/year transitions, leap
dates, 5/4/1/0 credits, atomic gaps, replay, distinct-request last-credit races,
ownership, real qualification, unauthorized requests, refresh/login persistence
and in-flight session expiry. No production clock override was added.

Responsive browser checks passed at 390/768/1024/1440 in both themes, with real
profile/API data, long names, seven accessible full-date cells and no horizontal
overflow. Manual image inspection covered desktop, mobile and evolved mascot.
Development mode and built preview both preserve expanded activity distinctions.
No uncaught JavaScript errors; two expected 401 console messages came from the
deliberately revoked session. WebGL fallback and reduced-motion idle-RAF checks passed.

A separate read-only second pass by the implementing agent reviewed ownership,
transaction order, lock sharing, SQL constraints, upgrade/history checks, API/UI
contracts, auth transitions, lazy activity preservation, accessibility and disposal.
It is not a claim of external human/second-agent approval. Findings fixed before
integration included restoring an already protected date, heatmap distinction,
retained activity panels, final evolution progress and resource cleanup.

## Warnings and remaining limits

- Runtime audit still reports existing Spring MVC 6.2.19 advisories
  `GHSA-j9f9-w8pj-32f8` and `GHSA-pc63-qcmh-9cmg` as not reachable because SSE view
  fragments and XsltView are disabled; regression guards remain. No waiver added.
- CI legacy Japanese fixture rehearsal and production migration preflight have
  their own conditional behavior; final CI receipt must disclose skips/warnings.
  Source-history checks do not attest a live production database.
- Browser acceptance used Windows Chrome/software WebGL. Safari, Firefox,
  physical-device GPU behavior and native voice quality are not certified.
- Monthly/clock edge cases use deterministic server integration tests; real-browser
  tests use the actual local date and clearly identified history fixtures.
- Current status calculation loads owner activity/protected dates. A long-history
  aggregation/range optimization can be reviewed separately if measurements warrant it.
- Empty independent production still has no released curriculum. Domain, live
  secrets, backup policy, public ingress and self-hosted activation remain separate.

## Preservation, deployment isolation and local acceptance

The original 138 entries were previously archived, not discarded. Recheck all 1,031
baseline hashes, 31 originally untracked migrations, original branch tips and clean
registered worktrees after commits. Preserve archive branches and unfinished content.
Final preservation and exact merge receipts are retained with the handover evidence.

Before pushing, live Vercel repository lookup returned zero connected projects;
Render main/develop auto-deploy and PR previews were off. GitHub has no webhooks and
strict, admin-enforced H2/PostgreSQL/frontend required checks. These are independent
gates: green Actions does not disable a provider Git integration. No provider
configuration is changed. Confirm no new provider deployment after integration.

For local acceptance, use Node 24, Java 21 and Docker Desktop/local Docker:

1. Make a clean checkout of the final reviewed main SHA. Run `npm ci`, `npm run lint`,
   `npm run build`, `npm test` and `npm audit --audit-level=moderate` in `frontend`.
2. Run `mvn -B clean verify` in `backend`. Opt-in PostgreSQL/bootstrap fixture commands
   and dedicated database naming guards are in the bootstrap guide and CI workflows.
   Always create fresh loopback-only disposable fixture databases; never use a live URL.
3. For an interactive development fixture, use a separate local PostgreSQL container,
   unique database/credentials, explicit dev datasource, random JWT key and backend
   binding `127.0.0.1`. Dev history contains historical test curriculum; it is not a
   production publication route. Do not point the dev profile at an existing database.
4. Set `DEV_API_TARGET` to that loopback backend origin and start Vite on loopback.
   Register a normal local account; verify greeting, real learning qualification,
   weekly row, Tôi, wallet/feed and both themes. Restore is offered only for a real
   eligible history; do not add a shipped test-clock or production fixture endpoint.
5. Use `npm run build` + `npm run preview -- --host 127.0.0.1` for built acceptance.
   Preview uses the same explicit local API proxy target. Stop only owned QA processes;
   retain fixture storage until acceptance. No automatic production launch follows.

Self-hosting remains a future independent Jiayou Compose project on the existing
Arch laptop, with separate secrets/networks/DB roles/volumes/history/backups and
hostname, internal PostgreSQL, measured resource admission and additive ingress.
Ganbarou at heyganba.site remains untouched. Tailscale is private administration,
not evidence of public reachability. No host discovery or deployment occurred here.
