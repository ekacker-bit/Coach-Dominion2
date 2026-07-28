(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function num(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function percent(actual, target) {
    return target > 0 ? Math.round((Number(actual || 0) / target) * 100) : null;
  }

  function weightTrend(entries = []) {
    const values = entries.filter((entry) => entry?.domain === "body_metrics")
      .map((entry) => ({ date: entry.performanceDate || entry.performance_date || "", value: num(entry.metrics?.measurement_value) }))
      .filter((item) => item.value > 0).sort((a, b) => a.date.localeCompare(b.date));
    if (values.length < 2) return { state: "INSUFFICIENT", change: null, observations: values.length };
    const change = values.at(-1).value - values[0].value;
    return { state: Math.abs(change) < 0.5 ? "STABLE" : change > 0 ? "INCREASING" : "DECREASING", change: Math.round(change * 10) / 10, observations: values.length };
  }

  function buildRecoveryRecommendation(input = {}) {
    const readiness = input.readiness || {}, nutrition = input.nutrition || {}, targets = input.targets || {};
    const training = input.training || {};
    const calorieCoverage = percent(nutrition.calories, targets.calories);
    const proteinCoverage = percent(nutrition.protein, targets.protein);
    const hasTraining = Number(training.volume || 0) > 0 || Number(training.sets || 0) > 0;
    const pain = readiness.pain === true;
    const highSoreness = num(readiness.soreness) !== null && num(readiness.soreness) >= 7;
    const lowEnergy = num(readiness.energy) !== null && num(readiness.energy) <= 4;
    const underCalories = calorieCoverage !== null && calorieCoverage < 85;
    const underProtein = proteinCoverage !== null && proteinCoverage < 90;
    let status = "ON PLAN", priority = "NORMAL", holdProgression = false;
    if (pain || readiness.state === "RED") { status = "PROTECT / RECOVER"; priority = "CRITICAL"; holdProgression = true; }
    else if (hasTraining && underCalories) { status = "REFUEL REQUIRED"; priority = "HIGH"; holdProgression = true; }
    else if (highSoreness || lowEnergy || readiness.state === "YELLOW") { status = "RECOVERY PRIORITY"; priority = "HIGH"; holdProgression = true; }
    else if (underProtein) { status = "PROTEIN GAP"; priority = "MODERATE"; }
    const calorieGap = targets.calories > 0 ? Math.max(0, Math.round(targets.calories - Number(nutrition.calories || 0))) : null;
    const proteinGap = targets.protein > 0 ? Math.max(0, Math.round(targets.protein - Number(nutrition.protein || 0))) : null;
    const actions = [];
    if (pain) actions.push("Stop progression and use the pain-modified mission.");
    else if (holdProgression) actions.push("Hold load progression until readiness and fueling recover.");
    if (calorieGap > 0) actions.push(`Close the ${calorieGap}-calorie gap with planned food.`);
    if (proteinGap > 0) actions.push(`Add ${proteinGap}g protein to reach the daily target.`);
    if (highSoreness || lowEnergy) actions.push("Prioritize sleep, hydration, and reduced nonessential volume.");
    if (!actions.length) actions.push("Maintain the approved training and fueling plan.");
    const evidenceCount = [readiness.state, hasTraining ? training : null, calorieCoverage, proteinCoverage].filter((value) => value !== null && value !== undefined).length;
    const confidence = evidenceCount >= 4 ? "HIGH" : evidenceCount >= 3 ? "MODERATE" : "LIMITED";
    return {
      generatedAt: input.generatedAt || new Date().toISOString(), status, priority, confidence, holdProgression,
      calorieCoverage, proteinCoverage, calorieGap, proteinGap, hasTraining,
      trainingVolume: Number(training.volume || 0), trainingSets: Number(training.sets || 0),
      readiness: { state: readiness.state || "UNKNOWN", energy: num(readiness.energy), soreness: num(readiness.soreness), pain },
      weightTrend: input.weightTrend || { state: "INSUFFICIENT", change: null, observations: 0 },
      actions
    };
  }

  function formatRecoveryPlan(recommendation = {}) {
    return (recommendation.actions || []).join(" ");
  }

  return Object.freeze({ percent, weightTrend, buildRecoveryRecommendation, formatRecoveryPlan });
});
