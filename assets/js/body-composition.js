(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBodyComposition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "021K.1";
  const DAY_MS = 86400000;
  const CIRCUMFERENCE_KEYS = Object.freeze(["waist", "chest", "hips", "arm", "thigh"]);
  const METRICS = Object.freeze([
    { key: "waist", label: "Waist", unit: "circumference" },
    { key: "chest", label: "Chest", unit: "circumference" },
    { key: "hips", label: "Hips", unit: "circumference" },
    { key: "arm", label: "Arm", unit: "circumference" },
    { key: "thigh", label: "Thigh", unit: "circumference" },
    { key: "body_fat", label: "Body fat", unit: "%" }
  ]);

  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 1) => value === null ? null : Number(Number(value).toFixed(digits));
  const average = (values = []) => {
    const usable = values.map(finite).filter((value) => value !== null);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
  };
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    return date ? new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
  };
  const signed = (value, digits = 1) => {
    const numeric = finite(value);
    if (numeric === null) return "—";
    return `${numeric > 0 ? "+" : numeric < 0 ? "−" : ""}${Math.abs(numeric).toFixed(digits).replace(/\.0$/, "")}`;
  };

  function normalizeUnit(value) {
    return String(value || "in").toLowerCase() === "cm" ? "cm" : "in";
  }

  function circumferenceInches(value, unit) {
    const numeric = finite(value);
    if (numeric === null) return null;
    return normalizeUnit(unit) === "cm" ? numeric / 2.54 : numeric;
  }

  function displayCircumference(valueInches, unit) {
    const numeric = finite(valueInches);
    if (numeric === null) return null;
    return round(normalizeUnit(unit) === "cm" ? numeric * 2.54 : numeric, 1);
  }

  function normalizeBodyEntry(entry = {}) {
    const metrics = entry.metrics && typeof entry.metrics === "object" ? entry.metrics : {};
    const date = dateOnly(entry.performanceDate || entry.performance_date || entry.date);
    const unit = normalizeUnit(metrics.circumference_unit || metrics.measurement_unit);
    const values = {};
    CIRCUMFERENCE_KEYS.forEach((key) => {
      const value = circumferenceInches(metrics[key], unit);
      if (value !== null && value > 0) values[key] = round(value, 3);
    });
    const bodyFat = finite(metrics.body_fat);
    if (bodyFat !== null && bodyFat > 0) values.body_fat = round(bodyFat, 1);

    const legacyLocation = String(metrics.measurement_location || "").trim().toLowerCase().replaceAll(" ", "_");
    const legacyValue = finite(metrics.measurement_value);
    if (legacyValue !== null) {
      const legacyKey = legacyLocation === "body_fat" || legacyLocation === "body_fat_percentage"
        ? "body_fat"
        : CIRCUMFERENCE_KEYS.includes(legacyLocation) ? legacyLocation : null;
      if (legacyKey === "body_fat" && !Object.hasOwn(values, legacyKey)) values[legacyKey] = round(legacyValue, 1);
      if (legacyKey && legacyKey !== "body_fat" && !Object.hasOwn(values, legacyKey)) values[legacyKey] = round(circumferenceInches(legacyValue, unit), 3);
    }

    return {
      id: entry.id || null,
      date,
      values,
      unit,
      notes: entry.notes || "",
      evidenceStatus: entry.evidenceStatus || entry.evidence_status || "SELF REPORTED",
      activityCode: entry.activityCode || entry.activity_code || null,
      source: entry.source || "MANUAL"
    };
  }

  function bodyEntries(entries = []) {
    return entries
      .filter((entry) => String(entry.domain || "").toLowerCase() === "body_metrics")
      .map(normalizeBodyEntry)
      .filter((entry) => entry.date && Object.keys(entry.values).length)
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  function buildCheckInEntry(input = {}, options = {}) {
    const date = dateOnly(input.date || input.performanceDate);
    const today = dateOnly(options.today) || new Date().toISOString().slice(0, 10);
    const unit = normalizeUnit(input.unit || input.circumference_unit);
    const errors = [];
    if (!date) errors.push("Choose a check-in date.");
    if (date && date > today) errors.push("A body check-in cannot be dated in the future.");
    const metrics = { circumference_unit: unit, protocol: "weekly_standard" };
    CIRCUMFERENCE_KEYS.forEach((key) => {
      const value = finite(input[key]);
      if (value === null) return;
      if (value <= 0 || value > 2000) errors.push(`${key.replaceAll("_", " ")} must be greater than zero.`);
      else metrics[key] = round(value, 1);
    });
    const bodyFat = finite(input.body_fat ?? input.bodyFat);
    if (bodyFat !== null) {
      if (bodyFat <= 0 || bodyFat > 75) errors.push("Body-fat estimate must be between 0 and 75%.");
      else metrics.body_fat = round(bodyFat, 1);
    }
    if (!METRICS.some((metric) => Object.hasOwn(metrics, metric.key))) errors.push("Enter at least one body measurement.");
    const now = options.now || new Date().toISOString();
    return {
      valid: errors.length === 0,
      errors,
      entry: {
        id: options.existingId || options.id || null,
        userId: options.userId || null,
        performanceDate: date,
        performanceTime: null,
        domain: "body_metrics",
        entryType: "MEASUREMENT",
        activityCode: "body_composition_checkin",
        activityName: "Body Composition Check-In",
        sessionName: "Weekly Outcome Check-In",
        source: "MANUAL",
        evidenceStatus: "SELF REPORTED",
        metrics,
        notes: String(input.notes || "").trim().slice(0, 500),
        createdAt: options.createdAt || now,
        updatedAt: now
      }
    };
  }

  function summarizeWeight(dailyStates = [], today, rangeDays = 84) {
    const end = dateOnly(today) || new Date().toISOString().slice(0, 10);
    const start = shiftDate(end, -(Math.max(7, Number(rangeDays) || 84) - 1));
    const rows = dailyStates.map((item) => ({ date: dateOnly(item.date), value: finite(item.weight) }))
      .filter((item) => item.date && item.date >= start && item.date <= end && item.value !== null && item.value > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    const latestStart = shiftDate(end, -6);
    const latestWindow = rows.filter((item) => item.date >= latestStart);
    const baselineStart = rows[0]?.date || start;
    const baselineEnd = shiftDate(baselineStart, 6);
    const baselineWindow = rows.filter((item) => item.date >= baselineStart && item.date <= baselineEnd);
    const latestAverage = average(latestWindow.map((item) => item.value));
    const baselineAverage = average(baselineWindow.map((item) => item.value));
    const change = latestAverage !== null && baselineAverage !== null && latestWindow.length && baselineWindow.length
      ? latestAverage - baselineAverage
      : null;
    return {
      latest: rows.at(-1)?.value ?? null,
      latestDate: rows.at(-1)?.date || null,
      sevenDayAverage: round(latestAverage, 1),
      baselineAverage: round(baselineAverage, 1),
      change: round(change, 1),
      changeLabel: change === null ? "Needs a baseline and current week" : `${signed(change)} lb vs baseline`,
      observations: rows.length,
      series: rows
    };
  }

  function summarizeMeasurements(entries = [], today, rangeDays = 84) {
    const end = dateOnly(today) || new Date().toISOString().slice(0, 10);
    const start = shiftDate(end, -(Math.max(7, Number(rangeDays) || 84) - 1));
    const checkIns = bodyEntries(entries).filter((entry) => entry.date >= start && entry.date <= end);
    const summaries = {};
    METRICS.forEach((metric) => {
      const series = checkIns.filter((entry) => Object.hasOwn(entry.values, metric.key)).map((entry) => ({ date: entry.date, value: entry.values[metric.key], id: entry.id }));
      const baseline = series[0] || null;
      const latest = series.at(-1) || null;
      const change = baseline && latest && baseline.date !== latest.date ? latest.value - baseline.value : null;
      summaries[metric.key] = {
        ...metric,
        latest: latest?.value ?? null,
        latestDate: latest?.date || null,
        baseline: baseline?.value ?? null,
        change: round(change, 1),
        observations: series.length,
        series
      };
    });
    return { checkIns, summaries, count: checkIns.length, latestDate: checkIns.at(-1)?.date || null };
  }

  function outcomeDecision(measurements, weight, contract = {}, signals = {}) {
    const goal = contract.primaryGoal || contract.primary_goal || "BALANCED_FITNESS";
    const waist = measurements.summaries.waist;
    const checkIns = measurements.count;
    if (!checkIns) return { code: "ESTABLISH_BASELINE", label: "ESTABLISH BASELINE", tone: "neutral", headline: "Record the first checkpoint", detail: "One truthful weekly check-in starts the outcome record.", action: "Log weekly check-in" };
    if (checkIns < 2) return { code: "MONITOR", label: "MONITOR", tone: "neutral", headline: "Baseline secured", detail: "Repeat under the same conditions next week before interpreting change.", action: "Hold the protocol" };
    if (goal === "LOSE_FAT" && waist.change !== null && waist.change <= -0.25) {
      return { code: "CONTINUE", label: "CONTINUE", tone: "positive", headline: "Outcome is moving with the Contract", detail: `Waist is ${signed(waist.change)} in from baseline. Preserve the approved plan.`, action: "Continue the plan" };
    }
    const evidenceStrong = finite(signals.discipline) !== null && Number(signals.discipline) >= 80
      && finite(signals.nutrition) !== null && Number(signals.nutrition) >= 70;
    if (goal === "LOSE_FAT" && checkIns >= 3 && waist.change !== null && waist.change > -0.1 && evidenceStrong) {
      return { code: "REVIEW_ADJUSTMENT", label: "REVIEW ADJUSTMENT", tone: "warning", headline: "Execution is present; outcome is flat", detail: "Atlas recommends reviewing the plan. No calorie or training change is automatic.", action: "Review with Atlas" };
    }
    if (goal === "BUILD_STRENGTH" && Number(signals.strengthSessions || 0) > 0) {
      return { code: "CONTINUE", label: "CONTINUE", tone: "positive", headline: "Body data supports the training record", detail: "Keep the approved strength plan while performance evidence accumulates.", action: "Continue the plan" };
    }
    return { code: "MONITOR", label: "MONITOR", tone: "neutral", headline: "Hold steady and measure again", detail: weight.changeLabel || "One more comparable checkpoint will sharpen the signal.", action: "Check in next week" };
  }

  function buildOutcomeModel(input = {}) {
    const today = dateOnly(input.today) || new Date().toISOString().slice(0, 10);
    const rangeDays = Math.max(28, Number(input.rangeDays) || 84);
    const measurements = summarizeMeasurements(input.performanceEntries || [], today, rangeDays);
    const weight = summarizeWeight(input.dailyStates || [], today, rangeDays);
    const contract = input.contract || {};
    const decision = outcomeDecision(measurements, weight, contract, input.signals || {});
    const confidence = Math.min(100, (measurements.count ? 35 : 0) + (measurements.count >= 2 ? 25 : 0) + (measurements.count >= 3 ? 15 : 0) + (weight.observations >= 4 ? 15 : 0) + (weight.observations >= 10 ? 10 : 0));
    return {
      version: VERSION,
      today,
      rangeDays,
      goal: contract.primaryGoal || contract.primary_goal || "BALANCED_FITNESS",
      goalTarget: contract.target || "",
      goalDate: contract.targetDate || contract.target_date || null,
      measurements,
      weight,
      decision,
      confidence,
      confidenceLabel: confidence >= 80 ? "STRONG" : confidence >= 60 ? "USABLE" : confidence >= 35 ? "LEARNING" : "BASELINE NEEDED",
      nextCheckInDate: measurements.latestDate ? shiftDate(measurements.latestDate, 7) : today
    };
  }

  function weeklyOutcomeSummary(model = {}, weekStart, weekEnd) {
    const checkIns = model.measurements?.checkIns || [];
    const inWeek = checkIns.filter((item) => item.date >= weekStart && item.date <= weekEnd);
    const latest = inWeek.at(-1) || null;
    return {
      state: latest ? "CAPTURED" : "NOT CAPTURED",
      date: latest?.date || null,
      decision: model.decision?.label || "ESTABLISH BASELINE",
      detail: latest ? model.decision?.headline || "Outcome checkpoint captured" : "No weekly body checkpoint. This does not reduce the discipline score.",
      evidenceStatus: latest?.evidenceStatus || null
    };
  }

  return {
    VERSION,
    METRICS,
    CIRCUMFERENCE_KEYS,
    normalizeUnit,
    circumferenceInches,
    displayCircumference,
    normalizeBodyEntry,
    bodyEntries,
    buildCheckInEntry,
    summarizeWeight,
    summarizeMeasurements,
    outcomeDecision,
    buildOutcomeModel,
    weeklyOutcomeSummary
  };
});
