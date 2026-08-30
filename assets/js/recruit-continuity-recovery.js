(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitContinuityRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030X.1";
  const RECEIPT_TYPE = "RECRUIT_CONTINUITY_RECOVERY";
  const STATES = Object.freeze({
    CLEAR: "CLEAR",
    PROTECTED: "PROTECTED",
    AUTO_REPAIR: "AUTO_REPAIR",
    ACTION_REQUIRED: "ACTION_REQUIRED",
    DECISION_REQUIRED: "DECISION_REQUIRED"
  });
  const MODES = Object.freeze({ AUTO: "AUTO", RECRUIT: "RECRUIT" });

  function text(value = "") { return String(value ?? "").trim(); }
  function dateIso(value = "") {
    const candidate = text(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }
  function addDays(value = "", days = 0) {
    const date = dateIso(value);
    if (!date) return null;
    const parsed = new Date(`${date}T12:00:00Z`);
    parsed.setUTCDate(parsed.getUTCDate() + Number(days || 0));
    return parsed.toISOString().slice(0, 10);
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
  function authorityFrom(value = {}) {
    const source = value.authority || value;
    return {
      contractRevision: Number(source.contractRevision || 0),
      weekId: text(source.weekId) || null,
      weekRevision: Number(source.weekRevision || 0),
      calendarCommitId: text(source.calendarCommitId) || null
    };
  }
  function stageByKey(loop = {}, key = "") {
    return (Array.isArray(loop.stages) ? loop.stages : []).find((item) => item?.key === key) || null;
  }
  function firstUnverified(loop = {}) {
    const order = ["account", "authority", "priorDay", "handoff", "morning", "execution"];
    return order.map((key) => stageByKey(loop, key)).find((item) => item && item.status !== "VERIFIED") || null;
  }
  function normalizeModule(value = "") {
    const raw = text(value).toLowerCase();
    return ({ fuel: "nutrition", fueling: "nutrition", workout: "strength", training: "strength", run: "running", abs: "core", "abs/core": "core" })[raw] || raw;
  }
  function targetFrom(loop = {}) {
    const morning = loop.links?.morning || null;
    const target = morning?.target || null;
    const route = target?.route || {};
    const assignmentId = text(target?.assignmentId || loop.links?.assignmentId) || null;
    const module = normalizeModule(target?.module || route.module) || null;
    return target || assignmentId ? {
      assignmentId,
      executionId: text(target?.executionId || route.executionId) || null,
      module,
      title: text(target?.title) || "today's assignment",
      route: {
        section: text(route.section) || (module === "running" ? "performance" : module === "nutrition" ? "nutrition" : "today"),
        module,
        anchor: text(route.anchor) || null
      }
    } : null;
  }
  function order(value = {}) {
    return {
      code: value.code,
      mode: value.mode || MODES.RECRUIT,
      label: value.label,
      title: value.title,
      detail: value.detail,
      section: value.section || "today",
      module: value.module || null,
      assignmentId: value.assignmentId || null,
      executionId: value.executionId || null,
      anchor: value.anchor || null,
      operatingDate: dateIso(value.operatingDate),
      mutatesSignedAuthority: false,
      inventsCompletion: false
    };
  }
  function recoveryOrder(input = {}) {
    const loop = input.loop || {};
    if (loop.state === "CERTIFIED") return null;
    const issue = firstUnverified(loop);
    const authority = authorityFrom(input.authority);
    const target = targetFrom(loop);
    if (!issue) return order({
      code: "REFRESH_TODAY",
      label: "Refresh Today",
      title: "Refresh today's command",
      detail: "Your saved program is intact. Refresh the command to continue."
    });
    if (issue.key === "account") {
      if (!text(input.userId)) return order({
        code: "SIGN_IN",
        label: "Sign in",
        title: "Return to your account",
        detail: "Sign in to restore your saved program across devices."
      });
      return order({
        code: "RETRY_PROTECTED_SAVE",
        mode: input.online === false ? MODES.RECRUIT : MODES.AUTO,
        label: input.online === false ? "Retry when online" : "Continue",
        title: input.online === false ? "Your work is protected" : "Restoring your saved work",
        detail: input.online === false ? "Reconnect to confirm your latest saved work." : "Your latest saved work is being confirmed now."
      });
    }
    if (issue.key === "authority") {
      if (!authority.contractRevision) return order({
        code: "OPEN_CONTRACT",
        label: "Review commitment",
        title: "Finish your commitment",
        detail: "Approve the commitment that will govern your program.",
        section: "contract"
      });
      if (!authority.weekId || !authority.weekRevision) return order({
        code: "OPEN_CONTRACT",
        label: "Finish your week",
        title: "Your week needs approval",
        detail: "Review the week built from your signed commitment.",
        section: "contract"
      });
      return order({
        code: "OPEN_CALENDAR",
        label: "Review Calendar",
        title: "Reconnect your Calendar",
        detail: "Confirm the Calendar generated from your signed week.",
        section: "calendar"
      });
    }
    if (issue.key === "priorDay") {
      if (issue.status === "PROTECTED") return order({
        code: "RETRY_PROTECTED_SAVE",
        mode: input.online === false ? MODES.RECRUIT : MODES.AUTO,
        label: input.online === false ? "Retry when online" : "Continue",
        title: "Securing yesterday",
        detail: "Yesterday is closed. Its account confirmation is settling."
      });
      if (issue.status === "WAITING" && input.canRebuildHandoff === true) return order({
        code: "REBUILD_HANDOFF",
        mode: MODES.AUTO,
        label: "Continue",
        title: "Preparing today's command",
        detail: "Yesterday is certified. Today is being restored from it."
      });
      return order({
        code: "OPEN_CLOSEOUT",
        label: "Review yesterday",
        title: "Close yesterday first",
        detail: "Finish yesterday's closeout so today starts from complete evidence.",
        operatingDate: addDays(input.targetDate || loop.targetDate, -1)
      });
    }
    if (issue.key === "handoff") {
      if (issue.status === "PROTECTED") return order({
        code: "RETRY_PROTECTED_SAVE",
        mode: input.online === false ? MODES.RECRUIT : MODES.AUTO,
        label: input.online === false ? "Retry when online" : "Continue",
        title: "Securing today's handoff",
        detail: "Today's command is protected while account confirmation completes."
      });
      if (issue.status === "WAITING" && input.canRebuildHandoff === true) return order({
        code: "REBUILD_HANDOFF",
        mode: MODES.AUTO,
        label: "Continue",
        title: "Preparing today's command",
        detail: "Your signed plan is rebuilding today's handoff."
      });
      return order({
        code: "OPEN_CALENDAR",
        label: "Review Calendar",
        title: "Today's plan needs review",
        detail: "The saved handoff no longer matches the signed Calendar.",
        section: "calendar"
      });
    }
    if (issue.key === "morning") {
      if (issue.status === "PROTECTED") return order({
        code: "RETRY_PROTECTED_SAVE",
        mode: input.online === false ? MODES.RECRUIT : MODES.AUTO,
        label: input.online === false ? "Retry when online" : "Continue",
        title: "Securing today's command",
        detail: "Today's exact assignment is protected while account confirmation completes."
      });
      if (issue.status === "WAITING" && input.canActivateMorning === true) return order({
        code: "ACTIVATE_TODAY",
        mode: MODES.AUTO,
        label: "Continue",
        title: "Activating today's command",
        detail: "The signed handoff is activating one exact Calendar assignment."
      });
      return order({
        code: "OPEN_CALENDAR",
        label: "Review Calendar",
        title: "Choose the signed assignment",
        detail: "Today's command and the signed Calendar no longer agree.",
        section: "calendar"
      });
    }
    if (issue.key === "execution" && issue.status === "PROTECTED") return order({
      code: "RETRY_PROTECTED_SAVE",
      mode: input.online === false ? MODES.RECRUIT : MODES.AUTO,
      label: input.online === false ? "Retry when online" : "Continue",
      title: "Securing your completed work",
      detail: "Completion is protected while the account receipt settles."
    });
    if (issue.key === "execution" && issue.status === "WAITING" && target?.assignmentId) return order({
      code: "RESUME_ASSIGNMENT",
      label: `Resume ${target.title}`,
      title: target.title,
      detail: "Continue the exact assignment activated from your signed Calendar.",
      section: target.route.section,
      module: target.module,
      assignmentId: target.assignmentId,
      executionId: target.executionId,
      anchor: target.route.anchor
    });
    return order({
      code: "OPEN_CALENDAR",
      label: "Review Calendar",
      title: "Confirm today's assignment",
      detail: "Completion evidence does not match the assignment activated for today.",
      section: "calendar"
    });
  }
  function buildReceipt(input = {}, recovery = null) {
    if (!recovery?.code) return null;
    const loop = input.loop || {};
    const issue = firstUnverified(loop);
    const basis = {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate: dateIso(input.targetDate || loop.targetDate),
      userId: text(input.userId) || null,
      authority: authorityFrom(input.authority),
      source: {
        loopState: text(loop.state) || null,
        loopReceiptId: loop.receipt?.id || null,
        stage: issue?.key || null,
        stageStatus: issue?.status || null
      },
      recovery: {
        code: recovery.code,
        mode: recovery.mode,
        section: recovery.section,
        module: recovery.module,
        assignmentId: recovery.assignmentId,
        executionId: recovery.executionId,
        operatingDate: recovery.operatingDate
      }
    };
    const fingerprint = `continuity-recovery-${stableHash(basis)}`;
    return {
      ...basis,
      id: `continuity-recovery:${basis.targetDate}:${fingerprint.slice(-8)}`,
      fingerprint,
      status: "PENDING",
      verificationStatus: "PENDING_ACCOUNT_RECEIPT",
      createdAt: input.createdAt || null,
      accountConfirmedAt: null
    };
  }
  function accountMatch(candidate = null, values = []) {
    return Boolean(candidate?.id && (Array.isArray(values) ? values : []).some((item) => item?.id === candidate.id && item?.fingerprint === candidate.fingerprint));
  }
  function evaluate(input = {}) {
    const loop = input.loop || {};
    const recovery = recoveryOrder(input);
    if (!recovery) return {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate: dateIso(input.targetDate || loop.targetDate),
      state: STATES.CLEAR,
      order: null,
      receipt: null,
      sourceState: loop.state || null
    };
    const candidate = buildReceipt(input, recovery);
    const confirmed = input.serverConfirmed === true
      && Number(input.pendingWrites || 0) === 0
      && accountMatch(candidate, input.accountReceipts);
    const receipt = {
      ...candidate,
      status: confirmed ? "ACCOUNT_CONFIRMED" : "PROTECTED",
      verificationStatus: confirmed ? "ACCOUNT_CONFIRMED" : "PENDING_ACCOUNT_RECEIPT",
      accountConfirmedAt: confirmed ? input.accountConfirmedAt || candidate.accountConfirmedAt : null
    };
    const state = recovery.mode === MODES.AUTO
      ? STATES.AUTO_REPAIR
      : recovery.code === "RETRY_PROTECTED_SAVE" ? STATES.PROTECTED
        : ["OPEN_CALENDAR"].includes(recovery.code) ? STATES.DECISION_REQUIRED
          : STATES.ACTION_REQUIRED;
    return {
      version: VERSION,
      type: RECEIPT_TYPE,
      targetDate: candidate.targetDate,
      state,
      order: recovery,
      receipt,
      sourceState: loop.state || null,
      accountConfirmed: confirmed
    };
  }
  function receiptTime(value = {}) { return Date.parse(value.accountConfirmedAt || value.createdAt || "") || 0; }
  function upsertHistory(history = [], receipt = null, limit = 120) {
    if (!receipt?.id) return Array.isArray(history) ? [...history] : [];
    return [receipt, ...(Array.isArray(history) ? history : []).filter((item) => item?.id !== receipt.id)]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || text(left.id).localeCompare(text(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }
  function latestForDate(history = [], value = "") {
    const targetDate = dateIso(value);
    return (Array.isArray(history) ? history : [])
      .filter((item) => item?.type === RECEIPT_TYPE && dateIso(item.targetDate) === targetDate)
      .sort((left, right) => receiptTime(right) - receiptTime(left) || text(left.id).localeCompare(text(right.id)))[0] || null;
  }

  return Object.freeze({ VERSION, RECEIPT_TYPE, STATES: { ...STATES }, MODES: { ...MODES }, stableHash, addDays, recoveryOrder, buildReceipt, evaluate, upsertHistory, latestForDate });
});
