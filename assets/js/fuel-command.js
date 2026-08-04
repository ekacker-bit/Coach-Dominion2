(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionFuelCommand = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023E.1";
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

  function selectNextMeal(mealPlan, now, calendarContext = null, fastingContext = null) {
    const slots = Array.isArray(mealPlan?.slots) ? mealPlan.slots : [];
    if (!slots.length) return null;
    const evidenceCount = uniqueMealCount(mealPlan?.meals);
    const hour = currentHour(now);
    const timeIndex = hour < 10 ? 0 : hour < 14 ? 1 : hour < 17 ? 2 : 3;
    const fastingIndex = fastingContext?.status === "FAST ACTIVE" ? 0 : null;
    const calendarIndex = calendarContext?.phase === "BETWEEN_SESSIONS" ? 1 : null;
    const index = Math.min(slots.length - 1, fastingIndex ?? calendarIndex ?? (evidenceCount > 0 ? evidenceCount : timeIndex));
    const slot = slots[index];
    return {
      index,
      label: slot.label || `Meal ${index + 1}`,
      note: slot.note || "Continue toward the approved daily targets.",
      calories: finite(slot.calories),
      protein: finite(slot.protein),
      carbs: finite(slot.carbs),
      fat: finite(slot.fat),
      availableAt: fastingIndex !== null ? fastingContext?.eatingStart || null : null,
      basis: fastingIndex !== null ? "FASTING WINDOW" : calendarIndex !== null ? "CALENDAR PHASE" : evidenceCount > 0 ? "MEAL EVIDENCE" : "TIME OF DAY"
    };
  }

  function primaryAction(execution, calendarContext = null, fastingContext = null) {
    if (!execution || execution.status === "SETUP REQUIRED") {
      return { id: "set-baseline", label: "Set baseline", route: "plan" };
    }
    if (calendarContext?.blocker === true) {
      return { id: "commit-calendar", label: "Open Calendar", route: "calendar" };
    }
    if (fastingContext?.liveCommand?.primaryAction) {
      return { ...fastingContext.liveCommand.primaryAction, route: "fasting" };
    }
    if (fastingContext?.enabled && !["OFF", "SUSPENDED TODAY"].includes(fastingContext.status)) {
      return { id: "view-fast", label: "View window", route: "fasting" };
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
    if (execution.status === "EXECUTE") {
      return { id: "build-meal", label: "Build next meal", route: "meal" };
    }
    return { id: "review-intake", label: "Update intake", route: "details" };
  }

  function commandCopy(execution, nextMeal, calendarContext = null, fastingContext = null) {
    if (!execution || execution.status === "SETUP REQUIRED") {
      return {
        headline: "Set your fueling baseline",
        detail: "Approve training and recovery targets before Atlas coaches the day."
      };
    }
    if (calendarContext?.blocker === true) {
      return {
        headline: "Commit the week to plan Fuel",
        detail: calendarContext.detail || "No committed calendar day is available."
      };
    }
    if (fastingContext?.liveCommand?.visible) {
      return {
        headline: fastingContext.liveCommand.headline,
        detail: fastingContext.liveCommand.detail
      };
    }
    if (fastingContext?.enabled && fastingContext.status !== "OFF") {
      return {
        headline: fastingContext.headline,
        detail: fastingContext.detail
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
    const calendarContext = value.calendarContext || execution?.calendarContext || null;
    const fastingContext = value.fastingContext || execution?.fastingContext || mealPlan?.fastingContext || null;
    const nextMeal = selectNextMeal(mealPlan, value.now, calendarContext, fastingContext);
    const copy = commandCopy(execution, nextMeal, calendarContext, fastingContext);
    const action = primaryAction(execution, calendarContext, fastingContext);
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
      calendarContext,
      fastingContext,
      primaryAction: action,
      evidence: {
        source: execution?.sourceLabel || "No intake source",
        freshness: execution?.freshness?.label || "No intake evidence yet",
        readiness: execution?.readiness || "UNKNOWN",
        training: execution?.trainingDay ? "Training day" : "Recovery / unclassified",
        window: execution?.trainingWindowLabel || "Training time not scheduled",
        mealEvidence: mealPlan?.evidenceMessage || "No meal-level evidence available.",
        calendarSource: calendarContext?.source || "No committed calendar day",
        calendarPolicy: calendarContext?.targetPolicy || "Approved targets unchanged",
        fastingStatus: fastingContext?.status || "OFF",
        fastingWindow: fastingContext?.windowLabel || "No fasting window",
        fastingPolicy: fastingContext?.targetPolicy || "Approved targets unchanged",
        fastingExecution: fastingContext?.liveCommand?.status || "NOT STARTED"
      },
      warnings,
      safeguards: [...new Set([...safeguards, ...(fastingContext?.safeguards || [])])],
      hasApprovedTargets: normalizeMetrics(execution).some((metric) => metric.target > 0)
    };
  }

  return { VERSION, selectNextMeal, primaryAction, buildFuelCommand };
}));
