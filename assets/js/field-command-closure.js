(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionFieldCommandClosure = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030Z.1";
  const RECEIPT_TYPE = "COMMAND_COMPLETION_CERTIFICATION";
  const EXCLUDED = new Set(["superseded", "cancelled"]);

  function text(value = "") { return String(value ?? "").trim(); }
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
    for (const character of stableJson(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16).padStart(8, "0");
  }
  function assignmentId(value = {}) {
    return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.id);
  }
  function exactAuthority(receipt = {}, authority = {}) {
    return Number(receipt.authority?.contractRevision || 0) === Number(authority.contractRevision || 0)
      && text(receipt.authority?.weekId) === text(authority.weekId)
      && Number(receipt.authority?.weekRevision || 0) === Number(authority.weekRevision || 0);
  }
  function certified(receipt = {}, date = "", authority = {}) {
    return receipt?.type === RECEIPT_TYPE
      && receipt?.operationalDate === dateIso(date)
      && receipt?.status === "CERTIFIED"
      && receipt?.verificationStatus === "VERIFIED"
      && Boolean(receipt?.accountConfirmedAt)
      && receipt?.closure?.sourceEvidenceConfirmed !== false
      && exactAuthority(receipt, authority);
  }
  function applicableEntries(ledger = {}) {
    return (Array.isArray(ledger.entries) ? ledger.entries : [])
      .filter((entry) => assignmentId(entry) && !EXCLUDED.has(text(entry.state).toLowerCase()));
  }
  function closureByAssignment(receipts = [], date = "", authority = {}) {
    const map = new Map();
    (Array.isArray(receipts) ? receipts : [])
      .filter((receipt) => certified(receipt, date, authority))
      .sort((left, right) => text(right.accountConfirmedAt).localeCompare(text(left.accountConfirmedAt)))
      .forEach((receipt) => {
        const id = assignmentId(receipt.completion || receipt);
        if (id && !map.has(id)) map.set(id, receipt);
      });
    return map;
  }
  function evaluate(input = {}) {
    const date = dateIso(input.date || input.ledger?.date);
    const ledger = input.ledger || {};
    const authority = input.authority || {};
    const entries = applicableEntries(ledger);
    const closures = closureByAssignment(input.receipts, date, authority);
    const assignments = entries.map((entry) => {
      const id = assignmentId(entry);
      const receipt = closures.get(id) || null;
      return {
        assignmentId: id,
        module: text(entry.module).toLowerCase(),
        title: text(entry.assignment?.title || entry.assignment?.sessionName || entry.module || "Assignment"),
        state: receipt ? "TERMINAL" : text(entry.state).toUpperCase() || "SCHEDULED",
        terminal: Boolean(receipt),
        outcome: receipt?.closure?.outcome || null,
        receiptId: receipt?.id || null,
        accountConfirmedAt: receipt?.accountConfirmedAt || null
      };
    });
    const next = assignments.find((entry) => !entry.terminal) || null;
    const consistent = ledger?.consistency?.consistent !== false;
    const closeoutReady = Boolean(entries.length > 0 && !next && consistent);
    const basis = {
      date,
      authority: {
        contractRevision: Number(authority.contractRevision || 0),
        weekId: text(authority.weekId) || null,
        weekRevision: Number(authority.weekRevision || 0)
      },
      ledgerFingerprint: text(ledger.fingerprint) || null,
      assignments: assignments.map((entry) => ({ assignmentId: entry.assignmentId, state: entry.state, receiptId: entry.receiptId })),
      nextAssignmentId: next?.assignmentId || null,
      closeoutReady
    };
    return {
      version: VERSION,
      date,
      fingerprint: `field-closure:${date || "undated"}:${stableHash(basis)}`,
      state: !consistent ? "ACTION_REQUIRED" : closeoutReady ? "CLOSEOUT_READY" : assignments.some((entry) => entry.terminal) ? "ADVANCED" : "OPEN",
      assignments,
      terminal: assignments.filter((entry) => entry.terminal).length,
      total: assignments.length,
      next,
      nextFingerprint: `next-${stableHash(next ? { assignmentId: next.assignmentId, module: next.module } : { type: "CLOSEOUT", date })}`,
      closeoutReady,
      consistent,
      issues: consistent ? [] : ledger?.consistency?.issues || [{ code: "LEDGER_INCONSISTENT" }]
    };
  }
  function surfaceAudit(result = {}, surfaces = {}) {
    const expected = result.closeoutReady ? "CLOSEOUT" : result.next?.assignmentId || null;
    const reports = Object.entries(surfaces).map(([surface, value]) => ({
      surface,
      expected,
      actual: text(value) || null,
      matches: (text(value) || null) === expected
    }));
    return { matches: reports.every((item) => item.matches), expected, reports };
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    assignmentId,
    exactAuthority,
    certified,
    closureByAssignment,
    evaluate,
    surfaceAudit
  });
});
