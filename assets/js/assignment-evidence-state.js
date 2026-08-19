(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAssignmentEvidenceState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";
  const STATES = Object.freeze({
    SCHEDULED: "scheduled",
    IN_PROGRESS: "in_progress",
    DRAFT_EVIDENCE: "draft_evidence",
    COMPLETED: "completed",
    VERIFIED: "verified",
    SUPERSEDED: "superseded",
    CANCELLED: "cancelled"
  });

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
  function number(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function assignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.sourceAssignmentId || value.sessionId || value.session?.id || value.id);
  }
  function evidenceAssignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.sourceAssignmentId || value.metrics?.assignment_id || value.metrics?.source_assignment_id);
  }
  function validRunEvidence(value = {}) {
    const metrics = value.metrics || value.actual || value;
    const distance = number(metrics.distance);
    const duration = number(metrics.duration_seconds ?? metrics.durationSeconds ?? value.durationSeconds);
    return Boolean(distance > 0 && duration > 0);
  }
  function linkedEvidence(assignment = {}, evidence = []) {
    const expected = assignmentId(assignment);
    if (!expected) return [];
    return (Array.isArray(evidence) ? evidence : []).filter((item) => evidenceAssignmentId(item) === expected);
  }
  function verifiedEvidence(item = {}) {
    return ["VERIFIED", "SECURED", "CONNECTED_VERIFIED"].includes(upper(item.evidenceStatus || item.status || item.verificationStatus));
  }
  function normalizedRunType(value = "") {
    const code = upper(value).replace(/S$/, "");
    return ({ INTERVAL: "INTERVAL", TEMPO: "TEMPO", THRESHOLD: "TEMPO", EASY: "EASY", RECOVERY: "RECOVERY", LONG: "LONG", RACE: "RACE" })[code] || code;
  }
  function evidenceFitsAssignment(assignment = {}, item = {}) {
    const expected = normalizedRunType(assignment.type || assignment.session?.type);
    const actual = normalizedRunType(item.metrics?.run_type || item.runType || text(item.activityCode).replace(/^manual_/i, ""));
    return !expected || !actual || expected === actual;
  }
  function resolve(input = {}) {
    const assignment = input.assignment || {};
    const execution = input.execution || null;
    const expectedId = assignmentId(assignment);
    const executionId = assignmentId(execution || {});
    const executionMatches = Boolean(execution && expectedId && executionId === expectedId);
    const evidence = linkedEvidence(assignment, input.evidence).filter((item) => validRunEvidence(item) && evidenceFitsAssignment(assignment, item));
    const invalidLinkedEvidence = linkedEvidence(assignment, input.evidence).filter((item) => !validRunEvidence(item) || !evidenceFitsAssignment(assignment, item));
    const executionState = executionMatches ? upper(execution.state || execution.status) : "";
    let state = STATES.SCHEDULED;
    if (["SUPERSEDED", "REPLACED"].includes(upper(assignment.status))) state = STATES.SUPERSEDED;
    else if (["CANCELLED", "CANCELED"].includes(upper(assignment.status))) state = STATES.CANCELLED;
    else if (evidence.some(verifiedEvidence)) state = STATES.VERIFIED;
    else if (evidence.length || ["COMPLETE", "COMPLETED"].includes(executionState)) state = STATES.COMPLETED;
    else if (invalidLinkedEvidence.length || executionState === "REVIEW") state = STATES.DRAFT_EVIDENCE;
    else if (["IN_PROGRESS", "PAUSED"].includes(executionState)) state = STATES.IN_PROGRESS;
    const title = text(assignment.title || assignment.session?.title || assignment.type || "assignment");
    const actions = {
      [STATES.SCHEDULED]: { code: "START", label: `Start ${title}` },
      [STATES.IN_PROGRESS]: { code: "RESUME", label: `Resume ${title}` },
      [STATES.DRAFT_EVIDENCE]: { code: "FINISH_LOG", label: title.toLowerCase().includes("run") || upper(assignment.module) === "RUNNING" ? "Finish run log" : "Finish evidence" },
      [STATES.COMPLETED]: { code: "REVIEW", label: "Review evidence" },
      [STATES.VERIFIED]: { code: "CONTINUE", label: text(input.nextTitle) ? `Continue to ${text(input.nextTitle)}` : "Continue" },
      [STATES.SUPERSEDED]: { code: "NONE", label: "Superseded" },
      [STATES.CANCELLED]: { code: "NONE", label: "Cancelled" }
    };
    return {
      version: VERSION,
      assignmentId: expectedId || null,
      state,
      evidence,
      evidenceId: evidence[0]?.id || null,
      executionMatches,
      incompleteEvidenceCount: invalidLinkedEvidence.length,
      complete: [STATES.COMPLETED, STATES.VERIFIED].includes(state),
      verified: state === STATES.VERIFIED,
      action: actions[state]
    };
  }

  return Object.freeze({ VERSION, STATES: { ...STATES }, assignmentId, evidenceAssignmentId, validRunEvidence, evidenceFitsAssignment, linkedEvidence, resolve });
});
