(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionTrends = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025M.1";
  const VALID_RANGES = Object.freeze([28, 56, 84]);
  const DAY_MS = 86400000;

  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 0) => value === null ? null : Number(Number(value).toFixed(digits));
  const average = (values = []) => {
    const usable = values.map(finite).filter((value) => value !== null);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
  };
  const sum = (values = []) => values.map(finite).filter((value) => value !== null).reduce((total, value) => total + value, 0);
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
    return `${numeric > 0 ? "+" : numeric < 0 ? "-" : ""}${formatted}`;
  };
  const percentChange = (current, prior) => {
    const currentValue = finite(current);
    const priorValue = finite(prior);
    return currentValue === null || priorValue === null || priorValue === 0 ? null : (currentValue - priorValue) / Math.abs(priorValue) * 100;
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

  function weekStart(value) {
    const date = dateOnly(value);
    if (!date) return null;
    const parsed = new Date(`${date}T12:00:00Z`);
    const offset = (parsed.getUTCDay() + 6) % 7;
    return shiftDate(date, -offset);
  }

  function weeklySeries(items = [], valueGetter = (item) => item.value) {
    const weeks = new Map();
    items.forEach((item) => {
      const date = dateOnly(item.date);
      const value = finite(valueGetter(item));
      const key = weekStart(date);
      if (!key || value === null) return;
      weeks.set(key, (weeks.get(key) || 0) + value);
    });
    return [...weeks.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, value]) => ({ date, value: round(value, 1) }));
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

  function sevenDayMetric(rows, endDate, key) {
    const recentStart = shiftDate(endDate, -6);
    const priorStart = shiftDate(endDate, -13);
    const priorEnd = shiftDate(endDate, -7);
    const recentValues = rows.filter((item) => item.date >= recentStart && item.date <= endDate).map((item) => item[key]);
    const priorValues = rows.filter((item) => item.date >= priorStart && item.date <= priorEnd).map((item) => item[key]);
    const current = average(recentValues);
    const prior = average(priorValues);
    return {
      current: round(current, key === "energy" || key === "sleep" ? 1 : 0),
      prior: round(prior, key === "energy" || key === "sleep" ? 1 : 0),
      delta: current !== null && prior !== null ? round(current - prior, key === "energy" || key === "sleep" ? 1 : 0) : null,
      percentDelta: round(percentChange(current, prior), 0),
      recentCount: recentValues.map(finite).filter((value) => value !== null).length,
      priorCount: priorValues.map(finite).filter((value) => value !== null).length
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
    const energy = sevenDayMetric(rows, window.end, "energy");
    const sleep = sevenDayMetric(rows, window.end, "sleep");
    const rhr = sevenDayMetric(rows, window.end, "rhr");
    const hrv = sevenDayMetric(rows, window.end, "hrv");
    const protect = energy.current !== null && energy.current < 5 || rhr.delta !== null && rhr.delta >= 5 || hrv.percentDelta !== null && hrv.percentDelta <= -12;
    const ready = energy.current !== null && energy.current >= 6 && !(rhr.delta !== null && rhr.delta >= 3) && !(hrv.percentDelta !== null && hrv.percentDelta <= -8);
    return {
      value: energy.current,
      delta: energy.delta,
      deltaLabel: energy.delta === null ? "Needs two 7-day windows" : `${signed(energy.delta, 1)} vs prior 7d`,
      observations: window.current.filter((item) => item.energy !== null).length,
      sleepAverage: sleep.current,
      sleepDelta: sleep.delta,
      rhrAverage: rhr.current,
      rhrDelta: rhr.delta,
      hrvAverage: hrv.current,
      hrvDelta: hrv.delta,
      hrvPercentDelta: hrv.percentDelta,
      state: protect ? "PROTECT" : ready ? "READY" : energy.current === null ? "LEARNING" : "WATCH",
      series: window.current.filter((item) => item.energy !== null).map((item) => ({ date: item.date, value: item.energy })),
      sleepSeries: window.current.filter((item) => item.sleep !== null).map((item) => ({ date: item.date, value: item.sleep })),
      rhrSeries: window.current.filter((item) => item.rhr !== null).map((item) => ({ date: item.date, value: item.rhr })),
      hrvSeries: window.current.filter((item) => item.hrv !== null).map((item) => ({ date: item.date, value: item.hrv })),
      tone: protect ? "negative" : ready ? "positive" : energy.current === null ? "neutral" : "steady"
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

  function durationSeconds(metrics = {}) {
    const seconds = finite(metrics.duration_seconds ?? metrics.elapsed_seconds ?? metrics.moving_time ?? metrics.durationSeconds);
    if (seconds !== null && seconds >= 0) return seconds;
    const minutes = finite(metrics.duration_minutes ?? metrics.durationMinutes);
    return minutes !== null && minutes >= 0 ? minutes * 60 : 0;
  }

  function normalizeStrengthExecution(item = {}) {
    const setLogs = item.setLogs && typeof item.setLogs === "object" ? item.setLogs : {};
    const sets = Object.values(setLogs).flat().filter((setItem) => String(setItem.kind || "WORK").toUpperCase() !== "WARMUP" && finite(setItem.reps) !== null && Number(setItem.reps) > 0);
    return {
      id: item.id || `${dateOnly(item.date || item.completedAt || item.updatedAt) || "undated"}:${item.sessionId || item.sessionSnapshot?.sessionId || "strength"}:${item.attempt || 1}`,
      date: dateOnly(item.date || item.completedAt || item.updatedAt),
      state: String(item.state || item.status || "").toUpperCase(),
      pain: Boolean(item.painReported),
      sets,
      volume: sets.reduce((total, setItem) => total + Number(setItem.load || 0) * Number(setItem.reps || 0), 0),
      rpeValues: sets.map((setItem) => finite(setItem.rpe)).filter((value) => value !== null)
    };
  }

  function summarizeStrengthWorkload(history = [], endDate, rangeDays) {
    const executions = history.map(normalizeStrengthExecution).filter((item) => item.date && ["COMPLETE", "PARTIAL", "STOPPED"].includes(item.state));
    const window = splitRange(executions, endDate, rangeDays);
    const stats = (items) => {
      const sets = items.flatMap((item) => item.sets);
      const complete = items.filter((item) => item.state === "COMPLETE").length;
      return {
        sessions: items.length,
        complete,
        workSets: sets.length,
        volume: sum(items.map((item) => item.volume)),
        averageRpe: average(items.flatMap((item) => item.rpeValues)),
        completionRate: items.length ? complete / items.length * 100 : null,
        painOrStops: items.filter((item) => item.pain || item.state === "STOPPED").length
      };
    };
    const current = stats(window.current);
    const prior = stats(window.prior);
    const volumeDelta = percentChange(current.volume, prior.volume);
    const series = weeklySeries(window.current, (item) => item.volume);
    const trajectory = current.sessions < 2 || current.workSets < 3
      ? "LEARNING"
      : current.painOrStops
        ? "PROTECT"
        : volumeDelta === null
          ? "ESTABLISHING"
          : volumeDelta > 10
            ? "BUILDING"
            : volumeDelta < -15
              ? "LOWER LOAD"
              : "STEADY";
    return {
      sessions: current.sessions,
      workSets: current.workSets,
      volume: round(current.volume, 0),
      volumeDelta: round(volumeDelta, 0),
      averageRpe: round(current.averageRpe, 1),
      completionRate: round(current.completionRate, 0),
      painOrStops: current.painOrStops,
      trajectory,
      priorVolume: round(prior.volume, 0),
      series
    };
  }

  function summarizeTraining(performanceEntries = [], strengthHistory = [], coreHistory = [], endDate, rangeDays) {
    const performance = performanceEntries.map(normalizePerformanceEntry).filter((item) => item.date);
    const nativeStrength = strengthHistory.map(normalizeStrengthExecution).filter((item) => item.date && ["COMPLETE", "PARTIAL", "STOPPED"].includes(item.state));
    const nativeCore = coreHistory.map((item) => ({
      date: dateOnly(item.date || item.completedAt || item.updatedAt),
      domain: "core",
      state: String(item.state || item.status || "").toUpperCase(),
      duration: item.startedAt && item.completedAt ? Math.max(0, (Date.parse(item.completedAt) - Date.parse(item.startedAt)) / 1000) : 0
    })).filter((item) => item.date && !["READY", "IN_PROGRESS", "DRAFT"].includes(item.state));
    const sessionEvidence = [
      ...performance,
      ...nativeStrength.map((item) => ({ ...item, domain: "strength", metrics: {} })),
      ...nativeCore.map((item) => ({ ...item, metrics: { duration_seconds: item.duration } }))
    ];
    const window = splitRange(sessionEvidence, endDate, rangeDays);
    const countDomainDates = (items, domain) => uniqueDates(items.filter((item) => item.domain === domain)).size;
    const currentRuns = window.current.filter((item) => item.domain === "running");
    const priorRuns = window.prior.filter((item) => item.domain === "running");
    const runMiles = sum(currentRuns.map((item) => distanceMiles(item.metrics)));
    const priorRunMiles = sum(priorRuns.map((item) => distanceMiles(item.metrics)));
    const runSeconds = sum(currentRuns.map((item) => durationSeconds(item.metrics)));
    const priorRunSeconds = sum(priorRuns.map((item) => durationSeconds(item.metrics)));
    const runPace = runMiles > 0 && runSeconds > 0 ? runSeconds / runMiles : null;
    const priorRunPace = priorRunMiles > 0 && priorRunSeconds > 0 ? priorRunSeconds / priorRunMiles : null;
    const performanceCore = window.current.filter((item) => item.domain === "core");
    const coreSeconds = sum(performanceCore.map((item) => durationSeconds(item.metrics)));
    const strength = summarizeStrengthWorkload(strengthHistory, endDate, rangeDays);
    const strengthDates = countDomainDates(window.current, "strength");
    const priorStrengthDates = countDomainDates(window.prior, "strength");
    const totalDates = uniqueDates(window.current.filter((item) => ["strength", "running", "core", "conditioning"].includes(item.domain))).size;
    return {
      strengthSessions: strengthDates,
      strengthDelta: strengthDates - priorStrengthDates,
      strength,
      runSessions: countDomainDates(window.current, "running"),
      runMiles: round(runMiles, 1),
      runDelta: round(percentChange(runMiles, priorRunMiles), 0),
      runPaceSeconds: round(runPace, 0),
      runPaceDeltaSeconds: runPace !== null && priorRunPace !== null ? round(runPace - priorRunPace, 0) : null,
      runSeries: weeklySeries(currentRuns, (item) => distanceMiles(item.metrics)),
      coreSessions: countDomainDates(window.current, "core"),
      coreMinutes: round(coreSeconds / 60, 0),
      coreSeries: weeklySeries(performanceCore, (item) => durationSeconds(item.metrics) / 60),
      conditioningSessions: countDomainDates(window.current, "conditioning"),
      totalSessionDays: totalDates,
      observations: window.current.length,
      tone: strength.trajectory === "PROTECT" ? "negative" : totalDates ? "positive" : "neutral"
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
    const scoreDay = (item) => targetCalories !== null && targetProtein !== null && item.calories / targetCalories >= 0.8 && item.calories / targetCalories <= 1.2 && item.protein / targetProtein >= 0.85 ? 100 : 0;
    const adherence = (items) => {
      if (!items.length || targetCalories === null || targetProtein === null) return null;
      return average(items.map(scoreDay));
    };
    const current = adherence(window.current);
    const prior = adherence(window.prior);
    const delta = current !== null && prior !== null ? current - prior : null;
    const targetReady = targetCalories !== null && targetProtein !== null;
    const coverage = round(window.current.length / normalizeRangeDays(rangeDays) * 100, 0);
    const deltaLabel = !targetReady
      ? "Approved targets required"
      : !window.current.length
        ? "No complete Fuel days"
        : delta === null
          ? `${window.current.length} complete day${window.current.length === 1 ? "" : "s"} - comparison building`
          : `${signed(delta)} pts vs prior window`;
    return {
      value: round(current, 0),
      delta: round(delta, 0),
      deltaLabel,
      evidenceDays: window.current.length,
      averageCalories: round(average(window.current.map((item) => item.calories)), 0),
      averageProtein: round(average(window.current.map((item) => item.protein)), 0),
      coverage,
      targetsReady: targetReady,
      series: targetReady ? window.current.map((item) => ({ date: item.date, value: scoreDay(item) })) : [],
      state: current === null ? "LEARNING" : current >= 80 ? "ON TARGET" : current >= 60 ? "WATCH" : "CONSTRAINT",
      tone: current === null ? "neutral" : current >= 80 ? "positive" : current >= 60 ? "steady" : "negative"
    };
  }

  function summarizeWeight(dailyStates = [], endDate, rangeDays) {
    const rows = dailyStates.map((item) => ({ date: dateOnly(item.date), value: finite(item.weight) }))
      .filter((item) => item.date && item.value !== null && item.value > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    const window = splitRange(rows, endDate, rangeDays);
    const current = [...window.current].sort((a, b) => a.date.localeCompare(b.date));
    const latest = current.at(-1) || null;
    const earliest = current[0] || null;
    const rawChange = latest && earliest && latest.date !== earliest.date ? latest.value - earliest.value : null;
    const openingEnd = shiftDate(window.currentStart, 6);
    const closingStart = shiftDate(window.end, -6);
    const opening = current.filter((item) => item.date >= window.currentStart && item.date <= openingEnd);
    const closing = current.filter((item) => item.date >= closingStart && item.date <= window.end);
    const openingAverage = opening.length >= 2 ? average(opening.map((item) => item.value)) : null;
    const closingAverage = closing.length >= 2 ? average(closing.map((item) => item.value)) : null;
    const trendChange = openingAverage !== null && closingAverage !== null && openingEnd < closingStart ? closingAverage - openingAverage : rawChange;
    const elapsedDays = earliest && latest ? Math.max(1, Math.round((Date.parse(`${latest.date}T12:00:00Z`) - Date.parse(`${earliest.date}T12:00:00Z`)) / DAY_MS)) : null;
    const weeklyRate = trendChange !== null && elapsedDays ? trendChange / elapsedDays * 7 : null;
    return {
      value: latest ? round(latest.value, 1) : null,
      average: round(closingAverage ?? average(current.slice(-Math.min(7, current.length)).map((item) => item.value)), 1),
      change: round(rawChange, 1),
      trendChange: round(trendChange, 1),
      weeklyRate: round(weeklyRate, 2),
      changeLabel: trendChange === null ? "Needs two weigh-ins" : `${signed(trendChange, 1)} lb trend in ${normalizeRangeDays(rangeDays)}d`,
      observations: current.length,
      latestDate: latest?.date || null,
      series: current,
      tone: "neutral"
    };
  }

  function bodyMeasurementFoundation(performanceEntries = []) {
    const supported = ["waist", "neck", "chest", "hips", "arm", "thigh", "body_fat"];
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

  function outcomeCard(id, label, status, value, detail, tone, evidence) {
    return { id, label, status, value, detail, tone, evidence };
  }

  function chooseCoachingReadout(model) {
    const { discipline, readiness, nutrition, training, bodyComposition, evidence } = model;
    let signal = "Build the signal";
    let detail = "Complete today's inputs so Atlas can separate progress from noise.";
    let action = { label: "Complete today", section: "today" };
    if (evidence.score >= 40 && discipline.value !== null && discipline.observations >= 2) {
      signal = discipline.tone === "positive" ? "The standard is rising" : discipline.tone === "negative" ? "Execution is slipping" : "Execution is holding";
      detail = `${Math.round(discipline.value)}% discipline - ${discipline.deltaLabel.toLowerCase()}.`;
      action = discipline.tone === "negative" ? { label: "Open Review", section: "inspection" } : { label: "Stay on plan", section: "today" };
    }
    if (training.strength.trajectory === "PROTECT" || readiness.state === "PROTECT") {
      signal = "Protect recovery";
      detail = training.strength.trajectory === "PROTECT" ? "Pain or a stopped Strength session is present in this window." : "The latest recovery window moved beyond its guardrail.";
      action = { label: "Review today", section: "today" };
    } else if (nutrition.value !== null && nutrition.evidenceDays >= 3 && nutrition.value < 60) {
      signal = "Fuel is the constraint";
      detail = `${nutrition.value}% of complete days met the approved calorie and protein range.`;
      action = { label: "Open Fuel", section: "nutrition" };
    } else if (bodyComposition?.decision?.code === "REVIEW_ADJUSTMENT" && readiness.state !== "PROTECT") {
      signal = "Outcome needs review";
      detail = bodyComposition.decision.detail;
      action = { label: "Open Body", section: "trends", view: "body" };
    } else if (training.strength.trajectory === "BUILDING") {
      signal = "Strength workload is building";
      detail = `${signed(training.strength.volumeDelta)}% work volume versus the prior ${model.rangeLabel.toLowerCase()} window.`;
      action = { label: "Open Training", section: "trends", view: "training" };
    }
    const win = discipline.tone === "positive"
      ? `Discipline ${discipline.deltaLabel.toLowerCase()}`
      : training.strength.trajectory === "BUILDING"
        ? `Strength volume ${signed(training.strength.volumeDelta)}%`
        : training.totalSessionDays
          ? `${training.totalSessionDays} active day${training.totalSessionDays === 1 ? "" : "s"}`
          : "No win claimed yet";
    const watch = readiness.state === "PROTECT"
      ? "Recovery guardrail triggered"
      : training.strength.trajectory === "PROTECT"
        ? "Strength pain or stop evidence"
        : nutrition.value !== null && nutrition.value < 80
          ? `Fuel adherence ${nutrition.value}%`
          : discipline.evidence !== null && discipline.evidence < 60
            ? `Evidence ${discipline.evidence}%`
            : "No major risk signal";
    return { signal, detail, win, watch, next: action.label, action };
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
    const evidenceSources = [discipline.observations >= 2, readiness.observations >= 3, training.observations >= 1, nutrition.evidenceDays >= 3, weight.observations >= 2];
    const evidenceScore = Math.round(evidenceSources.filter(Boolean).length / evidenceSources.length * 100);
    const evidence = {
      score: evidenceScore,
      label: evidenceScore >= 80 ? "STRONG" : evidenceScore >= 60 ? "USABLE" : evidenceScore >= 40 ? "LIMITED" : "LEARNING",
      sourceCount: evidenceSources.filter(Boolean).length,
      possibleSources: evidenceSources.length
    };
    const base = { discipline, readiness, training, nutrition, weight, bodyComposition, evidence, rangeLabel: `${rangeDays / 7} weeks` };
    const coaching = chooseCoachingReadout(base);
    const scorecards = [
      outcomeCard("execution", "Execution", discipline.observations >= 2 ? (discipline.tone === "positive" ? "RISING" : discipline.tone === "negative" ? "SLIPPING" : "HOLDING") : "LEARNING", discipline.value === null ? "-" : `${Math.round(discipline.value)}%`, discipline.deltaLabel, discipline.tone, `${discipline.observations} finalized weeks`),
      outcomeCard("training", "Training", training.strength.trajectory, training.totalSessionDays ? `${training.totalSessionDays} days` : "-", `${training.strength.workSets} Strength work sets - ${training.runMiles} run miles`, training.tone, `${training.observations} recorded training items`),
      outcomeCard("recovery", "Recovery", readiness.state, readiness.value === null ? "-" : `${readiness.value}/10`, readiness.deltaLabel, readiness.tone, `${readiness.observations} Roll Calls`),
      outcomeCard("fuel", "Fuel", nutrition.state, nutrition.value === null ? "-" : `${nutrition.value}%`, nutrition.deltaLabel, nutrition.tone, `${nutrition.evidenceDays} complete days - ${nutrition.coverage}% coverage`),
      outcomeCard("body", "Body", weight.observations >= 2 ? "TRENDING" : "BASELINE", weight.value === null ? "-" : `${weight.value} lb`, weight.changeLabel, "neutral", `${weight.observations} weigh-ins`)
    ];
    return {
      version: VERSION,
      rangeDays,
      rangeLabel: `${rangeDays / 7} weeks`,
      startDate: shiftDate(today, -(rangeDays - 1)),
      endDate: today,
      evidence,
      discipline,
      readiness,
      training,
      nutrition,
      weight,
      measurements,
      bodyComposition,
      coaching,
      scorecards,
      kpis: [
        kpiCard("discipline", "Discipline", discipline.value, "%", discipline.deltaLabel, discipline.tone, `${discipline.observations} finalized week${discipline.observations === 1 ? "" : "s"}`, discipline.series),
        kpiCard("readiness", "Readiness", readiness.value, "/10", readiness.deltaLabel, readiness.tone, `${readiness.observations} roll call${readiness.observations === 1 ? "" : "s"}`, readiness.series),
        kpiCard("strength", "Strength", training.strengthSessions, " days", `${signed(training.strengthDelta)} vs prior window`, training.strengthSessions ? "positive" : "neutral", `${training.strength.workSets} recorded work sets`, training.strength.series),
        kpiCard("running", "Running", training.runMiles, " mi", training.runDelta === null ? `${training.runSessions} recorded run${training.runSessions === 1 ? "" : "s"}` : `${signed(training.runDelta)}% volume`, training.runSessions ? "positive" : "neutral", `${training.runSessions} run day${training.runSessions === 1 ? "" : "s"}`, training.runSeries),
        kpiCard("nutrition", "Fuel", nutrition.value, "%", nutrition.deltaLabel, nutrition.tone, `${nutrition.evidenceDays} complete day${nutrition.evidenceDays === 1 ? "" : "s"}`, nutrition.series),
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
    summarizeStrengthWorkload,
    summarizeTraining,
    summarizeNutrition,
    summarizeWeight,
    bodyMeasurementFoundation,
    buildProgramTrendModel
  };
});
