(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMorningCommandActivation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030U.1";
  const RECEIPT_TYPE = "MORNING_COMMAND_ACTIVATION";
  const RESOLUTION_TYPE = "PRIOR_DAY_EXECUTION_RESOLUTION";
  const STATES = Object.freeze({
    WAITING: "WAITING",
    DECISION_REQUIRED: "DECISION_REQUIRED",
    PROTECTED: "PROTECTED",
    CERTIFIED: "CERTIFIED",
    ACTION_REQUIRED: "ACTION_REQUIRED"
  });
  const RESOLUTIONS = Object.freeze({
    RESUME: "RESUME",
    RESCHEDULE: "RESCHEDULE",
    CLOSE_INCOMPLETE: "CLOSE_INCOMPLETE"
  });
  const ACTIVE_EXECUTION_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const TERMINAL_ASSIGNMENT_STATES = new Set(["CANCELLED", "CANCELED", "SUPERSEDED"]);
  const MODULE_ALIASES = Object.freeze({
    workout: "strength",
    training: "strength",
    run: "running",
    cardio: "running",
    abs: "core",
    "abs/core": "core",
    fuel: "nutrition",
    fueling: "nutrition"
  });
  const ROUTES = Object.freeze({
    strength: { section: "today", module: "strength", anchor: "daily-assignment-heading" },
    running: { section: "performance", module: "running", anchor: "running-command-panel" },
    core: { section: "today", module: "core", anchor: "today-core-detail" },
    nutrition: { section: "nutrition", module: "fuel", anchor: "nutrition-today" },
    recovery: { section: "today", module: "recovery", anchor: "today-recovery-card" }
  });

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replace(/[\s-]+/g, "_"); }
  function dateIso(value = "") {
    const candidate = text(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function stableHash(value) {
    let result = 2166136261;
    for (const char of stableJson(value)) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function domain(value = {}) {
    const raw = typeof value === "string" ? value : value.module || value.domain || value.type;
    const normalized = text(raw).toLowerCase();
    return MODULE_ALIASES[normalized] || normalized;
  }
  function assignmentId(value = {}) {
    if (typeof value === "string") return text(value);
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.sourceAssignmentId || value.id || value.activityId);
  }
  function executionId(value = {}) {
    return text(value.executionId || value.id || value.sessionId || assignmentId(value) || `${domain(value)}:${dateIso(value.operationalDate || value.date) || "unknown"}`);
  }
  function executionDate(value = {}) { return dateIso(value.operationalDate || value.date || value.startedAt || value.createdAt || value.updatedAt); }
  function assignmentTitle(value = {}) {
    return text(value.title || value.sessionName || value.label || value.sessionSnapshot?.sessionName || value.sessionSnapshot?.title || "Today’s assignment");
  }
  function routeFor(value = {}, options = {}) {
    const module = domain(value) || text(options.module).toLowerCase() || "recovery";
    const base = ROUTES[module] || ROUTES.recovery;
    return {
      ...base,
      module,
      assignmentId: assignmentId(value) || null,
      executionId: options.executionId || null,
      carryover: options.carryover === true,
      label: options.label || `${options.carryover ? "Resume" : "Open"} ${assignmentTitle(value)}`
    };
  }
  function currentAssignments(input = {}) {
    const assignments = Array.isArray(input.assignments) ? input.assignments : [];
    return assignments.filter((item) => !TERMINAL_ASSIGNMENT_STATES.has(upper(item.state || item.status)));
  }
  function sortedAssignmentIds(values = []) {
    return [...new Set(values.map(assignmentId).filter(Boolean))].sort();
  }
  function sameIds(left = [], right = []) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
  function validHandoff(value = null, targetDate = "") {
    return Boolean(
      value?.id
      && value.type === "NEXT_DAY_COMMAND_HANDOFF"
      && upper(value.status) === "CERTIFIED"
      && dateIso(value.targetDate) === dateIso(targetDate)
      && value.accountConfirmedAt
    );
  }
  function authorityFromInput(input = {}) {
    const canonical = input.canonical || {};
    return {
      contractRevision: Number(input.contractRevision || 0),
      weekId: text(input.weekId || canonical.week?.id) || null,
      weekRevision: Number(input.weekRevision || canonical.week?.revision || 0),
      canonicalId: text(input.canonicalId || canonical.id) || null,
      canonicalDate: dateIso(canonical.date || input.targetDate)
    };
  }
  function authorityAudit(input = {}, handoff = null) {
    const current = authorityFromInput(input);
    const expected = handoff?.authority || {};
    const targetDate = dateIso(input.targetDate);
    const issues = [];
    if (!(current.contractRevision > 0)) issues.push({ code: "CONTRACT_AUTHORITY_MISSING" });
    if (!current.weekId || !(current.weekRevision > 0)) issues.push({ code: "WEEK_AUTHORITY_MISSING" });
    if (!current.canonicalId || current.canonicalDate !== targetDate) issues.push({ code: "TODAY_AUTHORITY_MISSING" });
    if (Number(expected.contractRevision || 0) !== current.contractRevision) issues.push({ code: "HANDOFF_CONTRACT_MISMATCH" });
    if (text(expected.weekId) !== text(current.weekId) || Number(expected.weekRevision || 0) !== current.weekRevision) issues.push({ code: "HANDOFF_WEEK_MISMATCH" });
    if (text(expected.canonicalId) !== text(current.canonicalId) || dateIso(expected.canonicalDate) !== current.canonicalDate) issues.push({ code: "HANDOFF_TODAY_MISMATCH" });
    return { valid: issues.length === 0, current, expected, issues };
  }
  function assignmentAudit(input = {}, handoff = null) {
    const expected = sortedAssignmentIds(Array.isArray(handoff?.assignments) ? handoff.assignments : []);
    const actual = sortedAssignmentIds(currentAssignments(input));
    const missing = expected.filter((id) => !actual.includes(id));
    const extra = actual.filter((id) => !expected.includes(id));
    return { matches: sameIds(expected, actual), expected, actual, missing, extra };
  }
  function normalizeExecution(value = {}) {
    const normalizedDomain = domain(value);
    const id = executionId(value);
    return {
      executionId: id,
      assignmentId: assignmentId(value) || null,
      module: normalizedDomain,
      title: assignmentTitle(value),
      operationalDate: executionDate(value),
      state: upper(value.state || value.status),
      raw: value
    };
  }
  function resolutionFor(execution = null, targetDate = "", history = []) {
    if (!execution?.executionId) return null;
    return (Array.isArray(history) ? history : []).find((item) => (
      item?.type === RESOLUTION_TYPE
      && item.executionId === execution.executionId
      && dateIso(item.targetDate) === dateIso(targetDate)
      && Object.values(RESOLUTIONS).includes(upper(item.action))
    )) || null;
  }
  function unfinishedAudit(input = {}) {
    const targetDate = dateIso(input.targetDate);
    const resolutions = Array.isArray(input.resolutions) ? input.resolutions : [];
    const active = (Array.isArray(input.previousExecutions) ? input.previousExecutions : [])
      .map(normalizeExecution)
      .filter((item) => item.executionId && item.operationalDate && item.operationalDate < targetDate && ACTIVE_EXECUTION_STATES.has(item.state))
      .sort((left, right) => left.operationalDate.localeCompare(right.operationalDate) || left.executionId.localeCompare(right.executionId));
    const selected = active[0] || null;
    const resolution = resolutionFor(selected, targetDate, resolutions);
    return {
      active,
      selected,
      count: active.length,
      duplicate: active.length > 1,
      resolution,
      unresolved: Boolean(selected && !resolution)
    };
  }
  function canonicalTarget(input = {}) {
    const canonical = input.canonical || {};
    const handoff = input.handoff || {};
    const recovery = canonical.schedule?.recoveryDay === true || upper(handoff.decision?.verdict) === "RECOVER";
    if (recovery) return {
      assignmentId: `recovery:${dateIso(input.targetDate)}`,
      module: "recovery",
      title: "Recovery order",
      window: "TODAY",
      order: 1,
      route: routeFor({ module: "recovery", title: "Recovery order" })
    };
    const sessions = Array.isArray(canonical.schedule?.sessions) ? canonical.schedule.sessions : [];
    const first = sessions.slice().sort((left, right) => Number(left.order || 0) - Number(right.order || 0))[0] || null;
    if (first) return { ...first, assignmentId: assignmentId(first), module: domain(first), title: assignmentTitle(first), route: routeFor(first) };
    const fuel = currentAssignments(input).find((item) => domain(item) === "nutrition") || null;
    return fuel ? { ...fuel, assignmentId: assignmentId(fuel), module: "nutrition", title: assignmentTitle(fuel) || "Fuel target", route: routeFor(fuel) } : null;
  }
  function selectedTarget(input = {}, unfinished = {}) {
    if (unfinished.selected && upper(unfinished.resolution?.action) === RESOLUTIONS.RESUME) {
      const execution = unfinished.selected;
      return {
        assignmentId: execution.assignmentId || execution.executionId,
        executionId: execution.executionId,
        module: execution.module,
        title: execution.title,
        operationalDate: execution.operationalDate,
        carryover: true,
        route: routeFor(execution, { executionId: execution.executionId, carryover: true, label: `Resume ${execution.title}` })
      };
    }
    return canonicalTarget(input);
  }
  function resolutionReceipt(execution = {}, action = "", targetDate = "", options = {}) {
    const normalized = normalizeExecution(execution);
    const choice = upper(action);
    if (!normalized.executionId || !Object.values(RESOLUTIONS).includes(choice)) return null;
    const basis = {
      version: VERSION,
      type: RESOLUTION_TYPE,
      targetDate: dateIso(targetDate),
      executionId: normalized.executionId,
      assignmentId: normalized.assignmentId,
      module: normalized.module,
      sourceDate: normalized.operationalDate,
      action: choice
    };
    const fingerprint = stableHash(basis);
    return {
      ...basis,
      id: `prior-day-resolution:${basis.targetDate}:${fingerprint}`,
      fingerprint,
      title: normalized.title,
      decidedAt: options.decidedAt || null,
      accountConfirmedAt: options.accountConfirmedAt || null
    };
  }
  function buildReceipt(input = {}, audit = {}) {
    const targetDate = dateIso(input.targetDate);
    const resolution = audit.unfinished?.resolution || null;
    const target = audit.target;
    const basis = {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate,
      sourceHandoffId: input.handoff?.id || null,
      sourceHandoffFingerprint: input.handoff?.fingerprint || null,
      authority: audit.authority.current,
      target: {
        assignmentId: target?.assignmentId || null,
        executionId: target?.executionId || null,
        module: target?.module || null,
        title: target?.title || null,
        carryover: target?.carryover === true,
        route: target?.route || null
      },
      priorDayResolution: resolution ? {
        id: resolution.id,
        executionId: resolution.executionId,
        action: upper(resolution.action)
      } : null
    };
    const fingerprint = stableHash(basis);
    return {
      ...basis,
      id: `morning-command:${targetDate}:${fingerprint}`,
      fingerprint,
      status: input.status || STATES.PROTECTED,
      activatedAt: input.activatedAt || null,
      accountConfirmedAt: input.accountConfirmedAt || null
    };
  }
  function receiptMatches(receipt = null, candidateId = "") {
    return Boolean(receipt?.id === candidateId && receipt?.type === RECEIPT_TYPE && receipt?.version === VERSION);
  }
  function viewFor(state, target = null, unfinished = {}) {
    if (state === STATES.CERTIFIED) return {
      eyebrow: "TODAY’S COMMAND",
      headline: target?.carryover ? `Finish ${target.title}` : target?.title || "Today is ready",
      detail: target?.carryover ? "The prior session is the active order. Today’s scheduled work remains protected." : "This is the assignment authorized for execution now.",
      action: "OPEN_COMMAND",
      actionLabel: target?.route?.label || `Open ${target?.title || "today"}`
    };
    if (state === STATES.PROTECTED) return {
      eyebrow: "TODAY’S COMMAND",
      headline: target?.carryover ? `Finish ${target.title}` : target?.title || "Today is ready",
      detail: "The command is protected on this device. Account confirmation will retry.",
      action: "OPEN_COMMAND",
      actionLabel: target?.route?.label || `Open ${target?.title || "today"}`
    };
    if (state === STATES.DECISION_REQUIRED) return {
      eyebrow: "ONE DECISION",
      headline: `What happens to ${unfinished.selected?.title || "the unfinished session"}?`,
      detail: "Choose once. Nothing carries into today silently.",
      action: "RESOLVE_PRIOR_WORK",
      actionLabel: null
    };
    if (state === STATES.ACTION_REQUIRED) return {
      eyebrow: "COMMAND CHECK",
      headline: "Today’s command needs repair",
      detail: "The signed week, handoff, or current assignments no longer match. No work was discarded.",
      action: "OPEN_ACCOUNT_HEALTH",
      actionLabel: "Check account"
    };
    return {
      eyebrow: "TODAY’S COMMAND",
      headline: "Waiting for a certified handoff",
      detail: "The committed plan remains protected until yesterday’s close is confirmed.",
      action: null,
      actionLabel: null
    };
  }
  function evaluate(input = {}) {
    const targetDate = dateIso(input.targetDate || input.date);
    const handoff = input.handoff || null;
    const sourceValid = validHandoff(handoff, targetDate);
    const authority = sourceValid ? authorityAudit({ ...input, targetDate }, handoff) : { valid: false, current: authorityFromInput(input), expected: handoff?.authority || {}, issues: [] };
    const assignments = sourceValid ? assignmentAudit(input, handoff) : { matches: false, expected: [], actual: [], missing: [], extra: [] };
    const unfinished = unfinishedAudit({ ...input, targetDate });
    const issues = [...authority.issues];
    if (sourceValid && !assignments.matches) issues.push({ code: "HANDOFF_ASSIGNMENTS_CHANGED", missing: assignments.missing, extra: assignments.extra });
    if (unfinished.duplicate) issues.push({ code: "MULTIPLE_ACTIVE_EXECUTIONS", count: unfinished.count });
    let state = STATES.WAITING;
    let target = null;
    let receipt = null;
    if (!sourceValid) state = STATES.WAITING;
    else if (issues.length) state = STATES.ACTION_REQUIRED;
    else if (unfinished.unresolved) state = STATES.DECISION_REQUIRED;
    else {
      target = selectedTarget({ ...input, targetDate, handoff }, unfinished);
      if (!target?.route?.section) {
        issues.push({ code: "EXECUTABLE_TARGET_MISSING" });
        state = STATES.ACTION_REQUIRED;
      } else {
        const candidate = buildReceipt({ ...input, targetDate, handoff }, { authority, assignments, unfinished, target });
        const accountMatch = (Array.isArray(input.accountReceipts) ? input.accountReceipts : []).some((item) => receiptMatches(item, candidate.id));
        const certified = input.serverConfirmed === true && accountMatch;
        state = certified ? STATES.CERTIFIED : STATES.PROTECTED;
        receipt = {
          ...candidate,
          status: state,
          activatedAt: certified ? input.activatedAt || candidate.activatedAt : null,
          accountConfirmedAt: certified ? input.accountConfirmedAt || candidate.accountConfirmedAt : null
        };
      }
    }
    return {
      version: VERSION,
      targetDate,
      state,
      certified: state === STATES.CERTIFIED,
      source: { valid: sourceValid, handoffId: handoff?.id || null, fingerprint: handoff?.fingerprint || null },
      authority,
      assignments,
      unfinished,
      target,
      receipt,
      candidateReceiptId: receipt?.id || null,
      issues,
      view: viewFor(state, target, unfinished)
    };
  }
  function upsertHistory(history = [], receipt = null, limit = 120) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => text(right.targetDate || right.accountConfirmedAt || right.decidedAt).localeCompare(text(left.targetDate || left.accountConfirmedAt || left.decidedAt)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    RESOLUTION_TYPE,
    STATES: { ...STATES },
    RESOLUTIONS: { ...RESOLUTIONS },
    ROUTES: { ...ROUTES },
    stableHash,
    domain,
    assignmentId,
    executionId,
    routeFor,
    validHandoff,
    authorityAudit,
    assignmentAudit,
    unfinishedAudit,
    resolutionReceipt,
    buildReceipt,
    receiptMatches,
    evaluate,
    upsertHistory
  });
});
