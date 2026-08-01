# Changelog

## Unreleased — Build 020B Between-Session Gate

- Replaced the informational Two-a-Day recovery note with a persisted, account-scoped checkpoint.
- Anchored Session 2 eligibility to the actual Session 1 completion time and a four-hour countdown.
- Required a midday energy and pain recheck plus explicit refueling and hydration confirmation.
- Kept Session 2 locked when the checkpoint is missing, the recovery interval is active, or safety evidence is adverse.
- Enforced the same gate through direct module launches so alternate Today controls cannot bypass it.
- Preserved local-first operation when the account migration is not yet available and reconciled saved checkpoints after sign-in.

## Unreleased — Build 020A Split-Day Command

- Turned a committed Two-a-Day into an ordered Session 1 and Session 2 execution sequence.
- Prioritized the first session from the Recruit Contract goal while keeping long runs first and time-open.
- Added a four-hour minimum separation and visible refuel/rehydration bridge between sessions.
- Prevented Session 2 from opening before Session 1 has terminal execution evidence.
- Added direct session launch controls, module status, and current fueling evidence to Today.
- Kept RED readiness, pain holds, the 240-minute non-long-run ceiling, and one protected recovery day authoritative.

## Unreleased — Build 019G Two-a-Day Capacity

- Added an explicit Two-a-Days commitment to the Recruit Contract and bound it to the signed Contract revision.
- Defined a Two-a-Day as two scheduled sessions targeting more than 120 combined minutes, with a 240-minute daily ceiling.
- Carried the commitment into coordinated-week generation, calendar capacity labels, Today context, and activation checks.
- Left long runs uncapped by time, including when they share a day with another assignment.
- Preserved the full recovery day, hard-run plus loaded-strength block, readiness, pain, and fueling safeguards.

## Unreleased — Build 019F Activation Repair Loop

- Added a guided Contract → Plans → Week → Today repair path directly inside One Command.
- Exposed the exact Strength, Running, Core, or Nutrition plan link blocking activation.
- Reused deliberate plan staging, module approval, coordinated-week build, and week commitment controls without silently changing active plans.
- Added deterministic deep links to the broken module, Contract signature, or weekly calendar.
- Added a timed reconciliation fallback so Today cannot remain indefinitely in `ASSEMBLING`.
- Confirmed an operational week immediately after successful commitment and returned the recruit to Today.
- Upgraded the mobile brand mark to a clearer gold-edged Dominion shield with a high-contrast monogram.
- Replaced the empty Recovery placeholder with an executable readiness-driven order, visible evidence posture, deliberate completion, undo, and full-review handoff.
- Wired Recovery completion into the existing daily execution queue, closed-loop evidence, and Daily Seal without clearing safety holds or changing an approved plan.

## Unreleased — Build 019E One Command UX

- Rebuilt Today around one dominant command sourced from the 019D operating truth layer.
- Added a compact six-stage progress rail, assigned-domain status chips, and one contextual secondary action.
- Consolidated the committed plan, adaptive coaching, evidence status, coaching logic, and setup guidance into one collapsed context drawer.
- Moved the full execution sequence behind progressive disclosure and shows the Daily Seal only when review, adaptation, or secured-day action is relevant.
- Removed the duplicate mobile command card while preserving thumb-friendly Roll Call and fuel capture sheets.
- Hid the global mission rail on Today so the user sees one authoritative next action rather than two competing commands.

## Unreleased — Build 019D Operating Truth

- Added a deterministic truth hierarchy from Recruit Contract through plans, committed week, Today, evidence, and review.
- Replaced optimistic completion labels with canonical `PLANNED`, `READY`, `IN PROGRESS`, `VERIFY`, `COMPLETE`, and `RECORDED` states.
- Prevented work outside the committed week from counting as planned completion.
- Added explicit repair guidance for Contract revision mismatch, missing plan links, uncommitted weeks, and time-commitment conflicts.
- Wired the global mission rail, mobile command, and Daily Seal to the same truth engine.
- Expanded the operating journey to include Evidence and Review, with responsive conflict and source summaries.

## Unreleased — Build 019C Daily Seal

- Turned end-of-day reconciliation into a deliberate Daily Seal ritual rather than an administrative close button.
- Added an Execute → Record → Verify → Adapt progression rail driven entirely by the existing daily queue and closed-loop coaching state.
- Added contextual states for work in motion, evidence verification, final review, proposed adaptation, protected RED-readiness days, and a fully secured day.
- Added live evidence confidence, secured-day count, consecutive-day chain, and current rank to the closing artifact.
- Added a subtle signed-day ceremony and clear next action while preserving reduced-motion behavior and mobile usability.
- Reused canonical Daily State, execution, Dominion Record, review, adaptation, and history data without adding storage or silently changing a plan.

## Unreleased — Build 019B Dominion Experience Shell

- Replaced the generic War Room masthead with a persistent Coach Dominion identity, current section context, and visible rank.
- Added one deterministic current-order rail that connects Contract, plans, coordinated week, and Today into a single operating journey.
- Added contextual next actions for unsigned contracts, incomplete plan links, week building, week commitment, Morning Roll Call, protected RED-readiness states, and daily execution.
- Reduced dashboard language across primary modules and removed internal build labels from the rendered experience while retaining source-level release markers.
- Removed the redundant Today training-assignment placeholder now that the live prescription and completion controls are authoritative.
- Established a navy, forest, and gold visual system, reserved crimson for danger, increased hierarchy and whitespace, and strengthened responsive and reduced-motion behavior.
- Reused existing Contract, plan, week, readiness, rank, and account state without introducing a second source of truth or new persistence.

## Unreleased — Build 019A Dominion Contract Experience

- Reframed Recruit Contract setup as a four-stage commitment flow: Outcome, Capacity, Standards, and Review.
- Added a Dominion seal, oath, typed signature, effective-date confirmation, and deliberate signing dialog.
- Made signatures revision-bound so an amended Contract must be reviewed and signed again; prior signed revisions remain immutable in account history.
- Replaced the approved-form default with a signed Contract artifact containing the declaration of intent, exact commitments, signature metadata, and Contract identity.
- Added a post-sign progression rail from Contract Signed through Plans Linked, Week Committed, and Day One Ready with a single contextual next action.
- Preserved active module plans during approval and amendment, reused existing account-scoped persistence, and added deterministic engine and integration coverage.

## Unreleased — Build 015A Automated Nutrition Feed

- Added a supported MyFitnessPal-to-Coach-Dominion path through Apple Health and a user-owned iPhone Shortcut.
- Added revocable, one-time-visible feed keys; Coach Dominion never receives or stores MyFitnessPal credentials.
- Added a serverless ingestion endpoint and security-definer Supabase function that accept only daily calories, protein, carbohydrates, fat, date, timezone, and sample count.
- Added deterministic daily upserts, duplicate detection, sync history, delivery audit events, and a live MyFitnessPal Connected account state.
- Added Nutrition setup, verification, rotation, revocation, delivery status, and privacy controls while retaining manual CSV import as a fallback.
- Added migration 014 with row-level security and automated-feed regression coverage. Raw food diaries and raw Apple Health records are not stored.

## Unreleased — Build 014A Closed-Loop Coaching

- Added one deterministic daily coaching loop across Observe, Decide, Authorize, Execute, Verify, and Adapt.
- Added immutable decision fingerprints so evidence is reconciled against the exact approved prescription.
- Added cross-domain verification for strength, running, core, fueling, recovery, and the Dominion Record.
- Added explicit evidence confidence, completion coverage, missing-domain blockers, and pain/technique safeguards.
- Added bounded next-adjustment proposals for protect, regress, reduce, hold, repeat, or conservative progression.
- Required deliberate approval for both the daily decision and any future adjustment; no approved plan is mutated automatically.
- Added user-scoped Supabase persistence with device fallback, Today and Training review surfaces, migration 013, and regression coverage.

## Unreleased — Build 013C Core Programming & Execution

- Added a deterministic four-week Abs/Core plan built from goal, experience, equipment, weekly frequency, and session length.
- Added explicit draft and approval states so a newly generated cycle never silently replaces the active plan.
- Balanced every cycle across anti-extension, anti-rotation, anti-lateral-flexion, trunk/hip-flexion, and carry/bracing work.
- Added a Today core prescription with movement targets, coaching cues, substitutions, set completion, session quality, and effort capture.
- Added readiness safeguards: Yellow may only reduce sets, while Red readiness or pain removes the session and blocks progression.
- Added evidence-based next-cycle recommendations, automatic Performance entries, user-scoped local fallback, and RLS-protected account persistence.
- Added deterministic engine, safety, execution, evidence, and persistence regression coverage.

## Unreleased — Build 013B Simplified Training Workspace

- Replaced the nine-item Performance navigation with five clear training destinations: Today’s Training, Log, Running, Abs/Core, and Progress.
- Consolidated programming and recovery guidance inside Today’s Training while preserving the existing approval and evidence workflows.
- Consolidated intelligence, fitness tests, personal records, and milestones inside one progressive-disclosure Progress workspace.
- Added an operational Abs/Core destination with weekly session, repetition, time-under-tension, active-day, recent-history, and next-milestone views.
- Added direct Abs/Core training and benchmark entry actions plus compatibility routing for legacy performance destinations.
- Added keyboard-operable destination tabs and regression coverage for navigation, compatibility aliases, and core-workspace calculations.

## Unreleased — Build 006A Connected Dominion architecture

- Added a deterministic provider catalog for Strava, Garmin, Apple Health, Fitbod, and MyFitnessPal; every provider remains architecture-only or planned.
- Added provider-neutral connected-account, permission, sync-job, imported-record, validation, deduplication, provenance, and Performance-mapping helpers.
- Added the top-level Connected experience with explicit Overview, Providers, Accounts, Sync History, Imported Records, and Privacy states.
- Added visibly simulated account connections and manual DEMO sync fixtures; no OAuth, credentials, tokens, live APIs, or write-back.
- Added user-scoped local fallback and remote-first Supabase persistence with explicit remote failure handling.
- Added migration 009 with RLS-protected connected accounts, sync jobs, and imported records.
- Added Connected Dominion regression coverage and retained the complete Build 005D regression suite.
- Release 0.6 is not complete.

This file records verified Coach Dominion release capabilities. The repository has no release tags or authoritative release dates, so dates are intentionally omitted.

## Unreleased — Build 005D: Performance Intelligence

- Added a deterministic Performance Intelligence layer that derives comparable series, trajectory classifications, confidence states, plateau/regression watch signals, benchmark proximity, and PR-attempt readiness from existing performance history.
- Added a new Performance INTELLIGENCE view with status strip, domain cards, watchlist, next benchmark panel, PR readiness panel, fitness-test event intelligence, Atlas intelligence brief, and explicit evidence-limitations output.
- Added deterministic handling for insufficient data, local fallback, remote load failure, and estimated-only evidence states.
- Added dependency-free regression coverage in [tests/performance-intelligence.test.js](tests/performance-intelligence.test.js) and UI/state coverage in [tests/performance-ux.test.js](tests/performance-ux.test.js).
- This remains unreleased Build 005D work and does not mark Release 0.5.0 complete.

## Unreleased — Build 005A: Performance Logging Foundation

- Added an unreleased Performance Logging section to the War Room with strength, running, core, conditioning, fitness-test, and body-metrics entry support.
- Added Build 005B extensions for fitness-test attempts, personal-record generation, milestone achievements, and Atlas review summaries.
- Added deterministic validation, strength-volume calculations, estimated-1RM calculations, running-pace calculations, summary cards, filters, and edit/delete actions.
- Added stable client-side performance-entry identifiers and exact-id deletion semantics so entries are removed deterministically without deleting arbitrary anonymous records.
- Added remote Supabase persistence through [supabase/migrations/006_performance_logging.sql](supabase/migrations/006_performance_logging.sql) and browser-local fallback behavior with user-scoped storage.
- Added regression coverage for normalization, validation, calculations, persistence payloads, summary logic, and deletion behavior.
- This remains unreleased Build 005A work and does not mark Release 0.5.0 complete.

## Unreleased — Build 004F: Rank & Promotion

- Added a deterministic rank ladder anchored at RECRUIT and advancing one step at a time through CADET, OPERATOR, VANGUARD, DOMINION, and ASCENDANT.
- Added promotion evaluation based on finalized inspection count, recent Discipline Score, evidence coverage, consecutive qualifying weeks, domain strength, standards/violation history, and corrective-period state.
- Added promotion eligibility states, deterministic Atlas Promotion Review output, explicit promotion confirmation, and immutable promotion-history storage.
- Added the Rank section to the War Room UI, local fallback persistence for rank status and promotion history, and a new Supabase migration for owner-scoped rank persistence.
- Added a new rank-promotion regression suite and included it in the main test script.

## Unreleased — Build 004E: Standards & Violations

- Added a deterministic standards catalog and violation-candidate engine that remains supplemental to the Dominion Record and Weekly Inspection scoring logic.
- Added protected-exception handling for excused statuses, N/A, approved modifications, readiness restrictions, illness, injury, and insufficient evidence.
- Added a standards review lifecycle for `CANDIDATE`, `UNDER REVIEW`, `CONFIRMED`, `CORRECTED`, `RESOLVED`, `DISMISSED`, and `EXCUSED` with explicit, non-punitive corrective actions and audit-event logging.
- Added Standards & Violations UI in the War Room with review queue, Atlas review output, and audit history.
- Added owner-scoped standards persistence through [supabase/migrations/004_standards_violations.sql](supabase/migrations/004_standards_violations.sql) and browser-local fallback behavior with user-scoped keys.
- Added standards-and-violations regression coverage and included the suite in the full test command.
- This remains unreleased Build 004E work; it does not alter finalized inspection snapshots or the existing scoring formulas.

## Unreleased — Build 004C: Dominion Record Trends & Analytics

- Added deterministic four-week finalized-inspection trajectories, evidence-quality precedence, five domain directions, historical summaries, and calendar-contiguous compliance streaks.
- Added responsive dependency-free SVG discipline and evidence charts with finalized/provisional distinctions, fixed axes, limited-evidence flags, accessible text equivalents, and empty states.
- Added a rule-based Atlas Trend Report that distinguishes insufficient evidence from documented poor performance.
- Added user-scoped Supabase/local history derivation without storing redundant analytics state or recalculating finalized snapshots.
- Added dependency-free trend analytics tests and included them in the full test command.
- This remains unreleased Build 004C work toward Release 0.4.0; it does not mark the release complete.

## Unreleased — Build 004B: Weekly Inspection & After Action Report

- Added deterministic Monday-through-Sunday aggregation of Build 004A Dominion Record observations, including five domain scores, observation/day counts, evidence coverage, tie-aware rankings, safety signals, and rule-based next-week priorities.
- Added the Weekly Inspection War Room panel with week selection, evidence review, Atlas After Action Report, finalization controls, and read-only historical snapshots.
- Added owner-scoped `weekly_inspections` persistence with finalized-snapshot protection and user/week-scoped browser-local fallback.
- Added dependency-free weekly inspection tests and included them in the complete test command.
- This remains unreleased Build 004B work toward Release 0.4.0; it does not mark the release complete.

## Unreleased — Build 004A: Dominion Record Compliance Foundation

- Added five-domain daily execution records for mission, strength, running/cardio, recovery, and nutrition compliance.
- Added deterministic equal-weight Discipline Score calculation with transparent included/excluded evidence and an unscored state.
- Added non-punitive excused, not-applicable, restriction, and approved-modification representation without creating violations.
- Added an editable Dominion Record panel with Supabase persistence and isolated browser-local fallback behavior.
- Added the owner-scoped `daily_compliance` migration and deterministic Node assertion coverage.
- This is foundation work toward Release 0.4.0; Weekly Inspection and a full violations system remain out of scope.

## Release 0.3.1 — Atlas Morning Brief

- Added a deterministic Atlas command-voice layer driven by the existing readiness result.
- Added the four command states: Roll Call Required, Mission Authorized, Mission Reduced, and Hard Training Denied.
- Added a War Room Morning Brief panel with status, directive, command note, orders, restrictions, confidence, risk, and missing-evidence context.
- Added Node assertion coverage for all command states and RED/YELLOW safety constraints.

## Release 0.3.0 — Readiness Engine 2.0

- Expanded readiness output with confidence weighting, rationale, evidence availability, primary risk, instructions, and restrictions.
- Preserved deterministic GREEN, YELLOW, and RED readiness behavior, including the pain override.
- Connected mission, Daily Intelligence, and command-feed behavior to the shared readiness result.
- Added the dependency-free readiness-engine test suite.

## Release 0.2.0 — War Room and Mission Board

- Expanded the authenticated application into a War Room command-center layout.
- Added the Mission Board, readiness intelligence, command feed, Daily Intelligence, status bar, and Daily State summary.
- Added generated mission guidance and command events based on the user's current Daily State.

## Release 0.1.0 — Daily State Engine

- Added Morning Roll Call capture for energy, soreness, pain, optional recovery metrics, confidence, and comments.
- Added deterministic readiness and mission foundations in the browser application.
- Added Supabase `daily_state` and `command_feed` schema migrations with validation, row-level security, and user-scoped policies.
- Added authenticated persistence and retrieval of each user's current daily state.
