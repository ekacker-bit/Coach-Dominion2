(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCommandCompletionCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030V.1";
  const RECEIPT_TYPE = "COMMAND_COMPLETION_CERTIFICATION";
  const STATES = Object.freeze({
    WAITING: "WAITING",
    PROTECTED: "PROTECTED",
    CERTIFIED: "CERTIFIED",
    ACTION_REQUIRED: "ACTION_REQUIRED"
  });
  const TERMINAL_STATES = new Set(["COMPLETE", "COMPLETED", "PARTIAL", "STOPPED", "PAIN_HOLD", "SECURED", "SEALED"]);
  const COMPLETE_STATES = new Set(["COMPLETE", "COMPLETED", "SECURED", "SEALED"]);
  const MODULE_ALIASES = Object.freeze({
    workout: "strength",
    training: "strength",
    run: "running",
    cardio: "running",
    abs: "core",
    abs_core: "core",
    "abs/core": "core",
    fuel: "nutrition",
    fueling: "nutrition"
  });
  const ROUTES = Object.freeze({
    strength: { section: "today", module: "strength", anchor: "daily-assignment-heading" },
    running: { section: "performance", module: "running", anchor: "running-command-panel" },
    core: { section: "today", module: "core", anchor: "today-core-detail" },
    nutrition: { section: "nutrition", module: "fuel", anchor: "fuel-closed-loop-panel" },
    recovery: { section: "today", module: "recovery", anchor: "today-recovery-card" },
    closeout: { section: "today", module: "closeout", anchor: "daily-closeout-panel" }
  });

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replace(/[\s-]+/g, "_"); }
  function dateIso(value = "") {
    const candidate = text(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }
  function moduleCode(value = "") {
    const raw = text(value).toLowerCase().replace(/[\s-]+/g, "_");
    return MODULE_ALIASES[raw] || raw;
  }
  function stableJson(value) {
    if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  function stableHash(value) {
    let result = 2166136261;
    for (const character of stableJson(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function assignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.sourceAssignmentId || value.id);
  }
  function routeFor(value = {}) {
    const module = moduleCode(value.module || value.domain || value.type);
    return { ...(ROUTES[module] || ROUTES.closeout) };
  }
  function normalizeAssignment(value = {}, index = 0) {
    const module = moduleCode(value.module || value.domain || value.type);
    const id = assignmentId(value);
    const order = Number(value.sessionOrder ?? value.order ?? index + 1);
    const windowOrder = Number(value.windowOrder ?? value.trainingWindowOrder ?? order);
    const windowLabel = text(value.windowLabel || value.sessionLabel || value.sessionWindow)
      || (windowOrder > 1 ? "PM" : "AM");
    return {
      assignmentId: id || null,
      module,
      title: text(value.title || value.sessionName || value.name) || `${module || "training"} session`,
      order: Number.isFinite(order) ? order : index + 1,
      windowOrder: Number.isFinite(windowOrder) ? windowOrder : index + 1,
      windowId: text(value.trainingWindowId || value.windowId) || `window-${Number.isFinite(windowOrder) ? windowOrder : index + 1}`,
      windowLabel,
      estimatedMinutes: Math.max(0, Number(value.estimatedMinutes || value.durationMinutes || 0)),
      tertiary: value.tertiary === true || module === "core",
      route: routeFor({ module })
    };
  }
  function normalizedAssignments(values = []) {
    const normalized = (Array.isArray(values) ? values : [])
      .map(normalizeAssignment)
      .filter((item) => item.assignmentId && ["strength", "running", "core", "nutrition", "recovery"].includes(item.module));
    const windowRanks = new Map();
    normalized.forEach((item, index) => {
      const label = upper(item.windowLabel);
      const semanticRank = label.startsWith("AM") ? 1 : label.startsWith("PM") ? 2 : Number(item.windowOrder || index + 1);
      const existing = windowRanks.get(item.windowId);
      windowRanks.set(item.windowId, existing === undefined ? semanticRank : Math.min(existing, semanticRank));
    });
    return normalized
      .map((item) => ({ ...item, windowOrder: windowRanks.get(item.windowId) || item.windowOrder }))
      .sort((left, right) => left.windowOrder - right.windowOrder
        || Number(left.tertiary) - Number(right.tertiary)
        || left.order - right.order
        || left.assignmentId.localeCompare(right.assignmentId));
  }
  function issue(code, detail) { return { code, detail }; }
  function receiptTime(value = {}) {
    return Date.parse(value.accountConfirmedAt || value.completedAt || value.createdAt || "") || 0;
  }
  function upsertHistory(history = [], receipt = null, limit = 365) {
    if (!receipt?.id) return Array.isArray(history) ? history : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || String(left.id).localeCompare(String(right.id)))
      .slice(0, Math.max(1, Number(limit || 365)));
  }
  function latestForDate(history = [], value = "") {
    const date = dateIso(value);
    return (Array.isArray(history) ? history : [])
      .filter((item) => item?.type === RECEIPT_TYPE && item.operationalDate === date)
      .sort((left, right) => receiptTime(right) - receiptTime(left))[0] || null;
  }
  function accountConfirmedReceipt(value = {}) {
    return value?.status === STATES.CERTIFIED
      && value?.verificationStatus === "VERIFIED"
      && Boolean(value?.accountConfirmedAt);
  }
  function completedAssignmentIds(history = [], operationalDate = "", authority = {}) {
    const date = dateIso(operationalDate);
    return new Set((Array.isArray(history) ? history : [])
      .filter((item) => item?.type === RECEIPT_TYPE
        && item.operationalDate === date
        && Number(item.authority?.contractRevision || 0) === Number(authority.contractRevision || 0)
        && text(item.authority?.weekId) === text(authority.weekId)
        && Number(item.authority?.weekRevision || 0) === Number(authority.weekRevision || 0))
      .map((item) => text(item.completion?.assignmentId))
      .filter(Boolean));
  }
  function nextCommand(assignments = [], history = [], receipt = null) {
    if (receipt?.completion?.state === "PAIN_HOLD") {
      return {
        type: "SAFETY",
        module: "recovery",
        title: "Review recovery order",
        label: "Recovery",
        route: routeFor({ module: "recovery" })
      };
    }
    const completed = completedAssignmentIds([receipt, ...(history || [])], receipt?.operationalDate, receipt?.authority || {});
    const next = assignments.find((item) => !completed.has(item.assignmentId));
    if (next) {
      const window = next.windowLabel && !["TODAY", "SESSION 1"].includes(upper(next.windowLabel)) ? `${next.windowLabel} ` : "";
      const result = {
        type: "COMMAND",
        assignmentId: next.assignmentId,
        module: next.module,
        title: next.title,
        label: `${window}${next.module === "running" ? "Run" : next.module === "core" ? "Core" : next.module === "nutrition" ? "Fuel" : next.title}`.trim(),
        windowId: next.windowId,
        windowLabel: next.windowLabel,
        tertiary: next.tertiary,
        route: next.route
      };
      return { ...result, fingerprint: `next-${stableHash(result)}` };
    }
    const result = { type: "CLOSEOUT", module: "closeout", title: "Close the day", label: "Close the day", route: routeFor({ module: "closeout" }) };
    return { ...result, fingerprint: `next-${stableHash(result)}` };
  }
  function completionView(receipt = {}, state = STATES.PROTECTED, next = null) {
    const complete = COMPLETE_STATES.has(receipt.completion?.state);
    const pain = receipt.completion?.state === "PAIN_HOLD";
    const headline = pain ? "Session stopped" : complete ? "Mission complete" : "Session preserved";
    const title = receipt.completion?.title || "Session";
    if (state !== STATES.CERTIFIED) {
      return {
        eyebrow: pain ? "SAFETY HOLD" : "SECURING PROOF",
        headline: "Securing completion",
        detail: `${title} is saved. Confirming the account receipt.`,
        action: null,
        actionLabel: null
      };
    }
    return {
      eyebrow: pain ? "SAFETY HOLD" : complete ? "MISSION COMPLETE" : "SESSION PRESERVED",
      headline,
      detail: `${title} ${pain ? "stopped and preserved" : "secured"}. ${next?.type === "COMMAND" ? `Next: ${next.label}.` : next?.type === "SAFETY" ? "Review the recovery order." : "Close the day."}`,
      action: next?.type === "SAFETY" ? "OPEN_RECOVERY" : next?.type === "CLOSEOUT" ? "OPEN_CLOSEOUT" : "OPEN_NEXT",
      actionLabel: next?.label || "Continue"
    };
  }
  function buildCandidate(input = {}, assignment = null, assignments = []) {
    const source = input.source || {};
    const authority = input.authority || {};
    const operationalDate = dateIso(input.operationalDate || source.date);
    const completion = {
      assignmentId: assignment.assignmentId,
      module: assignment.module,
      title: assignment.title,
      state: upper(source.state || source.status),
      executionId: text(source.sourceRecordId || source.executionId || source.sessionId) || null,
      evidenceReceiptId: text(source.id || source.evidenceReceiptId) || null,
      completedAt: source.completedAt || source.updatedAt || input.completedAt || new Date().toISOString(),
      summary: source.summary || source.metrics || {}
    };
    const lineage = {
      operationalDate,
      contractRevision: Number(authority.contractRevision || 0),
      weekId: text(authority.weekId),
      weekRevision: Number(authority.weekRevision || 0),
      calendarCommitId: text(authority.calendarCommitId) || null,
      assignmentId: completion.assignmentId,
      module: completion.module,
      executionId: completion.executionId,
      evidenceReceiptId: completion.evidenceReceiptId,
      completionState: completion.state
    };
    const fingerprint = `completion-${stableHash(lineage)}`;
    const id = `command-completion:${operationalDate}:${assignment.assignmentId}:${fingerprint.slice(-8)}`;
    const receipt = {
      version: VERSION,
      type: RECEIPT_TYPE,
      id,
      fingerprint,
      operationalDate,
      date: operationalDate,
      module: completion.module,
      domain: completion.module,
      assignmentId: completion.assignmentId,
      calendarAssignmentId: completion.assignmentId,
      state: completion.state,
      status: STATES.PROTECTED,
      verificationStatus: "PENDING_ACCOUNT_RECEIPT",
      sourceType: "COMMAND_COMPLETION_RECEIPT",
      source: "COACH_DOMINION_EXECUTION",
      authority: {
        contractRevision: lineage.contractRevision,
        weekId: lineage.weekId,
        weekRevision: lineage.weekRevision,
        calendarCommitId: lineage.calendarCommitId,
        assignmentFingerprint: `assignments-${stableHash(assignments.map((item) => ({ assignmentId: item.assignmentId, module: item.module, order: item.order, windowId: item.windowId })))}`
      },
      completion,
      closure: {
        assignmentId: completion.assignmentId,
        module: completion.module,
        terminalState: completion.state,
        outcome: COMPLETE_STATES.has(completion.state) ? "COMPLETED" : completion.state === "PAIN_HOLD" ? "SAFETY_STOP" : "ENDED_INCOMPLETE",
        sourceEvidenceConfirmed: false,
        accountReceiptConfirmed: false,
        ledgerFingerprintBefore: text(input.ledgerFingerprint) || null,
        pendingWrites: Math.max(0, Number(input.pendingWrites || 0))
      },
      summary: completion.summary,
      completedAt: completion.completedAt,
      createdAt: input.createdAt || completion.completedAt,
      accountConfirmedAt: null
    };
    receipt.next = nextCommand(assignments, input.history || [], receipt);
    receipt.nextFingerprint = receipt.next.fingerprint;
    receipt.dayComplete = receipt.next.type === "CLOSEOUT";
    receipt.closeoutReady = false;
    receipt.sessionComplete = COMPLETE_STATES.has(completion.state);
    return receipt;
  }
  function exactAccountReceipt(receipt = {}, values = []) {
    return (Array.isArray(values) ? values : []).find((item) => item?.id === receipt.id && item?.fingerprint === receipt.fingerprint) || null;
  }
  function evaluate(input = {}) {
    const source = input.source || null;
    if (!source) return { version: VERSION, type: RECEIPT_TYPE, state: STATES.WAITING, receipt: null, view: null, issues: [] };
    const operationalDate = dateIso(input.operationalDate || source.date);
    const authority = input.authority || {};
    const assignments = normalizedAssignments(input.assignments || []);
    const sourceAssignmentId = assignmentId(source);
    const sourceModule = moduleCode(source.module || source.domain || source.kind);
    const sourceState = upper(source.state || source.status);
    const issues = [];
    if (!operationalDate) issues.push(issue("OPERATIONAL_DATE_REQUIRED", "Completion needs one valid operational date."));
    if (!Number(authority.contractRevision || 0)) issues.push(issue("SIGNED_CONTRACT_REQUIRED", "The signed Contract revision is missing."));
    if (!text(authority.weekId) || !Number(authority.weekRevision || 0)) issues.push(issue("COMMITTED_WEEK_REQUIRED", "The committed week identity is missing."));
    if (!sourceAssignmentId) issues.push(issue("ASSIGNMENT_ID_REQUIRED", "The completion is not linked to a Calendar assignment."));
    if (!TERMINAL_STATES.has(sourceState)) issues.push(issue("TERMINAL_EXECUTION_REQUIRED", "The execution must be complete, partial, stopped, secured, or on pain hold."));
    const assignment = assignments.find((item) => item.assignmentId === sourceAssignmentId) || null;
    if (sourceAssignmentId && !assignment && sourceModule !== "recovery") issues.push(issue("STALE_ASSIGNMENT_REJECTED", "That assignment is not in the current committed day."));
    if (assignment && sourceModule && assignment.module !== sourceModule) issues.push(issue("ASSIGNMENT_MODULE_MISMATCH", "The execution module does not match the Calendar assignment."));
    if (issues.length) {
      return {
        version: VERSION,
        type: RECEIPT_TYPE,
        state: STATES.ACTION_REQUIRED,
        receipt: null,
        issues,
        view: { eyebrow: "PROOF NEEDS ATTENTION", headline: "Completion not certified", detail: issues[0].detail, action: "OPEN_CALENDAR", actionLabel: "Review Calendar" }
      };
    }
    const candidate = buildCandidate({ ...input, operationalDate }, assignment || normalizeAssignment({ ...source, id: sourceAssignmentId, module: sourceModule }), assignments);
    const restored = exactAccountReceipt(candidate, input.accountReceipts || input.history || []);
    const sourceConfirmed = input.sourceAccountConfirmed !== false
      || Boolean(source.accountConfirmedAt)
      || accountConfirmedReceipt(restored || {});
    const pendingWrites = Math.max(0, Number(input.pendingWrites || 0));
    const accountConfirmed = Boolean(input.serverConfirmed === true && restored && sourceConfirmed && pendingWrites === 0);
    const receipt = accountConfirmed
      ? {
        ...candidate,
        status: STATES.CERTIFIED,
        verificationStatus: "VERIFIED",
        accountConfirmedAt: restored.accountConfirmedAt || input.accountConfirmedAt || new Date().toISOString(),
        closure: {
          ...candidate.closure,
          sourceEvidenceConfirmed: true,
          accountReceiptConfirmed: true,
          pendingWrites: 0
        }
      }
      : candidate;
    receipt.next = nextCommand(assignments, input.history || [], receipt);
    receipt.nextFingerprint = receipt.next.fingerprint;
    receipt.dayComplete = receipt.next.type === "CLOSEOUT";
    receipt.closeoutReady = accountConfirmed && receipt.dayComplete;
    const state = accountConfirmed ? STATES.CERTIFIED : STATES.PROTECTED;
    return { version: VERSION, type: RECEIPT_TYPE, state, receipt, next: receipt.next, issues: [], view: completionView(receipt, state, receipt.next) };
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    STATES: { ...STATES },
    TERMINAL_STATES: [...TERMINAL_STATES],
    moduleCode,
    assignmentId,
    normalizeAssignment,
    normalizedAssignments,
    routeFor,
    upsertHistory,
    latestForDate,
    accountConfirmedReceipt,
    completedAssignmentIds,
    nextCommand,
    evaluate
  });
});
