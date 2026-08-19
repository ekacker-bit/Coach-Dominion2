(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DominionReadinessBaselines = api;
}(typeof self !== "undefined" ? self : this, function () {
  const METRICS = {
    sleep: { label: "Sleep", unit: "h", direction: "lower" },
    resting_heart_rate: { label: "Resting heart rate", unit: "bpm", direction: "higher" },
    heart_rate_variability: { label: "HRV", unit: "ms", direction: "lower" },
    steps: { label: "Steps", unit: "", direction: "informational" },
    weight: { label: "Weight", unit: "", direction: "informational" }
  };

  function numeric(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function median(values) {
    const sorted = values.map(numeric).filter((value) => value !== null).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function daysBetween(later, earlier) {
    const a = Date.parse(`${later}T00:00:00Z`);
    const b = Date.parse(`${earlier}T00:00:00Z`);
    return Number.isFinite(a) && Number.isFinite(b) ? Math.floor((a - b) / 86400000) : null;
  }

  function buildMetricBaseline(history, key, currentDate, windowDays) {
    const values = (history || [])
      .filter((item) => {
        const age = daysBetween(currentDate, item.date);
        return age !== null && age >= 1 && age <= windowDays;
      })
      .map((item) => numeric(item[key]))
      .filter((value) => value !== null);
    return {
      key,
      windowDays,
      count: values.length,
      median: median(values),
      minimum: values.length ? Math.min(...values) : null,
      maximum: values.length ? Math.max(...values) : null
    };
  }

  function signalFor(key, currentValue, baseline) {
    const value = numeric(currentValue);
    if (value === null || baseline.median === null || baseline.count < 10) {
      return { key, status: "UNAVAILABLE", ratio: null, severity: 0 };
    }
    const ratio = value / baseline.median;
    if (key === "sleep") {
      if (ratio < 0.70) return { key, status: "SEVERE", ratio, severity: 2 };
      if (ratio < 0.85) return { key, status: "CONCERN", ratio, severity: 1 };
    }
    if (key === "resting_heart_rate") {
      if (ratio > 1.20) return { key, status: "SEVERE", ratio, severity: 2 };
      if (ratio > 1.10) return { key, status: "CONCERN", ratio, severity: 1 };
    }
    if (key === "heart_rate_variability") {
      if (ratio < 0.70) return { key, status: "SEVERE", ratio, severity: 2 };
      if (ratio < 0.85) return { key, status: "CONCERN", ratio, severity: 1 };
    }
    return { key, status: "WITHIN BASELINE", ratio, severity: 0 };
  }

  function buildReadinessBaselineProfile(history, current, options) {
    const opts = options || {};
    const currentDate = opts.currentDate || current?.date;
    const observations = (history || []).filter((item) => item && item.date && item.date !== currentDate);
    const metrics = {};
    Object.keys(METRICS).forEach((key) => {
      metrics[key] = {
        ...METRICS[key],
        current: numeric(current?.[key]),
        baseline14: buildMetricBaseline(observations, key, currentDate, 14),
        baseline28: buildMetricBaseline(observations, key, currentDate, 28)
      };
      metrics[key].signal = signalFor(key, metrics[key].current, metrics[key].baseline28);
    });
    const eligibleSignals = ["sleep", "resting_heart_rate", "heart_rate_variability"].filter((key) => metrics[key].baseline28.count >= 10);
    const active = eligibleSignals.length > 0;
    return {
      state: active ? "ACTIVE" : "LEARNING",
      currentDate,
      historyDays: new Set(observations.map((item) => item.date)).size,
      minimumObservations: 10,
      eligibleSignals,
      metrics,
      safeguards: [
        "Pain and an existing RED state always take priority.",
        "Personalization can only preserve or reduce readiness.",
        "HRV is evaluated only against a personal 28-day median after 10 prior observations.",
        "Steps and weight remain informational."
      ]
    };
  }

  function evaluatePersonalizedReadiness(baseReadiness, profile) {
    const base = { ...(baseReadiness || {}) };
    if (!base.state || !profile || profile.state !== "ACTIVE") {
      return { ...base, baseline: profile, baselineAdjustment: "NONE" };
    }
    if (base.state !== "GREEN") {
      return { ...base, baseline: profile, baselineAdjustment: "NONE" };
    }
    const signals = ["sleep", "resting_heart_rate", "heart_rate_variability"]
      .map((key) => profile.metrics[key]?.signal)
      .filter((signal) => signal && signal.status !== "UNAVAILABLE");
    const concerns = signals.filter((signal) => signal.severity >= 1);
    const severeNonHrv = concerns.some((signal) => signal.severity >= 2 && signal.key !== "heart_rate_variability");
    const corroboratedSevereHrv = concerns.some((signal) => signal.severity >= 2 && signal.key === "heart_rate_variability") && concerns.length >= 2;
    if (!severeNonHrv && !corroboratedSevereHrv && concerns.length < 2) {
      const hrvConcern = concerns.find((signal) => signal.key === "heart_rate_variability");
      return {
        ...base,
        rationale: hrvConcern
          ? [...(base.rationale || []), "HRV is below baseline, but sleep, resting heart rate, energy, soreness, pain, and recent training load do not corroborate a recovery adjustment."]
          : base.rationale,
        baseline: profile,
        baselineAdjustment: "NONE"
      };
    }
    const reasons = concerns.map((signal) => {
      const metric = profile.metrics[signal.key];
      const percent = Math.round(Math.abs(1 - signal.ratio) * 100);
      const direction = signal.key === "resting_heart_rate" ? "above" : "below";
      return `${metric.label} is ${percent}% ${direction} the 28-day personal median.`;
    });
    return {
      ...base,
      state: "YELLOW",
      headline: "Personal baseline signals reduced readiness.",
      rationale: [...(base.rationale || []), ...reasons],
      primaryRisk: "Training above current recovery capacity.",
      instruction: "Complete primary work only.",
      restrictions: Array.from(new Set(["Remove optional intensity", "No additional volume", "Stop if symptoms worsen", ...(base.restrictions || [])])),
      baseline: profile,
      baselineAdjustment: "GREEN_TO_YELLOW"
    };
  }

  return {
    METRICS,
    median,
    buildMetricBaseline,
    buildReadinessBaselineProfile,
    evaluatePersonalizedReadiness
  };
}));
