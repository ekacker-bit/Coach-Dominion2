(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionProgressReview = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022C.1";
  const DAY_MS = 86400000;
  const TERMINAL_STATES = Object.freeze(["CONFIRMED", "HELD", "DEFERRED"]);
  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 1) => value === null ? null : Number(Number(value).toFixed(digits));
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    return date ? new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
  };
  const daysBetween = (start, end) => {
    const first = dateOnly(start);
    const last = dateOnly(end);
    return first && last ? Math.max(0, Math.round((new Date(`${last}T12:00:00Z`) - new Date(`${first}T12:00:00Z`)) / DAY_MS)) : 0;
  };
  const signed = (value, unit = "") => {
    const number = finite(value);
    if (number === null) return "—";
    const prefix = number > 0 ? "+" : number < 0 ? "−" : "";
    return `${prefix}${Math.abs(number).toFixed(1).replace(/\.0$/, "")}${unit}`;
  };

  function comparableCheckIns(bodyOutcome = {}) {
    return [...(bodyOutcome.measurements?.checkIns || [])]
      .filter((item) => dateOnly(item.date))
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  function reviewWindow(bodyOutcome = {}, priorReview = null) {
    const all = comparableCheckIns(bodyOutcome);
    if (priorReview?.sourceLatestDate && TERMINAL_STATES.includes(priorReview.status)) {
      const newCheckIns = all.filter((item) => item.date > priorReview.sourceLatestDate);
      const window = newCheckIns.slice(-4);
      return {
        all,
        window,
        count: newCheckIns.length,
        eligible: window.length >= 4 && daysBetween(window[0]?.date, window.at(-1)?.date) >= 21,
        previousComplete: true
      };
    }
    const window = all.slice(-4);
    return {
      all,
      window,
      count: all.length,
      eligible: window.length >= 4 && daysBetween(window[0]?.date, window.at(-1)?.date) >= 21,
      previousComplete: false
    };
  }

  function metricDelta(window = [], key) {
    const points = window.filter((item) => finite(item.values?.[key]) !== null);
    return points.length >= 2 ? round(Number(points.at(-1).values[key]) - Number(points[0].values[key]), 1) : null;
  }

  function evidenceModel(input = {}, window = []) {
    const trends = input.trends || {};
    const bodyMeasurements = window.filter((item) => finite(item.values?.waist) !== null || finite(item.values?.body_fat) !== null).length;
    const checks = [
      { id: "checkpoints", label: "Four comparable checkpoints", pass: window.length >= 4 && daysBetween(window[0]?.date, window.at(-1)?.date) >= 21, weight: 30 },
      { id: "measurements", label: "Body measurement coverage", pass: bodyMeasurements >= 3, weight: 10 },
      { id: "weight", label: "Weight trend", pass: Number(trends.weight?.observations || 0) >= 4, weight: 15 },
      { id: "nutrition", label: "Fuel evidence", pass: Number(trends.nutrition?.evidenceDays || 0) >= 7, weight: 15 },
      { id: "training", label: "Training evidence", pass: Number(trends.training?.observations || 0) >= 4, weight: 10 },
      { id: "readiness", label: "Readiness evidence", pass: Number(trends.readiness?.observations || 0) >= 7, weight: 10 },
      { id: "discipline", label: "Finalized inspections", pass: Number(trends.discipline?.observations || 0) >= 2, weight: 10 }
    ];
    const score = checks.filter((item) => item.pass).reduce((sum, item) => sum + item.weight, 0);
    return {
      score,
      label: score >= 80 ? "STRONG" : score >= 60 ? "USABLE" : score >= 40 ? "LIMITED" : "LEARNING",
      checks,
      sourceCount: checks.filter((item) => item.pass).length,
      possibleSources: checks.length
    };
  }

  function signalModel(input = {}, window = []) {
    const trends = input.trends || {};
    const waistDelta = metricDelta(window, "waist");
    const bodyFatDelta = metricDelta(window, "body_fat");
    const weightDelta = finite(trends.weight?.change ?? input.bodyOutcome?.weight?.change);
    const readiness = finite(trends.readiness?.value);
    const discipline = finite(trends.discipline?.value);
    const nutrition = finite(trends.nutrition?.value);
    const signals = [];
    if (waistDelta !== null) signals.push({ id: "waist", label: "Waist", value: signed(waistDelta, " in"), delta: waistDelta });
    if (bodyFatDelta !== null) signals.push({ id: "body_fat", label: "Body fat", value: signed(bodyFatDelta, "%"), delta: bodyFatDelta });
    if (weightDelta !== null) signals.push({ id: "weight", label: "Weight", value: signed(weightDelta, " lb"), delta: weightDelta });
    if (discipline !== null) signals.push({ id: "discipline", label: "Discipline", value: `${Math.round(discipline)}%`, delta: null });
    if (nutrition !== null) signals.push({ id: "nutrition", label: "Fuel", value: `${Math.round(nutrition)}%`, delta: null });
    if (readiness !== null) signals.push({ id: "readiness", label: "Readiness", value: `${round(readiness, 1)}/10`, delta: null });
    return { waistDelta, bodyFatDelta, weightDelta, readiness, discipline, nutrition, pain: Boolean(input.readinessPain), signals };
  }

  function classificationFor(input = {}, evidence = {}, signal = {}) {
    if (evidence.score < 60) return "LEARNING";
    if (signal.pain || (signal.readiness !== null && signal.readiness < 5)) return "REGRESSING";
    const goal = String(input.contract?.primaryGoal || input.contract?.primary_goal || input.bodyOutcome?.goal || "BALANCED_FITNESS").toUpperCase();
    const training = input.trends?.training || {};
    if (goal === "LOSE_FAT") {
      if ((signal.waistDelta !== null && signal.waistDelta <= -0.25) || (signal.bodyFatDelta !== null && signal.bodyFatDelta <= -0.5) || (signal.weightDelta !== null && signal.weightDelta <= -1)) return "ADVANCING";
      if ((signal.waistDelta !== null && signal.waistDelta >= 0.25) || (signal.bodyFatDelta !== null && signal.bodyFatDelta >= 0.5) || (signal.weightDelta !== null && signal.weightDelta >= 1)) return "REGRESSING";
      return "HOLDING";
    }
    if (goal === "BUILD_STRENGTH") {
      if (Number(training.strengthSessions || 0) > 0 && Number(training.strengthDelta || 0) >= 0 && Number(signal.discipline || 0) >= 75) return "ADVANCING";
      return Number(training.strengthDelta || 0) < 0 ? "REGRESSING" : "HOLDING";
    }
    if (["RUN_FASTER", "BUILD_ENDURANCE"].includes(goal)) {
      if (Number(training.runSessions || 0) > 0 && (finite(training.runDelta) === null || Number(training.runDelta) >= -5)) return "ADVANCING";
      return finite(training.runDelta) !== null && Number(training.runDelta) <= -20 ? "REGRESSING" : "HOLDING";
    }
    if (Number(training.totalSessionDays || 0) >= 8 && Number(signal.discipline || 0) >= 75 && (signal.readiness === null || signal.readiness >= 5)) return "ADVANCING";
    return Number(signal.discipline || 0) < 60 ? "REGRESSING" : "HOLDING";
  }

  function recommendationFor(input = {}, classification, evidence, signal) {
    const goal = String(input.contract?.primaryGoal || input.contract?.primary_goal || input.bodyOutcome?.goal || "BALANCED_FITNESS").toUpperCase();
    if (evidence.score < 60) return { code: "COLLECT_EVIDENCE", domain: "EVIDENCE", label: "BUILD THE SIGNAL", headline: "Complete the next checkpoint", detail: "Atlas does not have enough comparable evidence to justify a plan decision.", section: "today", requiresPlanApproval: false };
    if (signal.pain || (signal.readiness !== null && signal.readiness < 5)) return { code: "PROTECT_RECOVERY", domain: "RECOVERY", label: "PROTECT RECOVERY", headline: "Recovery is the current constraint", detail: "Keep progression locked and resolve the recovery signal before changing the plan.", section: "today", requiresPlanApproval: false };
    if (classification === "ADVANCING") return { code: "HOLD_PLAN", domain: "PROGRAM", label: "STAY THE COURSE", headline: "Keep the approved plan", detail: "The outcome and execution signals support the current Contract. Do not add complexity.", section: "today", requiresPlanApproval: false };
    if (classification === "REGRESSING" && goal === "LOSE_FAT" && Number(signal.discipline || 0) >= 75 && Number(signal.nutrition || 0) >= 70) return { code: "REVIEW_NUTRITION", domain: "NUTRITION", label: "REVIEW ONE LEVER", headline: "Open a bounded Nutrition review", detail: "Execution is present while the outcome is moving away from the Contract. Review one fuel lever; nothing changes yet.", section: "trends", requiresPlanApproval: true };
    if (classification === "REGRESSING" && goal === "BUILD_STRENGTH") return { code: "REVIEW_STRENGTH", domain: "STRENGTH", label: "REVIEW TRAINING", headline: "Review the strength block", detail: "Strength exposure is slipping. Review the active block before changing volume or load.", section: "performance", requiresPlanApproval: true };
    if (classification === "REGRESSING" && ["RUN_FASTER", "BUILD_ENDURANCE"].includes(goal)) return { code: "REVIEW_RUNNING", domain: "RUNNING", label: "REVIEW RUNNING", headline: "Review the running block", detail: "Running volume has fallen enough to warrant a block review. No session changes automatically.", section: "performance", requiresPlanApproval: true };
    if (classification === "HOLDING" && goal === "LOSE_FAT" && Number(signal.discipline || 0) >= 80 && Number(signal.nutrition || 0) >= 70) return { code: "REVIEW_NUTRITION", domain: "NUTRITION", label: "REVIEW ONE LEVER", headline: "Outcome is flat despite execution", detail: "Authorize a bounded Nutrition review. The approved plan remains active until a separate proposal is approved.", section: "trends", requiresPlanApproval: true };
    return { code: "EXECUTION_FIRST", domain: "PROGRAM", label: "EXECUTION FIRST", headline: "Hold the plan and tighten execution", detail: "The current evidence does not justify changing the prescription. Execute and review again.", section: "today", requiresPlanApproval: false };
  }

  function buildProgressReview(input = {}) {
    const today = dateOnly(input.today) || new Date().toISOString().slice(0, 10);
    const priorReview = input.priorReview || null;
    const deferredReady = priorReview?.status === "DEFERRED" && priorReview.reassessDate && today >= priorReview.reassessDate;
    const cycle = reviewWindow(input.bodyOutcome || {}, deferredReady ? null : priorReview);
    if (priorReview?.sourceLatestDate && TERMINAL_STATES.includes(priorReview.status) && cycle.count === 0) return { ...priorReview, nextReviewDate: shiftDate(priorReview.sourceLatestDate, 28), cycleCount: 0, cycleTarget: 4 };
    if (!cycle.eligible) {
      const count = Math.min(4, cycle.previousComplete ? cycle.count : cycle.window.length);
      const latestDate = cycle.all.at(-1)?.date || null;
      return {
        version: VERSION,
        id: null,
        status: cycle.previousComplete ? "MONITORING" : "BUILDING",
        classification: "LEARNING",
        label: cycle.previousComplete ? "NEXT REVIEW" : "BUILDING THE SIGNAL",
        headline: `${Math.max(0, 4 - count)} checkpoint${Math.max(0, 4 - count) === 1 ? "" : "s"} until review`,
        detail: "Four comparable checkpoints across at least 21 days unlock a coaching decision.",
        cycleCount: count,
        cycleTarget: 4,
        sourceLatestDate: latestDate,
        nextCheckInDate: latestDate ? shiftDate(latestDate, 7) : today,
        plansChanged: false
      };
    }
    const sourceFirstDate = cycle.window[0].date;
    const sourceLatestDate = cycle.window.at(-1).date;
    const id = `progress-review:${sourceFirstDate}:${sourceLatestDate}`;
    if (priorReview?.id === id && priorReview.status !== "DEFERRED") return priorReview;
    if (priorReview?.id === id && priorReview.status === "DEFERRED" && priorReview.reassessDate && today < priorReview.reassessDate) return priorReview;
    const evidence = evidenceModel(input, cycle.window);
    const signal = signalModel(input, cycle.window);
    const classification = classificationFor(input, evidence, signal);
    const recommendation = recommendationFor(input, classification, evidence, signal);
    return {
      version: VERSION,
      id,
      status: "READY",
      classification,
      label: "REVIEW READY",
      headline: classification === "ADVANCING" ? "Progress is advancing" : classification === "REGRESSING" ? "Progress is regressing" : classification === "HOLDING" ? "Progress is holding" : "The signal is still learning",
      detail: recommendation.detail,
      sourceFirstDate,
      sourceLatestDate,
      elapsedDays: daysBetween(sourceFirstDate, sourceLatestDate),
      cycleCount: cycle.window.length,
      cycleTarget: 4,
      evidence,
      signal,
      recommendation,
      generatedAt: input.generatedAt || new Date().toISOString(),
      plansChanged: false
    };
  }

  function resolveProgressReview(review = {}, resolution, options = {}) {
    if (review.status !== "READY") throw new Error("No progress review is awaiting a decision.");
    if (!["ACCEPT", "HOLD", "REASSESS_LATER"].includes(resolution)) throw new Error("Choose the recommendation, hold the current plan, or reassess later.");
    const resolvedAt = options.resolvedAt || new Date().toISOString();
    if (resolution === "ACCEPT") return { ...review, status: "CONFIRMED", resolution, resolvedAt, resolvedBy: options.userId || null, plansChanged: false };
    if (resolution === "HOLD") return { ...review, status: "HELD", resolution, resolvedAt, resolvedBy: options.userId || null, plansChanged: false };
    return { ...review, status: "DEFERRED", resolution, resolvedAt, resolvedBy: options.userId || null, reassessDate: shiftDate(dateOnly(resolvedAt), 7), plansChanged: false };
  }

  return Object.freeze({
    VERSION,
    TERMINAL_STATES,
    comparableCheckIns,
    reviewWindow,
    metricDelta,
    evidenceModel,
    signalModel,
    classificationFor,
    recommendationFor,
    buildProgressReview,
    resolveProgressReview
  });
});
