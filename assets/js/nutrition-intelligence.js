(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionNutritionIntelligence = api;
}(typeof self !== "undefined" ? self : this, function () {
  const REQUIRED_TARGETS = ["calories", "protein", "carbs", "fat"];
  const DAY_MS = 86400000;
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const round = (value) => value === null ? null : Math.round(value);
  const iso = (date) => new Date(date).toISOString().slice(0, 10);
  const shiftDate = (date, days) => iso(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS);

  function normalizeDays(days, start, end, trainingDates) {
    const byDate = new Map();
    (days || []).forEach((day) => {
      if (!day?.date || day.date < start || day.date > end) return;
      const normalized = {
        date: day.date,
        calories: number(day.calories),
        protein: number(day.protein),
        carbs: number(day.carbs),
        fat: number(day.fat),
        source: day.source || "UNKNOWN",
        trainingDay: trainingDates.has(day.date)
      };
      if (normalized.calories > 0 && normalized.protein > 0) byDate.set(day.date, normalized);
    });
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  function summarize(days, targets) {
    const calorieRatios = targets.calories ? days.map((day) => day.calories / targets.calories) : [];
    const proteinRatios = targets.protein ? days.map((day) => day.protein / targets.protein) : [];
    return {
      evidenceDays: days.length,
      averageCalories: round(average(days.map((day) => day.calories))),
      averageProtein: round(average(days.map((day) => day.protein))),
      calorieAdherence: average(calorieRatios),
      proteinAdherence: average(proteinRatios),
      onTargetDays: targets.calories && targets.protein ? days.filter((day) =>
        day.calories / targets.calories >= 0.8 &&
        day.calories / targets.calories <= 1.2 &&
        day.protein / targets.protein >= 0.85
      ).length : null,
      underFueledDays: targets.calories && targets.protein ? days.filter((day) =>
        day.calories / targets.calories < 0.8 || day.protein / targets.protein < 0.85
      ).length : null,
      reviewDays: targets.calories ? days.filter((day) => day.calories / targets.calories > 1.2).length : null
    };
  }

  function trendDirection(recent, prior) {
    if (recent.evidenceDays < 3 || prior.evidenceDays < 3) {
      return { status: "INSUFFICIENT EVIDENCE", calories: null, protein: null, message: "Log at least 3 complete days in each 7-day window to establish direction." };
    }
    const direction = (current, previous, unit) => {
      const delta = current - previous;
      const threshold = unit === "calories" ? 100 : 10;
      return { delta: round(delta), direction: Math.abs(delta) < threshold ? "STABLE" : delta > 0 ? "UP" : "DOWN" };
    };
    return {
      status: "AVAILABLE",
      calories: direction(recent.averageCalories, prior.averageCalories, "calories"),
      protein: direction(recent.averageProtein, prior.averageProtein, "protein"),
      message: "Recent 7-day evidence compared with the prior 7-day window."
    };
  }

  function selectPriority(state, summary, targets) {
    if (state === "NEEDS TARGETS") return { code: "DEFINE TARGETS", title: "Define the nutrition baseline", message: "Set calorie, protein, carbohydrate, and fat targets before evaluating adherence." };
    if (state === "INSUFFICIENT EVIDENCE") return { code: "BUILD EVIDENCE", title: "Build a reliable evidence base", message: "Log complete calorie and protein totals on at least 3 days. Missing days remain evidence gaps." };
    if (summary.proteinAdherence < 0.85) return { code: "PROTEIN CONSISTENCY", title: "Stabilize daily protein", message: "Protein is the clearest weekly opportunity. Improve consistency without compensating for prior days." };
    if (summary.calorieAdherence < 0.8) return { code: "RECOVERY FUELING", title: "Protect recovery fuel", message: "Average energy intake is below the current target. Restore consistency before making target changes." };
    if (summary.calorieAdherence > 1.2) return { code: "REVIEW PATTERN", title: "Review the weekly pattern", message: "Average energy intake is above the current target. Review context; no automatic calorie cut is recommended." };
    return { code: "MAINTAIN", title: "Maintain the current approach", message: "Available evidence supports consistency. Keep logging and review again next week." };
  }

  function buildNutritionIntelligence(input) {
    const value = input || {};
    const end = value.windowEnd || new Date().toISOString().slice(0, 10);
    const start = shiftDate(end, -13);
    const recentStart = shiftDate(end, -6);
    const targets = Object.fromEntries(REQUIRED_TARGETS.map((key) => [key, number(value.targets?.[key])]));
    const missingTargets = REQUIRED_TARGETS.filter((key) => !(targets[key] > 0));
    const trainingDates = new Set(value.trainingDates || []);
    const days = normalizeDays(value.nutritionDays, start, end, trainingDates);
    const recentDays = days.filter((day) => day.date >= recentStart);
    const priorDays = days.filter((day) => day.date < recentStart);
    const fourteenDay = summarize(days, targets);
    const sevenDay = summarize(recentDays, targets);
    const priorSevenDay = summarize(priorDays, targets);
    const training = summarize(days.filter((day) => day.trainingDay), targets);
    const recovery = summarize(days.filter((day) => !day.trainingDay), targets);
    let status = missingTargets.length ? "NEEDS TARGETS" : days.length < 3 ? "INSUFFICIENT EVIDENCE" : days.length < 7 ? "PROVISIONAL" : "READY";
    return {
      status,
      window: { start, end, days: 14 },
      evidenceDays: days.length,
      evidenceCoverage: round(days.length / 14 * 100),
      missingDays: 14 - days.length,
      missingTargets,
      targets,
      sevenDay,
      fourteenDay,
      priorSevenDay,
      training,
      recovery,
      trend: trendDirection(sevenDay, priorSevenDay),
      priority: selectPriority(status, fourteenDay, targets),
      safeguards: [
        "Missing days are evidence gaps, not failed days.",
        "No target changes occur automatically.",
        "Do not compensate for a prior day by restricting the next day.",
        "This is fitness coaching intelligence, not medical treatment."
      ]
    };
  }

  return { buildNutritionIntelligence, shiftDate };
}));
