(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionJourneyContinuity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030D.1";
  const RECEIPT_TYPE = "RECRUIT_JOURNEY_CONTINUITY";
  const ACTION_SYNC_STATES = new Set(["user_action_required", "conflict", "failed"]);

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function unique(values = []) {
    return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))].sort();
  }

  function normalizeAssignments(assignments = []) {
    return (Array.isArray(assignments) ? assignments : [])
      .filter(Boolean)
      .map((item, index) => ({
        id: clean(item.id || item.activityId || `assignment-${index + 1}`),
        module: clean(item.module).toUpperCase(),
        title: clean(item.title || item.name),
        minutes: Number.isFinite(Number(item.estimatedMinutes ?? item.minutes)) ? Math.max(0, Number(item.estimatedMinutes ?? item.minutes)) : null
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  function lineageKey(lineage = {}) {
    return [
      clean(lineage.date),
      Number(lineage.operatingContractRevision || lineage.contractRevision || 0),
      clean(lineage.programId),
      clean(lineage.weekId),
      clean(lineage.todayId)
    ].join("|");
  }

  function buildReceipt(journey = {}, context = {}) {
    if (!journey?.certified) return null;
    const assignments = normalizeAssignments(context.assignments);
    const evidenceIds = unique(context.evidenceIds);
    const proof = {
      journeyFingerprint: clean(journey.fingerprint),
      lineageKey: lineageKey(journey.lineage),
      assignments,
      evidenceIds,
      closeout: {
        id: clean(context.closeout?.id),
        state: clean(context.closeout?.status || context.closeout?.state || (context.closeout?.closed ? "SEALED" : "OPEN")).toUpperCase()
      },
      biometricReview: context.biometricReview === true ? "PENDING" : "CLEAR"
    };
    const proofFingerprint = stableHash(proof);
    return Object.freeze({
      id: `journey-${clean(journey.lineage?.date) || "undated"}-${proofFingerprint}`,
      type: RECEIPT_TYPE,
      schemaVersion: VERSION,
      proofFingerprint,
      journeyFingerprint: proof.journeyFingerprint,
      lineage: Object.freeze({ ...(journey.lineage || {}) }),
      lineageKey: proof.lineageKey,
      assignments: Object.freeze(assignments),
      assignmentIds: Object.freeze(assignments.map((item) => item.id)),
      evidenceIds: Object.freeze(evidenceIds),
      closeout: Object.freeze(proof.closeout),
      biometricReview: proof.biometricReview,
      observedAt: clean(context.observedAt || new Date().toISOString())
    });
  }

  function receiptTime(receipt = {}) {
    const parsed = Date.parse(receipt.observedAt || receipt.updatedAt || receipt.createdAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function appendReceipt(receipts = [], receipt = null, limit = 120) {
    const merged = new Map();
    [...(Array.isArray(receipts) ? receipts : []), receipt].filter((item) => item?.id).forEach((item) => {
      const current = merged.get(item.id);
      if (!current || receiptTime(item) >= receiptTime(current)) merged.set(item.id, item);
    });
    return [...merged.values()]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || clean(left.id).localeCompare(clean(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  function preservesEvidence(candidate = null, prior = null) {
    if (!candidate || !prior) return true;
    const current = new Set(unique(candidate.evidenceIds));
    return unique(prior.evidenceIds).every((id) => current.has(id));
  }

  function latestSameLineage(receipts = [], candidate = null) {
    if (!candidate?.lineageKey) return null;
    return (Array.isArray(receipts) ? receipts : [])
      .filter((item) => item?.lineageKey === candidate.lineageKey)
      .sort((left, right) => receiptTime(right) - receiptTime(left))[0] || null;
  }

  function evaluate(input = {}) {
    const journey = input.journey || null;
    const candidate = input.candidate || null;
    const localReceipts = Array.isArray(input.localReceipts) ? input.localReceipts : [];
    const accountReceipts = Array.isArray(input.accountReceipts) ? input.accountReceipts : [];
    const syncState = clean(input.syncState || "synced").toLowerCase();
    const pendingWrites = Math.max(0, Number(input.pendingWrites || 0));
    const localExact = Boolean(candidate && localReceipts.some((item) => item?.id === candidate.id));
    const accountExact = Boolean(candidate && accountReceipts.some((item) => item?.id === candidate.id));
    const accountPrior = latestSameLineage(accountReceipts, candidate);
    const evidencePreserved = preservesEvidence(candidate, accountPrior);
    let state = "CHECKING";
    let tone = "neutral";
    let label = "CHECKING";
    let detail = "Checking this journey against the saved account.";
    let action = null;
    let shouldSave = false;

    if (!journey?.certified || !candidate) {
      state = "JOURNEY_INCOMPLETE";
      tone = journey?.firstProblem ? "red" : "neutral";
      label = journey?.firstProblem ? "ACTION NEEDED" : "NOT READY";
      detail = journey?.firstProblem?.detail || "Complete the current journey before cross-device verification.";
      action = journey?.primaryAction || null;
    } else if (!evidencePreserved) {
      state = "EVIDENCE_MISMATCH";
      tone = "red";
      label = "REVIEW NEEDED";
      detail = "This device is missing evidence already secured by the account.";
      action = { code: "OPEN_ACCOUNT_HEALTH", label: "Restore saved evidence", section: "more" };
    } else if (ACTION_SYNC_STATES.has(syncState)) {
      state = syncState === "conflict" ? "ACCOUNT_CONFLICT" : "ACCOUNT_ACTION_REQUIRED";
      tone = "red";
      label = syncState === "conflict" ? "CHOICE NEEDED" : "ACTION NEEDED";
      detail = syncState === "conflict" ? "Choose the canonical saved state before continuity can be verified." : "Account sync needs a deliberate repair before continuity can be verified.";
      action = { code: syncState === "conflict" ? "RESOLVE_CONTINUITY" : "OPEN_ACCOUNT_HEALTH", label: syncState === "conflict" ? "Compare saved states" : "Review Account Health", section: "more" };
    } else if (accountExact && input.serverConfirmed === true && pendingWrites === 0) {
      state = "VERIFIED";
      tone = "green";
      label = "ACCOUNT VERIFIED";
      detail = "This exact day is confirmed by the account and will restore on another device.";
    } else if (localExact || pendingWrites || input.online === false) {
      state = "PROTECTED";
      tone = "yellow";
      label = input.online === false ? "SAVED HERE" : "SYNCING";
      detail = input.online === false ? "This journey is protected on this device until sync resumes." : "This journey is protected while the account confirms it.";
    } else {
      state = "READY_TO_SAVE";
      tone = "yellow";
      label = "VERIFYING";
      detail = "The journey is complete; its continuity receipt is ready to save.";
      shouldSave = true;
    }

    return Object.freeze({
      version: VERSION,
      state,
      tone,
      label,
      detail,
      verified: state === "VERIFIED",
      protected: state === "PROTECTED",
      shouldSave,
      action,
      candidate,
      localExact,
      accountExact,
      evidencePreserved,
      syncState,
      pendingWrites
    });
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    stableSerialize,
    stableHash,
    unique,
    normalizeAssignments,
    lineageKey,
    buildReceipt,
    appendReceipt,
    preservesEvidence,
    latestSameLineage,
    evaluate
  });
});
