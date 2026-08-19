(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBetaJourneyCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030D.1";
  const STAGES = Object.freeze([
    { id: "account", label: "Account" },
    { id: "contract", label: "Contract" },
    { id: "program", label: "Program" },
    { id: "calendar", label: "Calendar" },
    { id: "today", label: "Today" },
    { id: "evidence", label: "Evidence" },
    { id: "closeout", label: "Closeout" }
  ]);
  const CURRENT_PROGRAM_STATES = new Set(["ACTIVE", "COMPLETED"]);
  const TERMINAL_EXECUTION_STATES = new Set(["COMPLETE", "COMPLETED", "SECURED", "CLOSED"]);

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function upper(value = "") {
    return clean(value).toUpperCase().replaceAll(" ", "_");
  }

  function whole(value = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function sameReference(left, right) {
    const a = clean(left);
    const b = clean(right);
    return !a || !b || a === b;
  }

  function activeWeekForDate(week = null, date = "") {
    if (!week || ["REPLACED", "SUPERSEDED"].includes(upper(week.status || week.state))) return false;
    const target = clean(date).slice(0, 10);
    return Boolean(target && clean(week.weekStart) <= target && target <= clean(week.weekEnd));
  }

  function stageResult(id, state, detail, action = null, meta = {}) {
    const stage = STAGES.find((item) => item.id === id) || { id, label: id };
    return Object.freeze({ ...stage, state, detail, action, ...meta });
  }

  function action(code, label, section) {
    return Object.freeze({ code, label, section });
  }

  function evaluate(input = {}) {
    const date = clean(input.date || input.today?.date).slice(0, 10);
    const account = input.account || {};
    const contract = input.contract || {};
    const program = input.program || {};
    const week = input.week || null;
    const today = input.today || {};
    const evidence = input.evidence || {};
    const closeout = input.closeout || null;
    const stagedWeek = input.stagedWeek || null;
    const transition = input.transition || {};
    const executionContext = input.executionContext || {};
    const assignmentAudit = input.assignmentAudit || {};
    const biometricReview = input.biometricReview || null;
    const conflicts = whole(input.conflicts?.length || input.conflicts);
    const pendingWrites = whole(input.pendingWrites || account.pendingWrites);
    const accountMode = upper(account.status || account.mode);
    const syncState = clean(input.syncState || account.syncState || "").toLowerCase();
    const contractRevision = whole(contract.revision);
    const contractRef = clean(contract.hash || contract.fingerprint || contract.id || contractRevision);
    const programState = upper(program.state || program.status);
    const programCurrent = CURRENT_PROGRAM_STATES.has(programState);
    const weekCurrent = activeWeekForDate(week, date) && ["COMMITTED", "ACTIVE", "CURRENT", "APPROVED"].includes(upper(week?.status || week?.state || "COMMITTED"));
    const protectedCurrentWeek = transition.protectedCurrentWeek === true && weekCurrent;
    const operatingContractRevision = protectedCurrentWeek
      ? whole(transition.operatingContractRevision || week?.contractRevision)
      : contractRevision;
    const operatingContractRef = protectedCurrentWeek
      ? clean(transition.operatingContractRef || program.contractRef)
      : contractRef;
    const stagedWeekApplies = Boolean(stagedWeek) && !["REPLACED", "SUPERSEDED"].includes(upper(stagedWeek?.status || stagedWeek?.state));
    const todayCurrent = Boolean(today.id && today.committed !== false && today.weekCommitted !== false);
    const planReferencesAgree = sameReference(program.contractRevision, operatingContractRevision)
      && sameReference(program.contractRef, operatingContractRef);
    const weekReferencesAgree = sameReference(week?.contractRevision, operatingContractRevision)
      && sameReference(week?.programId, program.id);
    const stagedWeekReferencesAgree = !stagedWeekApplies || sameReference(stagedWeek?.contractRevision, contractRevision);
    const todayReferencesAgree = sameReference(today.contractRevision, operatingContractRevision)
      && sameReference(today.programId, program.id)
      && sameReference(today.weekId, week?.id);
    const evidenceReferencesAgree = sameReference(evidence.contractRevision, operatingContractRevision)
      && sameReference(evidence.programId, program.id)
      && sameReference(evidence.weekId, week?.id)
      && sameReference(evidence.todayId, today.id);
    const closeoutReferencesAgree = !closeout || (
      sameReference(closeout.todayId, today.id)
      && sameReference(closeout.weekId, week?.id)
      && sameReference(closeout.contractRevision, operatingContractRevision)
    );
    const accountConfirmed = account.serverConfirmed === true
      && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    const stages = [];

    if (conflicts || syncState === "conflict") {
      stages.push(stageResult("account", "BLOCKED", "Two approved saved states require one canonical choice.", action("RESOLVE_CONTINUITY", "Compare and choose saved Contract", "today"), { code: "CONTRACT_CONFLICT" }));
    } else if (["AUTH_REQUIRED", "CONFLICT_REQUIRES_CHOICE", "VALIDATION_FAILURE"].includes(accountMode) || syncState === "user_action_required") {
      const auth = accountMode === "AUTH_REQUIRED";
      stages.push(stageResult("account", "BLOCKED", auth ? "Sign in again to verify protected account work." : "Account state requires a deliberate repair.", action(auth ? "SIGN_IN" : "OPEN_ACCOUNT_HEALTH", auth ? "Sign in" : "Review Account Health", auth ? "app" : "more"), { code: auth ? "AUTH_REQUIRED" : syncState === "user_action_required" ? "ACCOUNT_ACTION_REQUIRED" : accountMode }));
    } else if (syncState === "failed") {
      stages.push(stageResult("account", "BLOCKED", "The latest account save failed and needs review.", action("OPEN_ACCOUNT_HEALTH", "Review Account Health", "more"), { code: "ACCOUNT_SAVE_FAILED" }));
    } else if (["offline_queued", "transient_retry"].includes(syncState)) {
      stages.push(stageResult("account", "PROTECTED", syncState === "offline_queued" ? "The latest work is protected on this device until connectivity returns." : "The latest work is protected while the account retries a transient save.", null, { code: syncState === "offline_queued" ? "OFFLINE_SAVE_QUEUED" : "TRANSIENT_SAVE_RETRY" }));
    } else if (pendingWrites || !accountConfirmed) {
      stages.push(stageResult("account", pendingWrites ? "PROTECTED" : "VERIFYING", pendingWrites ? "The latest complete snapshot is protected and waiting for an exact server receipt." : "Waiting for an exact server receipt before certifying the journey.", null, { code: pendingWrites ? "ACCOUNT_SAVE_PENDING" : "ACCOUNT_RECEIPT_REQUIRED" }));
    } else {
      stages.push(stageResult("account", "CURRENT", "The latest account revision is server-confirmed."));
    }

    if (!contract.exists || !contract.signed || !contractRevision) {
      stages.push(stageResult("contract", "BLOCKED", contract.exists ? "The governing Contract must be signed and revisioned." : "A signed Contract is required.", action("OPEN_CONTRACT", contract.exists ? "Finish Contract" : "Create Contract", "contract"), { code: "CONTRACT_REQUIRED" }));
    } else {
      stages.push(stageResult("contract", "CURRENT", `Contract R${contractRevision} is signed and canonical.`, null, { revision: contractRevision, reference: contractRef }));
    }

    if (!programCurrent) {
      stages.push(stageResult("program", "BLOCKED", "The complete program has not been activated.", action("OPEN_COMMISSIONING", "Finish program setup", "contract"), { code: "PROGRAM_REQUIRED" }));
    } else if (!planReferencesAgree) {
      stages.push(stageResult("program", "INCONSISTENT", "The active program points to a different Contract revision.", action("REBUILD_PROGRAM", "Reconcile program", "contract"), { code: "PROGRAM_CONTRACT_MISMATCH" }));
    } else {
      stages.push(stageResult("program", "CURRENT", protectedCurrentWeek ? `The active program remains protected through this week; the next week must use Contract R${contractRevision}.` : "Strength, Cardio, Core, and Fuel share the governing Contract.", null, { transition: protectedCurrentWeek }));
    }

    if (!weekCurrent) {
      stages.push(stageResult("calendar", "BLOCKED", "Today is not inside a committed operating week.", action("OPEN_CALENDAR", "Commit operating week", "calendar"), { code: "ACTIVE_WEEK_REQUIRED" }));
    } else if (!weekReferencesAgree) {
      stages.push(stageResult("calendar", "INCONSISTENT", "The operating week does not match the active program lineage.", action("OPEN_CALENDAR", "Repair Calendar", "calendar"), { code: "CALENDAR_LINEAGE_MISMATCH" }));
    } else if (!stagedWeekReferencesAgree) {
      stages.push(stageResult("calendar", "INCONSISTENT", `The next week is not linked to Contract R${contractRevision}.`, action("OPEN_CALENDAR", "Repair next week", "calendar"), { code: "STAGED_WEEK_CONTRACT_MISMATCH" }));
    } else {
      stages.push(stageResult("calendar", "CURRENT", protectedCurrentWeek ? `${week.weekStart} through ${week.weekEnd} remains protected on Contract R${operatingContractRevision}.` : `${week.weekStart} through ${week.weekEnd} is the active committed week.`, null, { transition: protectedCurrentWeek }));
    }

    if (executionContext.blocked === true) {
      stages.push(stageResult("today", "BLOCKED", "A genuine active-date conflict prevents today's command from being certified.", action("RESOLVE_CONTINUITY", "Review active-date conflict", "today"), { code: "ACTIVE_DATE_CONFLICT" }));
    } else if (!todayCurrent) {
      stages.push(stageResult("today", "BLOCKED", "Today does not have one committed canonical command.", action("REBUILD_TODAY", "Restore Today", "today"), { code: "TODAY_REQUIRED" }));
    } else if (!todayReferencesAgree) {
      stages.push(stageResult("today", "INCONSISTENT", "Today points to a different Contract, program, or Calendar week.", action("REBUILD_TODAY", "Rebuild Today", "today"), { code: "TODAY_LINEAGE_MISMATCH" }));
    } else if (assignmentAudit.matches === false) {
      stages.push(stageResult("today", "INCONSISTENT", "Today and Quick Log do not describe the same active assignments.", action("REBUILD_TODAY", "Restore today's assignments", "today"), { code: "ASSIGNMENT_SURFACE_MISMATCH" }));
    } else {
      stages.push(stageResult("today", "CURRENT", protectedCurrentWeek ? `Today remains authorized by the protected Contract R${operatingContractRevision} week.` : "Today is authorized by the active program and operating week.", null, { transition: protectedCurrentWeek }));
    }

    if (!evidenceReferencesAgree) {
      stages.push(stageResult("evidence", "INCONSISTENT", "Saved proof is attached to a different operating lineage.", action("REBUILD_EVIDENCE", "Reconcile evidence", "today"), { code: "EVIDENCE_LINEAGE_MISMATCH" }));
    } else {
      const count = whole(evidence.count);
      stages.push(stageResult("evidence", count ? "CURRENT" : "OPEN", count ? `${count} evidence item${count === 1 ? " is" : "s are"} linked to today's command.` : "Evidence capture is ready; no completed proof is required yet."));
    }

    if (!closeoutReferencesAgree) {
      stages.push(stageResult("closeout", "INCONSISTENT", "The Daily Closeout points to a different operating lineage.", action("OPEN_CLOSEOUT", "Repair Closeout", "today"), { code: "CLOSEOUT_LINEAGE_MISMATCH" }));
    } else if (closeout && (TERMINAL_EXECUTION_STATES.has(upper(closeout.status || closeout.state)) || closeout.closed === true)) {
      stages.push(stageResult("closeout", "CURRENT", "The day is sealed against the same canonical command."));
    } else {
      stages.push(stageResult("closeout", "OPEN", "Closeout remains available as the final daily action."));
    }

    const firstProblem = stages.find((stage) => ["BLOCKED", "INCONSISTENT"].includes(stage.state)) || null;
    const waiting = !firstProblem ? stages.find((stage) => ["PROTECTED", "VERIFYING"].includes(stage.state)) || null : null;
    const state = firstProblem ? (firstProblem.state === "INCONSISTENT" ? "INCONSISTENT" : "ACTION_REQUIRED") : waiting ? waiting.state : "CERTIFIED";
    const currentCount = stages.filter((stage) => ["CURRENT", "OPEN"].includes(stage.state)).length;
    const lineage = {
      contractRevision,
      contractRef,
      operatingContractRevision,
      operatingContractRef,
      programId: clean(program.id),
      weekId: clean(week?.id),
      todayId: clean(today.id),
      date
    };
    const attention = biometricReview?.pending === true
      ? Object.freeze([{ code: "BIOMETRIC_CONFIRMATION_REQUIRED", detail: "One biometric reading is quarantined and is not influencing coaching.", action: action("REVIEW_BIOMETRIC", "Review biometric", "today") }])
      : Object.freeze([]);
    const fingerprint = stableHash({ state, lineage, stages: stages.map(({ id, state: stageState, code }) => ({ id, state: stageState, code })) });
    return Object.freeze({
      version: VERSION,
      state,
      tone: firstProblem ? "red" : waiting ? "yellow" : "green",
      label: firstProblem ? "ACTION REQUIRED" : waiting ? (waiting.state === "PROTECTED" ? `SYNC ${pendingWrites}` : "VERIFYING") : "CURRENT",
      headline: firstProblem ? firstProblem.detail : waiting ? waiting.detail : "Program verified end to end",
      detail: firstProblem ? "Resolve the first broken link before the program advances." : waiting ? "Your work remains protected while certification waits." : "Account, Contract, program, Calendar, Today, evidence, and Closeout agree.",
      certified: state === "CERTIFIED",
      currentCount,
      total: STAGES.length,
      stages: Object.freeze(stages),
      firstProblem,
      primaryAction: firstProblem?.action || null,
      lineage: Object.freeze(lineage),
      pendingWrites,
      protectedCurrentWeek,
      syncState,
      attention,
      fingerprint
    });
  }

  function certificationReceipt(result = {}, options = {}) {
    if (!result.certified) return null;
    const certifiedAt = clean(options.certifiedAt || new Date().toISOString());
    return Object.freeze({
      id: `journey-${stableHash({ fingerprint: result.fingerprint, lineage: result.lineage })}`,
      type: "BETA_JOURNEY_CERTIFICATION",
      schemaVersion: VERSION,
      fingerprint: result.fingerprint,
      lineage: Object.freeze({ ...(result.lineage || {}) }),
      stageCount: whole(result.total),
      certifiedAt
    });
  }

  return Object.freeze({ VERSION, STAGES, stableHash, activeWeekForDate, evaluate, certificationReceipt });
});
