(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionMissionExecution = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025B.1";
  const ACTIVE_STATES = new Set(["IN_PROGRESS", "PAUSED", "REVIEW"]);
  const TERMINAL_STATES = new Set(["COMPLETE", "COMPLETED", "PARTIAL", "STOPPED", "PAIN_HOLD"]);
  const HELD_STATES = new Set(["PAIN_HOLD", "RECOVERY_ONLY", "SAFETY_HOLD", "STOPPED"]);

  function text(value = "") {
    return String(value || "").trim();
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

  function recordState(record = null) {
    if (record?.painReported === true) return "PAIN_HOLD";
    return upper(record?.state || "READY");
  }

  function isTerminal(state = "") {
    return TERMINAL_STATES.has(upper(state));
  }

  function isActive(state = "") {
    return ACTIVE_STATES.has(upper(state));
  }

  function isComplete(state = "") {
    return ["COMPLETE", "COMPLETED"].includes(upper(state));
  }

  function normalizeSession(item = {}, index = 0, record = null) {
    const module = moduleCode(item.module || item.type);
    const state = recordState(record);
    const held = HELD_STATES.has(state);
    const complete = isComplete(state);
    const terminal = isTerminal(state);
    return {
      id: item.id || `${module.toLowerCase()}-${index + 1}`,
      module,
      title: text(item.title) || `${module.charAt(0)}${module.slice(1).toLowerCase()} session`,
      type: upper(item.type || module),
      estimatedMinutes: Math.max(0, Number(item.estimatedMinutes || 0)),
      sessionOrder: Math.max(1, Number(item.sessionOrder || index + 1)),
      sessionLabel: text(item.sessionLabel || item.sessionWindow) || `SESSION ${index + 1}`,
      trainingWindowId: text(item.trainingWindowId) || `window-${item.sessionOrder || index + 1}`,
      tertiary: Boolean(item.tertiary),
      state,
      active: isActive(state),
      complete,
      terminal,
      held,
      record: record || { state: "READY" }
    };
  }

  function normalizeWindows(day = {}, records = {}) {
    const sequence = Array.isArray(day.sessionSequence) && day.sessionSequence.length
      ? day.sessionSequence
      : Array.isArray(day.activities) ? day.activities : [];
    const windows = new Map();
    sequence.forEach((item, index) => {
      const module = moduleCode(item.module || item.type);
      const record = records[module] || records[module.toLowerCase()] || null;
      const session = normalizeSession(item, index, record);
      if (!windows.has(session.trainingWindowId)) {
        windows.set(session.trainingWindowId, {
          id: session.trainingWindowId,
          order: session.sessionOrder,
          label: text(item.sessionLabel || item.sessionWindow) || (day.twoADay ? session.sessionOrder > 1 ? "PM" : "AM" : "TODAY"),
          sessions: []
        });
      }
      windows.get(session.trainingWindowId).sessions.push(session);
    });
    return [...windows.values()]
      .sort((left, right) => left.order - right.order)
      .map((window) => ({
        ...window,
        complete: window.sessions.length > 0 && window.sessions.every((session) => session.terminal),
        held: window.sessions.some((session) => session.held),
        active: window.sessions.some((session) => session.active)
      }));
  }

  function applySplitWindowLocks(windows = [], day = {}, splitGate = {}) {
    return windows.map((window, index) => ({
      ...window,
      sessions: window.sessions.map((session) => ({
        ...session,
        locked: Boolean(day.twoADay && index > 0 && splitGate.allowed !== true && !session.active && !session.terminal)
      }))
    }));
  }

  function flattenSessions(windows = []) {
    return windows.flatMap((window) => window.sessions.map((session) => ({ ...session, windowLabel: window.label, windowOrder: window.order })));
  }

  function nextSession(sessions = []) {
    return sessions.find((session) => session.active)
      || sessions.find((session) => !session.terminal && !session.held)
      || sessions.find((session) => !session.terminal)
      || null;
  }

  function primaryAction(model = {}) {
    if (!model.readinessComplete) {
      return { code: "ROLL_CALL", label: "Complete Roll Call", detail: "Set readiness before training begins." };
    }
    if (!model.sessions.length) {
      return { code: "OPEN_CALENDAR", label: "Open Calendar", detail: "No executable training is committed for today." };
    }
    if (model.protected) {
      const held = model.sessions.find((session) => session.held);
      return { code: "SAFETY", module: held?.module || null, label: "Review safety hold", detail: "Pain and safety rules override the remaining training order." };
    }
    if (model.complete) {
      return { code: "COMPLETE", label: "Mission complete", detail: "Every scheduled session has durable evidence." };
    }
    const session = model.current;
    if (!session) return { code: "OPEN_CALENDAR", label: "Review Calendar", detail: "Today needs a valid training order." };
    if (session.locked) {
      return { code: "CHECKPOINT", module: session.module, label: "Clear PM session", detail: model.splitGate?.blockers?.[0] || "Complete the between-session checkpoint." };
    }
    if (session.held) {
      return { code: "SAFETY", module: session.module, label: "Review safety hold", detail: "Pain and safety rules override training." };
    }
    if (session.state === "REVIEW") {
      return { code: "FINALIZE", module: session.module, label: "Save session evidence", detail: "Confirm the completed work once. No duplicate logging." };
    }
    if (session.state === "PAUSED") {
      return { code: "RESUME", module: session.module, label: `Resume ${session.module.toLowerCase()}`, detail: "Continue the saved session." };
    }
    if (session.state === "IN_PROGRESS") {
      return { code: "OPEN", module: session.module, label: "Continue session", detail: "The active session is saved and ready." };
    }
    return { code: "START", module: session.module, label: `Start ${session.windowLabel === "TODAY" ? "session" : session.windowLabel}`, detail: `${session.title} is next.` };
  }

  function buildCockpit(input = {}) {
    const day = input.day || {};
    const splitGate = input.splitGate || { allowed: true, status: "NOT_REQUIRED", blockers: [] };
    const windows = applySplitWindowLocks(normalizeWindows(day, input.records || {}), day, splitGate);
    const sessions = flattenSessions(windows);
    const completed = sessions.filter((session) => session.terminal).length;
    const current = nextSession(sessions);
    const complete = sessions.length > 0 && completed === sessions.length;
    const active = sessions.some((session) => session.active);
    const protectedSession = sessions.some((session) => session.held);
    const model = {
      version: VERSION,
      date: input.date || day.date || new Date().toISOString().slice(0, 10),
      readinessComplete: input.readinessComplete === true,
      twoADay: Boolean(day.twoADay),
      windows,
      sessions,
      current,
      completed,
      total: sessions.length,
      percent: sessions.length ? Math.round(completed / sessions.length * 100) : 0,
      complete: complete && !protectedSession,
      active,
      protected: protectedSession,
      splitGate,
      state: protectedSession ? "SAFETY_HOLD" : complete ? "COMPLETE" : active ? "IN_PROGRESS" : sessions.length ? "READY" : "PLAN_REQUIRED"
    };
    return { ...model, primary: primaryAction(model) };
  }

  function runningSegments(prescription = {}) {
    const session = prescription.session || {};
    const steps = Array.isArray(prescription.steps) ? prescription.steps : [];
    const warmup = steps.find((step) => upper(step.code) === "WARM_UP") || { title: "Warm-up", instruction: "Complete the prescribed warm-up." };
    const cooldown = steps.find((step) => upper(step.code) === "COOL_DOWN") || { title: "Cooldown", instruction: "Complete the prescribed cooldown." };
    if (upper(session.type) !== "INTERVAL") {
      return (steps.length ? steps : [warmup, { code: "WORK", title: "Main run", instruction: "Complete the prescribed run." }, cooldown]).map((step, index) => ({
        id: `${upper(step.code || "STEP").toLowerCase()}-${index + 1}`,
        kind: upper(step.code || "STEP"),
        title: text(step.title) || `Step ${index + 1}`,
        instruction: text(step.instruction),
        state: "READY",
        completedAt: null
      }));
    }
    const repetitions = Math.round(clamp(session.intervalCount || session.repetitions || 6, 2, 20));
    const work = steps.find((step) => upper(step.code) === "WORK") || { instruction: "Complete one controlled work repetition." };
    const segments = [{ id: "warm-up", kind: "WARM_UP", title: text(warmup.title) || "Warm-up", instruction: text(warmup.instruction), state: "READY", completedAt: null }];
    for (let index = 1; index <= repetitions; index += 1) {
      segments.push({ id: `work-${index}`, kind: "WORK", title: `Work rep ${index} of ${repetitions}`, instruction: text(work.instruction), state: "READY", completedAt: null });
      if (index < repetitions) segments.push({ id: `recover-${index}`, kind: "RECOVER", title: `Recovery ${index}`, instruction: "Recover easily until ready for the next prescribed repetition.", state: "READY", completedAt: null });
    }
    segments.push({ id: "cool-down", kind: "COOL_DOWN", title: text(cooldown.title) || "Cooldown", instruction: text(cooldown.instruction), state: "READY", completedAt: null });
    return segments;
  }

  function startRunningExecution(prescription = {}, existing = null, startedAt = new Date().toISOString()) {
    if (!prescription.session) return existing;
    if (existing?.state === "PAUSED") return resumeRunningExecution(existing, startedAt);
    if (isTerminal(existing?.state)) return existing;
    const segments = Array.isArray(existing?.segments) && existing.segments.length ? existing.segments : runningSegments(prescription);
    return {
      ...(existing || {}),
      version: VERSION,
      id: existing?.id || `${prescription.date || new Date().toISOString().slice(0, 10)}:${prescription.session.id || prescription.session.type || "run"}`,
      state: "IN_PROGRESS",
      date: prescription.date || existing?.date || new Date().toISOString().slice(0, 10),
      session: JSON.parse(JSON.stringify(prescription.session)),
      segments,
      startedAt: existing?.startedAt || startedAt,
      activeSegments: [...(existing?.activeSegments || []), { startedAt, endedAt: null }],
      painReported: false,
      updatedAt: startedAt
    };
  }

  function closeActiveTime(execution = {}, endedAt = new Date().toISOString()) {
    const activeSegments = [...(execution.activeSegments || [])];
    const index = activeSegments.findLastIndex((segment) => !segment.endedAt);
    if (index >= 0) activeSegments[index] = { ...activeSegments[index], endedAt };
    return activeSegments;
  }

  function activeRunningSegment(execution = {}) {
    return (execution.segments || []).find((segment) => segment.state !== "COMPLETE") || null;
  }

  function completeRunningSegment(execution = {}, segmentId = null, completedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS") return execution;
    const active = activeRunningSegment(execution);
    const targetId = segmentId || active?.id;
    if (!targetId) return execution;
    const segments = (execution.segments || []).map((segment) => segment.id === targetId ? { ...segment, state: "COMPLETE", completedAt } : segment);
    const allComplete = segments.length > 0 && segments.every((segment) => segment.state === "COMPLETE");
    return {
      ...execution,
      segments,
      state: allComplete ? "REVIEW" : "IN_PROGRESS",
      activeSegments: allComplete ? closeActiveTime(execution, completedAt) : execution.activeSegments,
      reviewStartedAt: allComplete ? completedAt : execution.reviewStartedAt,
      updatedAt: completedAt
    };
  }

  function completeAllRunningSegments(execution = {}, completedAt = new Date().toISOString()) {
    if (!execution) return execution;
    return {
      ...execution,
      state: "REVIEW",
      segments: (execution.segments || []).map((segment) => ({ ...segment, state: "COMPLETE", completedAt: segment.completedAt || completedAt })),
      activeSegments: closeActiveTime(execution, completedAt),
      reviewStartedAt: completedAt,
      updatedAt: completedAt
    };
  }

  function pauseRunningExecution(execution = {}, pausedAt = new Date().toISOString()) {
    if (execution.state !== "IN_PROGRESS") return execution;
    return { ...execution, state: "PAUSED", activeSegments: closeActiveTime(execution, pausedAt), pausedAt, updatedAt: pausedAt };
  }

  function resumeRunningExecution(execution = {}, resumedAt = new Date().toISOString()) {
    if (!['PAUSED', 'REVIEW'].includes(execution.state)) return execution;
    return { ...execution, state: "IN_PROGRESS", activeSegments: [...(execution.activeSegments || []), { startedAt: resumedAt, endedAt: null }], resumedAt, updatedAt: resumedAt };
  }

  function prepareRunningReview(execution = {}, reviewedAt = new Date().toISOString()) {
    if (!['IN_PROGRESS', 'PAUSED'].includes(execution.state)) return execution;
    return {
      ...execution,
      state: "REVIEW",
      activeSegments: execution.state === "IN_PROGRESS" ? closeActiveTime(execution, reviewedAt) : execution.activeSegments,
      reviewStartedAt: reviewedAt,
      updatedAt: reviewedAt
    };
  }

  function runningDurationSeconds(execution = {}, now = new Date().toISOString()) {
    const end = Date.parse(now);
    return Math.max(0, Math.round((execution.activeSegments || []).reduce((total, segment) => {
      const start = Date.parse(segment.startedAt || "");
      const finish = Date.parse(segment.endedAt || "") || end;
      return Number.isFinite(start) && Number.isFinite(finish) && finish >= start ? total + finish - start : total;
    }, 0) / 1000));
  }

  function finishRunningExecution(execution = {}, options = {}, completedAt = new Date().toISOString()) {
    if (isTerminal(execution.state)) return execution;
    const segments = execution.segments || [];
    const completed = segments.filter((segment) => segment.state === "COMPLETE").length;
    const state = options.painReported ? "PAIN_HOLD" : completed === segments.length && segments.length ? "COMPLETE" : completed ? "PARTIAL" : "STOPPED";
    return {
      ...execution,
      state,
      painReported: Boolean(execution.painReported || options.painReported),
      completedAt,
      activeSegments: execution.state === "IN_PROGRESS" ? closeActiveTime(execution, completedAt) : execution.activeSegments,
      notes: text(options.notes || execution.notes),
      durationSeconds: runningDurationSeconds(execution, completedAt),
      updatedAt: completedAt
    };
  }

  function reportRunningPain(execution = {}, reportedAt = new Date().toISOString()) {
    return finishRunningExecution({ ...execution, painReported: true }, { painReported: true }, reportedAt);
  }

  function buildEvidenceReceipt(input = {}) {
    const execution = input.execution || {};
    const module = moduleCode(input.module);
    const completedAt = input.completedAt || execution.completedAt || execution.updatedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `mission:${input.date || execution.date}:${module.toLowerCase()}:${execution.id || execution.sessionId || "session"}`,
      type: "MISSION_SESSION_EVIDENCE",
      date: input.date || execution.date,
      module,
      assignmentId: execution.assignmentId || input.assignmentId || null,
      sessionId: execution.id || execution.sessionId || null,
      planId: execution.planId || execution.blockId || null,
      state: recordState(execution),
      source: "COACH_DOMINION_EXECUTION",
      sourceRecordId: execution.id || null,
      windowId: text(input.windowId) || null,
      windowLabel: text(input.windowLabel) || "TODAY",
      summary: input.summary || {},
      painReported: Boolean(execution.painReported),
      completedAt,
      createdAt: input.createdAt || completedAt
    };
  }

  return Object.freeze({
    VERSION,
    ACTIVE_STATES,
    TERMINAL_STATES,
    moduleCode,
    recordState,
    isTerminal,
    isActive,
    isComplete,
    normalizeSession,
    normalizeWindows,
    buildCockpit,
    runningSegments,
    startRunningExecution,
    activeRunningSegment,
    completeRunningSegment,
    completeAllRunningSegments,
    pauseRunningExecution,
    resumeRunningExecution,
    prepareRunningReview,
    runningDurationSeconds,
    finishRunningExecution,
    reportRunningPain,
    buildEvidenceReceipt
  });
});
