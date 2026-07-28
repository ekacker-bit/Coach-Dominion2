(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionNutritionReview = api;
}(typeof self !== "undefined" ? self : this, function () {
  function buildWeeklyNutritionReview(input) {
    const value = input || {};
    const intelligence = value.intelligence || {};
    const summary = intelligence.fourteenDay || {};
    const evidenceDays = Number(intelligence.evidenceDays) || 0;
    if (intelligence.status === "NEEDS TARGETS") {
      return {
        status: "NEEDS TARGETS",
        evidenceDays,
        headline: "Approve a fueling baseline before running the weekly review.",
        wins: [],
        observations: ["Nutrition evidence remains visible, but adherence cannot be judged without approved targets."],
        actions: [{ code: "SET BASELINE", title: "Approve the 008D baseline", detail: "Define and approve the targets you intend to follow." }],
        safeguards: defaultSafeguards()
      };
    }
    if (evidenceDays < 3) {
      return {
        status: "INSUFFICIENT EVIDENCE",
        evidenceDays,
        headline: "The week is not ready for a coaching conclusion.",
        wins: evidenceDays ? [`${evidenceDays} complete nutrition day captured without treating gaps as failures.`] : [],
        observations: [`${14 - evidenceDays} days remain evidence gaps in the 14-day window.`],
        actions: [{ code: "BUILD EVIDENCE", title: "Capture complete daily totals", detail: `Log at least ${3 - evidenceDays} more complete calorie and protein day${3 - evidenceDays === 1 ? "" : "s"} before drawing a conclusion.` }],
        safeguards: defaultSafeguards()
      };
    }

    const provisional = evidenceDays < 7;
    const wins = [];
    const observations = [];
    const actions = [];
    if ((summary.onTargetDays || 0) > 0) wins.push(`${summary.onTargetDays} evidence day${summary.onTargetDays === 1 ? "" : "s"} met the calorie-and-protein operating range.`);
    if (summary.proteinAdherence >= 0.85) wins.push(`Average protein adherence reached ${Math.round(summary.proteinAdherence * 100)}%.`);
    if (summary.calorieAdherence >= 0.8 && summary.calorieAdherence <= 1.2) wins.push(`Average calorie adherence remained inside the coaching review range.`);
    if (!wins.length) wins.push("Complete evidence was captured; that is the first requirement for useful coaching.");

    observations.push(`${evidenceDays} of 14 days contain complete calorie and protein evidence.`);
    if (intelligence.trend?.status === "AVAILABLE") {
      observations.push(`Recent calories are ${intelligence.trend.calories.direction.toLowerCase()} versus the prior week; protein is ${intelligence.trend.protein.direction.toLowerCase()}.`);
    } else observations.push("Week-over-week direction is not established yet.");
    if (intelligence.training?.evidenceDays && intelligence.recovery?.evidenceDays) {
      observations.push(`Training-day intake averaged ${intelligence.training.averageCalories} kcal versus ${intelligence.recovery.averageCalories} kcal on recovery or unclassified days.`);
    }

    if (evidenceDays < 7) actions.push({ code: "EVIDENCE", title: "Increase evidence coverage", detail: `Capture ${7 - evidenceDays} additional complete day${7 - evidenceDays === 1 ? "" : "s"} before treating the pattern as established.` });
    if (summary.proteinAdherence < 0.85) actions.push({ code: "PROTEIN", title: "Use one repeatable protein anchor", detail: "Choose one reliable meal or snack that makes the approved protein target easier to reach." });
    if (summary.calorieAdherence < 0.8) actions.push({ code: "RECOVERY", title: "Protect recovery energy", detail: "Prioritize the approved calorie baseline; do not compensate by restricting the following day." });
    if (summary.calorieAdherence > 1.2) actions.push({ code: "PATTERN REVIEW", title: "Review high-intake context", detail: "Look for timing, hunger, travel, or meal-structure patterns. No automatic calorie cut is authorized." });
    if (intelligence.training?.evidenceDays && intelligence.recovery?.evidenceDays &&
        intelligence.training.averageCalories < intelligence.recovery.averageCalories) {
      actions.push({ code: "TRAINING FUEL", title: "Place fuel around training", detail: "Use the approved training-day allowance instead of shifting fuel away from training." });
    }
    if (!actions.length) actions.push({ code: "MAINTAIN", title: "Repeat the current structure", detail: "Keep the approved targets and logging rhythm unchanged for the next review window." });
    return {
      status: provisional ? "PROVISIONAL REVIEW" : "READY FOR REVIEW",
      evidenceDays,
      headline: provisional ? "A useful early pattern is visible, but confidence remains limited." : "The evidence window is ready for a weekly coaching decision.",
      wins,
      observations,
      actions: actions.slice(0, 3),
      goal: value.goal || "MAINTAIN",
      reviewEnd: value.reviewEnd,
      safeguards: defaultSafeguards()
    };
  }

  function defaultSafeguards() {
    return [
      "Recommendations change behaviors, not approved calorie or macro targets.",
      "Missing days remain evidence gaps, not noncompliance.",
      "No next-day restriction or exercise compensation is authorized.",
      "Persistent symptoms or clinical nutrition needs require a qualified professional."
    ];
  }

  function approveWeeklyNutritionReview(review, approvedAt, id) {
    if (!["PROVISIONAL REVIEW", "READY FOR REVIEW"].includes(review?.status)) {
      throw new Error("This review does not have enough evidence for approval.");
    }
    return { ...review, id: id || `nutrition-review-${Date.now()}`, status: "APPROVED", approvedAt: approvedAt || new Date().toISOString() };
  }

  return { buildWeeklyNutritionReview, approveWeeklyNutritionReview };
}));
