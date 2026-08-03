(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionObservationVerdict = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "022E.1";
  const DAY_MS = 86400000;
  const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, digits = 1) => value === null || value === undefined ? null : Number(Number(value).toFixed(digits));
  const average = (values = []) => {
    const usable = values.map(finite).filter((value) => value !== null);
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
  };
  const dateOnly = (value) => String(value || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || null;
  const shiftDate = (value, days) => {
    const date = dateOnly(value);
    return date ? new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10) : null;
  };
  const evidenceDate = (item = {}) => dateOnly(item.date || item.performanceDate || item.performance_date || item.completedAt || item.completed_at);
  const inWindow = (date, start, end) => Boolean(date && start && end && date >= start && date <= end);
  const completion = (state) => String(state || "COMPLETE").toUpperCase() === "COMPLETE" ? 1 : 0;
  const trendDelta = (rows = [], getter = (item) => item.value) => {
    const ordered = rows.map((item) => ({ date: evidenceDate(item), value: finite(getter(item)) }))
      .filter((item) => item.date && item.value !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    return ordered.length >= 2 ? round(ordered.at(-1).value - ordered[0].value, 1) : null;
  };

  function observationWindows(command = {}, today) {
    const effectiveDate = dateOnly(command.effectiveDate);
    const observationEnd = dateOnly(command.observationEnd) || shiftDate(effectiveDate, 13);
    const currentDate = dateOnly(today) || new Date().toISOString().slice(0, 10);
    return {
      baselineStart: shiftDate(effectiveDate, -14),
      baselineEnd: shiftDate(effectiveDate, -1),
      observationStart: effectiveDate,
      observationEnd,
      observedThrough: currentDate < observationEnd ? currentDate : observationEnd,
      today: currentDate
    };
  }

  function setMetrics(execution = {}) {
    const sets = Object.values(execution.setLogs || {}).flat().filter((item) => String(item.kind || "WORK").toUpperCase() === "WORK");
    return {
      workSets: sets.length,
      volume: sets.reduce((sum, item) => sum + Number(item.load || 0) * Number(item.reps || 0), 0)
    };
  }

  function normalizeSources(input = {}) {
    const readiness = (input.dailyStates || []).map((item) => ({
      date: evidenceDate(item),
      energy: finite(item.energy),
      pain: Boolean(item.pain || item.painReported),
      weight: finite(item.weight)
    })).filter((item) => item.date);
    const nutrition = (input.nutritionDays || []).map((item) => ({
      date: evidenceDate(item), calories: finite(item.calories), protein: finite(item.protein)
    })).filter((item) => item.date);
    const strength = (input.strengthHistory || []).map((item) => ({
      date: evidenceDate(item), state: String(item.state || "").toUpperCase(), pain: Boolean(item.painReported), ...setMetrics(item)
    })).filter((item) => item.date && ["COMPLETE", "PARTIAL", "STOPPED"].includes(item.state));
    const core = (input.coreHistory || []).map((item) => ({
      date: evidenceDate(item), state: String(item.state || item.status || "").toUpperCase(), pain: Boolean(item.painReported)
    })).filter((item) => item.date && !["READY", "IN_PROGRESS", "DRAFT"].includes(item.state));
    const performance = (input.performanceEntries || []).map((item) => ({
      date: evidenceDate(item), domain: String(item.domain || "").toLowerCase(), state: String(item.state || item.status || "COMPLETE").toUpperCase(), metrics: item.metrics || {}
    })).filter((item) => item.date);
    const running = performance.filter((item) => item.domain === "running").map((item) => ({
      date: item.date,
      state: item.state,
      distance: finite(item.metrics.distance) || 0,
      minutes: (finite(item.metrics.duration_seconds) || 0) / 60,
      pain: Boolean(item.metrics.pain || item.metrics.pain_reported)
    }));
    const body = performance.filter((item) => item.domain === "body_metrics").map((item) => ({
      date: item.date, waist: finite(item.metrics.waist), bodyFat: finite(item.metrics.body_fat)
    }));
    return { readiness, nutrition, strength, running, core, body };
  }

  function windowSummary(sources, start, end, targets = {}) {
    const rows = (items) => items.filter((item) => inWindow(item.date, start, end));
    const readiness = rows(sources.readiness);
    const nutrition = rows(sources.nutrition).filter((item) => item.calories !== null && item.protein !== null);
    const strength = rows(sources.strength);
    const running = rows(sources.running);
    const core = rows(sources.core);
    const body = rows(sources.body);
    const targetCalories = finite(targets.calories);
    const targetProtein = finite(targets.protein);
    const adherentDays = targetCalories && targetProtein ? nutrition.filter((item) => {
      const calories = item.calories / targetCalories;
      const protein = item.protein / targetProtein;
      return calories >= 0.8 && calories <= 1.2 && protein >= 0.85;
    }).length : 0;
    const completionRate = (items) => items.length ? average(items.map((item) => completion(item.state))) : null;
    const painDays = new Set([
      ...readiness.filter((item) => item.pain).map((item) => item.date),
      ...strength.filter((item) => item.pain).map((item) => item.date),
      ...running.filter((item) => item.pain).map((item) => item.date),
      ...core.filter((item) => item.pain).map((item) => item.date)
    ]).size;
    return {
      start, end,
      readinessDays: readiness.filter((item) => item.energy !== null).length,
      readiness: round(average(readiness.map((item) => item.energy)), 1),
      painDays,
      weightCount: readiness.filter((item) => item.weight !== null).length,
      weightChange: trendDelta(readiness, (item) => item.weight),
      waistCount: body.filter((item) => item.waist !== null).length,
      waistChange: trendDelta(body, (item) => item.waist),
      nutritionDays: nutrition.length,
      nutritionAdherence: nutrition.length && targetCalories && targetProtein ? round(adherentDays / nutrition.length * 100, 0) : null,
      strengthSessions: strength.length,
      strengthCompletion: round(completionRate(strength), 2),
      strengthWorkSets: strength.reduce((sum, item) => sum + item.workSets, 0),
      strengthVolume: round(strength.reduce((sum, item) => sum + item.volume, 0), 0),
      runningSessions: running.length,
      runningCompletion: round(completionRate(running), 2),
      runningDistance: round(running.reduce((sum, item) => sum + item.distance, 0), 1),
      runningMinutes: round(running.reduce((sum, item) => sum + item.minutes, 0), 0),
      coreSessions: core.length,
      coreCompletion: round(completionRate(core), 2)
    };
  }

  function evidenceRequirements(domain, summary, baseline = {}) {
    const readinessReady = Number(baseline.readinessDays || 0) >= 3 && summary.readinessDays >= 5;
    if (domain === "NUTRITION") {
      const outcomeCount = Math.max(summary.weightCount, summary.waistCount);
      const nutritionReady = Number(baseline.nutritionDays || 0) >= 3 && summary.nutritionDays >= 7;
      return {
        ready: readinessReady && nutritionReady && outcomeCount >= 2,
        met: [readinessReady, nutritionReady, outcomeCount >= 2],
        labels: [`Roll calls ${Number(baseline.readinessDays || 0)} before / ${summary.readinessDays} after`, `Fuel days ${Number(baseline.nutritionDays || 0)} before / ${summary.nutritionDays} after`, `${outcomeCount}/2 after-change body readings`]
      };
    }
    const sessions = domain === "STRENGTH" ? summary.strengthSessions : domain === "RUNNING" ? summary.runningSessions : summary.coreSessions;
    const baselineSessions = domain === "STRENGTH" ? Number(baseline.strengthSessions || 0) : domain === "RUNNING" ? Number(baseline.runningSessions || 0) : Number(baseline.coreSessions || 0);
    const sessionsReady = baselineSessions >= 1 && sessions >= 2;
    return {
      ready: readinessReady && sessionsReady,
      met: [readinessReady, sessionsReady],
      labels: [`Roll calls ${Number(baseline.readinessDays || 0)} before / ${summary.readinessDays} after`, `${domain.toLowerCase()} sessions ${baselineSessions} before / ${sessions} after`]
    };
  }

  function verdictFor(domain, baseline, observed, requirements) {
    const readinessDelta = baseline.readiness !== null && observed.readiness !== null ? round(observed.readiness - baseline.readiness, 1) : null;
    const painDelta = observed.painDays - baseline.painDays;
    const recoveryHarm = (readinessDelta !== null && readinessDelta <= -1) || observed.painDays >= 3 || painDelta >= 2;
    if (!requirements.ready) {
      return { recommendation: "EXTEND", rationale: "The observation does not yet contain enough evidence for a defensible plan decision." };
    }
    if (recoveryHarm) {
      return { recommendation: "ROLLBACK", rationale: "Recovery or pain moved beyond the safeguard. Restore the prior plan." };
    }
    if (domain === "NUTRITION") {
      const adherenceDelta = baseline.nutritionAdherence !== null && observed.nutritionAdherence !== null ? observed.nutritionAdherence - baseline.nutritionAdherence : null;
      const outcomeImproved = observed.weightChange !== null && observed.weightChange <= -0.4
        || observed.waistChange !== null && observed.waistChange <= -0.25;
      if (observed.nutritionAdherence >= 80 && (outcomeImproved || adherenceDelta !== null && adherenceDelta >= 10)) {
        return { recommendation: "RETAIN", rationale: "Fuel execution improved without a recovery penalty. Keep the change." };
      }
      if (observed.nutritionAdherence < 60 || observed.weightChange !== null && observed.weightChange >= 1 || observed.waistChange !== null && observed.waistChange >= 0.5) {
        return { recommendation: "ROLLBACK", rationale: "Execution or outcome moved against the intended result. Restore the prior target." };
      }
      return { recommendation: "EXTEND", rationale: "The signal is mixed. Seven more days will separate trend from noise." };
    }
    const key = domain === "STRENGTH" ? "strengthCompletion" : domain === "RUNNING" ? "runningCompletion" : "coreCompletion";
    const current = observed[key];
    const prior = baseline[key];
    const completionDelta = current !== null && prior !== null ? current - prior : null;
    if (current !== null && current >= 0.8 && (completionDelta === null || completionDelta >= -0.1)) {
      return { recommendation: "RETAIN", rationale: "Completion held or improved while recovery stayed protected. Keep the change." };
    }
    if (current !== null && (current < 0.6 || completionDelta !== null && completionDelta <= -0.2)) {
      return { recommendation: "ROLLBACK", rationale: "Completion regressed enough to reject the change. Restore the prior plan." };
    }
    return { recommendation: "EXTEND", rationale: "Performance is stable but not decisive. Observe seven more days." };
  }

  function metricCards(domain, baseline, observed) {
    const format = (value, suffix = "") => value === null || value === undefined ? "—" : `${value}${suffix}`;
    const cards = [
      { id: "readiness", label: "Readiness", baseline: format(baseline.readiness, "/10"), observed: format(observed.readiness, "/10") },
      { id: "pain", label: "Pain flags", baseline: format(baseline.painDays), observed: format(observed.painDays) }
    ];
    if (domain === "NUTRITION") {
      cards.unshift({ id: "execution", label: "Fuel on target", baseline: format(baseline.nutritionAdherence, "%"), observed: format(observed.nutritionAdherence, "%") });
      cards.push({ id: "weight", label: "Weight change", baseline: format(baseline.weightChange, " lb"), observed: format(observed.weightChange, " lb") });
      cards.push({ id: "waist", label: "Waist change", baseline: format(baseline.waistChange, " in"), observed: format(observed.waistChange, " in") });
    } else if (domain === "STRENGTH") {
      cards.unshift({ id: "completion", label: "Completion", baseline: format(baseline.strengthCompletion === null ? null : round(baseline.strengthCompletion * 100, 0), "%"), observed: format(observed.strengthCompletion === null ? null : round(observed.strengthCompletion * 100, 0), "%") });
      cards.push({ id: "sessions", label: "Sessions", baseline: format(baseline.strengthSessions), observed: format(observed.strengthSessions) });
    } else if (domain === "RUNNING") {
      cards.unshift({ id: "completion", label: "Completion", baseline: format(baseline.runningCompletion === null ? null : round(baseline.runningCompletion * 100, 0), "%"), observed: format(observed.runningCompletion === null ? null : round(observed.runningCompletion * 100, 0), "%") });
      cards.push({ id: "distance", label: "Distance", baseline: format(baseline.runningDistance), observed: format(observed.runningDistance) });
    } else {
      cards.unshift({ id: "completion", label: "Completion", baseline: format(baseline.coreCompletion === null ? null : round(baseline.coreCompletion * 100, 0), "%"), observed: format(observed.coreCompletion === null ? null : round(observed.coreCompletion * 100, 0), "%") });
      cards.push({ id: "sessions", label: "Sessions", baseline: format(baseline.coreSessions), observed: format(observed.coreSessions) });
    }
    return cards;
  }

  function buildObservationVerdict(input = {}) {
    const command = input.command || {};
    const prior = input.priorVerdict || null;
    if (prior?.commandId === command.id && prior.status === "RESOLVED") return clone(prior);
    if (!command.id || !["SCHEDULED", "OBSERVING", "REVIEW_DUE"].includes(command.status)) {
      return { version: VERSION, id: null, commandId: command.id || null, status: "WAITING", recommendation: null };
    }
    const windows = observationWindows(command, input.today);
    const sources = normalizeSources(input);
    const targets = command.proposedPlan?.recoveryTargets || input.nutritionTargets || {};
    const baseline = windowSummary(sources, windows.baselineStart, windows.baselineEnd, targets);
    const observed = windowSummary(sources, windows.observationStart, windows.observedThrough, targets);
    const requirements = evidenceRequirements(String(command.domain || "").toUpperCase(), observed, baseline);
    const confidenceScore = Math.round(requirements.met.filter(Boolean).length / requirements.met.length * 75 + Math.min(25, observed.readinessDays / 10 * 25));
    const confidence = confidenceScore >= 85 ? "STRONG" : confidenceScore >= 65 ? "USABLE" : confidenceScore >= 45 ? "LIMITED" : "LEARNING";
    const due = windows.today > windows.observationEnd || command.status === "REVIEW_DUE";
    const decision = verdictFor(String(command.domain || "").toUpperCase(), baseline, observed, requirements);
    return {
      version: VERSION,
      id: `observation-verdict:${command.id}`,
      commandId: command.id,
      domain: String(command.domain || "").toUpperCase(),
      status: command.status === "SCHEDULED" ? "SCHEDULED" : due ? "READY" : "OBSERVING",
      recommendation: due ? decision.recommendation : null,
      rationale: command.status === "SCHEDULED"
        ? `Evidence collection starts when the approved change activates on ${windows.observationStart}.`
        : due ? decision.rationale : `Atlas is collecting evidence through ${windows.observationEnd}.`,
      confidence: { score: Math.min(100, confidenceScore), label: confidence },
      requirements: requirements.labels,
      windows,
      baseline,
      observed,
      metrics: metricCards(String(command.domain || "").toUpperCase(), baseline, observed),
      extensionCount: Number(command.extensionCount || prior?.extensionCount || 0),
      generatedAt: input.generatedAt || new Date().toISOString()
    };
  }

  function resolveVerdict(verdict = {}, action, options = {}) {
    if (verdict.status !== "READY") throw new Error("The observation verdict is not ready.");
    if (!["RETAIN", "ROLLBACK", "EXTEND"].includes(action)) throw new Error("Retain, roll back, or observe seven more days.");
    if (action === "EXTEND" && Number(verdict.extensionCount || 0) >= 2) throw new Error("Two extensions are already complete. Choose retain or roll back.");
    const decidedAt = options.decidedAt || new Date().toISOString();
    const nextEnd = action === "EXTEND" ? shiftDate(verdict.windows.observationEnd, 7) : verdict.windows.observationEnd;
    return {
      ...clone(verdict),
      status: action === "EXTEND" ? "EXTENDED" : "RESOLVED",
      decision: action,
      decidedAt,
      decidedBy: options.userId || null,
      extensionCount: Number(verdict.extensionCount || 0) + (action === "EXTEND" ? 1 : 0),
      nextObservationEnd: nextEnd,
      receiptId: `${verdict.id}:${action}:${decidedAt}`
    };
  }

  return Object.freeze({
    VERSION, dateOnly, shiftDate, observationWindows, normalizeSources, windowSummary,
    evidenceRequirements, buildObservationVerdict, resolveVerdict
  });
});
