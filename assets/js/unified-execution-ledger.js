(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionUnifiedExecutionLedger = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030G.1";
  const STATES = Object.freeze({
    SCHEDULED: "scheduled",
    IN_PROGRESS: "in_progress",
    DRAFT_EVIDENCE: "draft_evidence",
    COMPLETED: "completed",
    VERIFIED: "verified",
    SUPERSEDED: "superseded",
    CANCELLED: "cancelled"
  });
  const DOMAINS = Object.freeze(["strength", "running", "core", "nutrition"]);
  const TERMINAL = new Set(["COMPLETE", "COMPLETED", "SECURED", "LOGGED", "SEALED", "PARTIAL", "STOPPED", "PAIN_HOLD"]);
  const ACTIVE = new Set(["IN_PROGRESS", "PAUSED"]);
  const DRAFT = new Set(["REVIEW", "PARTIAL", "STOPPED", "INCOMPLETE", "DRAFT"]);
  const VERIFIED = new Set(["VERIFIED", "SECURED", "CONNECTED_VERIFIED"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function domain(value = "") {
    const code = upper(value).replace(/^DOMAIN_/, "");
    return ({
      STRENGTH: "strength",
      WORKOUT: "strength",
      TRAINING: "strength",
      RUN: "running",
      RUNNING: "running",
      CARDIO: "running",
      CORE: "core",
      ABS: "core",
      ABS_CORE: "core",
      FUEL: "nutrition",
      FUELING: "nutrition",
      NUTRITION: "nutrition"
    })[code] || text(value).toLowerCase();
  }
  function assignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.sourceAssignmentId || value.id);
  }
  function evidenceAssignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.sourceAssignmentId || value.metrics?.assignment_id || value.metrics?.source_assignment_id);
  }
  function stateOf(value = {}) { return upper(value.state || value.status || value.executionState); }
  function domainOf(value = {}) { return domain(value.module || value.domain || value.kind); }
  function hasWorkSets(execution = {}) {
    return Object.values(execution.setLogs || {}).some((logs) => Array.isArray(logs) && logs.some((item) => upper(item.kind || "WORK") !== "WARMUP"));
  }
  function hasCoreProof(execution = {}) {
    const values = [execution.completedRounds, execution.roundsCompleted, execution.completedExercises, execution.completedSets];
    return values.some((value) => finite(value) > 0)
      || Object.values(execution.completedExercises || execution.logs || execution.exerciseLogs || execution.setLogs || {}).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
  }
  function metrics(value = {}) { return value.metrics || value.actual || value.totals || value.summary || value; }
  function commandClosure(value = {}) {
    return value?.type === "COMMAND_COMPLETION_CERTIFICATION" || value?.sourceType === "COMMAND_COMPLETION_RECEIPT";
  }
  function accountConfirmedEvidence(value = {}) {
    if (commandClosure(value)) {
      return value?.status === "CERTIFIED"
        && value?.verificationStatus === "VERIFIED"
        && Boolean(value?.accountConfirmedAt)
        && value?.closure?.sourceEvidenceConfirmed !== false;
    }
    return Boolean(value?.accountConfirmedAt)
      || VERIFIED.has(upper(value.evidenceStatus || value.verificationStatus || value.status));
  }
  function validRunningEvidence(value = {}) {
    const values = metrics(value);
    const distance = finite(values.distance ?? values.distance_miles ?? values.distance_km);
    const duration = finite(values.duration_seconds ?? values.durationSeconds ?? value.durationSeconds ?? values.duration_minutes);
    return Boolean(distance > 0 && duration > 0);
  }
  function validNutritionEvidence(value = {}) {
    const values = metrics(value);
    return Boolean(finite(values.calories) > 0 && finite(values.protein) > 0);
  }
  function validStrengthEvidence(value = {}) {
    if (!TERMINAL.has(stateOf(value))) return false;
    return hasWorkSets(value) || finite(metrics(value).completed_sets ?? metrics(value).completedSets) > 0 || upper(value.sourceType) === "MISSION_RECEIPT" || Boolean(value.completedAt);
  }
  function validCoreEvidence(value = {}) {
    if (!TERMINAL.has(stateOf(value))) return false;
    return hasCoreProof(value) || Boolean(value.completedAt);
  }
  function validEvidence(module, value = {}) {
    const code = domain(module || domainOf(value));
    if (commandClosure(value)) return TERMINAL.has(stateOf(value)) && accountConfirmedEvidence(value);
    if (code === "running") return validRunningEvidence(value);
    if (code === "nutrition") return validNutritionEvidence(value);
    if (code === "strength") return validStrengthEvidence(value);
    if (code === "core") return validCoreEvidence(value);
    return TERMINAL.has(stateOf(value));
  }
  function evidenceVerified(value = {}) {
    return commandClosure(value)
      ? accountConfirmedEvidence(value)
      : VERIFIED.has(upper(value.evidenceStatus || value.verificationStatus || value.status));
  }
  function linkedEvidence(assignment = {}, evidence = []) {
    const expected = assignmentId(assignment);
    if (!expected) return [];
    return (Array.isArray(evidence) ? evidence : []).filter((item) => evidenceAssignmentId(item) === expected);
  }
  function matchingExecution(assignment = {}, executions = []) {
    const expected = assignmentId(assignment);
    if (!expected) return null;
    return (Array.isArray(executions) ? executions : []).find((item) => assignmentId(item) === expected) || null;
  }
  function executionProvesCompletion(module, execution = {}) {
    const code = domain(module);
    if (!TERMINAL.has(stateOf(execution))) return false;
    if (code === "running" || code === "nutrition") return false;
    if (code === "strength") return hasWorkSets(execution);
    if (code === "core") return hasCoreProof(execution) || Boolean(execution.completedAt);
    return true;
  }
  function actionFor(entry = {}) {
    const title = text(entry.assignment?.title || entry.module || "assignment");
    return ({
      [STATES.SCHEDULED]: { code: "START", label: `Start ${title}` },
      [STATES.IN_PROGRESS]: { code: "RESUME", label: `Resume ${title}` },
      [STATES.DRAFT_EVIDENCE]: { code: "FINISH_LOG", label: `Finish ${entry.module === "nutrition" ? "Fuel" : title} log` },
      [STATES.COMPLETED]: { code: "REVIEW", label: "Review evidence" },
      [STATES.VERIFIED]: { code: "CONTINUE", label: "Continue" },
      [STATES.SUPERSEDED]: { code: "NONE", label: "Superseded" },
      [STATES.CANCELLED]: { code: "NONE", label: "Cancelled" }
    })[entry.state];
  }

  function resolveEntry(input = {}) {
    const assignment = input.assignment || {};
    const module = domain(input.module || domainOf(assignment));
    const id = assignmentId(assignment);
    const execution = input.execution || null;
    const executionMatches = Boolean(execution && id && assignmentId(execution) === id);
    const linked = linkedEvidence(assignment, input.evidence);
    const acceptedEvidence = linked.filter((item) => validEvidence(module, item));
    const incompleteEvidence = linked.filter((item) => !acceptedEvidence.includes(item));
    const executionState = executionMatches ? stateOf(execution) : "";
    const assignmentState = upper(assignment.status || assignment.state);
    const verified = acceptedEvidence.some(evidenceVerified);
    const completed = acceptedEvidence.length > 0 || (executionMatches && executionProvesCompletion(module, execution));
    const hasDraft = incompleteEvidence.length > 0
      || (executionMatches && (DRAFT.has(executionState) || hasWorkSets(execution) || hasCoreProof(execution)))
      || Boolean(input.draft);
    let state = STATES.SCHEDULED;
    if (["SUPERSEDED", "REPLACED"].includes(assignmentState)) state = STATES.SUPERSEDED;
    else if (["CANCELLED", "CANCELED"].includes(assignmentState)) state = STATES.CANCELLED;
    else if (verified) state = STATES.VERIFIED;
    else if (completed) state = STATES.COMPLETED;
    else if (executionMatches && ACTIVE.has(executionState)) state = STATES.IN_PROGRESS;
    else if (hasDraft || (executionMatches && DRAFT.has(executionState))) state = STATES.DRAFT_EVIDENCE;
    const entry = {
      version: VERSION,
      date: text(assignment.date || input.date).slice(0, 10) || null,
      module,
      assignmentId: id || null,
      identityValid: Boolean(id),
      assignment,
      execution: executionMatches ? execution : null,
      executionMatches,
      evidence: acceptedEvidence,
      incompleteEvidence,
      evidenceIds: acceptedEvidence.map((item) => text(item.id)).filter(Boolean),
      state,
      complete: [STATES.COMPLETED, STATES.VERIFIED].includes(state),
      verified: state === STATES.VERIFIED
    };
    entry.action = actionFor(entry);
    return entry;
  }

  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function hash(value = "") {
    let result = 2166136261;
    for (const char of String(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function nextEntry(entries = []) {
    const rank = [STATES.IN_PROGRESS, STATES.DRAFT_EVIDENCE, STATES.SCHEDULED, STATES.COMPLETED, STATES.VERIFIED];
    for (const state of rank) {
      const found = entries.find((entry) => entry.state === state);
      if (found) return found;
    }
    return null;
  }
  function consistencyReport(entries = [], evidence = []) {
    const ids = entries.map((entry) => entry.assignmentId).filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const known = new Set(ids);
    const orphanEvidence = (Array.isArray(evidence) ? evidence : [])
      .filter((item) => evidenceAssignmentId(item) && !known.has(evidenceAssignmentId(item)))
      .map((item) => text(item.id || evidenceAssignmentId(item)));
    const completedWithoutProof = entries.filter((entry) => entry.complete && !entry.evidence.length && !executionProvesCompletion(entry.module, entry.execution || {})).map((entry) => entry.assignmentId);
    const missingAssignmentIds = entries.filter((entry) => !entry.identityValid).map((entry) => entry.module);
    const issues = [
      ...duplicates.map((id) => ({ code: "DUPLICATE_ASSIGNMENT", assignmentId: id })),
      ...orphanEvidence.map((id) => ({ code: "ORPHAN_EVIDENCE", evidenceId: id })),
      ...completedWithoutProof.map((id) => ({ code: "COMPLETED_WITHOUT_PROOF", assignmentId: id })),
      ...missingAssignmentIds.map((module) => ({ code: "MISSING_ASSIGNMENT_ID", module }))
    ];
    return { consistent: issues.length === 0, issues, orphanEvidence, duplicates: [...new Set(duplicates)], missingAssignmentIds, completedWithoutProof };
  }
  function buildLedger(input = {}) {
    const date = text(input.date).slice(0, 10) || null;
    const assignments = (Array.isArray(input.assignments) ? input.assignments : []).filter((item) => DOMAINS.includes(domainOf(item)));
    const executions = Array.isArray(input.executions) ? input.executions : [];
    const evidence = Array.isArray(input.evidence) ? input.evidence : [];
    const drafts = input.drafts || {};
    const entries = assignments.map((assignment, index) => resolveEntry({
      date,
      assignment,
      module: domainOf(assignment),
      execution: matchingExecution(assignment, executions),
      evidence,
      draft: drafts[domainOf(assignment)] || null,
      index
    })).sort((left, right) => {
      const leftOrder = finite(left.assignment.sessionOrder) ?? DOMAINS.indexOf(left.module) + 100;
      const rightOrder = finite(right.assignment.sessionOrder) ?? DOMAINS.indexOf(right.module) + 100;
      return leftOrder - rightOrder;
    });
    const applicable = entries.filter((entry) => ![STATES.SUPERSEDED, STATES.CANCELLED].includes(entry.state));
    const counts = Object.fromEntries(Object.values(STATES).map((state) => [state, entries.filter((entry) => entry.state === state).length]));
    const consistency = consistencyReport(entries, evidence);
    const fingerprintInput = entries.map((entry) => ({ assignmentId: entry.assignmentId, module: entry.module, state: entry.state, evidenceIds: entry.evidenceIds }));
    return {
      version: VERSION,
      date,
      entries,
      counts,
      completed: applicable.filter((entry) => entry.complete).length,
      total: applicable.length,
      complete: applicable.length > 0 && applicable.every((entry) => entry.complete),
      next: nextEntry(applicable),
      consistency,
      fingerprint: `execution-ledger:${date || "undated"}:${hash(stableJson(fingerprintInput))}`
    };
  }
  function entryForModule(ledger = {}, module = "") {
    return (ledger.entries || []).find((entry) => entry.module === domain(module)) || null;
  }

  return Object.freeze({
    VERSION,
    STATES: { ...STATES },
    DOMAINS: [...DOMAINS],
    domain,
    assignmentId,
    evidenceAssignmentId,
    validEvidence,
    accountConfirmedEvidence,
    validRunningEvidence,
    validNutritionEvidence,
    linkedEvidence,
    resolveEntry,
    buildLedger,
    entryForModule,
    consistencyReport
  });
});
