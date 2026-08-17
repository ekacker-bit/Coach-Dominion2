# Changelog

## Unreleased - Account Persistence Receipts

- Automatically drains protected account saves after sign-in, token refresh, connectivity recovery, and a visible-tab return.
- Gives every account write a stable mutation ID so a retry cannot duplicate an already accepted save.
- Preserves revision checks so an older device cannot overwrite a newer account revision.
- Clears the pending state only after the server returns the same program and account-truth fingerprints.
- Keeps Account Saved, Verifying, Sync Pending, Offline Protected, and Retry Required as distinct states.

## Unreleased - Canonical Daily Command

- Establishes one committed program-week-day authority for Today, Train, Fuel, Recovery, Program, Calendar, Quick Log, and Closeout.
- Keeps draft calendar assignments visible for review but makes them non-executable everywhere else.
- Replaces competing setup actions with one instruction: Commit the coordinated week.
- Prevents an uncommitted week from being mislabeled as a recovery day or receiving recovery-day Fuel targets.
- Preserves committed Two-a-Day AM/PM windows and uncapped long-run truth across every daily surface.
- Adds explicit Draft, Ready to Commit, Active, Completed, and Superseded lifecycle state to the canonical object.

## Unreleased - Account Enrollment & Daily Closeout

- Adds a deliberate Create Account path that sends new recruits into the Contract after confirmation.
- Keeps password recovery from silently creating an account and handles confirmation-required signup safely.
- Establishes a server-controlled access tier for future trials and paid memberships without adding payment behavior now.
- Restores Daily Closeout as the final commitment in Today after the Daily Record.
- Keeps final steps, discipline answers, and amendments in the existing account-backed Closeout record.
- Prevents the daily loop from reporting complete until the Closeout is sealed.

## Unreleased - Release Stabilization & Daily Command Repair

- Replaces competing startup writers with one idempotent, account-scoped save and a bounded retry queue.
- Keeps device fallback quiet and durable while distinguishing device saves, account saves, pending work, and explicit conflicts.
- Reorders Today into one command-first path and makes recovery days read as recovery rather than failed training days.
- Centralizes percentage formatting and program lifecycle language across Program, Calendar, Contract, Today, and the header.
- Makes Connections report setup, freshness, pending work, conflicts, failures, and missing evidence truthfully.
- Protects completed and past calendar work while revealing move controls only during focused editing.
- Adds explicit Supabase Data API grants without weakening row-level security.

## Unreleased - Build 028E Transformation Ledger

- Turns Trends into one start-to-now transformation story instead of a collection of analytics cards.
- Combines weight, measurements, private photo checkpoints, Strength, Running, adherence, recovery, standards, and campaign progress.
- Makes evidence confidence explicit across nine proof domains and never converts a thin baseline into a progress claim.
- Shows one concise statement of what changed and one next coaching order.
- Keeps detailed Training, Recovery, Fuel, and Body views available without adding another destination.
- Fits the complete ledger on desktop and mobile without exposing release language to the recruit.

## Unreleased - Build 028D Weekly Replanning

- Turns Weekly Review into one coaching proposal built from prescribed work, completed evidence, and readiness.
- Names one limiting factor instead of asking the recruit to interpret a dashboard.
- Shows the current week beside the proposed next week, including training windows, minutes, recovery, and domain-level changes.
- Uses one approval to save the coaching decision, adapt the draft, and commit the coordinated calendar when it is clear.
- Preserves the current week and completed evidence, and carries a durable approval receipt into the next calendar.
- Keeps the recruit-facing review free of release language and makes the full comparison responsive on phones.

## Unreleased - Build 028C This Doesn't Fit Coach

- Gives the recruit one Today response surface for pain, fatigue, travel, equipment, time, and preference constraints.
- Shows Atlas's exact day-only adjustment and its tradeoff before anything changes.
- Preserves the approved program, future calendar, and Fuel targets while applying only the authorized daily override.
- Routes live-adaptation disagreement into the same coaching flow instead of opening a second feedback form.
- Stores the bounded decision and restore path in the recruit account without persisting free-form context in analytics events.
- Keeps pain safety-led by directing the recruit back to Roll Call before training again.

## Unreleased - Build 028B Frictionless Execution

- Adds one compact Today dock that opens Strength, Running, Core, Fuel, Recovery, or Closeout directly.
- Resumes active sessions before presenting lower-priority ready work.
- Protects unfinished Fuel totals, run review fields, and Daily Closeout entries across refreshes and signed-in devices.
- Reuses the durable Strength, Running, Core, Recovery, and evidence engines rather than creating duplicate logging paths.
- Keeps the recruit-facing surface word-light and hides internal release language.

## Unreleased - Build 028A Trust Layer

- Verifies the complete Contract, program, calendar, Today, and evidence chain at startup and after reconnection.
- Repairs safe account drift, queued saves, and missing Today decisions automatically while preserving deliberate recruit choices.
- Protects offline work and distinguishes sync delay from actual program failure.
- Adds private, allowlisted production events for trust checks, repair attempts, and runtime failures without logging recruit data.
- Replaces technical account language with a compact Account Health readout and one action only when the recruit must decide.
- Adds end-to-end regression coverage and repairs the stale brand-copy check that was blocking release validation.

## Unreleased - Build 027F Daily Decision Integrity & Mobile UX Repair

- Establishes one dated, versioned Daily Decision across Today, Calendar, Strength, Running, Core, Fuel, Recovery, and Review.
- Confines missing-plan blockers to the affected domain, preserving completed work and every other approved session unless the Contract explicitly requires an all-or-nothing hold.
- Rebuilds Today around one order, one reason, one action, compact evidence, and the actual session schedule.
- Makes Weekly Review honest about evidence coverage, assessed days, unscored days, and thin-sample conclusions.
- Keeps finalized Contracts read-only until Amend is chosen and simplifies Connections into current, stale, setup, demo, and failed states.
- Locks the mobile dock to Today, Train, Fuel, Review, and More while preventing dock overlap and horizontal status scrolling.
- Removes release numbers and repetitive brand prefixes from the product UI, keeping Coach Dominion identity in the header and Contract ceremony instead of every card.

## Unreleased - Build 027E Campaign Verdict & Re-Enlistment

- Turns the 12-week close into one credible verdict: advance, re-enlist, or recommission.
- Compares campaign-opening and campaign-closing body, photo, and performance evidence without treating missing proof as failure.
- Separates what was earned, missed, and learned and names which verified Atlas adaptations actually worked.
- Requires a final body checkpoint and deliberate recruit authorization before the immutable verdict is issued.
- Prefills the next Contract from demonstrated results, missed conditions, and verified lessons while preserving recruit review and signature authority.
- Keeps the conclusion mobile-first and word-light with one obvious next mission.

## Unreleased - Build 027D Connected Evidence

- Reconciles Apple Health, Health Connect, Fitbod, MyFitnessPal, Garmin, and Strava evidence against the committed Coach Dominion calendar.
- Awards one verified proof per assignment even when multiple providers describe the same session.
- Surfaces only materially conflicting or unmatched imports; normal training days require no reconciliation.
- Adds a user-controlled Health Connect JSON bridge for Android workouts, steps, sleep, RHR, HRV, and body weight without storing Google credentials or raw files.
- Feeds clean connected proof into Evidence Autopilot, Trends, and weekly review while leaving the Recruit Contract and approved program unchanged.
- Replaces nine technical connection tabs with Overview, Sources, and Review and keeps provenance machinery behind diagnostic disclosure.

## Unreleased - Build 027C Recovery Command

- Turns sleep, resting heart rate, HRV, energy, soreness, pain, and recent training load into one green, amber, or red morning posture.
- Tells the recruit exactly what changes today, then coordinates that order across Strength, Running, Core, Today, and Calendar.
- Protects priority work and uncapped long runs when possible while removing secondary volume before compromising the main session.
- Converts red days into a recovery-only prescription without changing the Recruit Contract, Dominion Campaign, or Fuel targets.
- Measures the next Roll Call after every completed intervention and records whether the recovery order helped.
- Keeps the mobile card word-light with one dominant action and personal-baseline signals behind the coaching decision.

## Unreleased - Build 027B Atlas Progression Engine

- Converts completed Strength, Running, and Core evidence into one exact next prescription instead of leaving separate progression widgets to compete.
- Advances load or bodyweight repetitions, running duration or quality pace, and earned Core-cycle targets through bounded domain rules.
- Detects pain, stopped work, repeated misses, and high exertion before progression and explains the decision in one sentence.
- Requires deliberate approval before revising an active plan and never rewrites the Recruit Contract or Dominion Campaign.
- Persists the current order and its decision history to the recruit account with device-first continuity.
- Refreshes the next prescription immediately after completed work and keeps the other domain calls behind one compact disclosure.

## Unreleased - Build 027A Campaign Commissioning

- Replaces separate post-Contract chores with one commissioning path across Contract, baseline order, complete program, opening Calendar, and campaign launch.
- Distinguishes true launch blockers from recommended Week One body, performance, and recovery evidence so optional measurements never deadlock activation.
- Makes one Begin Campaign authorization atomically activate Strength, Cardio, Core, Fuel, and the exact preflighted opening week.
- Stores a Contract-bound commissioning receipt on-device and in the recruit account while automatically recognizing already-active programs without repeating setup.
- Shows the exact blocking issue and next action while keeping detailed orientation and preflight controls behind one setup disclosure.
- Connects the Dominion Campaign order to commissioning language and preserves the existing rollback-safe Atlas activation transaction.

## Unreleased - Build 026L Fuel Day Ledger

- Replaces the buried daily-total workflow with one prominent calories, protein, carbs, and fat action in Fuel.
- Makes one canonical day record drive Today, Fuel, Trends, Evidence Autopilot, and weekly nutrition coaching.
- Preserves manual entries when MyFitnessPal is absent or incomplete and reconciles them when a complete import arrives.
- Treats a complete daily total as valid Fuel evidence without forcing meal-by-meal logging or a separate closeout.
- Moves fasting, meal construction, timing, and closeout into optional Precision Tools so the standard path stays simple.
- Keeps the fast mobile Fuel form on the same account-backed record and supports offline continuity.

## Unreleased - Build 026K Dominion Campaign

- Turns the signed Recruit Contract and approved Atlas program into one finite 12-week campaign with Foundation, Build, Pressure, and Prove phases.
- Establishes five explicit win conditions across execution, trusted proof, qualifying weeks, standards, and measurable outcome evidence.
- Gives the recruit one current campaign order and an honest finish forecast without creating another approval step.
- Connects the campaign to Program, Today, and Weekly Review so daily work and weekly judgments visibly serve the declared outcome.
- Persists one deterministic current campaign and idempotent history to the account with device-first continuity.
- Preserves separate credit for same-day Strength, Cardio, Core, and Fuel requirements while incomplete work remains unearned.

## Unreleased - Build 026J Evidence Autopilot

- Reconciles Strength, Cardio, Core, Fuel, Roll Call, daily closeout, recovery, and existing performance records into one canonical proof trail.
- Uses stable action identities and source lineage so repeated syncs or a parallel performance summary cannot create duplicate credit.
- Keeps connected-provider evidence verified, recruit-entered evidence self-reported, and unfinished actions incomplete.
- Repairs a missing training summary for Trends only when no matching Coach Dominion performance evidence already exists.
- Feeds the proof trail into Today, Weekly Review, Trends, and Account Truth without adding another dashboard or changing weekly scoring.
- Adds a concise rebuild control and scheduled-gap count so missing evidence is visible and recoverable.

## Unreleased - Build 026I Account Truth

- Adds one versioned account snapshot for profile and orientation, readiness, performance evidence, daily closeouts, mission receipts, and Atlas coaching memory.
- Reconciles concurrent device and account records without allowing a newer incomplete orientation or stale evidence copy to erase completed work.
- Saves the canonical program manifest and broader account truth in one revision-checked transaction.
- Protects the latest complete snapshot on-device when offline and retries it automatically when the connection returns.
- Extends the existing saved-program dialog with a concise health check instead of adding another dashboard.
- Falls back to the proven program-continuity ledger until Migration 028 is active, with an explicit status instead of a silent failure.

## Unreleased - Build 026H Adaptation Outcomes

- Closes each completed 72-hour Atlas decision against post-window Roll Call, execution, and closeout evidence.
- Distinguishes a helpful adjustment, a correctly held plan, an unresolved signal, and insufficient evidence in plain language.
- Requires moderate or high independent evidence before a result can become an Atlas coaching lesson.
- Lets the recruit keep or challenge the conclusion; challenged and inconclusive results never enter calibration memory.
- Adds one compact outcome to Today and the matching weekly Review without creating another dashboard or silently changing a plan.

## Unreleased - Build 026G Adaptive Tomorrow

- Turns verified readiness and completed execution into one bounded recommendation for the next 72 hours.
- Keeps a healthy recruit on the committed plan, proposes a short deload after degraded readiness, and protects the next exposure after pain or a stopped session.
- Requires recruit approval for non-safety changes while applying clear, reversible safety protection automatically.
- Applies approved changes to Today, Training, and Calendar without adding sessions, rewriting the Contract, or changing approved Fuel targets.
- Keeps long-run duration open and expires every recommendation after three days or when the Contract or calendar revision changes.

## Unreleased - Build 026E Daily Command UX Repair

- Adds one deterministic Daily Decision that governs Today, Training, Fuel, Recovery, and the current-week Calendar.
- Makes the first missing required plan the dominant repair order and prevents affected workouts or progression from executing until the program agrees.
- Reorders Today around one action, readiness, schedule, evidence, closeout, rationale, and optional technical detail.
- Reduces the mobile shell to Today, Train, Fuel, Review, and More while keeping secondary destinations and account actions accessible.
- Keeps a finalized Contract read-only until the recruit explicitly starts an amendment draft.
- Preserves Weekly Review scoring and promotion evidence with regression coverage.

## Unreleased - Build 026D Weekly Judgment

- Replaces the sprawling Inspection and separate Rank screens with one weekly verdict: earned, not earned, ready, or still building.
- Shows only three forms of proof at first glance: execution score, evidence coverage, and standards record.
- Places rank advancement directly beneath the verdict with four plain-language gates, one blocker, and one next order.
- Rechecks every eligibility gate at the moment of promotion and persists the resulting advancement history.
- Keeps domain evidence, daily closeouts, and promotion history available behind optional details instead of crowding the primary decision.

## Unreleased - Build 026C Atlas Live Adaptation

- Detects material readiness, pain, and execution deviations during the active day and proposes one bounded coaching change.
- Shows exactly what changes, why, and which same-day training and recovery surfaces are affected.
- Requires Accept, Hold, or This doesn't fit before any non-safety adjustment becomes executable.
- Applies approved changes to Today and Calendar together while preserving Fuel targets, future programming, and a one-click restore path.

## Unreleased - Build 026B Mission Execution Spine

- Turns Strength, Cardio, Core, Fuel, and Recovery into one ordered, resumable mission on Today.
- Preserves one cross-domain checkpoint alongside the existing canonical module records so active work survives refreshes and device changes.
- Advances the command automatically after durable evidence is secured without duplicating workout, run, Core, or Fuel logs.
- Adds a compact mobile-first mission status strip while retaining detailed controls behind the existing module surfaces.

## Unreleased - Build 026A Today: One Flow

- Replaces the Today dashboard stack with one three-stage path: Clear, Execute, Close.
- Shows only the current clearance, live mission, or closeout surface while preserving the existing action engines.
- Moves calendar context, evidence, rationale, detailed workout controls, and intelligence into one More context drawer.
- Keeps weekly body evidence visible only when the checkpoint is due and removes duplicate mobile command cards from the primary flow.

## Unreleased - Build 025Z.1 Program Completion Hotfix

- Normalizes legacy plan, Fuel, and calendar records before Atlas completes a program.
- Replaces null-state crashes with the existing named program blocker and safe recovery path.
- Keeps staged program data intact when a secondary module renderer cannot refresh immediately.

## Unreleased - Build 025Z Guided Program Recovery

- Turns incomplete activation into one six-step Contract, Strength, Cardio, Core, Fuel, and Calendar recovery path.
- Names the current blocker, shows completion progress, and exposes one canonical next action.
- Preserves every Contract-matched approved plan and reuses the established safe repair and activation workflow.

## Unreleased - Build 025Y Recruit Constraint Memory

- Gives recruits one durable place to record schedule, equipment, recovery, injury, and fueling constraints.
- Applies relevant active constraints to Atlas decision evidence without silently rewriting prescriptions.
- Saves constraint memory across devices and allows explicit retirement when a constraint is resolved.

## Unreleased - Build 025X Atlas Resolution Loop

- Converts "This doesn't fit" from passive feedback into one bounded follow-up and an exact source review.
- Records a durable resolution receipt while keeping the challenged decision open.
- Protects approved plans: the resolution loop can add context and route the recruit, but cannot mutate a program.

## Unreleased - Build 025W Atlas Coaching Rationale

- Explains every ranked Atlas call with its governing rule, confidence, and up to four canonical evidence signals.
- Adds one bounded "This doesn't fit" response for timing, missing constraints, disputed evidence, or a preference to hold.
- Keeps challenged decisions open and preserves every approved plan until the recruit acts in the canonical source module.
- Saves the recruit's context to the account-safe Decision Center history and shows a concise receipt beside the call.
- Ships a word-light desktop and mobile rationale experience plus a refreshed offline application shell.

## Unreleased - Build 025V Atlas Decision Center

- Consolidates pending Safety, saved-program integrity, Calendar, Fuel evidence, Strength, Running, and weekly calls into one ranked queue on Today.
- Shows one dominant decision, its consequence, and a count in desktop and mobile navigation without duplicating the canonical controls.
- Opens the exact source module where the recruit can approve, hold, reconcile, or resolve the item.
- Preserves immutable source plans and records a durable open-event receipt; Atlas never changes a plan from the queue.

## Unreleased - Build 025U Atlas Weekly Command

- Replaces scattered weekly calls with one word-light command across Strength, Running, Core, Fuel, and Recovery.
- Names one win, one limiting signal, and one next-week priority from the canonical program evidence.
- Shows every proposed domain change before approval and preserves a single decision receipt.
- Commits the coordinated next week only after recruit approval; holding repeats the current prescription unchanged.

## Unreleased - Build 025T Fuel Execution Mode

- Turns Fuel into a live daily order for remaining calories, protein, carbohydrate, fat, hydration, and training-window timing.
- Protects AM/PM and long-run fueling while allowing training and recovery to override a fasting window.
- Closes each day with an on-target, partial, under-fueled, exceeded, reconciliation, or incomplete-evidence verdict.
- Keeps missing intake non-punitive and forbids compensatory restriction or silent target changes.

## Unreleased - Build 025S Running Progression Engine

- Converts verified Running results into a bounded progress, repeat, reduce, recover, or collect-evidence proposal.
- Requires recruit approval before revising future distance and protects all completed runs and weeks.
- Rebuilds the coordinated Calendar from the approved Running revision.
- Keeps every long run uncapped by time while retaining distance, effort, pain, and recovery safeguards.

## Unreleased - Build 025R Running Verdict

- Replaces one-tap run completion that copied the prescription into evidence with a required actual-distance and elapsed-time review.
- Captures optional effort, average heart rate, elevation, and context from both Today and the Running workspace.
- Preserves the approved run prescription while storing the observed result separately in the execution receipt.
- Gives Atlas a bounded completed, partial, exceeded, effort-review, or pain verdict without silently changing the running plan.
- Writes one canonical Performance record from actual run metrics so Running, Trends, weekly evidence, and Today reconcile to the same truth.
- Applies the same verdict to manual runs counted toward today and avoids duplicate Performance evidence.
- Ships a responsive result form, verdict card, and refreshed offline application shell.

## Unreleased - Build 025Q Earn Entry

- Rebuilds sign-in as a branded Dominion entry ritual centered on discipline, evidence, difficulty, and the next order while preserving password and secure-link access.
- Makes completed First Week Orientation durable across sign-ins, devices, and Contract amendments; a completion receipt can reset only after an intentional Contract deletion.
- Prevents a newer incomplete device or account copy from overwriting a completed Orientation receipt.
- Adds a focused manual run form for date, type, distance, duration, effort, heart rate, elevation, and notes inside the Running workspace.
- Saves manual runs to the canonical Performance evidence ledger so Running, Trends, and weekly reconciliation use the same record.
- Allows today’s manual run to close the active Running assignment and create its Mission receipt without duplicating Performance evidence.
- Ships responsive desktop and phone treatments plus a fresh offline application shell.

## Unreleased - Build 025P Unified Blocker Resolution

- Makes a genuine same-revision saved-program conflict the single highest-priority Atlas command across Today, My Program, Calendar, the header, and mobile.
- Opens the existing side-by-side saved-copy comparison directly from every affected surface instead of sending the recruit through unrelated activation or week-commit actions.
- Protects an explicit account-copy choice from stale queued device writes before continuity retry and reconciliation.
- Advances automatically to Today after the final required choice and reveals the next valid command without a page reload.
- Keeps unresolved choices blocking while allowing protected background saves to retry without interrupting an otherwise valid training day.
- Adds a concise resolution receipt plus responsive red blocker treatment and ships a fresh offline application shell.

## Unreleased - Build 025O Atlas Daily Command

- Turns Today into one ranked Atlas order with an explicit verb, expected duration, execution window, and decision confidence.
- Makes program-integrity repairs, readiness, execution, evidence, and closeout compete in one deterministic priority ladder while preserving an already-started session.
- Adds a bounded “This doesn’t fit” response for shortening today, moving the execution window, or selecting recovery without silently rewriting the approved program.
- Applies a recruit-approved day-only dose adjustment to Strength, Running, and Core prescriptions while preserving Fuel targets and expiring the override that night.
- Reconciles every active day adjustment across Today and Calendar, with one-click restoration to the original approved order.
- Records command activation and adjustment events to the account-safe coaching ledger without copying free-form recruit context into telemetry.
- Ships a word-light responsive decision dialog and a fresh offline application shell.

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
