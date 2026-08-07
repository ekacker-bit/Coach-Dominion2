# Coach Dominion

Coach Dominion is a browser-based AI coaching operating system with a disciplined command-center interface. Its current release accepts a daily state report, calculates deterministic readiness, generates a constrained training mission, and presents an Atlas Morning Brief. Readiness and Atlas output are rule-based; the application does not call an LLM.

## Release status

The latest completed release is **Release 0.3.1 — Atlas Morning Brief**. Builds 004C through 005D are unreleased work and do not mark Release 0.4 or Release 0.5 complete. Release history is recorded in [CHANGELOG.md](CHANGELOG.md).

## Architecture

- `index.html` provides password and magic-link authentication.
- `app.html` contains the authenticated War Room interface.
- `assets/js/app.js` contains Supabase client operations, the Daily State/readiness engine, mission generation, Atlas brief generation, and UI rendering.
- `assets/js/core-programming.js` contains the deterministic four-week Abs/Core planner, daily prescription safeguards, execution state, and progression evidence rules.
- `assets/js/closed-loop.js` contains the Observe-to-Adapt coaching state machine, decision fingerprints, cross-domain reconciliation, and bounded next-adjustment rules.
- `assets/js/contract-experience.js` contains the revision-bound Dominion oath, signature validation, signed artifact, and post-sign progression model.
- `assets/js/experience-shell.js` derives the global current order and Contract-to-Today operating journey from existing canonical state.
- `assets/js/daily-ritual.js` derives the Daily Seal, secured-day chain, and Execute-to-Adapt close progression from the existing daily queue and closed-loop record.
- `assets/js/activation-repair.js` derives the guided Contract-to-Today repair flow and exact domain handoff from canonical activation state.
- `assets/js/atlas-program-repair.js` reconciles legacy plan links and Calendar drafts against the currently signed Contract without overwriting the active-program receipt.
- `assets/js/nutrition-feed.js` validates the privacy-limited daily nutrition payload and generates the iPhone Shortcut request contract.
- `assets/styles.css` contains the application styles.
- `api/health.js`, `api/config.js`, and `api/nutrition-feed.js` are Vercel Node.js serverless functions.
- `supabase/migrations/` contains the tracked PostgreSQL schema, constraints, row-level security policies, and trigger definitions.
- `tests/` contains dependency-free Node.js assertion tests.
- `vercel.json` defines clean URLs and the `/app` rewrite.

Build 004A adds a daily Dominion Record with five equal-weight compliance domains: mission, strength, running/cardio, recovery, and nutrition. Completed, partial, and missed domains score 100, 50, and 0. Excused and not-applicable domains are excluded. Blank or invalid assessments receive no credit and are excluded as unassessed; when nothing applicable has been assessed, the record remains unscored. Restriction and approved-modification evidence is stored independently, and no Build 004A status automatically creates a violation.

## Build 013C core programming

The Abs/Core destination supports a profile-driven, four-week cycle covering five movement categories. Draft generation and approval are separate; readiness can reduce or remove today’s prescription but cannot increase or silently rewrite an approved plan. Completed movements, session quality, effort, and pain holds persist to user-scoped account storage with device-local fallback. Controlled completion evidence drives an explicit next-cycle recommendation, while each completed exercise also becomes auditable Performance evidence.

## Build 014A closed-loop coaching

Closed-loop coaching unifies the operating cycle across Observe, Decide, Authorize, Execute, Verify, and Adapt. The approved daily decision receives an immutable fingerprint, and strength, running, core, fueling, recovery, and Dominion Record evidence are reconciled against that exact prescription. A closing review is unavailable while required evidence is missing. Once verified, Coach Dominion proposes a bounded future adjustment—never an automatic plan mutation—and requires explicit approval before carrying that adjustment into the next planning cycle.

## Build 015A automated nutrition feed

Build 015A adds a credential-free automated nutrition path: MyFitnessPal writes supported Food totals to Apple Health, and a user-owned iPhone Shortcut sends one daily aggregate to Coach Dominion. The feed accepts only date, timezone, sample count, calories, protein, carbohydrates, and fat. It does not accept food names, meal names, diary notes, MyFitnessPal credentials, or raw Apple Health records.

The Connections & Data → Nutrition view creates a private feed key, shows it once, generates the Shortcut request contract, verifies authorization, records deliveries, and supports rotation or immediate revocation. One canonical MyFitnessPal nutrition record exists per user and date, so repeated deliveries are classified as duplicates or updates rather than creating double-counted nutrition. Manual MyFitnessPal CSV import remains available.

Persistence uses [supabase/migrations/014_myfitnesspal_health_bridge.sql](supabase/migrations/014_myfitnesspal_health_bridge.sql). The migration adds user-scoped feed-key metadata, delivery events, the secured ingestion function, and the permitted live Connected-account state. The raw key is never stored; only its SHA-256 digest and a short display hint are retained.

## Build 019A Dominion Contract experience

The Recruit Contract is now a guided commitment and signed operating artifact rather than a permanent setup form. A recruit defines the outcome, sustainable capacity, and operating standards, reviews the exact weekly commitments, types a signature, affirms the Dominion oath, and confirms the effective date in a deliberate signing dialog. The signature is bound to the Contract ID and revision; amendments create a draft while the signed revision and active module plans remain protected. After signing, one progression rail guides the recruit through plan linking, week commitment, and Day One.

## Build 019B Dominion experience shell

The authenticated product now presents one Coach Dominion operating system instead of a collection of independent dashboards. A persistent current-order rail derives the recruit's next meaningful action from the signed Contract, linked module plans, coordinated week, and today's Daily State. The same rail moves through Commit, Link, Plan, Report, Protect, and Execute states without duplicating or rewriting any underlying data.

The global shell carries section identity, rank, primary navigation, and a four-stage Contract → Plans → Week → Today journey across every module. Rendered build labels are translated into product language, primary page copy is shorter, crimson is reserved for danger, and the navy/forest/gold hierarchy adapts for mobile and reduced-motion preferences.

## Build 019C Daily Seal

The Daily Seal gives Today a meaningful ending. It reads the canonical execution queue and closed-loop coaching record, then guides the recruit through Execute, Record, Verify, and Adapt. When the evidence is ready, the close action preserves the review; when Atlas proposes a bounded next move, the recruit must still approve it deliberately. A sealed day displays evidence confidence, secured-day history, the current consecutive chain, and rank without introducing another source of truth.

## Build 019D Operating Truth

Build 019D makes every major surface answer from one state hierarchy: Contract → Plans → Week → Today → Evidence → Review. A module can only show `COMPLETE` when a committed assignment, terminal execution, and preserved evidence agree. Unsigned contracts, stale plan links, uncommitted weeks, missing evidence, and review work now produce one named blocker and one repair action across the mission rail, mobile command, and Daily Seal.

## Build 019E One Command UX

Today now presents one authoritative order with one primary action. The same operating truth chooses the instruction, destination, evidence state, and closeout action; plan context and the full daily sequence remain available through progressive disclosure. On mobile, the duplicate command dashboard is removed while quick Roll Call and fuel capture remain directly accessible.

## Build 019F Activation Repair Loop

One Command now turns setup blockers into a guided recovery path. It names the exact plan that does not match the signed Contract, opens the correct Strength, Running, Core, or Nutrition destination, and then advances through coordinated-week build and deliberate commitment. A final reconciliation returns the recruit to an operational Today, while a timed fallback prevents an unresolved loading state from becoming a dead end.

The same release sharpens the Coach Dominion shield for small mobile surfaces and makes Recovery operational on Today. The card reads current readiness, training load, and fueling evidence; gives a clear recovery prescription; records deliberate completion in the canonical daily queue; and updates closed-loop evidence and the Daily Seal. Completion never removes a pain safeguard or silently changes an approved training plan.

## Build 019G Two-a-Day Capacity

The Recruit Contract can now authorize designated Two-a-Days. When enabled, the coordinated calendar may place two sessions on one day, targets at least 121 combined minutes, and enforces a 240-minute daily ceiling. Calendar and Today surfaces show that capacity explicitly, and changing the choice requires the same deliberate Contract revision and signature flow as every other commitment.

Long runs are exempt from time clipping: their duration remains open even when estimated above the standard or Two-a-Day ceiling. The exemption does not remove recovery-day protection, readiness and pain restrictions, the hard-run plus loaded-strength block, or the requirement to separate and refuel between compatible sessions.

## Build 020A Split-Day Command

A committed Two-a-Day now becomes an executable sequence instead of one oversized calendar block. Coach Dominion orders Session 1 and Session 2 from the signed goal, keeps a long run first and time-open, and carries the sequence into Today with independent module status and launch controls.

Session 2 remains unavailable until Session 1 has terminal execution evidence. Between sessions, the recruit receives one explicit recovery bridge: refuel, rehydrate, and separate exposures by at least four hours. Current nutrition evidence is visible without inventing another meal log or silently modifying the approved baseline.

## Build 020B Between-Session Gate

The split-day recovery bridge is now operational. Coach Dominion records the actual Session 1 completion time, counts down the four-hour separation, and requires a short midday checkpoint covering current energy, new pain, refueling, and hydration. The checkpoint persists across refreshes and reconciles to the recruit account when the supporting migration is available.

Session 2 cannot launch from Today or another direct training control until the gate is cleared. RED morning readiness, new pain, low midday energy, an unfinished recovery interval, or incomplete fueling evidence keeps the second session on hold without modifying the signed Contract or committed week.

## Build 004B weekly inspection

The Weekly Inspection reviews a normalized Monday-through-Sunday period and can move backward across prior weeks. It aggregates the underlying included domain observations: completed = 100, partial = 50, and missed = 0. Excused and intentionally not-applicable observations are excluded from the score denominator. Missing or invalid observations receive no credit and remain unassessed. Scores retain full precision internally and round only in the interface.

Evidence Coverage is separate from discipline: `(valid assessed observations excluding N/A) / (35 expected observations minus intentional N/A) × 100`. Missing and invalid observations reduce coverage; excused observations support coverage without affecting discipline. An all-N/A week is fully documented but remains `UNSCORED`.

Inspection states use a configurable 60% evidence threshold:

- `NOT READY`: no valid assessment exists.
- `LIMITED EVIDENCE`: some evidence exists below 60%.
- `READY FOR INSPECTION`: evidence is at least 60% and the inspection is not finalized.
- `INSPECTION COMPLETE`: the evidence and Atlas report snapshot were finalized.

Finalization is blocked below the threshold. A finalized inspection is loaded from its stored snapshot and is read-only; later daily-record changes do not rewrite it. Drafts recalculate from current daily evidence. Supabase persistence uses `weekly_inspections` after migration `003_weekly_inspections.sql` is reviewed and applied. If Supabase is unavailable, weekly drafts and snapshots use user/week-scoped local storage and are labeled `LOCAL FALLBACK`; they are browser-specific and are not automatically synchronized.

## Build 004D UX command center pass

The War Room now supports a structured command-center experience with top-level navigation for Today, Record, Inspection, Trends, and Standards. The app preserves section state through hash-based navigation, supports desktop and mobile navigation, and adds onboarding guidance that can be dismissed and reopened. Dominion Record now supports progressive disclosure, dirty-state tracking, save-state messaging, and unsaved-change warnings, while Weekly Inspection adds draft/finalized distinction, confirmation before finalization, read-only snapshot messaging, collapsible daily evidence, and clearer visual treatment for missed, excused, and approved-modification outcomes. Trends now lead with trajectory, score change, evidence quality, domain-at-risk context, and consistency, while preserving the existing scoring and analytics calculations.

Trends are derived at runtime; no analytics table or redundant state is stored. Finalized `weekly_inspections` snapshots are the authoritative historical source. The meaningful current week is added to charts as a clearly labeled provisional point, while `daily_compliance` drives calendar-day streaks. Finalized history is never recalculated from later daily changes.

The trajectory window contains the most recent four finalized scored inspections, using two or three when that is all the available history. Fewer than two yields `INSUFFICIENT HISTORY`. An ordinary least-squares slope uses actual week spacing: at least +2 score points per week is `IMPROVING`, at most −2 is `DECLINING`, and smaller movement is `STABLE`. Missing and UNSCORED weeks are omitted rather than converted to zero or interpolated. Average window evidence below 60% yields `LIMITED EVIDENCE` before any score conclusion.

Each domain uses the same four-week, ±2-point slope method. It reports `UP`, `FLAT`, `DOWN`, `LIMITED EVIDENCE`, or `NO DATA`. Domain ties preserve the fixed order mission, strength, running/cardio, recovery, then nutrition.

An assessed day has at least one valid compliance status. A fully assessed day has all five domains intentionally marked completed, partial, missed, excused, or N/A. Current streaks must reach today; longest assessed streak uses exact calendar continuity. Future and missing dates are ignored and never inferred.

The charts are dependency-free responsive SVG with fixed 0–100 axes, actual week labels, accessible text equivalents, solid finalized values, yellow/dashed provisional treatment, and a yellow outline when a score has evidence below 60%. Empty histories render an explicit empty state.

The browser loads Supabase JS v2 from jsDelivr. `/api/config` passes the configured Supabase project URL and anonymous client key to the browser. Supabase provides authentication and PostgreSQL persistence; row-level security restricts users to their own Daily State, command-feed, standards, and standards-audit records.

## Build 004E standards & violations

Build 004E adds a deterministic standards-and-violations layer that remains supplemental to the existing Dominion Record and Weekly Inspection scoring formulas. It does not alter readiness, discipline scoring, inspection aggregation, or finalized-inspection snapshots.

The standards catalog covers mission execution, strength completion, cardio completion, recovery restrictions, nutrition targets, reporting/evidence quality, safety restrictions, and program-conduct integrity. Protected exceptions include excused statuses, not-applicable statuses, approved modifications, readiness restrictions, illness, injury, and insufficient evidence. A single missed entry does not create confirmed misconduct; it becomes a candidate for review. Repeated unexcused misses can escalate severity, and deliberate falsification or knowingly unsafe behavior can move to Level III.

Review state is a lifecycle from `CANDIDATE` to `UNDER REVIEW`, `CONFIRMED`, `CORRECTED`, `RESOLVED`, `DISMISSED`, or `EXCUSED`. Confirmation, dismissal, excuse, correction, and resolution all require explicit workflow actions and are blocked by invalid transitions. Corrective actions are non-punitive and never include punishment exercise, food restriction, deprivation, or unsafe compensation.

Supabase persistence uses the new migration [supabase/migrations/004_standards_violations.sql](supabase/migrations/004_standards_violations.sql). The browser also supports user-scoped browser-local fallback for standards review state and audit events, and the UI clearly labels remote versus local persistence.

The Standards & Violations section in the War Room displays the catalog size, open candidates, confirmed count, and resolved count; it also shows a review queue, a deterministic Atlas Standards Review, and the persisted audit trail.

## Build 004F rank & promotion

Build 004F adds a deterministic rank-and-promotion system that uses finalized weekly-inspection history, recent Discipline Score, evidence coverage, consecutive qualifying weeks, standards history, and corrective-period status to determine promotion readiness. The system does not alter the existing scoring formulas or finalized-inspection snapshots. Promotion remains deliberate: eligibility is recalculated, promotions are only finalized after explicit confirmation, and finalized promotions are stored as immutable history.

The built-in rank catalog starts at RECRUIT and advances one rank at a time through CADET, OPERATOR, VANGUARD, DOMINION, and ASCENDANT. Requirements are progressive and explainable, using a deterministic catalog that can be adjusted later without a manual admin editor. Promotion states are NOT ELIGIBLE, PROGRESSING, ELIGIBLE, PROMOTION PENDING, PROMOTED, BLOCKED, and CORRECTIVE PERIOD. Dismissed and excused standards candidates do not count against promotion, and provisional or UNSCORED weeks do not qualify. The Rank section in the War Room shows the current rank, next-rank target, checklist, blockers, Atlas Promotion Review, history, and ladder overview. Local fallback persistence keeps rank status and promotion history available while remote persistence is unavailable.

## Build 005A performance logging foundation

Build 005A adds an unreleased Performance Logging foundation to the War Room. It is additive and does not replace existing readiness, Dominion Record, inspection, standards, or promotion behavior.

Performance domains include strength, running, core, conditioning, fitness tests, and body metrics. Supported entry types are training set, workout summary, benchmark, formal test, race, and measurement. Evidence statuses are self reported, verified, estimated, and incomplete. The UI supports progressive disclosure by domain, summary cards, filters, and edit/delete actions.

Validation rules are deterministic:
- strength entries require positive sets and repetitions, and weight must be non-negative
- running entries require positive distance and duration
- core and conditioning entries require positive repetitions or duration when provided
- formal tests require a protocol name or activity name
- body metrics require a non-negative measurement value

Performance calculations are:
- strength volume = sets × repetitions × weight
- estimated 1RM = weight × (1 + repetitions / 30)
- running pace = duration seconds / distance

Performance entries persist to Supabase through [supabase/migrations/006_performance_logging.sql](supabase/migrations/006_performance_logging.sql) when the remote table is available. If Supabase is unavailable, the browser falls back to user-scoped local storage and marks the save state as local fallback. The runtime uses stable client-side ids for performance entries and deletes only by exact stable identifier.

The current scope is the 005A foundation only. Build 005B extends this with deterministic fitness-test attempts, personal-record evaluation, milestone achievements, and Atlas review output. The runtime uses the new browser-side state helpers and a matching Supabase migration [supabase/migrations/007_fitness_tests_prs.sql](supabase/migrations/007_fitness_tests_prs.sql) for durable persistence. Planned follow-on work for 005C includes richer analytics, export/import, and deeper coaching automation around the new performance history.

## Build 005D performance intelligence (unreleased)

Build 005D adds a deterministic intelligence layer on top of existing 005A/005B performance data. It is additive and does not alter readiness, compliance, weekly inspection scoring, PR business rules, milestone qualification rules, or fitness-test completion rules.

Build 013B simplifies training navigation into five destinations: TODAY’S TRAINING, LOG, RUNNING, ABS / CORE, and PROGRESS. Existing programming and recovery reviews now live inside Today’s Training; intelligence, fitness tests, records, and milestones remain fully available inside Progress. Legacy destination requests are routed into their new consolidated homes.

The Intelligence view adds:
- an intelligence status strip
- overall trajectory distribution
- domain intelligence cards
- plateau and regression watchlist
- next benchmark recommendation
- PR readiness panel
- fitness-test event intelligence
- deterministic Atlas Performance Intelligence brief
- explicit evidence limitations

Trend windows and states:
- recent window: latest 3 valid comparable results
- prior window: preceding 3 valid comparable results when available
- minimum trend series: 3 valid comparable results
- preferred confidence series: 6 or more valid comparable results
- trajectory states: STRONGLY IMPROVING, IMPROVING, STABLE, NOISY, DECLINING, STRONGLY DECLINING, INSUFFICIENT DATA

Confidence, plateau, and regression states:
- confidence: HIGH, MODERATE, LOW, INSUFFICIENT
- plateau: NO PLATEAU, POSSIBLE PLATEAU, LIKELY PLATEAU, INSUFFICIENT DATA
- regression: NO REGRESSION, POSSIBLE REGRESSION, LIKELY REGRESSION, INSUFFICIENT DATA
- estimated-only evidence is explicitly labeled and confidence-limited

Benchmark proximity and PR readiness:
- benchmark proximity uses existing milestone targets with direction-aware gap handling
- non-comparable and unsupported evidence is excluded from ranking
- bodyweight-ratio benchmarks require valid bodyweight evidence
- PR readiness states: READY, APPROACHING, NOT READY, INSUFFICIENT EVIDENCE, ESTIMATED ONLY, RECENT REGRESSION
- readiness is evidence-based and not a guarantee

State handling includes distinct outcomes for no history, insufficient comparable history, remote load failure, local fallback active, authentication required, invalidated/incomplete evidence, and calculation-unavailable states.

## Build 006A Connected Dominion architecture (unreleased)

Build 006A adds a provider-neutral architecture for future Strava, Garmin, Apple Health, Fitbod, and MyFitnessPal integrations. All providers are `ARCHITECTURE_ONLY` or `PLANNED`: no real integrations, OAuth, credentials, tokens, provider API calls, background jobs, or write-back are active.

The new `CONNECTED` section contains Overview, Providers, Accounts, Sync History, Imported Records, and Privacy views. Users may create visibly simulated accounts after reviewing provider-supported read permissions and run manual DEMO syncs against built-in fixture data only. Simulated accounts, demo jobs, and demo records remain explicitly labeled. Disconnect preserves history, and retry creates a new auditable job.

The runtime models connected accounts, provider permissions, sync jobs, and canonical imported records. Provider record identity is the primary deduplication key; a stable provider/data/time/activity/duration/distance-or-load signature is used only when a provider ID is unavailable. Deduplication never crosses providers and never silently merges provider imports with manual entries.

Supported mapping is deliberately narrow:

- `RUN` maps only with positive distance and duration.
- `STRENGTH_SESSION` / `EXERCISE_SET` map only with an exact exercise identity, sets, repetitions, and load.
- `BODYWEIGHT` maps to body metrics and never creates an athletic trophy.
- `CONDITIONING_SESSION` maps only with an exact protocol and measurable result.
- Unsupported and partial health records remain auditable as `UNMAPPED`; invalid numeric records are `REJECTED`.

Mapped entries pass through the existing Performance normalization and validation path and preserve source provider, account, source record, imported record, sync job, source update time, evidence status, and demo designation. Manual and imported records remain distinguishable.

Migration `supabase/migrations/009_connected_dominion_architecture.sql` adds owner-scoped `connected_accounts`, `integration_sync_jobs`, and `imported_records` tables with RLS, constraints, indexes, and safe updated-at triggers. Local fallback uses user-scoped `coach-dominion:connected-accounts:<user>`, `coach-dominion:integration-sync-jobs:<user>`, `coach-dominion:imported-records:<user>`, and `coach-dominion:connected-ui:<user>` keys. Remote load failure is surfaced as `LOCAL FALLBACK`; it is never presented as empty remote data or remote success.

Run `node tests/connected-dominion.test.js` for the provider, permission, lifecycle, deduplication, provenance, mapping, immutability, and storage-state suite. Provider-specific OAuth, token refresh, webhooks, background sync, API clients, and provider deletion remain future scope.

Accessibility and responsive behavior include semantic headings, keyboard-accessible controls, visible focus states, aria-selected tabs, aria-live intelligence updates, reduced-motion support, and clean stacking across desktop/tablet/mobile layouts.

Known unrelated issue (not addressed in Build 005D):
- Weekly Inspection currently has a live Supabase schema-alignment defect involving a legacy weekly_inspections path. Build 005D intentionally does not modify Weekly Inspection persistence, migrations, or business logic.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Login and session detection |
| `/app` | Authenticated War Room, rewritten to `app.html` |
| `/api/health` | Service health response |
| `/api/config` | Browser-safe Supabase client configuration |

## Prerequisites

- Git
- A supported Node.js LTS release with npm
- Vercel CLI for full local routing and serverless-function behavior
- Access to an appropriately configured Supabase project for authenticated application use

There are no third-party npm project dependencies, so `npm install` is not required to run the tests.

## Clone and open

```sh
git clone <repository-url>
cd Coach-Dominion2
```

Open the directory in your editor. Work from a build branch rather than directly on `main`; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment variables

The application requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For local development, store values in `.env.local` or configure them through the Vercel CLI. Environment files are ignored by Git. Never paste real values into documentation, source files, commits, issues, or pull requests. Do not use a Supabase service-role key in this browser application.

Production and preview variables are managed in Vercel. Supabase Authentication must have the correct site URL and allowed redirect URLs, including the deployed `/app` route.

## Run locally

From the repository root, authenticate/link the Vercel CLI if your environment has not already been configured, then run:

```sh
vercel dev
```

Open the local URL printed by the CLI. This is preferred over opening `index.html` directly because the application relies on Vercel routes and `/api/config`.

Do not run migrations merely to view the UI. Apply or alter Supabase migrations only as part of an explicitly approved database change.

## Automated tests

Run the complete suite:

```sh
npm test
```

Run suites individually:

```sh
npm run test:readiness
npm run test:atlas
npm run test:compliance
npm run test:weekly
npm run test:trends
npm run test:standards
npm run test:ux
```

The underlying direct commands are:

```sh
node tests/readiness-engine.test.js
node tests/atlas-morning-brief.test.js
node tests/compliance-foundation.test.js
node tests/weekly-inspection.test.js
node tests/trends-analytics.test.js
node tests/standards-violations.test.js
node tests/performance-ux.test.js
node tests/performance-intelligence.test.js
```

The compliance panel persists to Supabase after `002_daily_compliance.sql` has been explicitly reviewed and applied through the approved database workflow. Until that table is available, the authenticated browser falls back to user/date-scoped local storage for compliance data only. Local fallback records are device/browser-specific and are not synchronized to Supabase automatically.

## Branch and pull-request workflow

Keep `main` deployable. Create one branch per build using `build-###x-description`, inspect before editing, run all tests, and open a pull request. Validate the Vercel preview before merging. Repository agents must not push, merge, deploy, or change remote services without explicit approval.

## Windows troubleshooting

PowerShell may block the `npm.ps1` shim with an execution-policy error. Without changing machine policy, invoke the command shim directly:

```powershell
npm.cmd test
npm.cmd run test:readiness
npm.cmd run test:atlas
```

Alternatively, open Command Prompt in the repository and use the normal `npm` commands there. If `vercel` has the same PowerShell issue, use `vercel.cmd dev` or Command Prompt.

If local authentication redirects incorrectly, confirm the local URL is allowed in Supabase Authentication settings. If `/api/config` returns an error, confirm both required environment variables are available to `vercel dev`; do not print their values while troubleshooting.
