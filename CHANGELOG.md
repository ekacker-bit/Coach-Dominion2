# Changelog

## Unreleased - Build 024G Exact-Plan Calendar Handoff

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

## Unreleased â€” Build 020B Between-Session Gate

- Replaced the informational Two-a-Day recovery note with a persisted, account-scoped checkpoint.
- Anchored Session 2 eligibility to the actual Session 1 completion time and a four-hour countdown.
- Required a midday energy and pain recheck plus explicit refueling and hydration confirmation.
- Kept Session 2 locked when the checkpoint is missing, the recovery interval is active, or safety evidence is adverse.
- Enforced the same gate through direct module launches so alternate Today controls cannot bypass it.
- Preserved local-first operation when the account migration is not yet available and reconciled saved checkpoints after sign-in.

## Unreleased â€” Build 020A Split-Day Command

- Turned a committed Two-a-Day into an ordered Session 1 and Session 2 execution sequence.
- Prioritized the first session from the Recruit Contract goal while keeping long runs first and time-open.
- Added a four-hour minimum separation and visible refuel/rehydration bridge between sessions.
- Prevented Session 2 from opening before Session 1 has terminal execution evidence.
- Added direct session launch controls, module status, and current fueling evidence to Today.
- Kept RED readiness, pain holds, the 240-minute non-long-run ceiling, and one protected recovery day authoritative.

## Unreleased â€” Build 019G Two-a-Day Capacity

- Added an explicit Two-a-Days commitment to the Recruit Contract and bound it to the signed Contract revision.
- Defined a Two-a-Day as two scheduled sessions targeting more than 120 combined minutes, with a 240-minute daily ceiling.
- Carried the commitment into coordinated-week generation, calendar capacity labels, Today context, and activation checks.
- Left long runs uncapped by time, including when they share a day with another assignment.
- Preserved the full recovery day, hard-run plus loaded-strength block, readiness, pain, and fueling safeguards.

## Unreleased â€” Build 019F Activation Repair Loop

- Added a guided Contract â†’ Plans â†’ Week â†’ Today repair path directly inside One Command.
- Exposed the exact Strength, Running, Core, or Nutrition plan link blocking activation.
- Reused deliberate plan staging, module approval, coordinated-week build, and week commitment controls without silently changing active plans.
- Added deterministic deep links to the broken module, Contract signature, or weekly calendar.
- Added a timed reconciliation fallback so Today cannot remain indefinitely in `ASSEMBLING`.
- Confirmed an operational week immediately after successful commitment and returned the recruit to Today.
- Upgraded the mobile brand mark to a clearer gold-edged Dominion shield with a high-contrast monogram.
- Replaced the empty Recovery placeholder with an executable readiness-driven order, visible evidence posture, deliberate completion, undo, and full-review handoff.
- Wired Recovery completion into the existing daily execution queue, closed-loop evidence, and Daily Seal without clearing safety holds or changing an approved plan.

## Unreleased â€” Build 019E One Command UX

- Rebuilt Today around one dominant command sourced from the 019D operating truth layer.
- Added a compact six-stage progress rail, assigned-domain status chips, and one contextual secondary action.
- Consolidated the committed plan, adaptive coaching, evidence status, coaching logic, and setup guidance into one collapsed context drawer.
- Moved the full execution sequence behind progressive disclosure and shows the Daily Seal only when review, adaptation, or secured-day action is relevant.
- Removed the duplicate mobile command card while preserving thumb-friendly Roll Call and fuel capture sheets.
- Hid the global mission rail on Today so the user sees one authoritative next action rather than two competing commands.

## Unreleased â€” Build 019D Operating Truth

- Added a deterministic truth hierarchy from Recruit Contract through plans, committed week, Today, evidence, and review.
- Replaced optimistic completion labels with canonical `PLANNED`, `READY`, `IN PROGRESS`, `VERIFY`, `COMPLETE`, and `RECORDED` states.
- Prevented work outside the committed week from counting as planned completion.
- Added explicit repair guidance for Contract revision mismatch, missing plan links, uncommitted weeks, and time-commitment conflicts.
- Wired the global mission rail, mobile command, and Daily Seal to the same truth engine.
- Expanded the operating journey to include Evidence and Review, with responsive conflict and source summaries.

## Unreleased â€” Build 019C Daily Seal

- Turned end-of-day reconciliation into a deliberate Daily Seal ritual rather than an administrative close button.
- Added an Execute â†’ Record â†’ Verify â†’ Adapt progression rail driven entirely by the existing daily queue and closed-loop coaching state.
- Added contextual states for work in motion, evidence verification, final review, proposed adaptation, protected RED-readiness days, and a fully secured day.
- Added live evidence confidence, secured-day count, consecutive-day chain, and current rank to the closing artifact.
- Added a subtle signed-day ceremony and clear next action while preserving reduced-motion behavior and mobile usability.
- Reused canonical Daily State, execution, Dominion Record, review, adaptation, and history data without adding storage or silently changing a plan.

## Unreleased â€” Build 019B Dominion Experience Shell

- Replaced the generic War Room masthead with a persistent Coach Dominion identity, current section context, and visible rank.
- Added one deterministic current-order rail that connects Contract, plans, coordinated week, and Today into a single operating journey.
- Added contextual next actions for unsigned contracts, incomplete plan links, week building, week commitment, Morning Roll Call, protected RED-readiness states, and daily execution.
- Reduced dashboard language across primary modules and removed internal build labels from the rendered experience while retaining source-level release markers.
- Removed the redundant Today training-assignment placeholder now that the live prescription and completion controls are authoritative.
- Established a navy, forest, and gold visual system, reserved crimson for danger, increased hierarchy and whitespace, and strengthened responsive and reduced-motion behavior.
- Reused existing Contract, plan, week, readiness, rank, and account state without introducing a second source of truth or new persistence.

## Unreleased â€” Build 019A Dominion Contract Experience

- Reframed Recruit Contract setup as a four-stage commitment flow: Outcome, Capacity, Standards, and Review.
- Added a Dominion seal, oath, typed signature, effective-date confirmation, and deliberate signing dialog.
- Made signatures revision-bound so an amended Contract must be reviewed and signed again; prior signed revisions remain immutable in account history.
- Replaced the approved-form default with a signed Contract artifact containing the declaration of intent, exact commitments, signature metadata, and Contract identity.
- Added a post-sign progression rail from Contract Signed through Plans Linked, Week Committed, and Day One Ready with a single contextual next action.
- Preserved active module plans during approval and amendment, reused existing account-scoped persistence, and added deterministic engine and integration coverage.

## Unreleased â€” Build 015A Automated Nutrition Feed

- Added a supported MyFitnessPal-to-Coach-Dominion path through Apple Health and a user-owned iPhone Shortcut.
- Added revocable, one-time-visible feed keys; Coach Dominion never receives or stores MyFitnessPal credentials.
- Added a serverless ingestion endpoint and security-definer Supabase function that accept only daily calories, protein, carbohydrates, fat, date, timezone, and sample count.
- Added deterministic daily upserts, duplicate detection, sync history, delivery audit events, and a live MyFitnessPal Connected account state.
- Added Nutrition setup, verification, rotation, revocation, delivery status, and privacy controls while retaining manual CSV import as a fallback.
- Added migration 014 with row-level security and automated-feed regression coverage. Raw food diaries and raw Apple Health records are not stored.

## Unreo_7×Ûh‘éì¶»§q«^vö76WG2ö§2öF–Ç’Ö6ö6†–æræ§2"À¢"ö76WG2ö§2öF–Ç’Ö76–væÖVçBæ§2"À¢"ö76WG2ö§2÷&VF–æW72Ö&6VÆ–æW2æ§2"À¢"ö76WG2ö§2÷vVV¶Ç’×Æâæ§2"À¢"ö76WG2ö§2öçWG&—F–öâÖ6öÖÖæBæ§2"À¢"ö76WG2ö§2öFF—fRÖgVVÆ–æræ§2"À¢"ö76WG2ö§2öçWG&—F–öâÖ–çFVÆÆ–vVæ6Ræ§2"À¢"ö76WG2ö§2ö&öG’×&öw&W72æ§3÷cÓ#&""À¢"ö76WG2ö§2ö&öG’Ö6ö×÷6—F–öâæ§3÷cÓ#&""À¢"ö76WG2ö§2÷&öw&W72×&Wf–Wræ§3÷cÓ#&2"À¢"ö76WG2ö§2÷ÆâÖ6öÖÖæBæ§3÷cÓ#&B"À¢"ö76WG2ö§2öö'6W'fF–öâ×fW&F–7Bæ§3÷cÓ#&R"À¢"ö76WG2ö§2öF–Ç’Ö6Æ÷6V÷WBæ§3÷cÓ#&b"À¢"ö76WG2ö§2öçWG&—F–öâÖ&6VÆ–æRæ§2"À¢"ö76WG2ö§2öçWG&—F–öâ×&Wf–Wræ§2"À¢"ö76WG2ö§2öÖVÂÖ6ö6†–æræ§2"À¢"ö76WG2ö§2ö–çFW&Ö—GFVçBÖf7F–æræ§3÷cÓ#6B"À¢"ö76WG2ö§2öf7F–ærÖW†V7WF–öâæ§3÷cÓ#6B"À¢"ö76WG2ö§2ögVVÂÖ6ÆVæF"æ§3÷cÓ#6""À¢"ö76WG2ö§2÷FöF’ÖçWG&—F–öâæ§2"À¢"ö76WG2ö§2öÖVÂÖW†V7WF–öâæ§3÷cÓ#6b"À¢"ö76WG2ö§2ögVVÂÖ6Æ÷6VBÖÆö÷æ§3÷cÓ#6b"À¢"ö76WG2ö§2ögVVÂÖ6öÖÖæBæ§3÷cÓ#6b"À¢"ö76WG2ö§2÷'Vææ–ærÖ6öÖÖæBæ§2"À¢"ö76WG2ö§2ö6÷&R×&öw&ÖÖ–æræ§2"À¢"ö76WG2ö§2ö6Æ÷6VBÖÆö÷æ§2"À¢"ö76WG2ö§2öFF—fRÖ6ö6†–æræ§3÷cÓ#&"À¢"ö76WG2ö§2öFÆ2Ö–çFW'fVçF–öâæ§3÷cÓ#&"À¢"ö76WG2ö§2÷&V7'V—BÖ6öçG&7Bæ§3÷cÓ#F"À¢"ö76WG2ö§2ö6öçG&7BÖW‡W&–Væ6Ræ§2"À¢"ö76WG2ö§2÷vVV¶Ç’Ö÷&6†W7G&F÷"æ§3÷cÓ#FB"À¢"ö76WG2ö§2÷7Æ—BÖF’Ö6öÖÖæBæ§2"À¢"ö76WG2ö§2ö6öçG&7BÖ7F—fF–öâæ§3÷cÓ#F"À¢"ö76WG2ö§2öFÆ2×&öw&Òæ§3÷cÓ#Fb"À¢"ö76WG2ö§2öFÆ2Ö7F—fF–öâæ§3÷cÓ#Fr"À¢"ö76WG2ö§2öFÆ2×&öw&Ò×&W—"æ§3÷cÓ#Fb"À¢"ö76WG2ö§2÷&öw&ÒÖ6öÖÖæBæ§3÷cÓ#F2"À¢"ö76WG2ö§2ö6öçG&7BÖ–çFVw&—G’æ§2"À¢"ö76WG2ö§2ö6öçG&7BÖWF÷6fRæ§2"À¢"ö76WG2ö§2öÖö&–ÆRÖ6öÖÖæBæ§3÷cÓ#&r"À¢"ö76WG2ö§2öW‡W&–Væ6R×6†VÆÂæ§2"À¢"ö76WG2ö§2öF–Ç’×&—GVÂæ§3÷cÓ#&b"À¢"ö76WG2ö§2ö÷W&F–ær×G'WF‚æ§2"À¢"ö76WG2ö§2ö7F—fF–öâ×&W—"æ§3÷cÓ#Fb"À¢"ö76WG2ö§2ööæRÖ6öÖÖæBæ§2"À¢"ö76WG2ö§2öFöÖ–æ–öâÖ6öçF–çV—G’æ§2"À¢"ö76WG2ö§2öf—'7B×vVV²Ö÷&–VçFF–öâæ§2"À¢"ö76WG2ö§2öæ§3÷cÓ#Fr ¥Ó° §6VÆbæFDWfVçDÆ—7FVæW"‚&–ç7FÆÂ"Â†WfVçB’Óâ°¢WfVçBçv—EVçF–Â†66†W2æ÷Vâ„44„UôäÔR’çF†Vâ‚†66†R’Óâ66†RæFDÆÂ„õ4„TÄÂ’’“°¢6VÆbç6¶—v—F–ær‚“°§Ò“° §6VÆbæFDWfVçDÆ—7FVæW"‚&7F—fFR"Â†WfVçB’Óâ°¢WfVçBçv—EVçF–Â€¢66†W2æ¶W—2‚¢çF†Vâ‚†¶W—2’Óâ&öÖ—6RæÆÂ†¶W—2æf–ÇFW"‚†¶W’’Óâ¶W’ç7F'G5v—F‚‚&6ö6‚ÖFöÖ–æ–öâÒ"’bb¶W’ÓÒ44„UôäÔR’æÖ‚†¶W’’Óâ66†W2æFVÆWFR†¶W’’’’¢çF†Vâ‚‚’Óâ6VÆbæ6Æ–VçG2æ6Æ–Ò‚’¢“°§Ò“° §6VÆbæFDWfVçDÆ—7FVæW"‚&fWF6‚"Â†WfVçB’Óâ°¢6öç7B&WVW7BÒWfVçBç&WVW7C°¢–b‡&WVW7BæÖWF†öBÓÒ$tUB"’&WGW&ã°¢6öç7BW&ÂÒæWrU$Â‡&WVW7BçW&Â“°¢–b‡W&Âæ÷&–v–âÓÒ6VÆbæÆö6F–öâæ÷&–v–âÇÂW&ÂçF†æÖRç7F'G5v—F‚‚"ö’ò"’’&WGW&ã° ¢–b‡&WVW7BæÖöFRÓÓÒ&æf–vFR"’°¢WfVçBç&W7öæEv—F‚€¢fWF6‚‡&WVW7B¢çF†Vâ‚‡&W7öç6R’Óâ°¢6öç7B6÷’Ò&W7öç6Ræ6ÆöæR‚“°¢66†W2æ÷Vâ„44„UôäÔR’çF†Vâ‚†66†R’Óâ66†RçWB‡&WVW7BÂ6÷’’“°¢&WGW&â&W7öç6S°¢Ò¢æ6F6‚†7–æ2‚’Óâ†v—B66†W2æÖF6‚‡&WVW7B’’ÇÂ†v—B66†W2æÖF6‚‚"öæ‡FÖÂ"’’¢“°¢&WGW&ã°¢Ğ ¢WfVçBç&W7öæEv—F‚€¢66†W2æÖF6‚‡&WVW7B’çF†Vâ‚†66†VB’Óâ°¢6öç7B&Vg&W6†VBÒfWF6‚‡&WVW7B¢çF†Vâ‚‡&W7öç6R’Óâ°¢–b‡&W7öç6Ræö²’66†W2æ÷Vâ„44„UôäÔR’çF†Vâ‚†66†R’Óâ66†RçWB‡&WVW7BÂ&W7öç6Ræ6ÆöæR‚’’“°¢&WGW&â&W7öç6S°¢Ò¢æ6F6‚‚‚’Óâ66†VB“°¢&WGW&â66†VBÇÂ&Vg&W6†VC°¢Ò¢“°§Ò“°