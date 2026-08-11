# Changelog

## Unreleased - Build 025N Program Continuity

- Makes the account continuity ledger recoverable by storing the canonical Contract, Strength, Running, Core, Fuel, and Calendar payloads instead of fingerprints alone.
- Proves that every active plan and committed week belongs to one approved Contract revision, while protecting an already-started week on the prior Contract as a deliberate transition.
- Removes false conflicts caused only by save timestamps and automatically upgrades older continuity records that lack recoverable payloads.
- Reserves manual choices for genuine same-revision divergence and lets the recruit resolve each affected program independently.
- Queues failed account writes durably on the device and retries them at startup, on reconnection, or on demand across every canonical program domain.
- Restores account-authoritative payloads into their actual program stores and refreshes Today, Program, Calendar, and Trends without forcing a page reload.
- Ships a word-light continuity view with explicit current, stale, protected-week, queued-save, and account-verified states on desktop and mobile.

## Unreleased - Build 025M Outcome Intelligence

- Rebuilds Trends as a five-domain outcome board for Execution, Training, Recovery, Fuel, and Body instead of a disconnected KPI sampler.
- Compares every selected 4-, 8-, or 12-week window with an equal prior window while keeping incomplete evidence explicit.
- Adds verified Strength work sets, workload, completion, effort, and safety flags plus Running distance and pace and Core session minutes.
- Adds seven-day Energy, Sleep, Resting HR, and HRV comparisons with bounded recovery guardrails.
- Separates Fuel adherence from logging coverage and removes contradictory target and prior-evidence messages.
- Adds smoothed weight context, dedicated domain views, stronger visual hierarchy, and one Atlas win, watch item, and next action.
- Ships a fresh offline shell and responsive phone layout for the upgraded Trends workspace.

## Unreleased - Build 025L Progression Trial

- Turns every recruit-approved load increase into a visible trial on the next matching Strength workout and exact plan revision.
- Judges the trial from recorded sets, repetitions, load, RPE, substitutions, skips, completion state, and pain without changing the plan automatically.
- Gives the recruit three explicit outcomes: retain the progression, repeat the trial, or restore the prior target in a newer audit revision.
- Blocks overlapping Strength revisions until the open trial is resolved and preserves every workout and verdict receipt with account-safe fallback storage.
- Reconciles a rollback into future Calendar assignments while protecting past work and the workout that generated the verdict.
- Shows one concise trial state across Today, Train, My Program, and Calendar with mobile-first controls.

## Unreleased - Build 025K Adaptive Calendar Handoff

- Reconciles an approved load-only Strength revision into future committed Calendar assignments without moving dates or training windows.
- Creates a new committed Calendar revision and receipt while preserving past assignments and any workout already started, reviewed, or completed.
- Keeps Today, Calendar, Train, and My Program on one visible plan revision with a concise synced-state receipt.
- Advances active Strength block and standalone schedule audit stamps without changing phases, exercise selection, sets, or session structure.
- Routes structural program changes to explicit Calendar review instead of applying them silently.
- Makes reconciliation idempotent and account-synced while retaining device-safe fallback state.

## Unreleased - Build 025J Earned Progression Activation

- Converts earned load recommendations into an explicit Approve, Review Each, or Keep Current Plan decision after the workout.
- Allows exercise-by-exercise activation so one earned target can advance while another remains held.
- Creates an immutable plan revision and account-synced activation receipt before the next matching workout consumes new targets.
- Keeps the just-completed workout snapshot unchanged while Today exposes the active plan revision and earned-target state.
- Blocks pain, stopped work, partial evidence, stale plan revisions, and unselected recommendations from changing the program.
- Supports a safe undo that restores prior targets in a newer revision without deleting the original approval audit.

## Unreleased - Build 025I Progression Memory

- Places the last verified sets, load, repetitions, RPE, and date beside every exercise in the live workout.
- Gives each exercise one evidence-governed Atlas target: establish, repeat, add one repetition, add the smallest load step, or hold for safety.
- Lets the recruit load the last workout or the coached target into the set form with one tap while preserving deliberate set confirmation.
- Detects load, repetition, and session-volume records against prior completed workouts without calling a first exposure a personal record.
- Preserves the strongest set, baselines, performance marks, and earned next-load decisions inside the completed workout receipt and account history.
- Keeps pain, stopped work, incomplete sets, missing RPE, substitutions, and RED readiness as hard progression constraints.

## Unreleased - Build 025H Training Integrity

- Repairs stale app-shell delivery so a newly activated service worker reloads the application once and future navigations bypass cached HTML.
- Keeps approved Strength sessions directly loggable while an unapproved revision draft remains open, with explicit copy that the approved workout is being recorded.
- Makes an active workout the dominant Today action even when the Contract, plan links, or coordinated week still require repair.
- Preserves those programming conflicts for after the live session instead of interrupting or hiding an in-progress Lower A workout.
- Rotates the application, operating-truth, and service-worker cache versions so existing devices receive the repaired training path.

## Unreleased - Build 025G Direct Workout Logging

- Makes every session in the approved Strength plan directly executable instead of leaving Lower A and its peers as read-only previews.
- Adds one `Log this workout` action that starts a dated execution snapshot and opens the existing exercise-by-exercise set logger on Today.
- Preserves logged sets when the recruit reopens or resumes the same workout and blocks accidental replacement by a second active session.
- Keeps pain and RED readiness as hard safety stops, and records that a plan session was selected without rewriting the approved Calendar.
- Rotates the Strength engine and application asset URLs so the logging controls appear after refresh.

## Unreleased - Build 025F State Repair

- Removed the misleading login reconciliation sentence; recoverable optional surfaces now stay out of the recruit-facing command status.
- Fixed Atlas activation so an existing approved Fuel plan is accepted instead of being rejected as an invalid profile.
- Uses the signed profile plus current Roll Call weight when Atlas needs to rebuild Fuel, preventing stale profile-shape blockers.
- Added a durable Core snapshot to the existing Dominion account continuity ledger so Core plans, drafts, history, and todayâ€™s execution survive sessions even when the legacy Core table is unavailable.
- Restores the newest Core state automatically and retries account writes through the continuity ledger without requiring a new database migration.

## Unreleased - Build 025E Morning Verification Loop

- Reconciles today’s Roll Call with the latest Mission debrief, recovery order, and personal readiness baseline.
- Issues one authoritative daily clearance: Proceed, Reduce Today, or Recovery Only.
- Applies bounded same-day guardrails across Strength, Cardio, Core, and Mission Execution without mutating approved plans.
- Carries unresolved recovery and safety evidence into the next morning instead of silently resetting it.
- Stores one idempotent decision receipt on the device and signed-in account, including the three strongest supporting signals.
- Adds a word-light Today surface that makes the decision, evidence, and next action immediately clear on desktop and mobile.

## Unreleased - Build 025D Executable Recovery Orders

- Replaces the passive Mission recovery recommendation and the separate one-click Today flag with one authoritative recovery order.
- Sequences hydration, fueling, checkpoint, safety, and closeout actions so only the current action can be secured.
- Persists each recovery task and its recruit-confirmed evidence to the device and signed-in account without clearing pain safeguards.
- Carries an unfinished order into the next day instead of silently resetting it at midnight.
- Uses the same order in Mission Execution and the Today Recovery card, preventing duplicate or contradictory completion states.
- Adds weekly recovery adherence to Atlas evidence and blocks automatic progression when multiple recovery orders remain unresolved.

## Unreleased - Build 025C Mission Debrief and Recovery Handoff

- Closes every completed training window with one four-signal debrief instead of another full log.
- Issues an immediate Atlas recovery order for normal completion, split-day recovery, technique limits, partial work, and pain.
- Waits for paired Core work before opening a normal debrief while allowing stopped or pain-held sessions to report immediately.
- Attaches the debrief and coaching order to the original Mission receipts with idempotent account continuity.
- Makes Mission debriefs the authoritative weekly technique and stopped-session evidence so Atlas does not double count Performance history.
- Preserves the active plan and routes material adjustments into the existing recruit-approved weekly review.
- Keeps a completed receipt attached to the AM or PM window that actually ended, even after Today advances to the next order.
- Repairs Core continuity by retrying newer device state to the recruit account, assigning contract-scoped plan revisions, and refreshing the cached Core engine.

## Unreleased - Build 025B Mission Execution Mode

- Replaces scattered training launches with one Today cockpit and one dominant Start action.
- Preserves the committed AM/PM order, keeps the second window behind the existing recovery checkpoint, and treats paired Core work inside its assigned window.
- Shows live Strength set progress, active exercise, and rest timing without duplicating the detailed set logger.
- Adds durable Cardio step and interval tracking with pause-safe active time, partial completion, and pain holds.
- Lets Core movements advance from Today and keeps quality and effort confirmation at session close.
- Creates one idempotent Mission receipt at finish and automatically writes eligible Strength, Cardio, and Core outcomes into Performance evidence.
- Keeps substitutions, skipped work, pain changes, and partial finishes attached to the original session instead of asking the recruit to log them again.

## Unreleased - Build 025A Atlas Adaptive Week

- Opens the next-week coaching review after the current week has produced enough execution and recovery evidence.
- Reconciles committed work, Roll Call readiness, pain, technique-limited or stopped sessions, and Fuel coverage into one bounded Atlas call.
- Proposes protect, deload, rebalance, progress, or hold without mutating the active week or base program.
- Requires recruit approval before material changes reach the next calendar; keeping the current prescription rolls the week forward unchanged.
- Applies approved weekly changes to the executable Strength, Cardio, Core, Fuel, and Calendar layers with an auditable decision receipt.
- Adds a word-light Week Review to Program and an explicit Adapted state to Calendar.

## Unreleased - Build 024N Atlas Week Autopilot

- Rolls an unchanged active Strength, Cardio, Core, and Fuel program into the next executable week automatically.
- Stops Today from treating an unfinished future-week draft as a current-week blocker.
- Pauses automation for real Contract or plan changes, calendar edits, and blocking conflicts while preserving the active week.
- Adds a concise next-week state to Program and a clear auto-committed state to Calendar.

## Unreleased - Build 024M Fuel Receipt Reconciliation

- Reasserts the Fuel baseline named in the active Atlas receipt after account continuity merges.
- Prevents older, future-dated Fuel records from reopening a completed Program link after reload.
- Preserves intentional Fuel changes approved after activation so genuine updates still require review.

## Unreleased - Build 024L Fuel Link Idempotency

- Makes the newly activated Atlas Fuel baseline authoritative for its effective window.
- Preserves older Fuel history while marking overlapping scheduled baselines as replaced, preventing a stale future baseline from forcing the Program page back into repair.
- Keeps subsequent program checks idempotent: an approved, Contract-linked Fuel plan remains active after reload and across future calendar weeks.

## Unreleased - Build 024K Activation Transaction Boundary

- Separates the durable Atlas activation transaction from best-effort UI rendering.
- Prevents a legacy Train, Fuel, Core, Calendar, Contract, or Today renderer from rolling back plans, the committed week, or the activation receipt after those records are saved.
- Keeps render failures visible in safe diagnostics and lets the affected surface recover on reload.

## Unreleased - Build 024J Legacy Calendar History Recovery

- Removes null and malformed legacy entries before Atlas evaluates or replaces the current calendar history.
- Prevents an old empty history row from crashing an otherwise verified Strength, Cardio, Core, Fuel, and Calendar activation.
- Adds safe activation-phase diagnostics while preserving the prior active program on any genuine commit failure.

## Unreleased - Build 024I Verified Calendar Handoff

- Lets a complete Atlas package commit the exact calendar that already passed activation preflight, even while the legacy Contract activation panel still reflects the pre-activation plans.
- Keeps the ordinary manual calendar gate intact; only an exact Contract, revision, week, and unblocked preflight package can use the verified handoff.
- Adds regression coverage for mismatched Contract revisions and blocked calendar drafts, then rotates the application cache.

## Unreleased - Build 024H Resilient Program Activation

- Activates the complete Strength, Cardio, Core, Fuel, and Calendar package on the recruit's device even when one account table is temporarily unavailable.
- Records the exact domains still awaiting account sync and leaves them in the continuity retry path instead of discarding the approved program.
- Adds safe, domain-labeled persistence warnings without logging plan payloads or account identifiers.
- Restores the activation control after a true failure and clearly distinguishes an active device program from a fully synced account program.
- Adds regression coverage for partial account writes and rotates the application and service-worker cache.

## Build 024G Exact-Plan Calendar Handoff

- Stops Atlas from reusing a blocked calendar draft merely because its program and Contract IDs match.
- Preserves a recruit's calendar edits only when the draft points to the exact pending Strength, Cardio, Core, and Fuel plan revisions.
- Adds an explicit preflight blocker for mismatched calendar plan references and a regression for the Contract 10 repair state.
- Rotates the application and service-worker cache so the repaired handoff reaches existing devices.

## Build 024F Contract-Linked Program Integrity

- Separated the staged Atlas package from the active-program receipt so reviewing a replacement can no longer erase the identity of the program still in force.
- Rebuilt stale Calendar drafts against the signed Contract instead of letting an expired prior-Contract week remain the operating preview.
- Added legacy-state normalization for missing plan-readiness records and isolated startup failures so one malformed record cannot stop the authenticated app from hydrating.
- Added direct links from the unified Program card to the real Strength, Cardio, Core, and Fuel plan surfaces.
- Required every account plan write to confirm before committing the coordinated week, preserving the previous program when sync is incomplete.

## Unreleased - Build 024E Atlas Program Repair

- Replaced four separate plan-repair chores with one `Complete my program` action across Today, Program, Contract, and Calendar.
- Preserved every approved plan that already matches the signed Contract and rebuilt only missing or stale links.
- Added a before-approval package preview covering Strength, Cardio, Core, Fuel, the exact week, and named safeguards.
- Kept the existing atomic activation boundary so all plans and the coordinated calendar activate together or the prior program is restored.
- Separated Atlas-fixable gaps from recruit decisions and safety conflicts, with a direct route for anything Atlas cannot resolve automatically.

## Unreleased - Build 024D Atlas Program Calendar

- Replaced after-the-fact plan reconciliation with one Atlas scheduler for Strength, Cardio, Core, Fuel, recovery, and Contract time capacity.
- Treated module dates as preferences while the signed Contract remains the source of truth for weekly load and available days.
- Scheduled long and hard runs first, kept loaded Strength away from hard running, and protected one full recovery day.
- Paired Core as tertiary work inside a Run or Strength window when the combined duration is 120 minutes or less.
- Preserved Two-a-Day capacity, AM/PM separation, the 240-minute ceiling, and uncapped long-run duration.
- Made the staged calendar part of the same atomic program approval so the plans and exact week cannot diverge.
- Kept deliberate calendar moves available and retained them through activation when they remain valid.

## Unreleased - Build 024C Program Command Center

- Added one word-light Program view for the active goal, Contract revision, weekly load, recovery, and all four approved modules.
- Made the current blocker or next order the dominant action instead of asking the recruit to interpret setup screens.
- Added a concise Atlas rationale for training density, Two-a-Day pairing, recovery space, and long-run protection.
- Added controlled change-impact previews for goal, capacity, training-mix, and schedule requests.
- Protected the active week from silent mutation: Contract-level changes require amendment and activation, while schedule changes keep the signed Contract in force.
- Moved Contract editing into the secondary menu so Program becomes the primary operating destination.

## Unreleased - Build 024B Atomic Program Activation

- Added a complete preflight that validates Contract linkage, all four plans, and the proposed calendar before any active state changes.
- Replaced generic activation failures with plain-language blockers and direct corrective guidance.
- Made the device handoff transactional: if activation throws, the previous plans, week, drafts, and receipt are restored.
- Added a durable active-program receipt with Contract revision, effective date, coordinated week, and sync posture.
- Added a guided repair action for missing or mismatched active links without requiring a new Contract.
- Moved future-dated programs to the Contract's effective week instead of activating them into an earlier calendar.

## Unreleased - Build 024A Atlas Program Commissioning

- Replaced four separate plan-approval chores with one coordinated Atlas program package.
- Used the signed Recruit Contract and profile to prepare Fuel, Strength, Core, Cardio, and the first calendar week together.
- Added current weight to the Contract so Fuel starts with explicit, reviewable targets instead of a missing-plan blocker.
- Gave recruits one deliberate approval that activates the complete package while protecting the current week until handoff.
- Kept specialized module editors available for later changes without making them part of first-time activation.
- Added conservative Week One cardio defaults when no running-distance baseline exists, so one missing estimate cannot deadlock setup.

## Unreleased - Build 023F Fuel Closed Loop

- Connected meal planning, eaten confirmation, a 20-second meal response, daily reconciliation, and Fuel closeout into one guided loop.
- Kept MyFitnessPal or manual daily totals authoritative; confirmed meals provide context and are never added a second time.
- Added an explicit stale-sync review when confirmed meal evidence is newer than the current daily total.
- Added account-backed meal feedback and amendable daily Fuel closeouts without requiring a new database migration.
- Gave Atlas one tomorrow recommendation while preserving the approved targets until the recruit deliberately changes them.
- Added a compact weekly view of meal-response energy, closeout coverage, and the strongest emerging meal pattern.
- Fixed meal-state reconciliation so a confirmed meal cannot be replaced by an older planned lifecycle state.

## Unreleased - Build 021G Contract Amendment Save Recovery

- Made Contract amendment navigation local-first so Continue and Review never wait on account sync.
- Recovered the autosave queue after an earlier rejected write instead of leaving every later amendment stuck on Saving.
- Bounded account sync to eight seconds and surfaced a clear device-saved, account-sync-pending state.
- Isolated continuity-ledger failures from the canonical Contract draft save.
- Advanced the app-shell cache so browsers receive the repaired Contract code immediately.

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
