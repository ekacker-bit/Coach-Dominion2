(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionNutritionCommand = api;
}(typeof self !== "undefined" ? self : this, function () {
  const KEYS = ["calories", "protein", "carbs", "fat"];

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function buildMetric(actual, target, key) {
    const a = finite(actual), t = finite(target);
    if (!t) return { key, actual: a, target: t, percent: null, status: "NO TARGET" };
    if (a === null) return { key, actual: null, target: t, percent: null, status: "NO DATA" };
    const percent = Math.round(a / t * 100);
    let status = "ON TARGET";
    if (key === "protein") status = percent < 85 ? "LOW" : percent > 130 ? "HIGH" : "ON TARGET";
    else status = percent < 80 ? "LOW" : percent > 120 ? "HIGH" : "ON TARGET";
    return { key, actual: a, target: t, percent, status };
  }

  function buildNutritionCommand(input) {
    const value = input || {};
    const actual = value.actual || {};
    const targets = value.targets || {};
    const metrics = Object.fromEntries(KEYS.map((key) => [key, buildMetric(actual[key], targets[key], key)]));
    const targetCount = Object.values(metrics).filter((item) => item.target > 0).length;
    const actualCount = Object.values(metrics).filter((item) => item.actual !== null).length;
    const low = Object.values(metrics).filter((item) => item.status === "LOW");
    const high = Object.values(metrics).filter((item) => item.status === "HIGH");
    let status = "ON TARGET";
    if (!targetCount) status = "NEEDS TARGETS";
    else if (!actualCount) status = "AWAITING DATA";
    else if (low.some((item) => ["calories", "protein"].includes(item.key))) status = "UNDER-FUELED";
    else if (high.length || low.length) status = "REVIEW NEEDED";
    const readiness = value.readiness || "UNKNOWN";
    const trainingDay = Boolean(value.trainingDay);
    const guidance = [];
    if (status === "NEEDS TARGETS") guidance.push("Define calorie and macro targets in the Dominion Record before evaluating intake.");
    if (status === "AWAITING DATA") guidance.push("Import MyFitnessPal data or enter today’s totals manually.");
    if (status === "UNDER-FUELED") guidance.push("Prioritize the existing calorie and protein targets; do not compensate with an aggressive next-day change.");
    if (status === "REVIEW NEEDED") guidance.push("Review the out-of-range metric without changing targets automatically.");
    if (status === "ON TARGET") guidance.push("Maintain the approved targets and continue recording intake.");
    if (trainingDay) guidance.push("Training evidence is present; place carbohydrate and protein around the assigned session when practical.");
    if (readiness === "YELLOW" || readiness === "RED") guidance.push("Reduced readiness does not authorize restrictive eating; prioritize recovery and hydration.");
    return {
      status,
      source: value.source || "NONE",
      date: value.date,
      readiness,
      trainingDay,
      metrics,
      guidance,
      safeguards: [
        "Targets never change without explicit approval.",
        "Missing data is not treated as noncompliance.",
        "No aggressive calorie cuts or compensation for missed targets.",
        "This module provides fitness coaching, not medical nutrition treatment."
      ]
    };
  }

  return { buildMetric, buildNutritionCommand };
}));
