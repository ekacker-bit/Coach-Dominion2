(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionFuelCommand = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023A.1";
  const METRICS = [
    { key: "calories", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" }
  ];

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function currentHour(now) {
    if (Number.isFinite(Number(now))) return Math.max(0, Math.min(23, Number(now)));
    const parsed = now instanceof Date ? now : new Date(now || Date.now());
    return Number.isNaN(parsed.getTime()) ? 12 : parsed.getHours();
  }

  function uniqueMealCount(meals) {
    const names = (Array.isArray(meals) ? meals : [])
      .map((meal) => String(meal?.name || "").trim().toLowerCase())
      .filter(Boolean);
    return new Set(names).size;
  }

  function selectNextMeal(mealPlan, now) {
    const slots = Array.isArray(mealPlan?.slots) ? mealPlan.slots : [];
    if (!slots.length) return null;
    const evidenceCount = uniqueMealCount(mealPlan?.meals);
    const hour = currentHour(now);
    const timeIndex = hour < 10 ? 0 : hour < 14 ? 1 : hour < 17 ? 2 : 3;
    const index = Math.min(slots.length - 1, evidenceCount > 0 ? evidenceCount : timeIndex);
    const slot = slots[index];
    return {
      index,
      label: slot.label || `Meal ${index + 1}`,
      note: slot.note || "Continue toward the approved daily targets.",
      calories: finite(slot.calories),
      protein: finite(slot.protein),
      carbs: finite(slot.carbs),
      fat: finite(slot.fat),
      basis: evidenceCount > 0 ? "MEAL EVIDENCE" : "TIME OF DAY"
    };
  }

  function primaryAction(execution) {
    if (!execution || execution.status === "SETUP REQUIRED") {
      return { id: "set-baseline", label: "Set baseline", route: "plan" };
    }
    if (execution.status === "AWAITING INTAKE") {
      if (execution.source === "MYFITNESSPAL" && execution.freshness?.state === "HISTORICAL") {
        return { id: "sync-intake", label: "Sync nutrition", route: "connected" };
      }
      return { id: "log-intake", label: "Log intake", route: "details" };
    }
    if (execution.status === "REVIEW EVIDENCE") {
      return { id: "review-intake", label: "Review intake", route: "details" };
    }
    return { id: "review-intake", label: "Update intake", route: "details" };
  }

  function commandCopy(execution, nextMeal) {
    if (!execution || execution.status === "SETUP REQUIRED") {
      return {
        headline: "Set your fueling baseline",
        detail: "Approve training and recovery targets before Atlas coaches the day."
      };
    }
    if (execution.status === "AWAITING INTAKE") {
      const syncedBefore = execution.source === "MYFITNESSPAL" && execution.freshness?.state === "HISTORICAL";
      return {
        headline: syncedBefore ? "Refresh today's nutrition" : "Log today's intake",
        detail: "No current totals are available. Missing evidence is not a missed standard."
      };
    }
    if (execution.status === "REVIEW EVIDENCE") {
      return {
        headline: "Review today's totals",
        detail: "Keep the approved plan unchanged. Check the evidence and do not compensate tomorrow."
      };
    }
    if (execution.status === "ON PLAN") {
      return {
        headline: "Fueling is on plan",
        detail: "Maintain the approved targets and keep recording normally."
      };
    }
    return {
      headline: nextMeal ? `Next: ${nextMeal.label}` : "Complete today's targets",
      detail: nextMeal?.note || execution.instruction || "Continue toward the approved daily targets."
    };
  }

  function normalizeMetrics(execution) {
    return METRICS.map((definition) => {
      const metric = execution?.metrics?.[definition.key] || {};
      return {
        ...definition,
        actual: finite(metric.actual),
        target: finite(metric.target),
        remaining: finite(metric.remaining),
        percent: finite(metric.percent),
        status: metric.status || "NO DATA"
      };
    });
  }

  function buildFuelCommand(input) {
    const value = input || {};
    const execution = value.execution || null;
    const mealPlan = value.mealPlan || null;
    const nextMeal = selectNextMeal(mealPlan, value.now);
    const copy = commandCopy(execution, nextMeal);
    const action = primaryAction(execution);
    const warnings = Array.isArray(execution?.warnings) ? execution.warnings : [];
    const safeguards = Array.isArray(execution?.safeguards) ? execution.safeguards : [];
    return {
      version: VERSION,
      date: execution?.date || null,
      status: execution?.status || "UNAVAILABLE",
      headline: copy.headline,
      detail: copy.detail,
      instruction: execution?.instruction || copy.detail,
      metrics: normalizeMetrics(execution),
      nextMeal,
      primaryAction: action,
      evidence: {
        source: execution?.sourceLabel || "No intake source",
        freshness: execution?.freshness?.label || "No intake evidence yet",
        readiness: execution?.readiness || "UNKNOWN",
        training: execution?.trainingDay ? "Training day" : "Recovery / unclassified",
        window: execution?.trainingWindowLabel || "Training time not scheduled",
        mealEvidence: mealPlan?.evidenceMessage || "No meal-level evidence available."
      },
      warnings,
      safeguards,
      hasApprovedTargets: normalizeMetrics(execution).some((metric) => metric.target > 0)
    };
  }

  return { VERSION, selectNextMeal, primaryAction, buildFuelCommand };
}));
