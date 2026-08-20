(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBetaStateIntegrity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030H.1";
  const OATH_VERSION = "DOMINION_OATH_019A";
  const ACTIVE_EXECUTION_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const TERMINAL_EXECUTION_STATES = new Set(["COMPLETE", "COMPLETED", "PARTIAL", "STOPPED", "CANCELLED", "CANCELED"]);
  const PLAN_DOMAINS = Object.freeze(["strength", "running", "core", "nutrition"]);

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

  function sessionLabel(value = {}) {
    return text(value.sessionName || value.title || value.sessionSnapshot?.sessionName || value.sessionSnapshot?.title || value.sessionId || "Strength session");
  }

  function activeExecution(value = {}) { return ACTIVE_EXECUTION_STATES.has(upper(value.state || value.status)); }

  function resolveActiveStrengthSession(input = {}) {
    const today = date(input.today) || new Date().toISOString().slice(0, 10);
    const executions = (Array.isArray(input.executions) ? input.executions : []).filter(Boolean)
      .filter((item, index, values) => {
        const key = assignmentId(item) || item.id || `${executionDate(item)}:${sessionLabel(item)}`;
        return values.findIndex((candidate) => (assignmentId(candidate) || candidate.id || `${executionDate(candidate)}:${sessionLabel(candidate)}`) === key) === index;
      });
    const scheduled = (Array.isArray(input.assignments) ? input.assignments : []).filter(Boolean);
    const active = executions.filter(activeExecution).sort((left, right) => {
      const leftDate = executionDate(left) || "9999-12-31";
      const rightDate = executionDate(right) || "9999-12-31";
      return leftDate.localeCompare(rightDate) || (Date.parse(left.startedAt || left.updatedAt || 0) - Date.parse(right.startedAt || right.updatedAt || 0));
    })[0] || null;
    const todayAssignment = scheduled.find((item) => date(item.date) === today) || scheduled[0] || null;
    const activeId = active ? assignmentId(active) || `legacy-strength:${active.id || executionDate(active) || "active"}` : null;
    const scheduledId = todayAssignment ? assignmentId(todayAssignment, { allowId: true }) : null;
    const waitingAssignment = active && todayAssignment && activeId !== scheduledId ? todayAssignment : null;
    const duplicateActiveIds = executions.filter(activeExecution).map((item) => assignmentId(item) || item.id).filter(Boolean);
    return Object.freeze({
      version: VERSION,
      today,
      activeExecution: active,
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
      primaryAction: active
        ? { code: "RESUME", label: `Resume ${sessionLabel(active)}` }
        : todayAssignment
          ? { code: "START", label: `Start ${sessionLabel(todayAssignment)}` }
          : null,
      secondaryAction: active ? { code: "END_INCOMPLETE", label: "End incomplete session" } : null,
      dailyRecordTarget: active
        ? `${sessionLabel(active)} · Assignment ${activeId}`
        : todayAssignment ? `${sessionLabel(todayAssignment)} · Assignment ${scheduledId}` : ""
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
    const draftPlans = revisionPlanStates(input.draftPlans || input.activePlans || {}, draftContract);
    const draftRequired = draftContract ? Object.values(draftPlans).filter((item) => !item.ready) : [];
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
        status: !draftContract ? "NO_DRAFT" : draftRequired.length ? "DRAFT_INCOMPLETE" : "DRAFT_READY",
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
    resolveActiveStrengthSession,
    endIncompleteSession,
    resolvePlanRevisionStatus,
    linkEvidenceToAssignment,
    countTrainingWindows
  });
});
