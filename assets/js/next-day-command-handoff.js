(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionNextDayCommandHandoff = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030T.1";
  const RECEIPT_TYPE = "NEXT_DAY_COMMAND_HANDOFF";
  const STATES = Object.freeze({
    WAITING: "WAITING",
    REVIEW_REQUIRED: "REVIEW_REQUIRED",
    PROTECTED: "PROTECTED",
    CERTIFIED: "CERTIFIED",
    ACTION_REQUIRED: "ACTION_REQUIRED"
  });
  const MODES = Object.freeze({ ADAPTED: "ADAPTED", PRESERVED: "PRESERVED" });
  const APPLIED_DECISION_STATES = new Set(["ACTIVE", "APPROVED", "HELD"]);
  const TRAINING_DOMAINS = new Set(["strength", "running", "core"]);

  function text(value = "") { return String(value ?? "").trim(); }
  function upper(value = "") { return text(value).toUpperCase().replaceAll(" ", "_"); }
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
  function assignmentId(value = {}) {
    if (typeof value === "string") return text(value);
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.id || value.activityId);
  }
  function domain(value = {}) {
    const raw = typeof value === "string" ? value : value.module || value.domain || value.type;
    const normalized = text(raw).toLowerCase();
    if (["training", "workout"].includes(normalized)) return "strength";
    if (["run", "cardio"].includes(normalized)) return "running";
    if (["abs", "abs_core", "abs/core"].includes(normalized)) return "core";
    if (["fuel", "fueling"].includes(normalized)) return "nutrition";
    return normalized;
  }
  function sortedIds(values = []) {
    return [...new Set((Array.isArray(values) ? values : []).map(assignmentId).filter(Boolean))].sort();
  }
  function sameIds(left = [], right = []) {
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }
  function applicableAssignments(input = {}) {
    const values = input.assignments || input.ledger?.entries || [];
    return (Array.isArray(values) ? values : []).filter((item) => !["cancelled", "superseded"].includes(text(item.state || item.status).toLowerCase()));
  }
  function expectedForSurface(assignments = [], surface = "calendar") {
    if (surface === "train") return assignments.filter((item) => TRAINING_DOMAINS.has(domain(item)));
    if (surface === "fuel") return assignments.filter((item) => domain(item) === "nutrition");
    if (surface === "quickLog") return assignments.filter((item) => ["running", "nutrition"].includes(domain(item)));
    return assignments;
  }
  function surfaceAudit(assignments = [], surfaces = {}) {
    const names = ["calendar", "today", "train", "quickLog", "fuel"];
    const reports = names.map((surface) => {
      const expected = sortedIds(expectedForSurface(assignments, surface));
      const actual = sortedIds(surfaces?.[surface]);
      const missing = expected.filter((id) => !actual.includes(id));
      const extra = actual.filter((id) => !expected.includes(id));
      return { surface, expected, actual, missing, extra, matches: sameIds(expected, actual) };
    });
    return { matches: reports.every((report) => report.matches), reports };
  }
  function decisionAudit(decision = null, targetDate = "") {
    const date = dateIso(targetDate);
    const status = upper(decision?.status);
    const effectiveDate = dateIso(decision?.effectiveDate);
    const reviewRequired = status === "PROPOSED" && effectiveDate === date;
    const valid = Boolean(decision?.id && decision?.verdict && effectiveDate === date && APPLIED_DECISION_STATES.has(status));
    return {
      valid,
      reviewRequired,
      id: text(decision?.id) || null,
      sourceDate: dateIso(decision?.date || decision?.sourceDate),
      effectiveDate,
      status: status || null,
      verdict: upper(decision?.verdict) || null,
      headline: text(decision?.headline) || null,
      reason: text(decision?.reason) || null,
      impact: text(decision?.impact) || null
    };
  }
  function sourceAudit(receipt = null, decision = null, targetDate = "") {
    const valid = Boolean(
      receipt?.id
      && receipt.type === "DAILY_LOOP_CERTIFICATION"
      && upper(receipt.status) === "CERTIFIED"
      && dateIso(receipt.date) === dateIso(decision?.date || decision?.sourceDate)
      && text(receipt.decision?.id) === text(decision?.id)
      && dateIso(receipt.decision?.effectiveDate) === dateIso(targetDate)
    );
    return {
      valid,
      id: text(receipt?.id) || null,
      sourceDate: dateIso(receipt?.date),
      decisionId: text(receipt?.decision?.id) || null,
      counts: receipt?.counts || {}
    };
  }
  function authorityAudit(input = {}, decision = null, source = null) {
    const targetDate = dateIso(input.targetDate || input.date);
    const canonical = input.canonical || {};
    const current = {
      contractRevision: Number(input.contractRevision || 0),
      weekId: text(input.weekId || canonical.week?.id) || null,
      weekRevision: Number(input.weekRevision || canonical.week?.revision || 0),
      canonicalId: text(input.canonicalId || canonical.id) || null,
      canonicalDate: dateIso(canonical.date || targetDate)
    };
    const issues = [];
    if (!(current.contractRevision > 0)) issues.push({ code: "CONTRACT_AUTHORITY_MISSING" });
    if (!current.weekId || !(current.weekRevision > 0)) issues.push({ code: "WEEK_AUTHORITY_MISSING" });
    if (!current.canonicalId || current.canonicalDate !== targetDate) issues.push({ code: "TODAY_AUTHORITY_MISSING" });
    const supersededByContract = Number(decision?.contractRevision || 0) > 0 && Number(decision.contractRevision) !== current.contractRevision;
    const crossedWeekBoundary = Boolean(source?.id && text(input.sourceWeekId) && text(input.sourceWeekId) !== current.weekId);
    return { valid: issues.length === 0, current, issues, supersededByContract, crossedWeekBoundary };
  }
  function commandMode(decision = {}, authority = {}) {
    if (upper(decision.status) === "HELD" || authority.supersededByContract || authority.crossedWeekBoundary || upper(decision.verdict) === "MAINTAIN") return MODES.PRESERVED;
    return MODES.ADAPTED;
  }
  function commandCopy(decision = {}, authority = {}, source = {}) {
    const mode = commandMode(decision, authority);
    const counts = source.counts || {};
    const evidence = `${Number(counts.COMPLETE || 0)} complete · ${Number(counts.PARTIAL || 0)} partial · ${Number(counts.MISSED || 0)} missed`;
    if (authority.supersededByContract) return { mode, headline: "Current Contract governs", change: "Yesterday’s call was not applied to a newer signed program.", why: evidence };
    if (authority.crossedWeekBoundary) return { mode, headline: "Committed week governs", change: "The new week stays intact; yesterday’s call remains in history.", why: evidence };
    if (upper(decision.status) === "HELD") return { mode, headline: "Current plan preserved", change: "You chose to keep today’s committed command.", why: evidence };
    if (upper(decision.verdict) === "RECOVER") return { mode, headline: "Recovery governs", change: "Hard training is held until a fresh Roll Call.", why: decision.reason || evidence };
    if (upper(decision.verdict) === "REDUCE") return { mode, headline: "Today’s dose is reduced", change: "Planned training volume is reduced about 20%.", why: decision.reason || evidence };
    if (upper(decision.verdict) === "ADVANCE") return { mode, headline: "One step forward", change: "One eligible primary target advances conservatively.", why: decision.reason || evidence };
    return { mode, headline: "Plan holds", change: "Today’s committed command stays unchanged.", why: decision.reason || evidence };
  }
  function buildReceipt(input = {}, audit = {}) {
    const targetDate = dateIso(input.targetDate || input.date);
    const decision = audit.decision;
    const source = audit.source;
    const authority = audit.authority;
    const assignments = applicableAssignments(input);
    const command = commandCopy(input.decision, authority, source);
    const basis = {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate,
      sourceReceiptId: source.id,
      sourceDate: source.sourceDate,
      decision: { id: decision.id, status: decision.status, verdict: decision.verdict },
      authority: authority.current,
      assignments: assignments.map((item) => ({ assignmentId: assignmentId(item), module: domain(item) })).sort((left, right) => left.assignmentId.localeCompare(right.assignmentId)),
      command
    };
    const fingerprint = stableHash(basis);
    return {
      ...basis,
      id: `next-day-command:${targetDate}:${fingerprint}`,
      fingerprint,
      status: input.status || STATES.PROTECTED,
      accountConfirmedAt: input.accountConfirmedAt || null
    };
  }
  function receiptMatches(receipt = null, candidateId = "") {
    return Boolean(receipt?.id === candidateId && receipt?.type === RECEIPT_TYPE && receipt?.version === VERSION);
  }
  function viewFor(state, command = null, decision = {}) {
    if (state === STATES.CERTIFIED) return { tone: command?.mode === MODES.ADAPTED ? "green" : "neutral", eyebrow: "TODAY’S CALL", headline: command?.headline || "Today’s command ready", detail: command?.change || "The committed plan governs.", why: command?.why || "Yesterday’s evidence was reconciled.", action: null };
    if (state === STATES.PROTECTED) return { tone: "yellow", eyebrow: "TODAY’S CALL", headline: command?.headline || "Today’s command ready", detail: `${command?.change || "The command is ready"} Account confirmation will retry.`, why: command?.why || "Yesterday’s evidence is protected.", action: "OPEN_ACCOUNT_HEALTH" };
    if (state === STATES.REVIEW_REQUIRED) return { tone: "gold", eyebrow: "ONE DECISION", headline: decision.headline || "Choose today’s command", detail: decision.impact || "Review the bounded change before today begins.", why: decision.reason || "Yesterday’s evidence supports a change.", action: "REVIEW_DECISION" };
    if (state === STATES.ACTION_REQUIRED) return { tone: "red", eyebrow: "COMMAND CHECK", headline: "Today’s command needs review", detail: "One assignment or authority line does not match. The signed program remains protected.", why: "Nothing was discarded or applied twice.", action: "OPEN_ACCOUNT_HEALTH" };
    return { tone: "neutral", eyebrow: "TODAY’S CALL", headline: "Yesterday is not secured yet", detail: "Close and certify the prior day before Atlas carries a decision forward.", why: "The committed plan remains unchanged.", action: null };
  }
  function evaluate(input = {}) {
    const targetDate = dateIso(input.targetDate || input.date);
    const decision = decisionAudit(input.decision, targetDate);
    const source = sourceAudit(input.sourceReceipt, input.decision, targetDate);
    const authority = authorityAudit({ ...input, targetDate }, input.decision, source);
    const surfaces = surfaceAudit(applicableAssignments(input), input.surfaceAssignments || {});
    const issues = [...authority.issues];
    if (!surfaces.matches) issues.push({ code: "COMMAND_SURFACE_MISMATCH", reports: surfaces.reports.filter((report) => !report.matches) });
    let state = STATES.WAITING;
    let receipt = null;
    let command = null;
    if (issues.length) state = STATES.ACTION_REQUIRED;
    else if (decision.reviewRequired && source.valid) state = STATES.REVIEW_REQUIRED;
    else if (!decision.valid || !source.valid) state = STATES.WAITING;
    else {
      const candidate = buildReceipt(input, { decision, source, authority, surfaces });
      const accountMatch = (Array.isArray(input.accountReceipts) ? input.accountReceipts : []).some((item) => receiptMatches(item, candidate.id));
      const certified = input.serverConfirmed === true && accountMatch;
      state = certified ? STATES.CERTIFIED : STATES.PROTECTED;
      receipt = { ...candidate, status: state, accountConfirmedAt: certified ? input.accountConfirmedAt || candidate.accountConfirmedAt : null };
      command = candidate.command;
    }
    return {
      version: VERSION,
      targetDate,
      state,
      certified: state === STATES.CERTIFIED,
      receipt,
      candidateReceiptId: receipt?.id || null,
      command,
      decision,
      source,
      authority,
      surfaces,
      issues,
      view: viewFor(state, command, decision)
    };
  }
  function upsertHistory(history = [], receipt = null, limit = 120) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => text(right.targetDate || right.accountConfirmedAt).localeCompare(text(left.targetDate || left.accountConfirmedAt)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    STATES: { ...STATES },
    MODES: { ...MODES },
    stableHash,
    surfaceAudit,
    sourceAudit,
    decisionAudit,
    authorityAudit,
    commandCopy,
    buildReceipt,
    receiptMatches,
    evaluate,
    upsertHistory
  });
});
