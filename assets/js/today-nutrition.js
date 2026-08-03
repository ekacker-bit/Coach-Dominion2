(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionTodayNutrition = api;
}(typeof self !== "undefined" ? self : this, function () {
  const KEYS = ["calories", "protein", "carbs", "fat"];

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function round(value) {
    return Math.round(Number(value) || 0);
  }

  function buildExecutionMetric(key, actualValue, targetValue) {
    const actual = finite(actualValue);
    const target = finite(targetValue);
    if (!(target > 0)) {
      return { key, actual, target: null, remaining: null, percent: null, status: "NO TARGET" };
    }
    if (actual === null) {
      return { key, actual: null, target, remaining: target, percent: null, status: "NO DATA" };
    }
    const percent = Math.round(actual / target * 100);
    const upperLimit = key === "protein" ? 130 : 120;
    return {
      key,
      actual,
      target,
      remaining: Math.max(0, target - actual),
      percent,
      status: percent > upperLimit ? "ABOVE PLAN" : actual >= target ? "TARGET MET" : "REMAINING"
    };
  }

  function formatTrainingWindow(trainingDay, trainingWindow) {
    if (!trainingDay) return "Recovery / no workout evidence today";
    const labels = {
      MORNING: "Morning session",
      MIDDAY: "Midday session",
      EVENING: "Evening session",
      SPLIT_DAY: "AM + PM training windows",
      LONG_RUN: "Long run · duration open",
      FASTING_TRAINING: "Eating window aligned to training",
      FASTING_RECOVERY: "Approved fasting window",
      UNSCHEDULED: "Training time not scheduled"
    };
    return labels[trainingWindow] || labels.UNSCHEDULED;
  }

  function sourceLabel(source) {
    return {
      MYFITNESSPAL: "MyFitnessPal",
      MANUAL: "Manual entry"
    }[source] || "No intake source";
  }

  function buildFreshness(date, actualDate, latestEvidenceDate, sourceRecordedAt) {
    if (actualDate === date) {
      const parsed = new Date(sourceRecordedAt || "");
      const time = Number.isNaN(parsed.getTime())
        ? ""
        : ` · received ${parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      return { state: "CURRENT", label: `Current for today${time}`, date };
    }
    if (latestEvidenceDate) {
      return { state: "HISTORICAL", label: `Latest evidence ${latestEvidenceDate}`, date: latestEvidenceDate };
    }
    return { state: "MISSING", label: "No intake evidence yet", date: null };
  }

  function buildActions(status) {
    if (status === "SETUP REQUIRED") {
      return [
        { id: "set-baseline", label: "Set Fueling Baseline", primary: true },
        { id: "log-intake", label: "Log Today's Intake" },
        { id: "troubleshoot-sync", label: "Check Nutrition Sync" }
      ];
    }
    if (status === "AWAITING INTAKE") {
      return [
        { id: "log-intake", label: "Log Today's Intake", primary: true },
        { id: "troubleshoot-sync", label: "Check Nutrition Sync" },
        { id: "review-targets", label: "Review Targets" }
      ];
    }
    return [
      { id: "open-nutrition", label: "Open Nutrition Command", primary: true },
      { id: "review-targets", label: "Review Targets" },
      { id: "troubleshoot-sync", label: "Check Nutrition Sync" }
    ];
  }

  function buildInstruction({ status, metrics, trainingDay, trainingWindow, readiness }) {
    const calorie = metrics.calories;
    const protein = metrics.protein;
    const carbs = metrics.carbs;
    if (status === "SETUP REQUIRED") {
      return "Approve a fueling baseline so Atlas can compare intake with a deliberate plan.";
    }
    if (status === "AWAITING INTAKE") {
      return "Log or sync today's intake. Missing evidence is not a missed standard.";
    }
    if (status === "REVIEW EVIDENCE") {
      return "Keep the approved plan unchanged. Review today's totals and do not compensate with restriction tomorrow.";
    }
    if (["YELLOW", "RED"].includes(readiness)) {
      return "Protect recovery: follow the approved targets, hydrate normally, and do not restrict intake because readiness is reduced.";
    }
    if (trainingDay && trainingWindow === "UNSCHEDULED") {
      return "Confirm the training time, then place carbohydrate and protein around the assigned session when practical.";
    }
    if (trainingDay && protein.remaining > 0) {
      const carbText = carbs.remaining > 0 ? ` and ${round(carbs.remaining)} g carbohydrate` : "";
      return `For the ${trainingWindow.toLowerCase()} session, distribute the remaining ${round(protein.remaining)} g protein${carbText} across normal meals.`;
    }
    if (protein.remaining > 0) {
      const calorieText = calorie.remaining > 0 ? `; ${round(calorie.remaining)} kcal remain in the approved plan` : "";
      return `Prioritize ${round(protein.remaining)} g protein across remaining meals${calorieText}.`;
    }
    if (calorie.remaining > 0) {
      return `Protein is covered. Use the remaining ${round(calorie.remaining)} kcal across normal meals without forcing exact timing.`;
    }
    return "Maintain the approved targets and continue recording intake normally.";
  }

  function buildTodayNutritionExecution(input) {
    const value = input || {};
    const actual = value.actual || {};
    const targets = value.targets || {};
    const metrics = Object.fromEntries(KEYS.map((key) => [key, buildExecutionMetric(key, actual[key], targets[key])]));
    const targetCount = Object.values(metrics).filter((metric) => metric.target > 0).length;
    const actualCount = Object.values(metrics).filter((metric) => metric.actual !== null).length;
    const actualDate = actualCount ? value.actualDate || value.date : null;
    const freshness = buildFreshness(value.date, actualDate, value.latestEvidenceDate, value.sourceRecordedAt);
    const overPlan = Object.values(metrics).filter((metric) => metric.status === "ABOVE PLAN");
    const calorieReady = metrics.calories.target
      ? metrics.calories.actual !== null && metrics.calories.percent >= 80 && metrics.calories.percent <= 120
      : true;
    const proteinReady = metrics.protein.target
      ? metrics.protein.actual !== null && metrics.protein.percent >= 85 && metrics.protein.percent <= 130
      : true;
    let status = "EXECUTE";
    if (!targetCount) status = "SETUP REQUIRED";
    else if (!actualCount || freshness.state !== "CURRENT") status = "AWAITING INTAKE";
    else if (overPlan.length) status = "REVIEW EVIDENCE";
    else if (calorieReady && proteinReady) status = "ON PLAN";

    const warnings = [];
    if (status === "REVIEW EVIDENCE") {
      warnings.push(`Recorded ${overPlan.map((metric) => metric.key).join(" and ")} evidence is above the approved comparison range. Targets remain unchanged.`);
    }
    if (freshness.state === "HISTORICAL") {
      warnings.push(`No current intake is recorded. The latest nutrition evidence is dated ${freshness.date}.`);
    }

    const trainingWindow = value.trainingWindow || "UNSCHEDULED";
    const readiness = value.readiness || "UNKNOWN";
    return {
      date: value.date,
      status,
      source: value.source || "NONE",
      sourceLabel: sourceLabel(value.source),
      freshness,
      trainingDay: Boolean(value.trainingDay),
      trainingWindow,
      trainingWindowLabel: formatTrainingWindow(Boolean(value.trainingDay), trainingWindow),
      calendarContext: value.calendarContext || null,
      fastingContext: value.fastingContext || null,
      readiness,
      metrics,
      instruction: buildInstruction({
        status,
        metrics,
        trainingDay: Boolean(value.trainingDay),
        trainingWindow,
        readiness
      }),
      warnings,
      actions: buildActions(status),
      safeguards: [
        "Approved targets do not change from this card.",
        "Missing intake evidence is not treated as noncompliance.",
        "No compensatory restriction is recommended."
      ]
    };
  }

  return { buildExecutionMetric, buildFreshness, buildTodayNutritionExecution };
}));
