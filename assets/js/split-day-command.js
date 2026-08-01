(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionSplitDayCommand = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "020B.2";
  const MINIMUM_SEPARATION_MINUTES = 240;
  const MINIMUM_SECOND_SESSION_ENERGY = 5;
  const TERMINAL_STATES = Object.freeze(["COMPLETE", "PARTIAL"]);

  function booleanValue(value) {
    if (typeof value === "boolean") return value;
    return ["TRUE", "YES", "ON", "1"].includes(String(value || "").toUpperCase());
  }

  function executionSummary(execution = {}) {
    const state = String(execution?.state || "READY").toUpperCase();
    const completedAt = execution?.completedAt || execution?.endedAt || null;
    return {
      state,
      terminal: TERMINAL_STATES.includes(state),
      held: ["STOPPED", "PAIN_HOLD", "RECOVERY_ONLY"].includes(state) || execution?.painReported === true,
      completedAt
    };
  }

  function createCheckpoint(values = {}, context = {}) {
    const energy = Number(values.energy);
    const painResponse = String(values.newPain ?? values.new_pain ?? "").toUpperCase();
    if (!Number.isFinite(energy) || energy < 1 || energy > 10) {
      throw new Error("Record current energy from 1 to 10.");
    }
    if (!['YES', 'NO'].includes(painResponse)) {
      throw new Error("Confirm whether any new pain is present.");
    }
    const recordedAt = context.recordedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `${context.date || "undated"}:${context.weekId || "week"}:session-2-checkpoint`,
      date: context.date || null,
      weekId: context.weekId || null,
      weekRevision: Number(context.weekRevision || 0),
      sessionOneActivityId: context.sessionOneActivityId || null,
      sessionOneCompletedAt: context.sessionOneCompletedAt || null,
      energy,
      newPain: painResponse === "YES",
      refueled: booleanValue(values.refueled),
      hydrated: booleanValue(values.hydrated),
      notes: String(values.notes || "").trim().slice(0, 280),
      recordedAt,
      updatedAt: recordedAt
    };
  }

  function checkpointMatches(checkpoint = {}, context = {}) {
    if (!checkpoint || typeof checkpoint !== "object") return false;
    if (context.date && checkpoint.date !== context.date) return false;
    if (context.weekId && checkpoint.weekId && checkpoint.weekId !== context.weekId) return false;
    if (context.sessionOneActivityId && checkpoint.sessionOneActivityId && checkpoint.sessionOneActivityId !== context.sessionOneActivityId) return false;
    if (context.sessionOneCompletedAt && checkpoint.sessionOneCompletedAt && checkpoint.sessionOneCompletedAt !== context.sessionOneCompletedAt) return false;
    return true;
  }

  function evaluate(input = {}) {
    const day = input.day || {};
    const nowValue = input.now || new Date().toISOString();
    const now = Date.parse(nowValue);
    const first = executionSummary(input.sessionOne);
    const second = executionSummary(input.sessionTwo);
    const context = {
      date: day.date || null,
      weekId: input.weekId || null,
      sessionOneActivityId: day.sessionSequence?.[0]?.activityId || day.activities?.[0]?.id || null,
      sessionOneCompletedAt: first.completedAt || null
    };
    const checkpoint = checkpointMatches(input.checkpoint, context) ? input.checkpoint : null;
    const readinessState = String(input.morningReadiness?.state || "UNKNOWN").toUpperCase();
    const morningPain = input.morningReadiness?.pain === true;
    const morningReadinessMissing = !["GREEN", "YELLOW", "RED"].includes(readinessState);

    if (!day.twoADay) {
      return { required: false, status: "NOT_REQUIRED", allowed: true, blockers: [], checkpoint: null };
    }
    if (second.terminal) {
      return { required: true, status: "COMPLETE", allowed: false, blockers: [], checkpoint, first, second };
    }
    if (!first.terminal || first.held) {
      return {
        required: true,
        status: first.held ? "HELD" : "AWAITING_SESSION_1",
        allowed: false,
        blockers: [first.held ? "The AM session ended on a safety hold." : "Complete the AM session before beginning the recovery window."],
        checkpoint,
        first,
        second
      };
    }
    const firstCompleted = Date.parse(first.completedAt || "");
    if (!Number.isFinite(firstCompleted)) {
      return {
        required: true,
        status: "COMPLETION_TIME_REQUIRED",
        allowed: false,
        blockers: ["The AM session needs a completion timestamp before the PM session can unlock."],
        checkpoint,
        first,
        second
      };
    }

    const unlockAtMs = firstCompleted + MINIMUM_SEPARATION_MINUTES * 60 * 1000;
    const separationComplete = Number.isFinite(now) && now >= unlockAtMs;
    const minutesRemaining = separationComplete ? 0 : Math.max(1, Math.ceil((unlockAtMs - now) / 60000));
    const blockers = [];
    if (readinessState === "RED" || morningPain) blockers.push("Morning readiness or pain evidence keeps the second session on hold.");
    if (checkpoint?.newPain === true) blockers.push("New pain was reported at the between-session checkpoint.");
    if (checkpoint && Number(checkpoint.energy) < MINIMUM_SECOND_SESSION_ENERGY) blockers.push(`Energy must be at least ${MINIMUM_SECOND_SESSION_ENERGY}/10 for the PM session.`);
    if (blockers.length) {
      return {
        required: true,
        status: "HELD",
        allowed: false,
        blockers,
        checkpoint,
        first,
        second,
        unlockAt: new Date(unlockAtMs).toISOString(),
        separationComplete,
        minutesRemaining
      };
    }

    const checkpointGaps = [];
    if (morningReadinessMissing) checkpointGaps.push("Complete today's Morning Roll Call before the PM session.");
    if (!checkpoint) checkpointGaps.push("Complete the between-session readiness checkpoint.");
    else {
      if (!checkpoint.refueled) checkpointGaps.push("Confirm refueling after the AM session.");
      if (!checkpoint.hydrated) checkpointGaps.push("Confirm hydration before the PM session.");
      if (!Number.isFinite(Number(checkpoint.energy))) checkpointGaps.push("Record current energy.");
    }
    if (!separationComplete) {
      return {
        required: true,
        status: "RECOVERING",
        allowed: false,
        blockers: [`Keep ${minutesRemaining} more minute${minutesRemaining === 1 ? "" : "s"} between sessions.`, ...checkpointGaps],
        checkpoint,
        first,
        second,
        unlockAt: new Date(unlockAtMs).toISOString(),
        separationComplete,
        minutesRemaining
      };
    }
    if (checkpointGaps.length) {
      return {
        required: true,
        status: "CHECKPOINT_REQUIRED",
        allowed: false,
        blockers: checkpointGaps,
        checkpoint,
        first,
        second,
        unlockAt: new Date(unlockAtMs).toISOString(),
        separationComplete,
        minutesRemaining: 0
      };
    }
    return {
      required: true,
      status: "CLEARED",
      allowed: true,
      blockers: [],
      checkpoint,
      first,
      second,
      unlockAt: new Date(unlockAtMs).toISOString(),
      separationComplete: true,
      minutesRemaining: 0
    };
  }

  return Object.freeze({
    VERSION,
    MINIMUM_SEPARATION_MINUTES,
    MINIMUM_SECOND_SESSION_ENERGY,
    TERMINAL_STATES,
    executionSummary,
    createCheckpoint,
    checkpointMatches,
    evaluate
  });
});
