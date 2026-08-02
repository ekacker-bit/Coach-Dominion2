(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionTrends = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021L.1";
  const VALID_RANGES = Object.freeze([28, 56, 84]);
  const DAY_MS = 86400000;

  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 0) => value === null ? null : Number(Number(value).toFixed(digits));
  const average = (values = []) => {
    const usable = values.map(finite).filter((value) => value !== null);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
  };
  const dateOnly = (value) => {
    if (!value) return null;
    const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  };
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    if (!date) return null;
    return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
  };
  const uniqueDates = (items = []) => new Set(items.map((item) => dateOnly(item.date)).filter(Boolean));
  const signed = (value, digits = 0) => {
    const numeric = finite(value);
    if (numeric === null) return null;
    const formatted = Number(Math.abs(numeric).toFixed(digits));
    return `${numeric > 0 ? "+" : numeric < 0 ? "−" : ""}${formatted}`;
  };

  function normalizeRangeDays(value) {
    const numeric = Number(value);
    return VALID_RANGES.includes(numeric) ? numeric : 28;
  }

  function splitRange(items = [], endDate, rangeDays, getter = (item) => item.date) {
    const end = dateOnly(endDate);
    const days = normalizeRangeDays(rangeDays);
    const currentStart = shiftDate(end, -(days - 1));
    const priorStart = shiftDate(currentStart, -days);
    const priorEnd = shiftDate(currentStart, -1);
    const normalized = items.map((item) => ({ item, date: dateOnly(getter(item)) })).filter((entry) => entry.date && entry.date <= end);
    return {
      current: normalized.filter((entry) => entry.date >= currentStart).map((entry) => entry.item),
      prior: normalized.filter((entry) => entry.date >= priorStart && entry.date <= priorEnd).map((entry) => entry.item),
      currentStart,
      priorStart,
      priorEnd,
      end
    };
  }

  function normalizeInspection(item = {}) {
    return {
      date: dateOnly(item.weekStartDate || item.week_start_date),
      score: finite(item.score ?? item.weeklyDisciplineScore ?? item.weekly_discipline_score),
      evidence: finite(item.evidenceCoverage ?? item.evidence_coverage),
      domains: item.domainScores || item.domain_scores || {},
      finalizedAt: item.finalizedAt || item.finalized_at || null
    };
  }

  function summarizeDiscipline(inspections = [], endDate, rangeDays) {
    const finalized = inspections.map(normalizeInspection)
      .filter((item) => item.date && item.finalizedAt && item.score !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    const window = splitRange(finalized, endDate, rangeDays);
    const current = window.current;
    const latest = current.at(-1) || null;
    const prior = current.at(-2) || finalized.filter((item) => item.date < window.currentStart).at(-1) || null;
    const delta = latest && prior ? latest.score - prior.score : null;
    const evidence = average(current.map((item) => item.evidence));
    return {
      value: latest?.score ?? null,
      delta: round(delta, 0),
      deltaLabel: delta === null ? "Needs two finalized weeks" : `${signed(delta)} pts vs prior week`,
      evidence: round(evidence, 0),
      observations: current.length,
      series: current.map((item) => ({ date: item.date, value: item.score, evidence: item.evidence })),
      tone: delta === null ? "neutral" : delta >= 2 ? "positive" : delta <= -2 ? "negative" : "steady"
    };
  }

  function summarizeReadiness(dailyStates = [], endDate, rangeDays) {
    const rows = dailyStates.map((item) => ({
      date: dateOnly(item.date),
      energy: finite(item.energy),
      soreness: finite(item.soreness),
      sleep: finite(item.sleep),
      rhr: finite(item.resting_heart_rate ?? item.restingHeartRate),
      hrv: finite(item.heart_rate_variability ?? item.heartRateVariability)
    })).filter((item) => item.date);
    const window = splitRange(rows, endDate, rangeDays);
    const current = window.current;
    const recentStart = shiftDate(window.end, -6);
    const priorStart = shiftDate(window.end, -13);
    const priorEnd = shiftDate(window.end, -7);
    const recent = rows.filter((item) => item.date >= recentStart && item.date <= window.end);
    const prior = rows.filter((item) => item.date >= priorStart && item.date <= priorEnd);
    const recentEnergy = average(recent.map((item) => item.energy));
    const priorEnergy = average(prior.map((item) => item.energy));
    const delta = recentEnergy !== null && priorEnergy !== null ? recentEnergy - priorEnergy : null;
    return {
      value: round(recentEnergy, 1),
      delta: round(delta, 1),
      deltaLabel: delta === null ? "Needs two 7-day windows" : `${signed(delta, 1)} vs prior 7d`,
      observations: current.filter((item) => item.energy !== null).length,
      sleepAverage: round(average(current.map((item) => item.sleep)), 1),
      rhrAverage: round(average(current.map((item) => item.rhr)), 0),
      hrvAverage: round(average(current.map((item) => item.hrv)), 0),
      series: current.filter((item) => item.energy !== null).map((item) => ({ date: item.date, value: item.energy })),
      tone: delta === null ? "neutral" : delta >= 0.5 ? "positive" : delta <= -0.5 ? "negative" : "steady"
    };
  }

  function normalizePerformanceEntry(item = {}) {
    return {
      date: dateOnly(item.performanceDate || item.performance_date || item.date || item.completedAt),
      domain: String(item.domain || "").toLowerCase(),
      metrics: item.metrics || {},
      state: String(item.state || item.status || "").toUpperCase()
    };
  }

  function distanceMiles(metrics = {}) {
    const value = finite(metrics.distance);
    if (value === null || value <= 0) return 0;
    const unit = String(metrics.distance_unit || metrics.distanceUnit || "mi").toLowerCase();
    if (unit.startsWith("km")) return value * 0.621371;
    if (unit.startsWith("m") && !unit.startsWith("mi")) return value / 1609.344;
    return value;
  }

  function summarizeTraining(performanceEntries = [], strengthHistory = [], coreHistory = [], endDate, rangeDays) {
    const performance = performanceEntries.map(normalizePerformanceEntry).filter((item) => item.date);
    const nativeStrength = strengthHistory.map((item) => ({
      date: dateOnly(item.date || item.completedAt), domain: "strength", metrics: {}, state: String(item.state || "").toUpperCase()
    })).filter((item) => item.date && ["COMPLETE", "PARTIAL", "STOPPED"].includes(item.state));
    const nativeCore = coreHistory.map((item) => ({
      date: dateOnly(item.date || item.completedAt), domain: "core", metrics: {}, state: String(item.state || item.status || "").toUpperCase()
    })).filter((item) => item.date && !["READY", "IN_PROGRESS", "DRAFT"].includes(item.state));
    const window = splitRange([...performance, ...nativeStrength, ...nativeCore], endDate, rangeDays);
    const countDomainDates = (items, domain) => uniqueDates(items.filter((item) => item.domain === domain)).size;
    const currentRunEntries = window.current.filter((item) => item.domain === "running");
    const priorRunEntries = window.prior.filter((item) => item.domain === "running");
    const runMiles = currentRunEntries.reduce((sum, item) => sum + distanceMiles(item.metrics), 0);
    const priorRunMiles = priorRunEntries.reduce((sum, item) => sum + distanceMiles(item.metrics), 0);
    const runDelta = priorRunMiles > 0 ? ((runMiles - priorRunMiles) / priorRunMiles) * 100 : null;
    const strengthDates = countDomainDates(window.current, "strength");
    const priorStrengthDates = countDomainDates(window.prior, "strength");
    const totalDates = uniqueDates(window.current.filter((item) => ["strength", "running", "core", "conditioning"].includes(item.domain))).size;
    return {
      strengthSessions: strengthDates,
      strengthDelta: strengthDates - priorStrengthDates,
      runSessions: countDomainDates(window.current, "running"),
      runMiles: round(runMiles, 1),
      runDelta: round(runDelta, 0),
      coreSessions: countDomainDates(window.current, "core"),
      conditioningSessions: countDomainDates(window.current, "conditioning"),
      totalSessionDays: totalDates,
      observations: window.current.length,
      tone: totalDates ? "positive" : "neutral"
    };
  }

  function summarizeNutrition(days = [], targets = {}, endDate, rangeDays) {
    const approvedTargets = targets || {};
    const rows = days.map((item) => ({
      date: dateOnly(item.date || item.nutrition_date),
      calories: finite(item.calories),
      protein: finite(item.protein)
    })).filter((item) => item.date && item.calories !== null && item.protein !== null);
    const window = splitRange(rows, endDate, rangeDays);
    const targetCalories = finite(approvedTargets.calories);
    const targetProtein = finite(approvedTargets.protein);
    const adherence = (items) => {
      if (!items.length || targetCalories === null || targetProtein === null) return null;
      return items.filter((item) => item.calories / targetCalories >= 0.8 && item.calories / targetCalories <= 1.2 && item.protein / targetProtein >= 0.85).length / items.length * 100;
    };
    const current = adherence(window.current);
    const prior = adherence(window.prior);
    const delta = current !== null && prior !== null ? current - prior : null;
    return {
      value: round(current, 0),
      delta: round(delta, 0),
      deltaLabel: delta === null ? "Needs targets and prior evidence" : `${signed(delta)} pts vs prior window`,
      evidenceDays: window.current.length,
      averageCalories: round(average(window.current.map((item) => item.calories)), 0),
      averageProtein: round(average(window.current.map((item) => item.protein)), 0),
      coverage: round(window.current.length / normalizeRangeDays(rangeDays) * 100, 0),
      tone: current === null ? "neutral" : current >= 80 ? "positive" : current >= 60 ? "steady" : "negative"
    };
  }

  function summarizeWeight(dailyStates = [], endDate, rangeDays) {
    const rows = dailyStates.map((item) => ({ date: dateOnly(item.date), value: finite(item.weight) }))
      .filter((item) => item.date && item.value !== null && item.value > 0);
    const window = splitRange(rows, endDate, rangeDays);
    const current = [...window.current].sort((a, b) => a.date.localeCompare(b.date));
    const latest = current.at(-1) || null;
    const earliest = current[0] || null;
    const change = latest && earliest && latest.date !== earliest.date ? latest.value - earliest.value : null;
    return {
      value: latest ? round(latest.value, 1) : null,
      change: round(change, 1),
      changeLabel: change === null ? "Needs two weigh-ins" : `${signed(change, 1)} lb in ${normalizeRangeDays(rangeDays)}d`,
      observations: current.length,
      latestDate: latest?.date || null,
      series: current,
      tone: "neutral"
    };
  }

  function bodyMeasurementFoundation(performanceEntries = []) {
    const supported = ["waist", "chest", "hips", "arm", "thigh", "body_fat"];
    const series = Object.fromEntries(supported.map((key) => [key, []]));
    performanceEntries.map(normalizePerformanceEntry).filter((item) => item.domain === "body_metrics").forEach((item) => {
      supported.forEach((key) => {
        const value = finite(item.metrics[key]);
        if (item.date && value !== null) series[key].push({ date: item.date, value });
      });
    });
    return {
      state: Object.values(series).some((items) => items.length) ? "AVAILABLE" : "CAPTURE NOT YET ENABLED",
      supported,
      series
    };
  }

  function kpiCard(id, label, value, suffix, deltaLabel, tone, evidence, series = []) {
    return { id, label, value, suffix, deltaLabel, tone, evidence, series };
  }

  function chooseCoachingReadout(model) {
    const { discipline, readiness, nutrition, training, weight, bodyComposition } = model;
    let signal = "Build the signal";
    let detail = "Complete today’s inputs so Atlas can distinguish progress from noise.";
    let action = { label: "Complete today", section: "today" };
    if (discipline.value !== null && discipline.observations >= 2) {
      signal = discipline.tone === "positive" ? "The standard is rising" : discipline.tone === "negative" ? "Execution is slipping" : "Execution is holding";
      detail = `${Math.round(discipline.value)}% discipline · ${discipline.deltaLabel.toLowerCase()}.`;
      action = discipline.tone === "negative" ? { label: "Open inspection", section: "inspection" } : { label: "Stay on plan", section: "today" };
    }
    if (nutrition.value !== null && nutrition.value < 60) {
      signal = "Fuel is the constraint";
      detail = `${nutrition.value}% of logged days met the approved calorie and protein range.`;
      action = { label: "Open Fuel", section: "nutrition" };
    }
    if (readiness.value !== null && readiness.value < 5) {
      signal = "Recovery needs protection";
      detail = `${readiness.value}/10 average energy over the latest seven-day window.`;
      action = { label: "Review today", section: "today" };
    }
    if (bodyComposition?.decision?.code === "REVIEW_ADJUSTMENT" && (readiness.value === null || readiness.value >= 5)) {
      signal = "Outcome needs a review";
      detail = bodyComposition.decision.detail;
      action = { label: "Open Body", section: "trends" };
    }
    const win = discipline.tone === "positive"
      ? `Discipline ${discipline.deltaLabel.toLowerCase()}`
      : training.totalSessionDays
        ? `${training.totalSessionDays} active day${training.totalSessionDays === 1 ? "" : "s"}`
        : "No win claimed yet";
    const watch = readiness.value !== null && readiness.value < 5
      ? `Energy ${readiness.value}/10`
      : bodyComposition?.decision?.code === "REVIEW_ADJUSTMENT"
        ? bodyComposition.decision.headline
      : nutrition.value !== null && nutrition.value < 80
        ? `Fuel adherence ${nutrition.value}%`
        : discipline.evidence !== null && discipline.evidence < 60
          ? `Evidence ${discipline.evidence}%`
          : "No major risk signal";
    return {
      signal,
      detail,
      win,
      watch,
      next: action.label,
      action
    };
  }

  function buildProgramTrendModel(input = {}) {
    const today = dateOnly(input.today) || new Date().toISOString().slice(0, 10);
    const rangeDays = normalizeRangeDays(input.rangeDays);
    const dailyStates = Array.isArray(input.dailyStates) ? input.dailyStates : [];
    const performanceEntries = Array.isArray(input.performanceEntries) ? input.performanceEntries : [];
    const discipline = summarizeDiscipline(input.inspections || [], today, rangeDays);
    const readiness = summarizeReadiness(dailyStates, today, rangeDays);
    const training = summarizeTraining(performanceEntries, input.strengthHistory || [], input.coreHistory || [], today, rangeDays);
    const nutrition = summarizeNutrition(input.nutritionDays || [], input.nutritionTargets || {}, today, rangeDays);
    const weight = summarizeWeight(dailyStates, today, rangeDays);
    const bodyComposition = input.bodyComposition || null;
    const measurements = bodyComposition?.measurements || bodyMeasurementFoundation(performanceEntries);
    const base = { discipline, readiness, training, nutrition, weight, bodyComposition };
    const coaching = chooseCoachingReadout(base);
    const evidenceSources = [discipline.observations >= 2, readiness.observations >= 3, training.observations >= 1, nutrition.evidenceDays >= 3, weight.observations >= 2];
    const evidenceScore = Math.round(evidenceSources.filter(Boolean).length / evidenceSources.length * 100);
    return {
      version: VERSION,
      rangeDays,
      rangeLabel: `${rangeDays / 7} weeks`,
      startDate: shiftDate(today, -(rangeDays - 1)),
      endDate: today,
      evidence: {
        score: evidenceScore,
        label: evidenceScore >= 80 ? "STRONG" : evidenceScore >= 60 ? "USABLE" : evidenceScore >= 40 ? "LIMITED" : "LEARNING",
        sourceCount: evidenceSources.filter(Boolean).length,
        possibleSources: evidenceSources.length
      },
      discipline,
      readiness,
      training,
      nutrition,
      weight,
      measurements,
      bodyComposition,
      coaching,
      kpis: [
        kpiCard("discipline", "Discipline", discipline.value, "%", discipline.deltaLabel, discipline.tone, `${discipline.observations} finalized week${discipline.observations === 1 ? "" : "s"}`, discipline.series),
        kpiCard("readiness", "Readiness", readiness.value, "/10", readiness.deltaLabel, readiness.tone, `${readiness.observations} roll call${readiness.observations === 1 ? "" : "s"}`, readiness.series),
        kpiCard("strength", "Strength", training.strengthSessions, " days", `${signed(training.strengthDelta)} vs prior window`, training.strengthSessions ? "positive" : "neutral", "Completed or recorded sessions"),
        kpiCard("running", "Running", training.runMiles, " mi", training.runDelta === null ? `${training.runSessions} recorded run${training.runSessions === 1 ? "" : "s"}` : `${signed(training.runDelta)}% volume`, training.runSessions ? "positive" : "neutral", `${training.runSessions} run day${training.runSessions === 1 ? "" : "s"}`),
        kpiCard("nutrition", "Fuel", nutrition.value, "%", nutrition.deltaLabel, nutrition.tone, `${nutrition.evidenceDays} complete day${nutrition.evidenceDays === 1 ? "" : "s"}`),
        kpiCard("weight", "Weight", weight.value, " lb", weight.changeLabel, weight.tone, `${weight.observations} weigh-in${weight.observations === 1 ? "" : "s"}`, weight.series)
      ]
    };
  }

  return {
    VERSION,
    VALID_RANGES,
    normalizeRangeDays,
    splitRange,
    summarizeDiscipline,
    summarizeReadiness,
    summarizeTraining,
    summarizeNutrition,
    summarizeWeight,
    bodyMeasurementFoundation,
    buildProgramTrendModel
  };
});
