(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionWeeklyVerdictLaunch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031E.1";
  const RECEIPT_TYPE = "WEEKLY_VERDICT_LAUNCH";
  const DAY_MS = 86400000;

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function upper(value = "") {
    return clean(value).toUpperCase();
  }

  function isoDate(value = "") {
    const candidate = clean(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }

  function ordinal(value = "") {
    const date = isoDate(value);
    if (!date) return null;
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / DAY_MS;
  }

  function addDays(value, amount = 0) {
    const day = ordinal(value);
    if (day === null) return null;
    return new Date((day + Number(amount || 0)) * DAY_MS).toISOString().slice(0, 10);
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

  function decisionCode(input = {}) {
    const command = upper(input.command?.code || input.reconciliation?.verdict?.commandCode);
    const position = upper(input.reconciliation?.verdict?.position);
    if (["PROTECT", "RECOVER", "RECOVERY"].some((value) => command.includes(value))) return "RECOVER";
    if (["DELOAD", "REBALANCE", "REDUCE"].some((value) => command.includes(value)) || position === "SLIPPING") return "REDUCE";
    if (["PROGRESS", "ADVANCE"].some((value) => command.includes(value)) || position === "AHEAD") return "ADVANCE";
    return "MAINTAIN";
  }

  function concise(value, fallback) {
    const text = clean(value || fallback).replace(/\s+/g, " ");
    return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
  }

  function receiptFor(receipts = [], id = "") {
    return values(receipts).find((item) => item?.type === RECEIPT_TYPE && item.id === id) || null;
  }

  function firstMission(targetWeek = null) {
    const day = values(targetWeek?.days).find((item) => values(item?.activities).length);
    const activity = values(day?.activities)[0] || null;
    if (!day || !activity) return null;
    return Object.freeze({
      date: isoDate(day.date),
      assignmentId: clean(activity.assignmentId || activity.id),
      module: upper(activity.module || activity.type || "TRAINING"),
      label: concise(activity.title || activity.sessionName || activity.label, "First scheduled mission"),
      activityCount: values(day.activities).length
    });
  }

  function buildReceipt(input = {}) {
    const proofWeek = input.proofWeek || null;
    const inspection = input.inspection || null;
    const reconciliation = input.reconciliation || null;
    const sourceWeek = input.sourceWeek || null;
    const targetWeek = input.targetWeek || null;
    const rollover = input.rollover || null;
    const calendar = input.calendarReceipt || rollover?.receipt || null;
    if (proofWeek?.state !== "VERIFIED" || !proofWeek?.candidate?.id) return null;
    if (!inspection?.finalizedAt || !reconciliation?.id || reconciliation.status !== "COMMITTED" || !reconciliation.commitReceipt?.id) return null;
    if (targetWeek?.status !== "COMMITTED" || !rollover?.valid || !rollover?.receipt?.id) return null;
    const sourceStart = isoDate(sourceWeek?.weekStart || inspection.weekStartDate);
    const sourceEnd = isoDate(sourceWeek?.weekEnd || inspection.weekEndDate);
    const targetStart = isoDate(targetWeek.weekStart);
    if (!sourceStart || !sourceEnd || !targetStart || addDays(sourceEnd, 1) !== targetStart) return null;
    const basis = {
      proofWeekReceiptId: proofWeek.candidate.id,
      inspectionId: clean(inspection.id || inspection.inspectionId || `weekly-inspection:${sourceStart}`),
      inspectionFinalizedAt: clean(inspection.finalizedAt),
      reconciliationId: reconciliation.id,
      reconciliationFingerprint: reconciliation.fingerprint || null,
      reconciliationCommitReceiptId: reconciliation.commitReceipt.id,
      sourceWeekId: clean(sourceWeek?.id),
      sourceWeekRevision: Number(sourceWeek?.revision || 0),
      sourceWeekStart: sourceStart,
      sourceWeekEnd: sourceEnd,
      targetWeekId: clean(targetWeek.id),
      targetWeekRevision: Number(targetWeek.revision || 0),
      targetWeekStart: targetStart,
      targetWeekEnd: isoDate(targetWeek.weekEnd || addDays(targetStart, 6)),
      contractRevision: Number(targetWeek.contractRevision || reconciliation.packet?.contractRevision || 0),
      programId: clean(targetWeek.programId || reconciliation.packet?.programId),
      programRevision: Number(targetWeek.programRevision || reconciliation.packet?.programRevision || 0),
      calendarReceiptId: clean(calendar?.calendarReceiptId || calendar?.id),
      calendarContentHash: clean(calendar?.calendarContentHash || calendar?.contentHash),
      rolloverReceiptId: rollover.receipt.id,
      rolloverFingerprint: rollover.receipt.fingerprint || null,
      decision: decisionCode(input)
    };
    const fingerprint = stableHash(basis);
    return Object.freeze({
      ...basis,
      id: `weekly-verdict-launch:${sourceStart}:${targetStart}:${fingerprint}`,
      type: RECEIPT_TYPE,
      schemaVersion: VERSION,
      fingerprint,
      observedAt: clean(input.observedAt || new Date().toISOString())
    });
  }

  function action(code, label, section = "inspection", detail = "", operatingDate = null) {
    return Object.freeze({ code, label, section, detail, operatingDate: isoDate(operatingDate) });
  }

  function evaluate(input = {}) {
    const proofWeek = input.proofWeek || null;
    const inspection = input.inspection || null;
    const reconciliation = input.reconciliation || null;
    const targetWeek = input.targetWeek || null;
    const rollover = input.rollover || null;
    const decision = decisionCode(input);
    const verdict = reconciliation?.verdict || {};
    const localReceipts = values(input.localReceipts);
    const accountReceipts = values(input.accountReceipts);
    const account = input.account || {};
    const pendingWrites = Math.max(0, Number(account.pendingWrites || input.pendingWrites || 0));
    const operatingDate = isoDate(input.asOfDate || new Date().toISOString());
    const mission = firstMission(targetWeek);
    const candidate = buildReceipt(input);
    const localExact = Boolean(candidate && receiptFor(localReceipts, candidate.id));
    const accountExact = Boolean(candidate && receiptFor(accountReceipts, candidate.id));
    const serverConfirmed = account.serverConfirmed === true && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    const lines = Object.freeze({
      win: concise(verdict.worked, "The week is still collecting evidence."),
      constraint: concise(verdict.broke, "No verified constraint has been recorded."),
      next: concise(verdict.next, "Hold the signed standard until the next week is committed.")
    });

    let state = "EARNING";
    let tone = "neutral";
    let label = "WEEK IN PROGRESS";
    let detail = proofWeek?.detail || "Finish the seven-day proof before judgment.";
    let primaryAction = action("OPEN_TODAY", "Continue the week", "today");
    let shouldSave = false;

    if (proofWeek?.repair) {
      state = "ACTION_REQUIRED";
      tone = "red";
      label = "PROOF NEEDS REVIEW";
      detail = proofWeek.repair.detail || proofWeek.detail;
      primaryAction = action(proofWeek.repair.code, proofWeek.repair.label || "Review proof", proofWeek.repair.section || "today", detail, proofWeek.repair.operatingDate);
    } else if (proofWeek?.state !== "VERIFIED") {
      state = proofWeek?.state === "PROTECTED" || pendingWrites ? "PROTECTED" : "EARNING";
      tone = state === "PROTECTED" ? "yellow" : "neutral";
      label = state === "PROTECTED" ? "PROOF SECURING" : "WEEK IN PROGRESS";
      detail = proofWeek?.detail || "All seven days must be confirmed before judgment.";
      primaryAction = action("OPEN_TODAY", state === "PROTECTED" ? "Proof is securing" : "Continue the week", "today", detail);
    } else if (!inspection?.finalizedAt) {
      if (input.finalization?.allowed === false) {
        state = "BLOCKED";
        tone = "red";
        label = "WEEK NEEDS REVIEW";
        detail = input.finalization.detail || "One weekly result still needs an honest resolution.";
        primaryAction = action(input.finalization.code || "RESOLVE_WEEK", input.finalization.label || "Resolve week", input.finalization.section || "inspection", detail, input.finalization.operatingDate);
      } else {
        state = "READY_TO_FINALIZE";
        tone = "yellow";
        label = "WEEK READY";
        detail = "Seven days are secure. Lock the result before Atlas changes next week.";
        primaryAction = action("FINALIZE_WEEK", "Finalize week", "inspection", detail);
      }
    } else if (!reconciliation?.id || ["BLOCKED", "UNSCORED"].includes(upper(verdict.position))) {
      state = "BLOCKED";
      tone = "red";
      label = "DECISION BLOCKED";
      detail = verdict.broke || "The finalized week has no safe next-week decision.";
      primaryAction = action("RESOLVE_BLOCKER", verdict.action?.label || "Resolve blocker", verdict.position === "BLOCKED" ? "inspection" : "calendar", detail);
    } else if (targetWeek?.status !== "COMMITTED" || reconciliation.status !== "COMMITTED") {
      state = "VERDICT_READY";
      tone = verdict.tone || "yellow";
      label = `${decision} NEXT WEEK`;
      detail = "The verdict is final. Approve its coordinated next-week calendar.";
      primaryAction = action("APPROVE_NEXT_WEEK", "Approve next week", "inspection", detail);
    } else if (!rollover?.valid) {
      state = "BLOCKED";
      tone = "red";
      label = "HANDOFF BLOCKED";
      detail = rollover?.detail || "The committed week does not match the finalized verdict.";
      primaryAction = action(rollover?.repair?.code || "OPEN_CALENDAR", rollover?.repair?.action?.label || "Repair Calendar", rollover?.repair?.action?.section || "calendar", detail);
    } else if (candidate && accountExact && serverConfirmed) {
      state = "VERIFIED";
      tone = "green";
      label = `${decision} CONFIRMED`;
      detail = `Next week is saved to this account and begins ${candidate.targetWeekStart}${mission ? `. First order: ${mission.label}.` : "."}`;
      primaryAction = action("OPEN_NEXT_WEEK", "Open next week", "calendar", detail);
    } else if (candidate && (localExact || pendingWrites || account.online === false)) {
      state = "PROTECTED";
      tone = "yellow";
      label = "LAUNCH SECURING";
      detail = "The approved week is protected while the account confirms it.";
      primaryAction = action("WAIT_FOR_ACCOUNT", account.online === false ? "Saved on this device" : "Securing account", "inspection", detail);
    } else if (candidate) {
      state = "READY_TO_SAVE";
      tone = "yellow";
      label = "SECURING LAUNCH";
      detail = "The exact verdict and Calendar revision are ready for account confirmation.";
      primaryAction = action("SAVE_LAUNCH", "Securing launch", "inspection", detail);
      shouldSave = true;
    }

    const draftOpen = input.draftOpen === true;
    const canReopen = state === "VERIFIED" && Boolean(operatingDate && targetWeek?.weekStart && operatingDate < targetWeek.weekStart);
    return Object.freeze({
      version: VERSION,
      state,
      tone,
      label,
      detail,
      decision,
      lines,
      targetWeekStart: isoDate(targetWeek?.weekStart || verdict.targetWeekStart),
      targetWeekEnd: isoDate(targetWeek?.weekEnd || verdict.targetWeekEnd),
      candidate,
      shouldSave,
      localExact,
      accountExact,
      pendingWrites,
      primaryAction,
      secondaryAction: canReopen
        ? action(draftOpen ? "OPEN_NEXT_WEEK_DRAFT" : "REOPEN_NEXT_WEEK", draftOpen ? "Continue editing" : "Reopen before it starts", "calendar")
        : null,
      firstMission: mission,
      canReopen,
      draftOpen,
      verified: state === "VERIFIED"
    });
  }

  function presentation(report = null, options = {}) {
    if (options.loading) return Object.freeze({
      state: "CHECKING",
      status: "CHECKING",
      tone: "neutral",
      message: options.message || "Checking the saved week…",
      finalizeVisible: false,
      finalizeEnabled: false,
      retryVisible: false
    });
    if (options.saving) return Object.freeze({
      state: "SAVING",
      status: "SAVING",
      tone: "yellow",
      message: options.message || "Securing the weekly decision on your account…",
      finalizeVisible: false,
      finalizeEnabled: false,
      retryVisible: false
    });
    if (options.error || !report) return Object.freeze({
      state: "ACTION_REQUIRED",
      status: "ACTION REQUIRED",
      tone: "red",
      message: concise(options.error?.message || options.error || "Weekly Review could not be restored.", "Weekly Review could not be restored."),
      finalizeVisible: false,
      finalizeEnabled: false,
      retryVisible: true
    });
    const status = ({
      EARNING: "EARNING",
      ACTION_REQUIRED: "ACTION REQUIRED",
      READY_TO_FINALIZE: "READY",
      VERDICT_READY: "READY",
      BLOCKED: "ACTION REQUIRED",
      READY_TO_SAVE: "SAVING",
      PROTECTED: "SAVING",
      VERIFIED: "LAUNCHED"
    })[report.state] || "CHECKING";
    return Object.freeze({
      state: report.state,
      status,
      tone: report.tone || "neutral",
      message: options.message || "",
      finalizeVisible: report.state === "READY_TO_FINALIZE" && report.primaryAction?.code === "FINALIZE_WEEK",
      finalizeEnabled: report.state === "READY_TO_FINALIZE" && report.primaryAction?.code === "FINALIZE_WEEK",
      retryVisible: false
    });
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    isoDate,
    addDays,
    stableSerialize,
    stableHash,
    decisionCode,
    firstMission,
    receiptFor,
    buildReceipt,
    evaluate,
    presentation
  });
});
