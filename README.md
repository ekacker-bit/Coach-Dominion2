# Coach Dominion

Coach Dominion is a browser-based AI coaching operating system with a disciplined command-center interface. Its current release accepts a daily state report, calculates deterministic readiness, generates a constrained training mission, and presents an Atlas Morning Brief. Readiness and Atlas output are rule-based; the application does not call an LLM.

## Release status

The latest completed release is **Release 0.3.1 — Atlas Morning Brief**. **Build 004B — Weekly Inspection & After Action Report** is unreleased work toward Release 0.4.0; it builds on 004A but does not represent the complete 0.4.0 release. Release history is recorded in [CHANGELOG.md](CHANGELOG.md).

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

The browser loads Supabase JS v2 from jsDelivr. `/api/config` passes the configured Supabase project URL and anonymous client key to the browser. Supabase provides authentication and PostgreSQL persistence; row-level security restricts users to their own Daily State and command-feed records.

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
```

The underlying direct commands are:

```sh
node tests/readiness-engine.test.js
node tests/atlas-morning-brief.test.js
node tests/compliance-foundation.test.js
node tests/weekly-inspection.test.js
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
