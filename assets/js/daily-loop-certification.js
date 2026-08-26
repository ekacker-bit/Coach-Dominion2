(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionDailyLoopCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030S.1";
  const RECEIPT_TYPE = "DAILY_LOOP_CERTIFICATION";
  const STATES = Object.freeze({
    OPEN: "OPEN",
    READY_TO_CLOSE: "READY_TO_CLOSE",
    SETTLING: "SETTLING",
    PROTECTED: "PROTECTED",
    CERTIFIED: "CERTIFIED",
    ACTION_REQUIRED: "ACTION_REQUIRED"
  });
  const OUTCOMES = Object.freeze({
    COMPLETE: "COMPLETE",
    PARTIAL: "PARTIAL",
    MISSED: "MISSED",
    UNRESOLVED: "UNRESOLVED",
    EXCLUDED: "EXCLUDED"
  });
  const REQUIRED_SURFACES = Object.freeze(["calendar", "today", "train", "quickLog"]);
  const COMPLETE_STATES = new Set(["COMPLETED", "VERIFIED"]);
  const PARTIAL_STATES = new Set(["IN_PROGRESS", "DRAFT_EVIDENCE"]);
  const EXCLUDED_STATES = new Set(["SUPERSEDED", "CANCELLED"]);
  const INVALID_DECISION_STATES = new Set(["", "BLOCKED", "EVIDENCE_OPEN"]);

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
  function sortedIds(values = []) {
    return [...new Set((Array.isArray(values) ? values : []).map(assignmentId).filter(Boolean))].sort();
  }
  function sameIds(left = [], right = []) {
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }
  function applicableEntries(ledger = {}) {
    return (Array.isArray(ledger.entries) ? ledger.entries : []).filter((entry) => !EXCLUDED_STATES.has(upper(entry.state)));
  }
  function assignmentOutcome(entry = {}, sealed = false) {
    const state = upper(entry.state);
    if (EXCLUDED_STATES.has(state)) return OUTCOMES.EXCLUDED;
    if (!assignmentId(entry) || entry.identityValid === false) return OUTCOMES.UNRESOLVED;
    if (entry.complete === true || COMPLETE_STATES.has(state)) return OUTCOMES.COMPLETE;
    if (!sealed) return OUTCOMES.UNRESOLVED;
    if (PARTIAL_STATES.has(state)) return OUTCOMES.PARTIAL;
    if (state === "SCHEDULED") return OUTCOMES.MISSED;
    return OUTCOMES.UNRESOLVED;
  }
  function outcomeSummary(ledger = {}, sealed = false) {
    const outcomes = (Array.isArray(ledger.entries) ? ledger.entries : []).map((entry) => ({
      assignmentId: assignmentId(entry) || null,
      module: text(entry.module).toLowerCase() || null,
      state: upper(entry.state) || null,
      outcome: assignmentOutcome(entry, sealed),
      evidenceIds: sortedIds(entry.evidenceIds || [])
    }));
    const counts = Object.fromEntries(Object.values(OUTCOMES).map((outcome) => [outcome, outcomes.filter((item) => item.outcome === outcome).length]));
    return { outcomes, counts };
  }
  function surfaceAudit(ledger = {}, surfaces = {}, requiredSurfaces = REQUIRED_SURFACES) {
    const expected = sortedIds(applicableEntries(ledger));
    const reports = (Array.isArray(requiredSurfaces) ? requiredSurfaces : REQUIRED_SURFACES).map((surface) => {
      const actual = sortedIds(surfaces?.[surface]);
      const missing = expected.filter((id) => !actual.includes(id));
      const extra = actual.filter((id) => !expected.includes(id));
      return { surface, expected, actual, missing, extra, matches: sameIds(expected, actual) };
    });
    return { matches: reports.every((report) => report.matches), expected, reports };
  }
  function lineageAudit(input = {}) {
    const lineage = {
      contractRevision: Number(input.contractRevision || 0),
      weekId: text(input.weekId) || null,
      todayId: text(input.todayId) || null,
      ledgerFingerprint: text(input.ledger?.fingerprint) || null
    };
    const issues = [];
    if (!(lineage.contractRevision > 0)) issues.push({ code: "CONTRACT_AUTHORITY_MISSING" });
    if (!lineage.weekId) issues.push({ code: "WEEK_AUTHORITY_MISSING" });
    if (!lineage.todayId) issues.push({ code: "TODAY_AUTHORITY_MISSING" });
    if (!lineage.ledgerFingerprint) issues.push({ code: "LEDGER_FINGERPRINT_MISSING" });
    return { lineage, valid: issues.length === 0, issues };
  }
  function decisionAudit(decision = null, sourceDate = "") {
    const date = dateIso(sourceDate);
    const effectiveDate = dateIso(decision?.effectiveDate);
    const decisionDate = dateIso(decision?.date || decision?.sourceDate);
    const status = upper(decision?.status);
    const valid = Boolean(
      decision?.id
      && date
      && decisionDate === date
      && effectiveDate
      && effectiveDate > date
      && decision?.verdict
      && !INVALID_DECISION_STATES.has(status)
    );
    return {
      valid,
      id: text(decision?.id) || null,
      status: status || null,
      verdict: upper(decision?.verdict) || null,
      headline: text(decision?.headline) || null,
      sourceDate: decisionDate,
      effectiveDate,
      issues: valid ? [] : [{ code: "NEXT_DAY_DECISION_MISSING" }]
    };
  }
  function closeoutAudit(closeout = null, sourceDate = "") {
    const date = dateIso(sourceDate);
    const sealed = Boolean(closeout?.id && upper(closeout?.status) === "SEALED" && dateIso(closeout?.date) === date);
    return {
      sealed,
      id: text(closeout?.id) || null,
      revision: Number(closeout?.revision || 0),
      updatedAt: closeout?.updatedAt || closeout?.sealedAt || null,
      issues: sealed ? [] : [{ code: "CLOSEOUT_NOT_SEALED" }]
    };
  }
  function receiptMatches(receipt = null, candidateId = "") {
    return Boolean(receipt?.id && receipt.id === candidateId && receipt.type === RECEIPT_TYPE && receipt.version === VERSION);
  }
  function buildReceipt(input = {}) {
    const date = dateIso(input.date || input.closeout?.date || input.ledger?.date);
    const closeout = closeoutAudit(input.closeout, date);
    const decision = decisionAudit(input.decision, date);
    const lineage = lineageAudit(input).lineage;
    const outcomes = outcomeSummary(input.ledger, closeout.sealed);
    const basis = {
      version: VERSION,
      type: RECEIPT_TYPE,
      date,
      lineage,
      ledgerFingerprint: lineage.ledgerFingerprint,
      closeout: { id: closeout.id, revision: closeout.revision },
      decision: { id: decision.id, status: decision.status, verdict: decision.verdict, effectiveDate: decision.effectiveDate },
      outcomes: outcomes.outcomes
    };
    const fingerprint = stableHash(basis);
    return {
      ...basis,
      id: `daily-loop:${date}:${fingerprint}`,
      fingerprint,
      status: input.status || STATES.PROTECTED,
      securedAt: closeout.updatedAt || null,
      accountConfirmedAt: input.accountConfirmedAt || null,
      counts: outcomes.counts
    };
  }
  function viewFor(state, counts = {}, decision = {}) {
    const result = `${counts.COMPLETE || 0} complete · ${counts.PARTIAL || 0} partial · ${counts.MISSED || 0} missed`;
    if (state === STATES.CERTIFIED) return { tone: "green", headline: "Day secured", detail: `${result}. Tomorrow: ${decision.headline || "the next command is ready"}.`, action: null };
    if (state === STATES.PROTECTED) return { tone: "yellow", headline: "Day secured on this device", detail: `${result}. Account confirmation will retry automatically.`, action: "OPEN_ACCOUNT_HEALTH" };
    if (state === STATES.SETTLING) return { tone: "yellow", headline: "Finalizing tomorrow’s command", detail: "Your Closeout is sealed. Atlas is preparing the next decision.", action: "OPEN_TODAY" };
    if (state === STATES.READY_TO_CLOSE) return { tone: "gold", headline: "Close the day", detail: "Today’s assignment evidence is ready for the Daily Closeout.", action: "OPEN_CLOSEOUT" };
    if (state === STATES.ACTION_REQUIRED) return { tone: "red", headline: "Daily proof needs review", detail: "One assignment or authority line does not match. Nothing was discarded.", action: "OPEN_ACCOUNT_HEALTH" };
    return { tone: "neutral", headline: "Day in progress", detail: "Complete or honestly log each assigned action before Closeout.", action: "OPEN_TODAY" };
  }
  function evaluate(input = {}) {
    const date = dateIso(input.date || input.closeout?.date || input.ledger?.date);
    const closeout = closeoutAudit(input.closeout, date);
    const outcomes = outcomeSummary(input.ledger, closeout.sealed);
    const surfaces = surfaceAudit(input.ledger, input.surfaceAssignments, input.requiredSurfaces);
    const lineage = lineageAudit(input);
    const decision = decisionAudit(input.decision, date);
    const ledgerConsistent = input.ledger?.consistency?.consistent !== false;
    const unresolved = outcomes.counts.UNRESOLVED > 0;
    const issues = [
      ...(ledgerConsistent ? [] : (input.ledger?.consistency?.issues || [{ code: "LEDGER_INCONSISTENT" }])),
      ...(surfaces.matches ? [] : [{ code: "ASSIGNMENT_SURFACE_MISMATCH", reports: surfaces.reports.filter((report) => !report.matches) }]),
      ...lineage.issues,
      ...(closeout.sealed && unresolved ? [{ code: "ASSIGNMENT_OUTCOME_UNRESOLVED" }] : [])
    ];
    let state = STATES.OPEN;
    let receipt = null;
    if (issues.length) state = STATES.ACTION_REQUIRED;
    else if (!closeout.sealed) {
      const applicable = applicableEntries(input.ledger);
      state = applicable.length === 0 || applicable.every((entry) => entry.complete === true) ? STATES.READY_TO_CLOSE : STATES.OPEN;
    } else if (!decision.valid) state = STATES.SETTLING;
    else {
      const candidate = buildReceipt({ ...input, date, status: STATES.PROTECTED });
      const accountMatch = (Array.isArray(input.accountReceipts) ? input.accountReceipts : []).some((item) => receiptMatches(item, candidate.id));
      const certified = input.serverConfirmed === true && accountMatch;
      state = certified ? STATES.CERTIFIED : STATES.PROTECTED;
      receipt = { ...candidate, status: state, accountConfirmedAt: certified ? input.accountConfirmedAt || candidate.securedAt : null };
    }
    return {
      version: VERSION,
      date,
      state,
      certifiable: state === STATES.PROTECTED || state === STATES.CERTIFIED,
      certified: state === STATES.CERTIFIED,
      candidateReceiptId: receipt?.id || null,
      receipt,
      counts: outcomes.counts,
      outcomes: outcomes.outcomes,
      closeout,
      decision,
      lineage: lineage.lineage,
      surfaces,
      issues: [...issues, ...(state === STATES.SETTLING ? decision.issues : []), ...(!closeout.sealed && state !== STATES.ACTION_REQUIRED ? closeout.issues : [])],
      view: viewFor(state, outcomes.counts, decision)
    };
  }
  function upsertHistory(history = [], receipt = null, limit = 120) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => text(right.securedAt || right.accountConfirmedAt).localeCompare(text(left.securedAt || left.accountConfirmedAt)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    STATES: { ...STATES },
    OUTCOMES: { ...OUTCOMES },
    REQUIRED_SURFACES: [...REQUIRED_SURFACES],
    assignmentOutcome,
    outcomeSummary,
    surfaceAudit,
    buildReceipt,
    receiptMatches,
    evaluate,
    upsertHistory
  });
});
