(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DominionStrengthProgressionTrial = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025L.1";
  const OPEN_STATUSES = Object.freeze(["SCHEDULED", "REPEAT_SCHEDULED", "VERDICT_READY"]);
  const TERMINAL_EXECUTION_STATES = Object.freeze(["COMPLETE", "PARTIAL", "STOPPED"]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isoDate(value) {
    return String(value || "").slice(0, 10);
  }

  function workSets(execution = {}, exerciseCode) {
    return (execution.setLogs?.[exerciseCode] || [])
      .filter((item) => String(item.kind || "WORK").toUpperCase() !== "WARMUP");
  }

  function averageRpe(logs = []) {
    const values = logs
      .map((item) => item.rpe)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(Number)
      .filter(Number.isFinite);
    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10;
  }

  function isOpen(trial = {}) {
    return OPEN_STATUSES.includes(String(trial.status || "").toUpperCase());
  }

  function createTrial(plan = {}, adjustment = {}, options = {}) {
    if (plan.status !== "APPROVED" || adjustment.status !== "APPROVED" || plan.id !== adjustment.planId) return null;
    if (Number(plan.revision || 0) !== Number(adjustment.appliedRevision || 0)) return null;
    const changes = (adjustment.appliedChanges || [])
      .filter((item) => item.decision === "PROGRESS_LOAD")
      .map((item) => ({
        sessionId: item.sessionId,
        exerciseCode: item.exerciseCode,
        exerciseName: item.exerciseName,
        previousLoad: Number(item.previousLoad || 0),
        previousUnit: item.previousUnit || item.appliedUnit || "lb",
        previousAction: item.previousAction,
        previousRationale: item.previousRationale,
        trialLoad: Number(item.appliedLoad || 0),
        trialUnit: item.appliedUnit || item.previousUnit || "lb"
      }));
    if (!changes.length) return null;
    const createdAt = options.createdAt || adjustment.approvedAt || new Date().toISOString();
    return {
      version: VERSION,
      id: `strength-trial:${adjustment.id}:r${Number(plan.revision || 0)}`,
      type: "STRENGTH_PROGRESSION_TRIAL",
      status: "SCHEDULED",
      verdict: null,
      planId: plan.id,
      planRevision: Number(plan.revision || 0),
      adjustmentId: adjustment.id,
      sessionId: adjustment.sessionId,
      sessionName: adjustment.sessionName,
      attempt: 1,
      createdAt,
      scheduledDate: isoDate(options.scheduledDate || adjustment.activation?.scheduledDate) || null,
      changes,
      evidenceHistory: [],
      safeguards: [
        "Only the next matching plan revision can resolve this trial.",
        "Pain or RPE 9+ recommends rollback.",
        "Incomplete or modified work repeats before another increase.",
        "The recruit chooses retain, repeat, or rollback."
      ]
    };
  }

  function trialMatchesExecution(trial = {}, execution = {}) {
    if (!isOpen(trial) || trial.status === "VERDICT_READY") return false;
    if (!TERMINAL_EXECUTION_STATES.includes(String(execution.state || "").toUpperCase())) return false;
    if (execution.planId !== trial.planId || execution.sessionId !== trial.sessionId) return false;
    if (Number(execution.sessionSnapshot?.planRevision || 0) !== Number(trial.planRevision || 0)) return false;
    if (trial.sourceExecutionId === execution.id) return false;
    const scheduledDate = isoDate(trial.scheduledDate);
    const executionDate = isoDate(execution.date || execution.completedAt);
    return !scheduledDate || !executionDate || executionDate >= scheduledDate;
  }

  function exerciseVerdict(change = {}, execution = {}) {
    const code = change.exerciseCode;
    const prescription = (execution.sessionSnapshot?.exercises || [])
      .find((item) => (item.exerciseCode || item.id) === code) || {};
    const logs = workSets(execution, code);
    const plannedSets = Number(prescription.recommendedSets || prescription.sets || 0);
    const targetReps = Number(prescription.targetReps || prescription.reps || 0);
    const completedSets = logs.length;
    const rpe = averageRpe(logs);
    const loadMet = logs.length > 0 && logs.every((item) => Number(item.load || 0) >= Number(change.trialLoad || 0));
    const repsMet = logs.length > 0 && logs.every((item) => Number(item.reps || 0) >= targetReps);
    const setsMet = plannedSets > 0 && completedSets >= plannedSets;
    const substituted = Boolean(execution.substitutions?.[code]);
    const skipped = Boolean(execution.skipped?.[code]);
    let verdict = "RETAIN";
    let label = "Retain progression";
    let reason = "All prescribed work was completed at the trial load with controlled effort.";

    if (execution.painReported || execution.state === "STOPPED" || rpe !== null && rpe >= 9) {
      verdict = "ROLLBACK_RECOMMENDED";
      label = "Rollback recommended";
      reason = execution.painReported || execution.state === "STOPPED"
        ? "Pain or a stopped session makes the increased target unsafe to retain."
        : "Average RPE reached 9 or higher at the increased target.";
    } else if (substituted || skipped || !setsMet || !repsMet || !loadMet || rpe === null || rpe > 8) {
      verdict = "REPEAT_TRIAL";
      label = "Repeat trial";
      reason = substituted || skipped
        ? "The original movement was modified, so the increased target was not verified."
        : rpe === null
          ? "RPE was not recorded, so Atlas will not infer a successful trial."
          : !setsMet || !repsMet || !loadMet
            ? "The full prescribed target was not completed at the increased load."
            : "The target was completed near the limit and should repeat before it is retained.";
    }
    return {
      exerciseCode: code,
      exerciseName: change.exerciseName,
      verdict,
      label,
      reason,
      previousLoad: change.previousLoad,
      trialLoad: change.trialLoad,
      unit: change.trialUnit,
      completedSets,
      plannedSets,
      targetReps,
      averageRpe: rpe,
      loadMet,
      repsMet,
      setsMet,
      substituted,
      skipped
    };
  }

  function evaluateTrial(trial = {}, execution = {}, options = {}) {
    if (trial.status === "VERDICT_READY" && trial.sourceExecutionId === execution.id) return clone(trial);
    if (!trialMatchesExecution(trial, execution)) return clone(trial);
    const decisions = (trial.changes || []).map((change) => exerciseVerdict(change, execution));
    const verdict = decisions.some((item) => item.verdict === "ROLLBACK_RECOMMENDED")
      ? "ROLLBACK_RECOMMENDED"
      : decisions.some((item) => item.verdict === "REPEAT_TRIAL")
        ? "REPEAT_TRIAL"
        : "RETAIN";
    const evaluatedAt = options.evaluatedAt || execution.completedAt || new Date().toISOString();
    return {
      ...clone(trial),
      status: "VERDICT_READY",
      verdict,
      verdictLabel: verdict === "RETAIN" ? "Retain progression" : verdict === "REPEAT_TRIAL" ? "Repeat trial" : "Rollback recommended",
      evaluatedAt,
      sourceExecutionId: execution.id,
      sourceExecutionState: execution.state,
      evidence: {
        executionId: execution.id,
        executionDate: isoDate(execution.date || execution.completedAt),
        state: execution.state,
        painReported: Boolean(execution.painReported),
        decisions
      }
    };
  }

  function retainTrial(trial = {}, resolvedAt = new Date().toISOString()) {
    if (trial.status !== "VERDICT_READY") throw new Error("A completed progression trial is required before retaining the target.");
    return { ...clone(trial), status: "RETAINED", resolution: "RETAIN", resolvedAt };
  }

  function repeatTrial(trial = {}, scheduledDate = null, resolvedAt = new Date().toISOString()) {
    if (trial.status !== "VERDICT_READY") throw new Error("A completed progression trial is required before scheduling a repeat.");
    const evidenceHistory = [
      ...(trial.evidenceHistory || []),
      {
        attempt: Number(trial.attempt || 1),
        verdict: trial.verdict,
        evaluatedAt: trial.evaluatedAt,
        evidence: clone(trial.evidence || {})
      }
    ];
    return {
      ...clone(trial),
      status: "REPEAT_SCHEDULED",
      verdict: null,
      verdictLabel: null,
      attempt: Number(trial.attempt || 1) + 1,
      scheduledDate: isoDate(scheduledDate) || null,
      repeatedAt: resolvedAt,
      evidenceHistory,
      evidence: null,
      evaluatedAt: null,
      sourceExecutionId: null,
      sourceExecutionState: null
    };
  }

  function rollbackTrial(plan = {}, trial = {}, rolledBackAt = new Date().toISOString()) {
    if (plan.status !== "APPROVED" || trial.status !== "VERDICT_READY" || trial.planId !== plan.id) {
      throw new Error("A completed progression trial for the active plan is required.");
    }
    if (Number(plan.revision || 0) !== Number(trial.planRevision || 0)) {
      throw new Error("This trial no longer belongs to the latest plan revision and cannot be rolled back safely.");
    }
    const changes = new Map((trial.changes || []).map((item) => [`${item.sessionId}:${item.exerciseCode}`, item]));
    if (!changes.size) throw new Error("This trial does not contain a reversible target receipt.");
    const sessions = (plan.sessions || []).map((session) => ({
      ...session,
      exercises: (session.exercises || []).map((exercise) => {
        const change = changes.get(`${session.id}:${exercise.exerciseCode || exercise.id}`);
        return change ? {
          ...exercise,
          recommendedLoad: change.previousLoad,
          unit: change.previousUnit || exercise.unit,
          action: change.previousAction,
          rationale: change.previousRationale
        } : { ...exercise };
      })
    }));
    const nextPlan = clone({
      ...plan,
      version: VERSION,
      revision: Number(plan.revision || 0) + 1,
      sessions,
      adjustedAt: rolledBackAt,
      lastAdjustmentId: null,
      lastAdjustmentActivation: null,
      lastProgressionTrialId: trial.id,
      rolledBackTrialId: trial.id
    });
    return {
      plan: nextPlan,
      trial: {
        ...clone(trial),
        status: "ROLLED_BACK",
        resolution: "ROLLBACK",
        resolvedAt: rolledBackAt,
        rollbackRevision: nextPlan.revision
      }
    };
  }

  return Object.freeze({
    VERSION,
    OPEN_STATUSES,
    TERMINAL_EXECUTION_STATES,
    isOpen,
    createTrial,
    trialMatchesExecution,
    evaluateTrial,
    retainTrial,
    repeatTrial,
    rollbackTrial
  });
});
