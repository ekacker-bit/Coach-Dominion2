# Coach Dominion

Coach Dominion is a browser-based AI coaching operating system with a disciplined command-center interface. Its current release accepts a daily state report, calculates deterministic readiness, generates a constrained training mission, and presents an Atlas Morning Brief. Readiness and Atlas output are rule-based; the application does not call an LLM.

## Release status

The latest completed release is **Release 0.3.1 — Atlas Morning Brief**. **Build 004C — Dominion Record: Trends & Analytics** is unreleased work toward Release 0.4.0; it builds on 004A and 004B but does not represent the complete 0.4.0 release. Release history is recorded in [CHANGELOG.md](CHANGELOG.md).

## Architecture

- `index.html` provides password and magic-link authentication.
- `app.html` contains the authenticated War Room interface.
- `assets/js/app.js` contains Supabase client operations, the Daily State/readiness engine, mission generation, Atlas brief generation, and UI rendering.
- `assets/styles.css` contains the application styles.
- `api/health.js` and `api/config.js` are Vercel Node.js serverless functions.
- `supabase/migrations/` contains the tracked PostgreSQL schema, constraints, row-level security policies, and trigger definitions.
- `tests/` contains dependency-free Node.js assertion tests.
- `vercel.json` defines clean URLs and the `/app` rewrite.

Build 004A adds a daily Dominion Record with five equal-weight compliance domains: mission, strength, running/cardio, recovery, and nutrition. Completed, partial, and missed domains score 100, 50, and 0. Excused and not-applicable domains are excluded. Blank or invalid assessments receive no credit and are excluded as unassessed; when nothing applicable has been assessed, the record remains unscored. Restriction and approved-modification evidence is stored independently, and no Build 004A status automatically creates a violation.

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
```

The underlying direct commands are:

```sh
node tests/readiness-engine.test.js
node tests/atlas-morning-brief.test.js
node tests/compliance-foundation.test.js
node tests/weekly-inspection.test.js
node tests/trends-analytics.test.js
node tests/standards-violations.test.js
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
