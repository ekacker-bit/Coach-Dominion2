(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMissionDebrief = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025C.2";
  const TERMINAL_STATES = new Set(["COMPLETE", "COMPLETED", "PARTIAL", "STOPPED", "PAIN_HOLD"]);
  const INTERRUPTED_STATES = new Set(["PARTIAL", "STOPPED", "PAIN_HOLD"]);

  function text(value = "") {
    return String(value ?? "").trim();
  }

  function upper(value = "") {
    return text(value).toUpperCase().replaceAll(" ", "_");
  }

  function clamp(value, minimum, maximum) {
    const number = Number(value);
    return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : minimum));
  }

  function moduleCode(value = "") {
    const code = upper(value);
    if (code === "CARDIO" || code === "RUN") return "RUNNING";
    if (code === "ABS") return "CORE";
    return code;
  }

  function stableHash(value = "") {
    const source = typeof value === "string" ? value : JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function windowIdentity(date = "", window = {}) {
    return `mission-debrief:${text(date)}:${text(window.id || window.label || "today").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  }

  function receiptBelongsToWindow(receipt = {}, window = {}) {
    const windowId = text(window.id);
    const receiptWindowId = text(receipt.windowId);
    if (windowId && receiptWindowId) return receiptWindowId === windowId;
    if (upper(receipt.windowLabel) && upper(window.label)) return upper(receipt.windowLabel) === upper(window.label);
    const modules = new Set((window.sessions || []).map((session) => moduleCode(session.module)));
    return modules.has(moduleCode(receipt.module));
  }

  function windowReceiptCoverage(window = {}, receipts = []) {
    const matching = receipts.filter((receipt) => receiptBelongsToWindow(receipt, window));
    const receiptModules = new Set(matching.map((receipt) => moduleCode(receipt.module)));
    const terminalSessions = (window.sessions || []).filter((session) => session.terminal || TERMINAL_STATES.has(upper(session.state)));
    const expectedModules = new Set(terminalSessions.map((session) => moduleCode(session.module)));
    const interrupted = matching.some((receipt) => receipt.painReported === true || INTERRUPTED_STATES.has(upper(receipt.state)));
    return {
      matching,
      expected: expectedModules.size,
      secured: [...expectedModules].filter((module) => receiptModules.has(module)).length,
      complete: expectedModules.size > 0 && [...expectedModules].every((module) => receiptModules.has(module)),
      interrupted
    };
  }

  function resolveReceiptContext(input = {}) {
    const module = moduleCode(input.module);
    const execution = input.execution || {};
    const preferred = input.item || input.preferred || {};
    const sessions = (Array.isArray(input.sessions) ? input.sessions : [])
      .filter((session) => moduleCode(session.module) === module);
    if (!sessions.length) return preferred;

    const executionIds = new Set([
      execution.id,
      execution.sessionId,
      execution.session?.id,
      execution.sessionSnapshot?.id,
      execution.activityId
    ].map(text).filter(Boolean));
    const receipts = Array.isArray(input.receipts) ? input.receipts : [];
    const receiptSecures = (session) => receipts.some((receipt) => (
      moduleCode(receipt.module) === module
      && text(receipt.windowId)
      && text(receipt.windowId) === text(session.trainingWindowId || session.windowId)
    ));
    const exactCandidates = executionIds.size
      ? sessions.filter((session) => [
        session.id,
        session.activityId,
        session.record?.id,
        session.record?.sessionId,
        session.record?.session?.id,
        session.record?.sessionSnapshot?.id
      ].map(text).some((id) => id && executionIds.has(id)))
      : [];
    const exact = exactCandidates.find((session) => !receiptSecures(session)) || exactCandidates[0] || null;
    const preferredIsCompletedSession = moduleCode(preferred.module) === module
      && Boolean(preferred.terminal || TERMINAL_STATES.has(upper(preferred.state)));
    const unreceiptedTerminal = sessions.find((session) => (
      (session.terminal || TERMINAL_STATES.has(upper(session.state)))
      && !receiptSecures(session)
    ));
    const resolved = exact
      || (preferredIsCompletedSession ? preferred : null)
      || unreceiptedTerminal
      || sessions.find((session) => session.terminal || TERMINAL_STATES.has(upper(session.state)))
      || (moduleCode(preferred.module) === module ? preferred : null)
      || sessions[0];
    return {
      ...preferred,
      ...resolved,
      trainingWindowId: text(resolved.trainingWindowId || resolved.windowId) || null,
      windowId: text(resolved.trainingWindowId || resolved.windowId) || null,
      windowLabel: text(resolved.windowLabel || resolved.sessionLabel) || "TODAY"
    };
  }

  function pendingDebrief(input = {}) {
    const cockpit = input.cockpit || {};
    const receipts = Array.isArray(input.receipts) ? input.receipts : [];
    const debriefs = Array.isArray(input.debriefs) ? input.debriefs : [];
    const date = cockpit.date || input.date || new Date().toISOString().slice(0, 10);
    for (const window of cockpit.windows || []) {
      const id = windowIdentity(date, window);
      if (debriefs.some((record) => record.id === id)) continue;
      const coverage = windowReceiptCoverage(window, receipts);
      const allTerminal = (window.sessions || []).length > 0
        && (window.sessions || []).every((session) => session.terminal || TERMINAL_STATES.has(upper(session.state)));
      const eligible = coverage.interrupted || (allTerminal && coverage.complete);
      if (!eligible) continue;
      return {
        id,
        date,
        window,
        receipts: coverage.matching,
        interrupted: coverage.interrupted,
        coverage
      };
    }
    return null;
  }

  function debriefOutcome(receipts = []) {
    if (receipts.some((receipt) => receipt.painReported === true || upper(receipt.state) === "PAIN_HOLD")) return "PAIN_HOLD";
    if (receipts.some((receipt) => upper(receipt.state) === "STOPPED")) return "STOPPED";
    if (receipts.some((receipt) => upper(receipt.state) === "PARTIAL")) return "PARTIAL";
    return "COMPLETE";
  }

  function buildDebrief(values = {}, context = {}) {
    const window = context.window || {};
    const receipts = Array.isArray(context.receipts) ? context.receipts : [];
    const previous = context.previous || null;
    const effort = Number(values.effort);
    const recoveryConfidence = Number(values.recoveryConfidence);
    const painAnswer = upper(values.pain);
    const executionQuality = upper(values.executionQuality);
    if (!Number.isFinite(effort) || effort < 1 || effort > 10) throw new Error("Rate session effort from 1 to 10.");
    if (!Number.isFinite(recoveryConfidence) || recoveryConfidence < 1 || recoveryConfidence > 10) throw new Error("Rate recovery confidence from 1 to 10.");
    if (!["YES", "NO"].includes(painAnswer)) throw new Error("Confirm whether pain appeared.");
    if (!["CONTROLLED", "TECHNIQUE_LIMITED"].includes(executionQuality)) throw new Error("Confirm execution quality.");
    const submittedAt = context.submittedAt || new Date().toISOString();
    const date = context.date || receipts[0]?.date || new Date().toISOString().slice(0, 10);
    const painReported = painAnswer === "YES" || receipts.some((receipt) => receipt.painReported === true);
    const meaningful = {
      effort: Math.round(clamp(effort, 1, 10)),
      painReported,
      executionQuality,
      recoveryConfidence: Math.round(clamp(recoveryConfidence, 1, 10)),
      notes: text(values.notes).slice(0, 280),
      receiptIds: receipts.map((receipt) => receipt.id).filter(Boolean).sort()
    };
    const fingerprint = stableHash(meaningful);
    if (previous?.fingerprint === fingerprint) return previous;
    return {
      version: VERSION,
      id: windowIdentity(date, window),
      type: "MISSION_DEBRIEF",
      date,
      windowId: text(window.id) || null,
      windowLabel: text(window.label) || "TODAY",
      receiptIds: meaningful.receiptIds,
      modules: [...new Set(receipts.map((receipt) => moduleCode(receipt.module)).filter(Boolean))],
      outcomeState: painReported ? "PAIN_HOLD" : debriefOutcome(receipts),
      effort: meaningful.effort,
      painReported,
      executionQuality,
      techniqueLimited: executionQuality === "TECHNIQUE_LIMITED",
      recoveryConfidence: meaningful.recoveryConfidence,
      notes: meaningful.notes,
      revision: Math.max(1, Number(previous?.revision || 0) + 1),
      fingerprint,
      submittedAt: previous?.submittedAt || submittedAt,
      updatedAt: submittedAt
    };
  }

  function coachingDecision(debrief = {}, context = {}) {
    const cockpit = context.cockpit || {};
    const splitGate = context.splitGate || cockpit.splitGate || { status: "NOT_REQUIRED", allowed: true, blockers: [] };
    const outcome = upper(debrief.outcomeState);
    const base = {
      version: VERSION,
      debriefId: debrief.id,
      planMutationAllowed: false,
      atlasReviewRequired: false,
      createdAt: context.now || new Date().toISOString()
    };
    if (debrief.painReported === true || outcome === "PAIN_HOLD") {
      return { ...base, code: "SAFETY_HOLD", tone: "red", headline: "Training is held", detail: "Pain overrides the calendar. Update Roll Call before more work.", requirements: ["Stop training", "Update pain status", "Resume only when cleared"], action: "ROLL_CALL", actionLabel: "Update Roll Call", atlasReviewRequired: true };
    }
    const needsReview = ["STOPPED", "PARTIAL"].includes(outcome)
      || debrief.techniqueLimited === true
      || Number(debrief.effort) >= 9
      || Number(debrief.recoveryConfidence) <= 4;
    if (needsReview) {
      return { ...base, code: "RECOVER_AND_REVIEW", tone: "yellow", headline: "Recovery takes priority", detail: "Atlas has the evidence. No plan changes occur without review.", requirements: ["Hydrate", "Refuel", "Protect the next recovery window"], action: "CLOSEOUT", actionLabel: "Continue to closeout", atlasReviewRequired: true };
    }
    if (cockpit.twoADay && ["RECOVERING", "CHECKPOINT_REQUIRED", "COMPLETION_TIME_REQUIRED", "AWAITING_SESSION_1"].includes(upper(splitGate.status))) {
      const checkpointDue = upper(splitGate.status) === "CHECKPOINT_REQUIRED";
      return { ...base, code: "RECOVER_BETWEEN_SESSIONS", tone: "yellow", headline: checkpointDue ? "Checkpoint is due" : "Recover before session two", detail: checkpointDue ? "Clear the PM window with current evidence." : "The PM window remains locked until recovery requirements are met.", requirements: (splitGate.blockers || []).slice(0, 3).length ? (splitGate.blockers || []).slice(0, 3) : ["Rehydrate", "Refuel", "Honor the separation window"], action: checkpointDue ? "CHECKPOINT" : "FUEL", actionLabel: checkpointDue ? "Complete checkpoint" : "Open Fuel", unlockAt: splitGate.unlockAt || null };
    }
    if (cockpit.current && !cockpit.complete) {
      return { ...base, code: "PROCEED_TO_NEXT", tone: "green", headline: "Next order is ready", detail: "Recovery evidence is clear. Continue the committed sequence.", requirements: ["Hydrate", "Follow the next order"], action: "NEXT", actionLabel: "Continue mission" };
    }
    return { ...base, code: "RECOVER_COMPLETE", tone: "green", headline: "Mission secured", detail: "Evidence is reconciled. Finish recovery and close the day.", requirements: ["Hydrate", "Refuel", "Protect sleep"], action: "CLOSEOUT", actionLabel: "Close the day" };
  }

  function attachDebrief(receipts = [], debrief = {}, decision = {}) {
    const ids = new Set(debrief.receiptIds || []);
    return receipts.map((receipt) => ids.has(receipt.id) ? {
      ...receipt,
      debriefId: debrief.id,
      debriefFingerprint: debrief.fingerprint,
      coachingCode: decision.code || null,
      atlasReviewRequired: decision.atlasReviewRequired === true,
      updatedAt: debrief.updatedAt
    } : receipt);
  }

  function upsertDebrief(items = [], record = {}, limit = 180) {
    if (!record?.id) return Array.isArray(items) ? items : [];
    return [record, ...(Array.isArray(items) ? items : []).filter((item) => item.id !== record.id)]
      .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")))
      .slice(0, limit);
  }

  function summarizeForAtlas(history = [], start = "", end = "") {
    const records = (Array.isArray(history) ? history : []).filter((record) => record.date && (!start || record.date >= start) && (!end || record.date <= end));
    const unique = new Map();
    records.forEach((record) => (record.modules || []).forEach((module) => {
      const key = `${moduleCode(module)}:${record.date}`;
      if (!unique.has(key)) unique.set(key, record);
    }));
    const values = [...unique.values()];
    return {
      events: unique.size,
      techniqueFlags: [...new Set([...unique.entries()].filter(([, record]) => record.techniqueLimited === true).map(([key]) => key))].length,
      stoppedSessions: [...new Set([...unique.entries()].filter(([, record]) => ["STOPPED", "PAIN_HOLD"].includes(upper(record.outcomeState))).map(([key]) => key))].length
    };
  }

  return Object.freeze({
    VERSION,
    TERMINAL_STATES,
    moduleCode,
    stableHash,
    windowIdentity,
    windowReceiptCoverage,
    resolveReceiptContext,
    pendingDebrief,
    buildDebrief,
    coachingDecision,
    attachDebrief,
    upsertDebrief,
    summarizeForAtlas
  });
});
