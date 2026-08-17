(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBetaReadinessGate = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029H.1";
  const STATE = Object.freeze({
    READY: "READY",
    DECISION_REQUIRED: "DECISION_REQUIRED",
    VERIFYING: "VERIFYING",
    PROTECTED: "PROTECTED",
    ACTION_REQUIRED: "ACTION_REQUIRED"
  });
  const PROPOSAL_STATES = new Set(["PROPOSED", "NEEDS_CONTEXT", "ADAPTATION_PROPOSED"]);
  const CURRENT_PROGRAM_STATES = new Set(["ACTIVE", "COMPLETED"]);

  function upper(value = "") {
    return String(value || "").trim().toUpperCase().replaceAll(" ", "_");
  }

  function count(value = 0) {
    return Math.max(0, Number(value || 0));
  }

  function activeWeekForDate(week = null, date = "") {
    if (!week || ["REPLACED", "SUPERSEDED"].includes(upper(week.status || week.state))) return false;
    const target = String(date || "").slice(0, 10);
    return Boolean(target && week.weekStart <= target && target <= week.weekEnd);
  }

  function setupAction(lifecycleState, trustAction = null) {
    if (trustAction) return trustAction;
    if (lifecycleState === "READY_TO_COMMIT") return { code: "OPEN_CALENDAR", label: "Commit coordinated week", section: "calendar" };
    return { code: "OPEN_CONTRACT", label: "Continue setup", section: "contract" };
  }

  function evaluate(input = {}) {
    const trust = input.trustReport || {};
    const account = input.account || {};
    const canonical = input.canonicalCommand || null;
    const lifecycleState = upper(input.lifecycle?.state || canonical?.lifecycle?.program);
    const adaptationState = upper(input.adaptation?.adaptationState || input.adaptation?.status);
    const pendingWrites = count(input.pendingWrites);
    const online = input.online !== false;
    const serverConfirmed = account.serverConfirmed === true && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    const activeWeek = activeWeekForDate(input.activeWeek, canonical?.date);
    const canonicalCurrent = Boolean(canonical?.day?.committed && canonical?.week?.committed && activeWeek);
    const trustActionRequired = upper(trust.status) === "ACTION_REQUIRED";
    const programCurrent = CURRENT_PROGRAM_STATES.has(lifecycleState);
    const checks = {
      account: serverConfirmed ? "CURRENT" : pendingWrites ? "SYNC PENDING" : online ? "VERIFYING" : "DEVICE PROTECTED",
      program: programCurrent ? "CURRENT" : lifecycleState === "READY_TO_COMMIT" ? "READY TO COMMIT" : "SETUP REQUIRED",
      calendar: activeWeek ? "CURRENT" : "REQUIRED",
      today: canonicalCurrent ? "CURRENT" : "WAITING",
      evidence: pendingWrites ? "SYNC PENDING" : serverConfirmed ? "SAVED" : "VERIFYING"
    };
    const issueCodes = [];
    let state = STATE.READY;
    let tone = "green";
    let label = "CURRENT";
    let headline = "One verified program";
    let detail = "Contract, program, Calendar, Today, and the latest account receipt agree.";
    let primaryAction = null;

    if (trustActionRequired || !programCurrent || !activeWeek || !canonicalCurrent) {
      state = STATE.ACTION_REQUIRED;
      tone = "red";
      label = "ACTION REQUIRED";
      if (!programCurrent) issueCodes.push("PROGRAM_NOT_CURRENT");
      if (!activeWeek) issueCodes.push("ACTIVE_WEEK_REQUIRED");
      if (!canonicalCurrent) issueCodes.push("TODAY_NOT_AUTHORIZED");
      primaryAction = setupAction(lifecycleState, trust.primaryAction || null);
      headline = primaryAction.section === "calendar" ? "Commit the operating week" : trust.headline || "Finish program setup";
      detail = primaryAction.section === "calendar"
        ? "Today cannot become executable until the coordinated week is committed."
        : trust.detail || "Complete the next required program decision.";
    } else if (PROPOSAL_STATES.has(adaptationState)) {
      state = STATE.DECISION_REQUIRED;
      tone = "yellow";
      label = "DECISION WAITING";
      issueCodes.push("ADAPTATION_DECISION_REQUIRED");
      headline = "Atlas has one proposed adjustment";
      detail = "The active mission remains unchanged until you accept or decline the proposal.";
      primaryAction = { code: "OPEN_TODAY", label: "Review Today", section: "today" };
    } else if (!online || pendingWrites || ["OFFLINE_PROTECTED", "SAVE_QUEUED", "RETRY_REQUIRED", "LEGACY_ACTIVE"].includes(upper(account.mode || account.status))) {
      state = STATE.PROTECTED;
      tone = "yellow";
      label = pendingWrites ? `SYNC · ${pendingWrites}` : "DEVICE PROTECTED";
      issueCodes.push(pendingWrites ? "ACCOUNT_SAVE_PENDING" : "ACCOUNT_OFFLINE");
      headline = pendingWrites ? "Work saved; account sync pending" : "Work protected on this device";
      detail = pendingWrites ? "The latest complete account snapshot will retry automatically." : "Keep going. Account verification will resume when the connection returns.";
    } else if (!serverConfirmed || ["CHECKING", "REPAIRING", "VERIFYING"].includes(upper(trust.status || account.mode || account.status))) {
      state = STATE.VERIFYING;
      tone = "neutral";
      label = "VERIFYING";
      issueCodes.push("ACCOUNT_RECEIPT_REQUIRED");
      headline = "Verifying the latest account save";
      detail = "The app will not call this program current until the server confirms the exact revision.";
    }

    return Object.freeze({
      version: VERSION,
      state,
      tone,
      label,
      headline,
      detail,
      quiet: state === STATE.READY,
      checks: Object.freeze(checks),
      issueCodes: Object.freeze(issueCodes),
      primaryAction,
      serverConfirmed,
      pendingWrites,
      fingerprint: [state, lifecycleState, canonical?.id || "", input.activeWeek?.id || "", account.accountRevision || 0, pendingWrites, adaptationState].join("|")
    });
  }

  return Object.freeze({ VERSION, STATE, activeWeekForDate, evaluate });
});
