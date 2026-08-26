(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBetaStateIntegrity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030R.1";
  const OATH_VERSION = "DOMINION_OATH_019A";
  const ACTIVE_EXECUTION_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const TERMINAL_EXECUTION_STATES = new Set(["COMPLETE", "COMPLETED", "PARTIAL", "STOPPED", "CANCELLED", "CANCELED"]);
  const PLAN_DOMAINS = Object.freeze(["strength", "running", "core", "nutrition"]);
  const CONTRACT_OPERATING_FIELDS = Object.freeze([
    "age", "heightCm", "heightUnit", "heightValue", "weightKg", "weightUnit", "weightValue",
    "gender", "trainingYears", "athleteType", "primaryGoal", "target", "targetDate",
    "trainingDaysPerWeek", "strengthDaysPerWeek", "runningDaysPerWeek", "coreDaysPerWeek",
    "sessionMinutes", "twoADays", "equipment", "experience", "runningGoal", "preferredUnit",
    "declaredWeeklyDistance", "nutritionCommitment", "effectiveDate"
  ]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replace(/[\s-]+/g, "_"); }
  function revision(value = {}) { return Math.max(0, Number(value.revision || value.contractRevision || value.recruitContractRevision || 0)); }
  function date(value = "") { return /^\d{4}-\d{2}-\d{2}$/.test(text(value).slice(0, 10)) ? text(value).slice(0, 10) : null; }

  function validSignature(contract = {}) {
    const signature = contract?.signature || null;
    return Boolean(
      contract?.id
      && revision(contract) > 0
      && signature
      && text(signature.signerName).length >= 2
      && signature.accepted === true
      && signature.contractId === contract.id
      && Number(signature.contractRevision || 0) === revision(contract)
      && signature.oathVersion === OATH_VERSION
      && signature.signedAt
    );
  }

  function contractTimestamp(contract = {}) {
    return Date.parse(contract.signature?.signedAt || contract.approvedAt || contract.updatedAt || contract.createdAt || "") || 0;
  }

  function contractSort(left = {}, right = {}) {
    return revision(right) - revision(left) || contractTimestamp(right) - contractTimestamp(left);
  }

  function pendingDraft(contract = null) {
    if (!contract || validSignature(contract)) return false;
    return ["READY_FOR_APPROVAL", "REVIEW_REQUIRED", "APPROVED", "DRAFT", "UNSIGNED_DRAFT"].includes(upper(contract.status));
  }

  function resolveContractLifecycle(input = {}) {
    const approvedSlot = input.approved || null;
    const explicitDraft = input.draft || null;
    const history = Array.isArray(input.history) ? input.history.filter(Boolean) : [];
    const signedCandidates = [approvedSlot, ...history].filter(validSignature).sort(contractSort);
    const activeSignedContract = signedCandidates[0] || null;
    const draftCandidates = [explicitDraft, pendingDraft(approvedSlot) ? approvedSlot : null]
      .filter(pendingDraft)
      .filter((item, index, values) => values.findIndex((candidate) => candidate.id === item.id && revision(candidate) === revision(item)) === index)
      .sort(contractSort);
    const draftContract = draftCandidates.find((candidate) => !activeSignedContract || revision(candidate) >= revision(activeSignedContract)) || draftCandidates[0] || null;
    const superseded = signedCandidates.find((candidate) => candidate.id === activeSignedContract?.supersedesId)
      || signedCandidates.find((candidate) => revision(candidate) === revision(activeSignedContract) - 1)
      || null;
    return Object.freeze({
      version: VERSION,
      activeSignedContract,
      draftContract,
      activeSignedContractRevision: activeSignedContract ? revision(activeSignedContract) : null,
      draftContractRevision: draftContract ? revision(draftContract) || (activeSignedContract ? revision(activeSignedContract) + 1 : 1) : null,
      draftContractStatus: draftContract ? "UNSIGNED_DRAFT" : null,
      draftEffectiveDate: draftContract ? date(draftContract.effectiveDate) : null,
      supersededContractRevision: superseded ? revision(superseded) : null,
      authority: activeSignedContract ? "SIGNED_CONTRACT" : "NONE",
      draftAuthoritative: false
    });
  }

  function assignmentId(value = {}, options = {}) {
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.sourceAssignmentId
      || value.sessionSnapshot?.assignmentId || value.sessionSnapshot?.calendarAssignmentId
      || (options.allowId ? value.id : ""));
  }

  function executionDate(value = {}) {
    return date(value.operationalDate || value.date || value.startedAt || value.createdAt || value.updatedAt);
  }

  function dayDistance(left = "", right = "") {
    const start = Date.parse(`${date(left) || ""}T00:00:00Z`);
    const end = Date.parse(`${date(right) || ""}T00:00:00Z`);
    return Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / 86400000) : null;
  }

  function weekBounds(week = {}) {
    return Object.freeze({
      start: date(week.weekStart || week.week_start),
      end: date(week.weekEnd || week.week_end)
    });
  }

  function sessionLabel(value = {}) {
    return text(value.sessionName || value.title || value.sessionSnapshot?.sessionName || value.sessionSnapshot?.title || value.sessionId || "Strength session");
  }

  function activeExecution(value = {}) { return ACTIVE_EXECUTION_STATES.has(upper(value.state || value.status)); }

  function contractOperatingState(contract = {}) {
    return Object.fromEntries(CONTRACT_OPERATING_FIELDS.map((key) => [key, contract?.[key] ?? contract?.athleteProfile?.[key] ?? null]));
  }

  function sameOperatingContract(left = null, right = null) {
    if (!left || !right) return false;
    return JSON.stringify(contractOperatingState(left)) === JSON.stringify(contractOperatingState(right));
  }

  function resolveOperatingProgramAuthority(input = {}) {
    const today = date(input.today) || new Date().toISOString().slice(0, 10);
    const signedContract = input.signedContract || null;
    const activeWeek = input.activeWeek || input.committedWeek || null;
    const receipt = input.receipt || input.activationReceipt || null;
    const signedRevision = revision(signedContract);
    const weekRevision = revision(activeWeek);
    const receiptRevision = revision(receipt);
    const bounds = weekBounds(activeWeek || {});
    const weekCoversToday = Boolean(bounds.start && bounds.end && bounds.start <= today && today <= bounds.end);
    const signedWeek = Boolean(weekCoversToday && weekRevision && (!signedRevision || weekRevision <= signedRevision));
    const contractRevision = signedWeek ? weekRevision : receiptRevision || signedRevision || weekRevision || null;
    const programId = text((signedWeek ? activeWeek?.programId : receipt?.programId)
      || activeWeek?.programId || receipt?.programId || input.programId) || null;
    return Object.freeze({
      version: VERSION,
      today,
      signedRevision: signedRevision || null,
      weekRevision: weekRevision || null,
      receiptRevision: receiptRevision || null,
      contractRevision,
      programId,
      signedWeekAuthoritative: signedWeek,
      receiptDeferred: Boolean(signedWeek && receiptRevision && receiptRevision !== weekRevision),
      source: signedWeek ? "SIGNED_ACTIVE_WEEK" : receiptRevision ? "ACTIVATION_RECEIPT" : signedRevision ? "SIGNED_CONTRACT" : "NONE"
    });
  }

  function resolveActiveStrengthSession(input = {}) {
    const today = date(input.today) || new Date().toISOString().slice(0, 10);
    const staleAfterDays = Math.max(1, Number(input.staleAfterDays || 7));
    const executions = (Array.isArray(input.executions) ? input.executions : []).filter(Boolean)
      .filter((item, index, values) => {
        const key = assignmentId(item) || item.id || `${executionDate(item)}:${sessionLabel(item)}`;
        return values.findIndex((candidate) => (assignmentId(candidate) || candidate.id || `${executionDate(candidate)}:${sessionLabel(candidate)}`) === key) === index;
      });
    const scheduled = (Array.isArray(input.assignments) ? input.assignments : []).filter(Boolean);
    const todayAssignment = scheduled.find((item) => date(item.date) === today)
      || (scheduled.some((item) => date(item.date)) ? null : scheduled[0])
      || null;
    const scheduledId = todayAssignment ? assignmentId(todayAssignment, { allowId: true }) : null;
    const bounds = weekBounds(input.committedWeek || {});
    const activeCandidates = executions.filter(activeExecution).sort((left, right) => {
      const leftDate = executionDate(left) || "9999-12-31";
      const rightDate = executionDate(right) || "9999-12-31";
      return leftDate.localeCompare(rightDate) || (Date.parse(left.startedAt || left.updatedAt || 0) - Date.parse(right.startedAt || right.updatedAt || 0));
    });
    const currentAssignmentExecution = activeCandidates.find((item) => scheduledId && assignmentId(item) === scheduledId) || null;
    const currentWeekExecution = activeCandidates.find((item) => {
      const value = executionDate(item);
      return value && bounds.start && bounds.end && bounds.start <= value && value <= bounds.end;
    }) || null;
    const selectedActive = currentAssignmentExecution || currentWeekExecution || activeCandidates[0] || null;
    const retirementCandidates = activeCandidates.filter((item) => {
      const value = executionDate(item);
      const age = dayDistance(value, today);
      return Boolean(bounds.start && value && value < bounds.start && age !== null && age >= staleAfterDays);
    }).map((item) => Object.freeze({
      execution: item,
      executionId: text(item.id || item.sessionId || assignmentId(item)) || null,
      assignmentId: assignmentId(item) || null,
      sessionName: sessionLabel(item),
      operationalDate: executionDate(item),
      ageDays: dayDistance(executionDate(item), today),
      action: "ARCHIVE_INCOMPLETE",
      reason: "Historical session predates the signed active week"
    }));
    const selectedRetiresAutomatically = retirementCandidates.some((item) => item.execution === selectedActive);
    const active = selectedRetiresAutomatically ? null : selectedActive;
    const historicalExecution = selectedRetiresAutomatically ? selectedActive : null;
    const activeId = active ? assignmentId(active) || `legacy-strength:${active.id || executionDate(active) || "active"}` : null;
    const waitingAssignment = active && todayAssignment && activeId !== scheduledId ? todayAssignment : null;
    const duplicateActiveIds = activeCandidates.map((item) => assignmentId(item) || item.id).filter(Boolean);
    const signedContractRevisionId = text(input.signedContract?.id || input.signedContractId) || null;
    const committedWeekId = text(input.committedWeek?.id || input.committedWeekId || todayAssignment?.weekId) || null;
    const evidence = (Array.isArray(input.evidence) ? input.evidence : []).find((item) => assignmentId(item) === activeId) || null;
    const lifecycleState = active ? upper(active.state || active.status) : todayAssignment ? "READY" : "UNSCHEDULED";
    const choices = active && waitingAssignment ? [
      { code: "RESUME_HISTORICAL", label: `Resume unfinished ${sessionLabel(active)} from ${executionDate(active)}` },
      { code: "START_TODAY", label: `Start today ${sessionLabel(waitingAssignment)}` }
    ] : [];
    return Object.freeze({
      version: VERSION,
      today,
      activeExecution: active,
      historicalExecution,
      retirementCandidates: Object.freeze(retirementCandidates),
      authority: active ? "ACTIVE_EXECUTION" : todayAssignment ? "SIGNED_WEEK_ASSIGNMENT" : "UNSCHEDULED",
      activeAssignmentId: activeId,
      activeSessionLabel: active ? sessionLabel(active) : null,
      activeOperationalDate: active ? executionDate(active) : null,
      scheduledAssignment: todayAssignment,
      scheduledAssignmentId: scheduledId,
      waitingAssignment,
      waitingLabel: waitingAssignment ? sessionLabel(waitingAssignment) : null,
      canStartScheduled: !active,
      requiresResolution: Boolean(active && waitingAssignment),
      duplicateActiveSessionIds: duplicateActiveIds.length > 1 ? duplicateActiveIds.slice(1) : [],
      signedContractRevisionId,
      signedContractRevision: Number(input.signedContract?.revision || input.signedContractRevision || 0) || null,
      committedWeekId,
      calendarAssignmentId: activeId || scheduledId || null,
      activeSessionId: active ? text(active.id || active.sessionId || activeId) : null,
      scheduledLocalDate: active ? executionDate(active) : date(todayAssignment?.date),
      sessionName: active ? sessionLabel(active) : todayAssignment ? sessionLabel(todayAssignment) : null,
      lifecycleState,
      evidenceId: text(active?.evidenceId || evidence?.id) || null,
      choices,
      primaryAction: active
        ? { code: "RESUME", label: `Resume ${sessionLabel(active)}` }
        : todayAssignment
          ? { code: "START", label: `Start ${sessionLabel(todayAssignment)}` }
          : null,
      secondaryAction: active && waitingAssignment
        ? { code: "START_TODAY", label: `Start today ${sessionLabel(waitingAssignment)}` }
        : active ? { code: "END_INCOMPLETE", label: "End incomplete session" } : null,
      dailyRecordTarget: todayAssignment
        ? `${sessionLabel(todayAssignment)} · Assignment ${scheduledId}`
        : active ? `${sessionLabel(active)} · Assignment ${activeId}` : ""
    });
  }

  function endIncompleteSession(execution = {}, options = {}) {
    if (!activeExecution(execution)) return execution;
    const endedAt = options.endedAt || new Date().toISOString();
    return {
      ...execution,
      state: "STOPPED",
      reason: options.reason || "Ended incomplete by recruit",
      endedIncomplete: true,
      completedAt: endedAt,
      updatedAt: endedAt
    };
  }

  function planContractRevision(plan = {}) {
    return Number(plan.contractRevision || plan.recruitContractRevision || plan.sourceContractRevision || 0);
  }

  function planReady(plan = {}) {
    return ["ACTIVE", "APPROVED", "READY", "COMPLETE", "COMMITTED"].includes(upper(plan.status || plan.state));
  }

  function revisionPlanStates(plans = {}, contract = null) {
    const contractRevision = contract ? revision(contract) : 0;
    return Object.fromEntries(PLAN_DOMAINS.map((domain) => {
      const plan = plans?.[domain] || null;
      const linked = Boolean(plan && contractRevision && planContractRevision(plan) === contractRevision);
      const ready = Boolean(linked && planReady(plan));
      return [domain, Object.freeze({ domain, contractRevision, linked, ready, status: ready ? "READY" : linked ? "DRAFT_INCOMPLETE" : "REGENERATION_REQUIRED" })];
    }));
  }

  function resolvePlanRevisionStatus(input = {}) {
    const activeSignedContract = input.activeSignedContract || null;
    const draftContract = input.draftContract || null;
    const activePlans = revisionPlanStates(input.activePlans || {}, activeSignedContract);
    const noOperatingChanges = sameOperatingContract(activeSignedContract, draftContract);
    const draftPlans = revisionPlanStates(input.draftPlans || input.activePlans || {}, draftContract);
    const draftRequired = draftContract && !noOperatingChanges ? Object.values(draftPlans).filter((item) => !item.ready) : [];
    const activeWeek = input.activeWeek || null;
    return Object.freeze({
      version: VERSION,
      activeWeek: Object.freeze({
        contractRevision: Number(activeWeek?.contractRevision || 0) || null,
        status: activeWeek ? "EXECUTABLE" : "MISSING",
        plans: activePlans
      }),
      signedFuture: Object.freeze({ contractRevision: activeSignedContract ? revision(activeSignedContract) : null, plans: activePlans }),
      draft: Object.freeze({
        contractRevision: draftContract ? revision(draftContract) : null,
        status: !draftContract ? "NO_DRAFT" : noOperatingChanges ? "NO_OPERATING_CHANGES" : draftRequired.length ? "DRAFT_INCOMPLETE" : "DRAFT_READY",
        noOperatingChanges,
        plans: draftPlans,
        requiresRegenerationAfterSignature: draftRequired.map((item) => item.domain),
        requiredCount: draftRequired.length
      }),
      currentExecutionBlocked: false
    });
  }

  function linkEvidenceToAssignment(input = {}) {
    const assignment = input.assignment || null;
    const assignmentDate = date(assignment?.date);
    const operationalDate = date(input.operationalDate || input.performanceDate || input.date) || assignmentDate;
    const id = assignment ? assignmentId(assignment, { allowId: true }) : text(input.assignmentId);
    const scheduled = Boolean(id && assignmentDate);
    return Object.freeze({
      assignmentId: id || null,
      scheduledDate: scheduled ? assignmentDate : null,
      operationalDate,
      occurredAt: input.occurredAt || input.createdAt || new Date().toISOString(),
      unplanned: !scheduled,
      satisfiesAssignment: Boolean(scheduled && operationalDate === assignmentDate)
    });
  }

  function countTrainingWindows(sessions = []) {
    const values = Array.isArray(sessions) ? sessions.filter(Boolean) : [];
    const groups = new Map();
    values.forEach((item, index) => {
      const key = text(item.trainingWindowId || item.windowId || item.window || item.sessionWindow) || `session-${index}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const corePaired = [...groups.values()].some((items) => items.length > 1 && items.some((item) => upper(item.module || item.domain) === "CORE"));
    return Object.freeze({ count: groups.size, corePaired, label: `${groups.size} training window${groups.size === 1 ? "" : "s"}${corePaired ? " · Core paired" : ""}` });
  }

  return Object.freeze({
    VERSION,
    OATH_VERSION,
    PLAN_DOMAINS: [...PLAN_DOMAINS],
    ACTIVE_EXECUTION_STATES: [...ACTIVE_EXECUTION_STATES],
    TERMINAL_EXECUTION_STATES: [...TERMINAL_EXECUTION_STATES],
    validSignature,
    revision,
    pendingDraft,
    resolveContractLifecycle,
    assignmentId,
    executionDate,
    activeExecution,
    contractOperatingState,
    sameOperatingContract,
    resolveOperatingProgramAuthority,
    resolveActiveStrengthSession,
    endIncompleteSession,
    resolvePlanRevisionStatus,
    linkEvidenceToAssignment,
    countTrainingWindows
  });
});
