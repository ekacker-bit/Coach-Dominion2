(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionFuelClosedLoop = api;
}(typeof self !== "undefined" ? self : this, function () {
  const VERSION = "023F.1";
  const METRICS = ["calories", "protein", "carbs", "fat"];

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function rating(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 5) throw new Error(`${label} must be rated from 1 to 5.`);
    return number;
  }

  function isoDate(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function currentHour(now) {
    if (Number.isFinite(Number(now))) return Math.max(0, Math.min(23, Number(now)));
    const parsed = now instanceof Date ? now : new Date(now || Date.now());
    return Number.isNaN(parsed.getTime()) ? 12 : parsed.getHours();
  }

  function mergeById(history = [], record = null, limit = 180) {
    const values = [...(Array.isArray(history) ? history : []).filter(Boolean), ...(record?.id ? [record] : [])];
    const byId = new Map();
    values.forEach((item) => {
      if (!item?.id) return;
      const current = byId.get(item.id);
      if (!current || String(item.updatedAt || "") >= String(current.updatedAt || "")) byId.set(item.id, item);
    });
    return [...byId.values()].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, limit);
  }

  function normalizeLedger(value = {}) {
    return {
      feedback: mergeById(value.feedback || []),
      closeouts: mergeById(value.closeouts || [], null, 120),
      updatedAt: value.updatedAt || null
    };
  }

  function mealRecords(ledger = {}, date) {
    const records = [...(Array.isArray(ledger.history) ? ledger.history : []), ...(ledger.current?.id ? [ledger.current] : [])];
    return mergeById(records)
      .filter((item) => item.status === "CONFIRMED" && item.date === date)
      .sort((a, b) => String(b.confirmedAt || b.updatedAt || "").localeCompare(String(a.confirmedAt || a.updatedAt || "")));
  }

  function sumMeals(meals = []) {
    return Object.fromEntries(METRICS.map((key) => [key, Math.round(meals.reduce((sum, meal) => sum + Number(meal.actual?.[key] ?? meal.estimate?.[key] ?? 0), 0))]));
  }

  function executionMetrics(execution = {}) {
    return Object.fromEntries(METRICS.map((key) => {
      const metric = execution.metrics?.[key] || {};
      return [key, {
        actual: finite(metric.actual),
        target: finite(metric.target),
        remaining: finite(metric.remaining),
        status: metric.status || "NO DATA"
      }];
    }));
  }

  function reconcileDay(input = {}) {
    const date = isoDate(input.date) || isoDate(input.execution?.date);
    const meals = mealRecords(input.mealLedger, date);
    const confirmed = sumMeals(meals);
    const metrics = executionMetrics(input.execution);
    const hasAuthoritative = METRICS.some((key) => metrics[key].actual !== null);
    const source = input.execution?.sourceLabel || input.execution?.source || "No daily total";
    if (!hasAuthoritative) {
      return {
        state: "AWAITING_TOTALS",
        label: "Daily totals pending",
        detail: meals.length
          ? "Meal confirmations are saved, but they are not added to the day. Sync or enter the final daily total once."
          : "No daily nutrition total is available. Missing evidence is not noncompliance.",
        source,
        meals,
        confirmed,
        metrics,
        reviewRequired: false,
        doubleCountPolicy: "Confirmed meals never add to imported or manual daily totals."
      };
    }
    if (!meals.length) {
      return {
        state: "DAILY_TOTALS_ONLY",
        label: "Daily total verified",
        detail: `${source} is the operating total. No Coach Dominion meal has been confirmed today.`,
        source,
        meals,
        confirmed,
        metrics,
        reviewRequired: false,
        doubleCountPolicy: "The authoritative daily total is used once."
      };
    }
    const tolerances = { calories: 100, protein: 10, carbs: 15, fat: 8 };
    const over = METRICS.filter((key) => metrics[key].actual !== null && confirmed[key] > metrics[key].actual + tolerances[key]);
    const reviewRequired = over.length > 0;
    return {
      state: reviewRequired ? "SYNC_BEHIND" : "RECONCILED",
      label: reviewRequired ? "Sync may be behind" : "Evidence reconciled",
      detail: reviewRequired
        ? `Confirmed meal evidence currently exceeds ${source} for ${over.join(", ")}. Refresh the daily total; do not add the meal again.`
        : `Confirmed meals fit inside the ${source} daily total and were not counted twice.`,
      source,
      meals,
      confirmed,
      metrics,
      reviewRequired,
      doubleCountPolicy: "Confirmed meals are context only. The authoritative daily total is used once."
    };
  }

  function buildMealFeedback(meal, input = {}, options = {}) {
    if (!meal?.id || meal.status !== "CONFIRMED") throw new Error("Confirm a meal before rating it.");
    const digestion = ["GOOD", "OK", "POOR"].includes(input.digestion) ? input.digestion : null;
    if (!digestion) throw new Error("Choose how digestion felt.");
    const now = options.now || new Date().toISOString();
    return {
      version: VERSION,
      id: `fuel-feedback:${meal.id}`,
      date: meal.date,
      mealId: meal.id,
      mealName: meal.name || meal.slotLabel || "Meal",
      slotLabel: meal.slotLabel || "Meal",
      hungerAfter: rating(input.hungerAfter, "Hunger"),
      fullness: rating(input.fullness, "Fullness"),
      energy: rating(input.energy, "Energy"),
      cravings: rating(input.cravings, "Cravings"),
      digestion,
      note: String(input.note || "").trim().slice(0, 280) || null,
      createdAt: options.previous?.createdAt || now,
      updatedAt: now
    };
  }

  function average(values = []) {
    const usable = values.map(finite).filter((value) => value !== null);
    return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length * 10) / 10 : null;
  }

  function feedbackSummary(feedback = []) {
    return {
      count: feedback.length,
      hungerAfter: average(feedback.map((item) => item.hungerAfter)),
      fullness: average(feedback.map((item) => item.fullness)),
      energy: average(feedback.map((item) => item.energy)),
      cravings: average(feedback.map((item) => item.cravings)),
      poorDigestion: feedback.filter((item) => item.digestion === "POOR").length
    };
  }

  function recommendation(input = {}) {
    const reconciliation = input.reconciliation || {};
    const latestFeedback = input.latestFeedback || null;
    const metrics = reconciliation.metrics || {};
    if (!Object.values(metrics).some((metric) => metric?.actual !== null)) {
      return {
        code: "CAPTURE_TOTAL",
        headline: "Finish with one daily total",
        detail: "Sync MyFitnessPal or enter the day once. Confirmed meals stay supplemental and will not be added again."
      };
    }
    if (reconciliation.reviewRequired) {
      return {
        code: "REFRESH_EVIDENCE",
        headline: "Refresh the daily total",
        detail: "The meal record appears newer than the daily total. Re-sync instead of entering the meal a second time."
      };
    }
    if (latestFeedback?.digestion === "POOR") {
      return {
        code: "SIMPLIFY_NEXT_MEAL",
        headline: "Simplify the next meal",
        detail: "Use familiar, easier-to-digest foods and keep the approved targets unchanged."
      };
    }
    if (latestFeedback && (latestFeedback.hungerAfter >= 4 || latestFeedback.cravings >= 4 || latestFeedback.fullness <= 2)) {
      return {
        code: "BUILD_SATIETY",
        headline: "Lead with protein and produce",
        detail: "Build more satiety into the next meal without restricting tomorrow or changing the approved target."
      };
    }
    const protein = metrics.protein || {};
    if (protein.target > 0 && protein.remaining > Math.max(20, protein.target * 0.15)) {
      return {
        code: "PROTEIN_FIRST",
        headline: "Put protein in the first meal",
        detail: "Front-load a complete protein serving tomorrow. Keep the approved daily target unchanged."
      };
    }
    const calories = metrics.calories || {};
    if (calories.target > 0 && calories.actual > calories.target * 1.1) {
      return {
        code: "RETURN_TO_PLAN",
        headline: "Return to the plan tomorrow",
        detail: "Do not compensate or restrict. Resume the approved target and record normally."
      };
    }
    return {
      code: "REPEAT_PATTERN",
      headline: "Repeat what worked",
      detail: "Keep today’s meal timing and approved targets. Consistency is the next adjustment."
    };
  }

  function buildFuelLoop(input = {}) {
    const date = isoDate(input.date) || isoDate(input.execution?.date) || new Date().toISOString().slice(0, 10);
    const ledger = normalizeLedger(input.ledger);
    const reconciliation = reconcileDay({ date, execution: input.execution, mealLedger: input.mealLedger });
    const latestMeal = reconciliation.meals[0] || null;
    const feedback = ledger.feedback.filter((item) => item.date === date);
    const latestFeedback = latestMeal ? feedback.find((item) => item.mealId === latestMeal.id) || null : null;
    const closeout = ledger.closeouts.find((item) => item.date === date && item.status === "SEALED") || null;
    const currentMeal = input.mealLedger?.current?.date === date ? input.mealLedger.current : null;
    const hasTargets = Object.values(reconciliation.metrics).some((metric) => metric.target > 0);
    const hasAuthoritative = Object.values(reconciliation.metrics).some((metric) => metric.actual !== null);
    const hour = currentHour(input.now);
    const readyToClose = hasTargets && (hour >= 19 || ["ON PLAN", "REVIEW EVIDENCE"].includes(input.execution?.status) || (latestFeedback && !Object.values(reconciliation.metrics).some((metric) => metric.remaining > 20)));
    const nextRecommendation = recommendation({ reconciliation, latestFeedback });
    let primaryAction;
    if (!hasTargets) primaryAction = { id: "set-baseline", label: "Set baseline", route: "plan" };
    else if (currentMeal?.status === "PLANNED") primaryAction = { id: "confirm-meal", label: "Confirm eaten", route: "meal" };
    else if (latestMeal && !latestFeedback) primaryAction = { id: "rate-meal", label: "Rate this meal", route: "loop-feedback" };
    else if (closeout) primaryAction = { id: "review-closeout", label: "Review closeout", route: "loop" };
    else if (reconciliation.reviewRequired) primaryAction = { id: "review-sync", label: "Review intake", route: "details" };
    else if (readyToClose) primaryAction = { id: "close-fuel", label: "Close Fuel", route: "loop-closeout" };
    else primaryAction = { id: "build-meal", label: "Build next meal", route: "meal" };
    const copy = {
      "set-baseline": ["Set your fueling baseline", "Approve daily targets before Atlas coaches the loop."],
      "confirm-meal": ["Confirm the meal", "Record what you ate. This does not add it to imported daily totals."],
      "rate-meal": ["How did that meal land?", "A 20-second check-in helps Atlas improve tomorrow’s recommendation."],
      "review-closeout": ["Fuel day closed", closeout?.recommendation?.detail || nextRecommendation.detail],
      "review-sync": ["Refresh the nutrition total", reconciliation.detail],
      "close-fuel": ["Close the Fuel day", "Seal today’s evidence and carry one clear action into tomorrow."],
      "build-meal": ["Build the next meal", "Use what remains today. The approved target stays fixed."]
    }[primaryAction.id];
    return {
      version: VERSION,
      date,
      status: closeout ? "DAY CLOSED" : primaryAction.id === "rate-meal" ? "CHECK IN" : primaryAction.id === "close-fuel" ? "CLOSE DAY" : primaryAction.id === "review-sync" ? "REVIEW SYNC" : primaryAction.id === "confirm-meal" ? "CONFIRM MEAL" : primaryAction.id === "set-baseline" ? "SETUP REQUIRED" : "PLAN MEAL",
      headline: copy[0],
      detail: copy[1],
      primaryAction,
      reconciliation,
      latestMeal,
      latestFeedback,
      feedback,
      feedbackSummary: feedbackSummary(feedback),
      closeout,
      recommendation: closeout?.recommendation || nextRecommendation,
      canClose: hasTargets,
      readyToClose,
      hasAuthoritative,
      safeguards: [
        "Imported or manually entered daily totals are authoritative and are never combined with confirmed meals.",
        "Missing intake is incomplete evidence, not noncompliance.",
        "Atlas recommendations never change approved targets without recruit approval."
      ]
    };
  }

  function closeFuelDay(loop, input = {}, options = {}) {
    if (!loop?.date || !loop.canClose) throw new Error("Approve a Fuel baseline before closing the day.");
    const now = options.now || new Date().toISOString();
    const previous = options.previous?.date === loop.date ? options.previous : null;
    return {
      version: VERSION,
      id: `fuel-closeout:${loop.date}`,
      date: loop.date,
      status: "SEALED",
      revision: Math.max(1, Number(previous?.revision || 0) + 1),
      source: loop.reconciliation.source,
      reconciliationState: loop.reconciliation.state,
      authoritativeMetrics: Object.fromEntries(METRICS.map((key) => [key, loop.reconciliation.metrics[key]])),
      confirmedMealCount: loop.reconciliation.meals.length,
      feedbackSummary: loop.feedbackSummary,
      recommendation: loop.recommendation,
      note: String(input.note || "").trim().slice(0, 280) || null,
      evidenceConfidence: loop.hasAuthoritative ? "VERIFIED DAILY TOTAL" : loop.reconciliation.meals.length ? "MEAL EVIDENCE ONLY" : "LIMITED EVIDENCE",
      targetChangePolicy: "No approved target changed.",
      sealedAt: previous?.sealedAt || now,
      updatedAt: now
    };
  }

  function patternScore(items = []) {
    const summary = feedbackSummary(items);
    if (!summary.count) return -Infinity;
    const digestion = items.reduce((sum, item) => sum + (item.digestion === "GOOD" ? 5 : item.digestion === "OK" ? 3 : 1), 0) / items.length;
    return (summary.energy || 0) + (6 - (summary.cravings || 3)) + digestion - Math.abs((summary.fullness || 3) - 3.5);
  }

  function summarizeWeek(value = {}, range = {}) {
    const ledger = normalizeLedger(value);
    const start = isoDate(range.start || range.weekStartDate);
    const end = isoDate(range.end || range.weekEndDate);
    const within = (item) => (!start || item.date >= start) && (!end || item.date <= end);
    const feedback = ledger.feedback.filter(within);
    const closeouts = ledger.closeouts.filter((item) => item.status === "SEALED" && within(item));
    const groups = new Map();
    feedback.forEach((item) => {
      const key = item.slotLabel || item.mealName || "Meal";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    const patterns = [...groups.entries()].map(([label, items]) => ({ label, count: items.length, score: patternScore(items), summary: feedbackSummary(items) })).sort((a, b) => b.score - a.score);
    return {
      version: VERSION,
      feedbackCount: feedback.length,
      closedDays: closeouts.length,
      feedbackSummary: feedbackSummary(feedback),
      bestPattern: patterns[0] || null,
      confidence: feedback.length >= 5 && closeouts.length >= 3 ? "USEFUL" : feedback.length >= 2 ? "EARLY" : "LIMITED",
      recommendation: closeouts[0]?.recommendation || null
    };
  }

  return Object.freeze({
    VERSION,
    normalizeLedger,
    mergeById,
    mealRecords,
    reconcileDay,
    buildMealFeedback,
    feedbackSummary,
    recommendation,
    buildFuelLoop,
    closeFuelDay,
    summarizeWeek
  });
}));
