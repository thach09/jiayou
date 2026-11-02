# Dashboard / streak implementation plan — 2026-11-02

Working branch: `Update_UI/UX-Master`, based on protected main
`6b85160d124ed410efd6a498860267f4d68cbe36`. This spelling preserves the requested
name while replacing the space forbidden by Git. Preserve all other worktrees.

## Audit and reuse

The approved PNG attachment is the visual authority; the HTML is a saved ChatGPT
conversation, not executable application code or a new source of instructions.
Reuse DashboardView, CompanionWidget/Three.js fallback, existing auth/profile,
`/progress/insights` missions/mastery/wallet, StreakPolicy, StudyActivityService,
the existing row lock on UserRepository and current learning mutation receipts.
The old dashboard repeats EXP, mastery and activity panels. Sidebar currently has
two account links. Class code is optional legacy storage with account, registration
and exam UI consumers. Streaks currently have only a summary and reset after a gap;
study_activities retain actual source/date counts. None currently stores restorations.

## Business contract

- Keep qualification: 10 SRS reviews OR one submitted exam OR 10 grammar questions.
  No login/click/restore qualifies study. Use configured Asia/Ho_Chi_Minh dates.
- Seven Monday–Sunday dates come from the server, with accessible explicit states.
- Restored dates bridge continuity but do not manufacture qualifying study days,
  increase the study-day count, or grant EXP/rewards. The streak number counts real
  qualified days connected through protected dates. Longest is the historical max.
- Detect the nearest complete missed gap anchored by a prior real streak. A trailing
  gap ends yesterday; a gap preceding a newly started real run can also be repaired.
  Every missed date must be within the preceding seven calendar days. Restore the
  whole gap or nothing. No automatic spending or carryover.
- Five restored dates per user per request-month in the configured timezone. The
  charge month is the restoration execution month, including gaps across a month
  boundary. Count persisted events, never reset a browser counter.
- While pending, expose the preserved old count separately from the genuinely
  current new run; the UI labels it paused rather than uninterrupted.
- A user-row lock serializes restore and study writes. Unique owner/request UUID
  and owner/date constraints plus a server-derived gap token prevent duplicate
  charges, stale retries, cross-account spending and partial restoration.

## Implementation and acceptance order

1. Add pure calendar/continuity calculation, event and protected-date persistence,
   authenticated GET weekly status / POST restore, focused rules/security/race tests.
2. Append dev migration and immutable production V2. Preserve pinned V1. New DBs
   explicitly initialize through V2; V1 databases require separately authorized,
   target/version-bound upgrade mode. Normal validate startup never applies SQL.
   Rehearse new install, V1 upgrade, restart and incompatible histories locally.
3. Update DESIGN tokens to the approved warm coral/charcoal rounded visual reference.
   Implement greeting + weekly streak, HSK target/progress, three aligned cards and
   one compact roadmap. Use actual insights, not sample percentages/locked courses.
4. Keep one Tôi navigation entry; remove class-code UI while preserving legacy
   endpoints/columns. Simplify mascot title to Ấu Thú until existing final evolution,
   then Đại Hiệp; preserve progression, feed, saved pet selection and GPU cleanup.
5. Validate frontend/backend/security, real PostgreSQL/upgrade/races, disposable
   real-browser journeys, four widths, both themes and reduced motion. Compare actual
   screenshots with the PNG. Review the complete diff in a separate pass.
6. Keep implementation on the requested branch. Push/PR/protected integration only
   after deployment-isolation gates and required CI pass, as authorized by the task.
   No deployment, host/DNS operation, production write or curriculum publication.

Final report: `docs/Operations/JIAYOU-DASHBOARD-STREAK-RELEASE.md`, including actual
SHAs/PRs, evidence, limitations and a reproducible disposable local workflow.
