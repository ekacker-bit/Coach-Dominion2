(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionOutcomePlanRevision = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021M.1";
  const DAY_MS = 86400000;
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    return date ? new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
  };
  const roundToTen = (value) => Math.round(Number(value) / 10) * 10;

  function nextOperatingWeek(date) {
    const value = new Date(`${dateOnly(date) || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    const days = ((8 - value.getUTCDay()) % 7) || 7;
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  function nutritionPlanSnapshot(baseline = {}) {
    if (!baseline?.recoveryTargets || !baseline?.trainingTargets) return null;
    return {
      id: baseline.id || null,
      goal: baseline.goal || "MAINTAIN",
      effectiveDate: baseline.effectiveDate || null,
      recoveryTargets: { ...baseline.recoveryTargets },
      trainingTargets: { ...baseline.trainingTargets },
      trainingAdjustments: { ...(baseline.trainingAdjustments || {}) }
    };
  }

  function proposeNutritionRevision(baseline = {}) {
    const current = nutritionPlanSnapshot(baseline);
    if (!current) return null;
    const currentCalories = finite(current.recoveryTargets.calories);
    const currentCarbs = finite(current.recoveryTargets.carbs);
    if (!(currentCalories > 0) || !(currentCarbs > 0)) return null;
    const proposedCalories = Math.max(1200, roundToTen(currentCalories * 0.95));
    if (proposedCalories === currentCalories) return null;
    const calorieDelta = currentCalories - proposedCalories;
    const proposedCarbs = Math.max(50, Math.round(currentCarbs - calorieDelta / 4));
    const recoveryTargets = {
      ...current.recoveryTargets,
      calories: proposedCalories,
      carbs: proposedCarbs
    };
    const trainingAdjustments = { ...current.trainingAdjustments };
    const trainingTargets = {
      ...current.trainingTargets,
      calories: proposedCalories + Number(trainingAdjustments.calories || 0),
      protein: recoveryTargets.protein,
      carbs: proposedCarbs + Number(trainingAdjustments.carbs || 0),
      fat: recoveryTargets.fat
    };
    return {
      goal: current.goal,
      recoveryTargets,
      trainingTargets,
      trainingAdjustments,
      change: {
        lever: "NUTRITION",
        caloriePercent: Math.round((proposedCalories - currentCalories) / currentCalories * 100),
        recoveryCalories: proposedCalories - currentCalories,
        trainingCalories: trainingTargets.calories - Number(current.trainingTargets.calories || 0),
        protein: Number(recoveryTargets.protein || 0) - Number(current.recoveryTargets.protein || 0),
        trainingChanged: false
      }
    };
  }

  function investigation(input = {}) {
    const outcome = input.outcome || {};
    const review = input.outcomeReview || outcome.review || {};
    const readiness = input.readiness || {};
    const baseline = nutritionPlanSnapshot(input.nutritionBaseline || {});
    const checks = [
      { id: "authorization", label: "Outcome review authorized", pass: review.status === "AUTHORIZED", blocking: true },
      { id: "window", label: "Four comparable checkpoints", pass: Number(review.checkpoints || 0) >= 4 && Number(review.elapsedDays || 0) >= 21, blocking: true },
      { id: "confidence", label: "Evidence confidence is usable", pass: Number(outcome.confidence || 0) >= 60, blocking: true },
      { id: "readiness", label: "Recovery is stable", pass: finite(readiness.value) === null || Number(readiness.value) >= 5, blocking: true },
      { id: "pain", label: "No active pain flag", pass: !readiness.pain, blocking: true },
      { id: "baseline", label: "Approved Nutrition baseline linked", pass: Boolean(baseline), blocking: true }
    ];
    const blockers = checks.filter((item) => item.blocking && !item.pass);
    return { checks, blockers, clear: blockers.length === 0, baseline };
  }

  function refreshLifecycle(record = null, today) {
    if (!record) return null;
    const date = dateOnly(today) || new Date().toISOString().slice(0, 10);
    if (record.status === "SCHEDULED" && date >= record.effectiveDate) return { ...record, status: date > record.observationEnd ? "REVIEW_DUE" : "OBSERVING" };
    if (record.status === "OBSERVING" && date > record.observationEnd) return { ...record, status: "REVIEW_DUE" };
    return record;
  }

  function buildProposal(input = {}) {
    const today = dateOnly(input.today) || new Date().toISOString().slice(0, 10);
    const outcome = input.outcome || {};
    const review = input.outcomeReview || outcome.review || {};
    const prior = refreshLifecycle(input.priorRevision || null, today);
    if (prior && prior.sourceReviewId === review.id) {
      if (prior.status !== "DEFERRED" || !prior.reassessDate || today < prior.reassessDate) return prior;
    }
    const audit = investigation(input);
    const id = review.id ? `plan-revision:${review.id}` : null;
    if (!audit.clear) {
      return {
        version: VERSION,
        id,
        sourceReviewId: review.id || null,
        status: "HOLD",
        code: "INVESTIGATE",
        lever: null,
        label: "INVESTIGATE FIRST",
        headline: "A plan revision is not justified yet",
        detail: audit.blockers[0]?.label || "Complete the outcome review first.",
        investigation: audit,
        plansChanged: false,
        generatedAt: input.generatedAt || new Date().toISOString()
      };
    }
    const contractGoal = input.contract?.primaryGoal || input.contract?.primary_goal || outcome.goal || "BALANCED_FITNESS";
    const proposedPlan = contractGoal === "LOSE_FAT" ? proposeNutritionRevision(input.nutritionBaseline || {}) : null;
    if (!proposedPlan) {
      return {
        version: VERSION,
        id,
        sourceReviewId: review.id,
        status: "HOLD",
        code: "MODULE_REVIEW",
        lever: null,
        label: "MODULE REVIEW",
        headline: "Keep the current plan",
        detail: "The current outcome signal does not support one bounded revision. Atlas will continue monitoring.",
        investigation: audit,
        plansChanged: false,
        generatedAt: input.generatedAt || new Date().toISOString()
      };
    }
    const effectiveDate = nextOperatingWeek(today);
    return {
      version: VERSION,
      id,
      sourceReviewId: review.id,
      sourceLatestDate: review.sourceLatestDate || outcome.measurements?.latestDate || null,
      status: "DRAFT",
      code: "ONE_LEVER_REVISION",
      lever: "NUTRITION",
      label: "DRAFT READY",
      headline: "Adjust one nutrition lever",
      detail: "A five-percent energy adjustment is the smallest bounded revision. Protein and all training plans remain unchanged.",
      rationale: [
        "Four comparable outcome checkpoints span at least 21 days.",
        "Execution evidence is strong enough to separate adherence from plan fit.",
        "Recovery and pain signals do not require a safety hold."
      ],
      investigation: audit,
      currentPlan: audit.baseline,
      proposedPlan,
      effectiveDate,
      observationEnd: shiftDate(effectiveDate, 13),
      generatedAt: input.generatedAt || new Date().toISOString(),
      plansChanged: false
    };
  }

  function resolveProposal(proposal = {}, action, options = {}) {
    if (proposal.status !== "DRAFT") throw new Error("No outcome plan revision is awaiting a decision.");
    if (!["APPROVE", "KEEP_CURRENT", "REASSESS_LATER"].includes(action)) throw new Error("Choose whether to approve, keep the current plan, or reassess later.");
    const now = options.resolvedAt || new Date().toISOString();
    if (action === "APPROVE") return { ...proposal, status: "SCHEDULED", decision: action, approvedAt: now, approvedBy: options.userId || null, plansChanged: false };
    if (action === "KEEP_CURRENT") return { ...proposal, status: "HELD", decision: action, resolvedAt: now, plansChanged: false };
    return { ...proposal, status: "DEFERRED", decision: action, resolvedAt: now, reassessDate: shiftDate(dateOnly(now), 7), plansChanged: false };
  }

  function completeObservation(record = {}, action, options = {}) {
    if (!["OBSERVING", "REVIEW_DUE", "SCHEDULED"].includes(record.status)) throw new Error("No active outcome revision can be closed.");
    if (!["RETAIN", "ROLLBACK"].includes(action)) throw new Error("Choose whether to retain or roll back the revision.");
    const retained = action === "RETAIN";
    return {
      ...record,
      status: retained ? "RETAINED" : "REVERTED",
      observationDecision: action,
      observationClosedAt: options.closedAt || new Date().toISOString(),
      rollbackBaselineId: options.rollbackBaselineId || null,
      plansChanged: retained
    };
  }

  return Object.freeze({
    VERSION,
    nextOperatingWeek,
    nutritionPlanSnapshot,
    proposeNutritionRevision,
    investigation,
    buildProposal,
    resolveProposal,
    refreshLifecycle,
    completeObservation
  });
});
