(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitLoopCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030W.1";
  const RECEIPT_TYPE = "RECRUIT_LOOP_CERTIFICATION";
  const STATES = Object.freeze({ WAITING: "WAITING", PROTECTED: "PROTECTED", CERTIFIED: "CERTIFIED", ACTION_REQUIRED: "ACTION_REQUIRED" });
  const STAGE_STATUS = Object.freeze({ VERIFIED: "VERIFIED", WAITING: "WAITING", PROTECTED: "PROTECTED", BROKEN: "BROKEN", SLOW: "SLOW", ATTENTION: "ATTENTION" });
  const REQUIRED_STAGES = Object.freeze(["account", "authority", "priorDay", "handoff", "morning", "execution"]);

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
    let hash = 2166136261;
    for (const character of stableJson(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function receiptTime(value = {}) {
    return Date.parse(value.accountConfirmedAt || value.completedAt || value.activatedAt || value.createdAt || "") || 0;
  }
  function latest(values = [], predicate = () => true) {
    return (Array.isArray(values) ? values : []).filter(predicate)
      .sort((left, right) => receiptTime(right) - receiptTime(left) || text(left.id).localeCompare(text(right.id)))[0] || null;
  }
  function authorityFrom(value = {}) {
    const source = value.authority || value.lineage || value;
    return {
      contractRevision: Number(source.contractRevision || 0),
      weekId: text(source.weekId),
      weekRevision: Number(source.weekRevision || 0),
      calendarCommitId: text(source.calendarCommitId) || null
    };
  }
  function authorityMatches(expected = {}, actual = {}, requireCalendar = false) {
    return Number(expected.contractRevision || 0) === Number(actual.contractRevision || 0)
      && text(expected.weekId) === text(actual.weekId)
      && (!Number(expected.weekRevision || 0) || Number(expected.weekRevision || 0) === Number(actual.weekRevision || 0))
      && (!requireCalendar || !text(expected.calendarCommitId) || text(expected.calendarCommitId) === text(actual.calendarCommitId));
  }
  function assignmentId(value = {}) { return text(value.assignmentId || value.assignment_id || value.calendarAssignmentId || value.id); }
  function stage(key, label, status, detail) { return { key, label, status, detail }; }
  function stageIndex(stages = []) { return Object.fromEntries(stages.map((item) => [item.key, item])); }
  function accountMatch(candidate = null, values = []) {
    return Boolean(candidate?.id && (Array.isArray(values) ? values : []).some((item) => item?.id === candidate.id && item?.fingerprint === candidate.fingerprint));
  }
  function buildReceipt(input = {}, links = {}) {
    const targetDate = dateIso(input.targetDate || input.date);
    const authority = authorityFrom(input.authority);
    const basis = {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate,
      userId: text(input.userId) || null,
      authority,
      links: {
        dailyLoopId: links.dailyLoop?.id || null,
        handoffId: links.handoff?.id || null,
        morningActivationId: links.morning?.id || null,
        commandCompletionId: links.completion?.id || null,
        assignmentId: links.assignmentId || null
      }
    };
    const fingerprint = `recruit-loop-${stableHash(basis)}`;
    return {
      ...basis,
      id: `recruit-loop:${targetDate}:${fingerprint.slice(-8)}`,
      fingerprint,
      status: STATES.PROTECTED,
      verificationStatus: "PENDING_ACCOUNT_RECEIPT",
      createdAt: input.createdAt || links.completion?.completedAt || null,
      accountConfirmedAt: null
    };
  }
  function evaluate(input = {}) {
    const targetDate = dateIso(input.targetDate || input.date);
    const authority = authorityFrom(input.authority);
    const assignments = Array.isArray(input.assignments) ? input.assignments : [];
    const handoff = latest(input.nextDayHandoffs, (item) => item?.type === "NEXT_DAY_COMMAND_HANDOFF" && dateIso(item.targetDate) === targetDate);
    const dailyLoop = handoff ? latest(input.dailyLoopReceipts, (item) => item?.type === "DAILY_LOOP_CERTIFICATION" && item?.id === handoff.sourceReceiptId) : null;
    const morning = latest(input.morningActivations, (item) => item?.type === "MORNING_COMMAND_ACTIVATION" && dateIso(item.targetDate) === targetDate);
    const targetAssignmentId = text(morning?.target?.assignmentId);
    const completion = targetAssignmentId
      ? latest(input.commandCompletions, (item) => item?.type === "COMMAND_COMPLETION_CERTIFICATION"
        && dateIso(item.operationalDate || item.date) === targetDate
        && text(item.completion?.assignmentId || item.assignmentId) === targetAssignmentId)
      : null;
    const stages = [];

    if (!text(input.userId)) stages.push(stage("account", "Account", STAGE_STATUS.BROKEN, "A signed-in account is required."));
    else if (input.serverConfirmed !== true || Number(input.pendingWrites || 0) > 0) stages.push(stage("account", "Account", STAGE_STATUS.PROTECTED, "Saved locally; account confirmation is still settling."));
    else stages.push(stage("account", "Account", STAGE_STATUS.VERIFIED, "Account identity and persistence are confirmed."));

    if (!authority.contractRevision || !authority.weekId || !authority.weekRevision || !authority.calendarCommitId) stages.push(stage("authority", "Signed program", STAGE_STATUS.BROKEN, "Contract, committed week, and Calendar authority must all be present."));
    else stages.push(stage("authority", "Signed program", STAGE_STATUS.VERIFIED, "Contract and committed Calendar share one authority line."));

    if (!handoff) stages.push(stage("priorDay", "Prior day", STAGE_STATUS.WAITING, "Yesterday has not produced a next-day handoff yet."));
    else if (!dailyLoop) stages.push(stage("priorDay", "Prior day", STAGE_STATUS.BROKEN, "The handoff cannot be traced to its exact sealed-day receipt."));
    else if (dailyLoop.status !== "CERTIFIED" || !dailyLoop.accountConfirmedAt) stages.push(stage("priorDay", "Prior day", STAGE_STATUS.PROTECTED, "Yesterday is sealed on this device; account proof is pending."));
    else stages.push(stage("priorDay", "Prior day", STAGE_STATUS.VERIFIED, "Yesterday's exact sealed-day receipt is account-confirmed."));

    if (!handoff) stages.push(stage("handoff", "Overnight handoff", STAGE_STATUS.WAITING, "No handoff exists for this morning."));
    else if (handoff.sourceReceiptId !== dailyLoop?.id || !authorityMatches(authority, authorityFrom(handoff))) stages.push(stage("handoff", "Overnight handoff", STAGE_STATUS.BROKEN, "The handoff does not match yesterday or the signed week."));
    else if (handoff.status !== "CERTIFIED" || !handoff.accountConfirmedAt) stages.push(stage("handoff", "Overnight handoff", STAGE_STATUS.PROTECTED, "The handoff is protected while account confirmation completes."));
    else stages.push(stage("handoff", "Overnight handoff", STAGE_STATUS.VERIFIED, "Yesterday's evidence produced one certified command handoff."));

    if (!morning) stages.push(stage("morning", "Morning command", STAGE_STATUS.WAITING, "Today's executable command has not activated yet."));
    else if (morning.sourceHandoffId !== handoff?.id || !authorityMatches(authority, authorityFrom(morning)) || !targetAssignmentId || !assignments.some((item) => assignmentId(item) === targetAssignmentId)) stages.push(stage("morning", "Morning command", STAGE_STATUS.BROKEN, "The morning command no longer matches the handoff or current Calendar assignment."));
    else if (morning.status !== "CERTIFIED" || !morning.accountConfirmedAt) stages.push(stage("morning", "Morning command", STAGE_STATUS.PROTECTED, "Today's command is usable; its account receipt is still settling."));
    else stages.push(stage("morning", "Morning command", STAGE_STATUS.VERIFIED, "One exact Calendar assignment governs today's command."));

    if (!completion) stages.push(stage("execution", "Executed command", STAGE_STATUS.WAITING, "The active command is still in progress."));
    else if (!authorityMatches(authority, authorityFrom(completion), true) || text(completion.completion?.assignmentId || completion.assignmentId) !== targetAssignmentId) stages.push(stage("execution", "Executed command", STAGE_STATUS.BROKEN, "Completion proof belongs to a different assignment or authority line."));
    else if (completion.status !== "CERTIFIED" || !completion.accountConfirmedAt) stages.push(stage("execution", "Executed command", STAGE_STATUS.PROTECTED, "Completion is saved; its exact account receipt is still settling."));
    else stages.push(stage("execution", "Executed command", STAGE_STATUS.VERIFIED, "The activated assignment has an exact account-confirmed completion receipt."));

    const restoreDurationMs = Math.max(0, Number(input.restoreDurationMs || 0));
    const startupIssues = Array.isArray(input.startupIssues) ? input.startupIssues : [];
    stages.push(stage("restore", "Startup restore", startupIssues.length ? STAGE_STATUS.ATTENTION : restoreDurationMs > 4000 ? STAGE_STATUS.SLOW : STAGE_STATUS.VERIFIED,
      startupIssues.length ? `${startupIssues.length} optional surface${startupIssues.length === 1 ? "" : "s"} recovered during startup.` : restoreDurationMs > 4000 ? `Restore completed in ${(restoreDurationMs / 1000).toFixed(1)} seconds.` : "Protected account truth restored within the target window."));

    const required = stageIndex(stages);
    let state = REQUIRED_STAGES.some((key) => required[key]?.status === STAGE_STATUS.BROKEN) ? STATES.ACTION_REQUIRED
      : REQUIRED_STAGES.some((key) => required[key]?.status === STAGE_STATUS.PROTECTED) ? STATES.PROTECTED
        : REQUIRED_STAGES.some((key) => required[key]?.status === STAGE_STATUS.WAITING) ? STATES.WAITING
          : STATES.PROTECTED;
    let receipt = null;
    if (REQUIRED_STAGES.every((key) => required[key]?.status === STAGE_STATUS.VERIFIED)) {
      const candidate = buildReceipt(input, { dailyLoop, handoff, morning, completion, assignmentId: targetAssignmentId });
      const confirmed = input.serverConfirmed === true && Number(input.pendingWrites || 0) === 0 && accountMatch(candidate, input.accountReceipts);
      state = confirmed ? STATES.CERTIFIED : STATES.PROTECTED;
      receipt = { ...candidate, status: state, verificationStatus: confirmed ? "ACCOUNT_CONFIRMED" : "PENDING_ACCOUNT_RECEIPT", accountConfirmedAt: confirmed ? input.accountConfirmedAt || candidate.accountConfirmedAt : null };
    }
    return {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate,
      state,
      certified: state === STATES.CERTIFIED,
      receipt,
      candidateReceiptId: receipt?.id || null,
      stages,
      links: { dailyLoop, handoff, morning, completion, assignmentId: targetAssignmentId },
      issues: stages.filter((item) => [STAGE_STATUS.BROKEN, STAGE_STATUS.ATTENTION].includes(item.status))
    };
  }
  function upsertHistory(history = [], receipt = null, limit = 120) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || text(left.id).localeCompare(text(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }
  function latestForDate(history = [], value = "") {
    const targetDate = dateIso(value);
    return latest(history, (item) => item?.type === RECEIPT_TYPE && dateIso(item.targetDate) === targetDate);
  }

  return Object.freeze({ VERSION, RECEIPT_TYPE, STATES: { ...STATES }, STAGE_STATUS: { ...STAGE_STATUS }, REQUIRED_STAGES: [...REQUIRED_STAGES], stableHash, buildReceipt, evaluate, upsertHistory, latestForDate });
});
