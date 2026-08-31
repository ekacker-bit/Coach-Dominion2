(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRealAccountJourney = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031B.1";
  const RECEIPT_TYPE = "REAL_ACCOUNT_JOURNEY";
  const TERMINAL_STATES = new Set([
    "COMPLETE", "COMPLETED", "SECURED", "CLOSED", "SEALED", "LOGGED",
    "RECOVERED", "VERIFIED", "ADAPTED_NOT_REQUIRED", "NOT_REQUIRED"
  ]);
  const CONFIRMED_STATES = new Set(["VERIFIED", "CONFIRMED", "ACCOUNT_CONFIRMED"]);

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function upper(value = "") {
    return clean(value).toUpperCase().replaceAll(" ", "_");
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

  function values(value) {
    return Array.isArray(value) ? value : value == null ? [] : [value];
  }

  function unique(values = []) {
    return [...new Set(values.map(clean).filter(Boolean))].sort();
  }

  function assignmentId(value = {}, index = 0) {
    return clean(value.assignmentId || value.id || value.activityId || value.sourceAssignmentId || `assignment-${index + 1}`);
  }

  function assignmentModule(value = {}) {
    const module = upper(value.module || value.type || value.domain);
    if (module === "FUEL") return "NUTRITION";
    if (module === "ABS") return "CORE";
    return module;
  }

  function terminal(value = {}) {
    return value.terminal === true
      || value.complete === true
      || TERMINAL_STATES.has(upper(value.state || value.status || value.lifecycle));
  }

  function normalizeAssignments(assignments = []) {
    return values(assignments)
      .filter(Boolean)
      .map((item, index) => Object.freeze({
        id: assignmentId(item, index),
        module: assignmentModule(item),
        required: item.required !== false && item.optional !== true,
        terminal: terminal(item),
        title: clean(item.title || item.name)
      }))
      .filter((item) => item.id)
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  function normalizeEvidence(evidence = []) {
    return values(evidence)
      .filter(Boolean)
      .map((item, index) => Object.freeze({
        id: clean(item.id || item.receiptId || item.sourceRecordId || `evidence-${index + 1}`),
        assignmentId: assignmentId(item, index),
        module: assignmentModule(item),
        confirmed: item.accountConfirmed === true
          || item.sourceAccountConfirmed === true
          || Boolean(item.accountConfirmedAt)
          || CONFIRMED_STATES.has(upper(item.verificationStatus || item.receiptStatus)),
        state: upper(item.state || item.status)
      }))
      .filter((item) => item.id)
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  function exactSet(left = [], right = []) {
    const a = unique(left);
    const b = unique(right);
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  function stage(id, state, detail, action = null, meta = {}) {
    return Object.freeze({ id, state, detail, action, ...meta });
  }

  function action(code, label, section) {
    return Object.freeze({ code, label, section });
  }

  function receiptTime(receipt = {}) {
    const parsed = Date.parse(receipt.accountConfirmedAt || receipt.observedAt || receipt.updatedAt || receipt.createdAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function appendReceipt(receipts = [], receipt = null, limit = 120) {
    const merged = new Map();
    [...values(receipts), receipt].filter((item) => item?.id).forEach((item) => {
      const current = merged.get(item.id);
      if (!current || receiptTime(item) <= receiptTime(current)) merged.set(item.id, current || item);
      else merged.set(item.id, item);
    });
    return [...merged.values()]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || clean(left.id).localeCompare(clean(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  function buildReceipt(input = {}) {
    const assignments = normalizeAssignments(input.assignments).filter((item) => item.required);
    const evidence = normalizeEvidence(input.evidence).filter((item) => item.confirmed);
    const authority = Object.freeze({
      date: clean(input.date).slice(0, 10),
      contractRevision: Number(input.authority?.contractRevision || 0),
      programId: clean(input.authority?.programId),
      weekId: clean(input.authority?.weekId),
      todayId: clean(input.authority?.todayId)
    });
    const proof = {
      authority,
      assignments: assignments.map((item) => [item.id, item.module]),
      evidenceIds: evidence.map((item) => item.id),
      fuelReceiptId: clean(input.fuel?.receiptId || input.fuel?.recordId),
      closeoutId: clean(input.closeout?.id),
      reviewDate: clean(input.review?.operatingDate).slice(0, 10)
    };
    const fingerprint = stableHash(proof);
    return Object.freeze({
      id: `real-account-journey:${authority.date || "undated"}:${fingerprint}`,
      type: RECEIPT_TYPE,
      schemaVersion: VERSION,
      fingerprint,
      authority,
      assignmentIds: Object.freeze(assignments.map((item) => item.id)),
      evidenceIds: Object.freeze(evidence.map((item) => item.id)),
      fuelReceiptId: proof.fuelReceiptId || null,
      closeoutId: proof.closeoutId || null,
      reviewDate: proof.reviewDate || null,
      observedAt: clean(input.observedAt || new Date().toISOString())
    });
  }

  function evaluate(input = {}) {
    const date = clean(input.date || input.authority?.date).slice(0, 10);
    const authority = input.authority || {};
    const assignments = normalizeAssignments(input.assignments);
    const required = assignments.filter((item) => item.required);
    const evidence = normalizeEvidence(input.evidence);
    const account = input.account || {};
    const pendingWrites = Math.max(0, Number(account.pendingWrites || input.pendingWrites || 0));
    const localReceipts = values(input.localReceipts).filter((item) => item?.type === RECEIPT_TYPE);
    const accountReceipts = values(input.accountReceipts).filter((item) => item?.type === RECEIPT_TYPE);
    const stages = [];
    const contractRevision = Number(authority.contractRevision || 0);
    const authorityReady = Boolean(
      date
      && authority.contractSigned === true
      && contractRevision > 0
      && clean(authority.programId)
      && clean(authority.weekId)
      && clean(authority.todayId)
      && Number(authority.programContractRevision || contractRevision) === contractRevision
      && Number(authority.weekContractRevision || contractRevision) === contractRevision
    );
    stages.push(authorityReady
      ? stage("authority", "CURRENT", "Signed Contract and committed week agree.")
      : stage("authority", "ACTION_REQUIRED", "The signed Contract, program, and committed week do not share one identity.", action("OPEN_CONTRACT", "Review Contract", "contract"), { code: "AUTHORITY_MISMATCH" }));

    const assignmentIds = required.map((item) => item.id);
    const calendarIds = values(input.surfaces?.calendar).map((item, index) => assignmentId(item, index));
    const todayIds = values(input.surfaces?.today).map((item, index) => assignmentId(item, index));
    const activeExecutionId = clean(input.surfaces?.activeExecutionId);
    const surfacesAgree = exactSet(assignmentIds, calendarIds)
      && exactSet(assignmentIds, todayIds)
      && (!activeExecutionId || assignmentIds.includes(activeExecutionId));
    stages.push(surfacesAgree
      ? stage("assignments", "CURRENT", "Calendar, Today, and active execution agree.")
      : stage("assignments", "ACTION_REQUIRED", "Calendar, Today, and the active session disagree.", action("OPEN_CALENDAR", "Review Calendar", "calendar"), { code: "ASSIGNMENT_SURFACE_MISMATCH" }));

    const terminalAssignments = required.filter((item) => item.terminal);
    const missingEvidence = terminalAssignments.filter((assignment) => !evidence.some((item) => item.assignmentId === assignment.id));
    const pendingEvidence = terminalAssignments.filter((assignment) => evidence.some((item) => item.assignmentId === assignment.id) && !evidence.some((item) => item.assignmentId === assignment.id && item.confirmed));
    const allTerminal = required.length > 0 && terminalAssignments.length === required.length;
    if (missingEvidence.length) {
      stages.push(stage("execution", "ACTION_REQUIRED", "Completed work is missing its exact account receipt.", action("OPEN_TRAIN", "Restore completed work", "performance"), { code: "EXECUTION_RECEIPT_MISSING", assignmentIds: missingEvidence.map((item) => item.id) }));
    } else if (pendingEvidence.length) {
      stages.push(stage("execution", "PROTECTED", "Completed work is protected while the account confirms it.", null, { code: "EXECUTION_RECEIPT_PENDING", assignmentIds: pendingEvidence.map((item) => item.id) }));
    } else if (!allTerminal) {
      stages.push(stage("execution", "OPEN", "Today still has assigned work to complete.", null, { remaining: required.length - terminalAssignments.length }));
    } else {
      stages.push(stage("execution", "CURRENT", "Every required assignment has account-confirmed evidence."));
    }

    const fuelAssignment = required.find((item) => item.module === "NUTRITION") || null;
    const fuel = input.fuel || {};
    const fuelConfirmed = fuel.confirmed === true || Boolean(fuel.accountConfirmedAt) || CONFIRMED_STATES.has(upper(fuel.verificationStatus));
    if (!fuelAssignment) {
      stages.push(stage("fuel", "NOT_REQUIRED", "Fuel is not assigned for this operating day."));
    } else if (!fuelAssignment.terminal) {
      stages.push(stage("fuel", fuel.pending === true ? "PROTECTED" : "OPEN", fuel.pending === true ? "Fuel totals are protected while the account confirms them." : "Fuel totals remain open."));
    } else if (!clean(fuel.recordId || fuel.receiptId) || !fuelConfirmed) {
      stages.push(stage("fuel", fuel.pending === true ? "PROTECTED" : "ACTION_REQUIRED", fuel.pending === true ? "Fuel totals are protected while the account confirms them." : "The completed Fuel assignment is missing its exact account receipt.", fuel.pending === true ? null : action("OPEN_FUEL", "Review Fuel", "nutrition"), { code: fuel.pending === true ? "FUEL_RECEIPT_PENDING" : "FUEL_RECEIPT_MISSING" }));
    } else {
      stages.push(stage("fuel", "CURRENT", "Fuel totals are confirmed by the account."));
    }

    const closeout = input.closeout || null;
    const closeoutDate = clean(closeout?.date || closeout?.operatingDate).slice(0, 10);
    const closeoutSealed = upper(closeout?.status || closeout?.state) === "SEALED" || closeout?.closed === true;
    const closeoutConfirmed = Boolean(closeout?.accountConfirmedAt) || closeout?.accountConfirmed === true || CONFIRMED_STATES.has(upper(closeout?.verificationStatus));
    if (!allTerminal) {
      stages.push(stage("closeout", "OPEN", "Closeout unlocks after required work is complete."));
    } else if (!closeoutSealed) {
      stages.push(stage("closeout", "OPEN", "Daily Closeout is the final action.", action("OPEN_CLOSEOUT", "Close the day", "today")));
    } else if (closeoutDate && closeoutDate !== date) {
      stages.push(stage("closeout", "ACTION_REQUIRED", "Closeout is attached to the wrong operating date.", action("OPEN_CLOSEOUT", "Review Closeout", "today"), { code: "CLOSEOUT_DATE_MISMATCH" }));
    } else if (!closeoutConfirmed) {
      stages.push(stage("closeout", "PROTECTED", "Closeout is protected while the account confirms it.", null, { code: "CLOSEOUT_RECEIPT_PENDING" }));
    } else {
      stages.push(stage("closeout", "CURRENT", "Daily Closeout is confirmed by the account."));
    }

    const review = input.review || {};
    const reviewDate = clean(review.operatingDate).slice(0, 10);
    if (!closeoutSealed || !closeoutConfirmed) {
      stages.push(stage("review", "OPEN", "Review updates after the day is secured."));
    } else if (reviewDate !== date) {
      stages.push(stage("review", "ACTION_REQUIRED", "Review is not reading the secured operating date.", action("OPEN_REVIEW", "Review the day", "inspection"), { code: "REVIEW_DATE_MISMATCH" }));
    } else {
      stages.push(stage("review", "CURRENT", "Review reflects the secured operating date."));
    }

    const problem = stages.find((item) => item.state === "ACTION_REQUIRED") || null;
    const protectedStage = stages.find((item) => item.state === "PROTECTED") || null;
    const ready = !problem
      && !protectedStage
      && stages.every((item) => ["CURRENT", "NOT_REQUIRED"].includes(item.state));
    const candidate = ready ? buildReceipt({ ...input, date, assignments, evidence }) : null;
    const localExact = Boolean(candidate && localReceipts.some((item) => item.id === candidate.id));
    const accountExact = Boolean(candidate && accountReceipts.some((item) => item.id === candidate.id));
    const serverConfirmed = account.serverConfirmed === true && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    let state = "IN_PROGRESS";
    let tone = "neutral";
    let label = "IN PROGRESS";
    let detail = "Complete today's assigned work, Fuel, and Closeout.";
    let primaryAction = problem?.action || null;
    let shouldSave = false;

    if (problem) {
      state = "ACTION_REQUIRED";
      tone = "red";
      label = "REVIEW NEEDED";
      detail = problem.detail;
    } else if (protectedStage || pendingWrites || account.online === false) {
      state = "PROTECTED";
      tone = "yellow";
      label = account.online === false ? "SAVED HERE" : "SECURING";
      detail = protectedStage?.detail || "Your work is protected while the account confirms it.";
    } else if (candidate && accountExact && serverConfirmed) {
      state = "VERIFIED";
      tone = "green";
      label = "DAY SECURE";
      detail = "The same completed day is confirmed by this account and will restore in another session.";
    } else if (candidate && localExact) {
      state = "PROTECTED";
      tone = "yellow";
      label = "SECURING";
      detail = "The completed day is protected while its account receipt is confirmed.";
    } else if (candidate) {
      state = "READY_TO_SAVE";
      tone = "yellow";
      label = "SECURING";
      detail = "The completed day is ready for its final account receipt.";
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
      primaryAction,
      firstProblem: problem,
      stages: Object.freeze(stages),
      assignmentIds: Object.freeze(assignmentIds),
      candidate,
      localExact,
      accountExact,
      pendingWrites
    });
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    stableSerialize,
    stableHash,
    assignmentId,
    assignmentModule,
    terminal,
    normalizeAssignments,
    normalizeEvidence,
    exactSet,
    buildReceipt,
    appendReceipt,
    evaluate
  });
});
