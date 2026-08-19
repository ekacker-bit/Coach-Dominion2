(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionBiometricIntegrity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030C.1";
  const DEFAULT_RULES = Object.freeze({
    weight: { minimum: 66, maximum: 772, sharpAbsolute: 25, sharpRatio: 0.18, unit: "lb" },
    resting_heart_rate: { minimum: 25, maximum: 250, sharpAbsolute: 30, sharpRatio: 0.35, unit: "bpm" },
    heart_rate_variability: { minimum: 1, maximum: 500, sharpAbsolute: 80, sharpRatio: 0.65, unit: "ms" }
  });

  function numeric(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function median(values = []) {
    const sorted = values.map(numeric).filter((value) => value !== null).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function baselineFor(history = [], metric = "weight", limit = 14) {
    return median((Array.isArray(history) ? history : []).slice(0, limit).map((item) => item?.[metric]));
  }

  function evaluateReading(metric, value, history = [], options = {}) {
    const rules = { ...(DEFAULT_RULES[metric] || {}), ...(options.rules?.[metric] || options.rule || {}) };
    const reading = numeric(value);
    if (reading === null) return { metric, value: null, state: "EMPTY", quarantined: false, reasons: [], baseline: baselineFor(history, metric) };
    const baseline = numeric(options.baseline) ?? baselineFor(history, metric, options.baselineLimit || 14);
    const reasons = [];
    if (Number.isFinite(rules.minimum) && reading < rules.minimum) reasons.push(`below plausible minimum ${rules.minimum}${rules.unit ? ` ${rules.unit}` : ""}`);
    if (Number.isFinite(rules.maximum) && reading > rules.maximum) reasons.push(`above plausible maximum ${rules.maximum}${rules.unit ? ` ${rules.unit}` : ""}`);
    if (baseline !== null && baseline > 0) {
      const absoluteDelta = Math.abs(reading - baseline);
      const ratioDelta = absoluteDelta / baseline;
      if (absoluteDelta >= Number(rules.sharpAbsolute || Infinity) || ratioDelta >= Number(rules.sharpRatio || Infinity)) {
        reasons.push(`sharp change from recent baseline ${Number(baseline.toFixed(1))}${rules.unit ? ` ${rules.unit}` : ""}`);
      }
    }
    return {
      metric,
      value: reading,
      baseline,
      state: reasons.length ? "CONFIRMATION_REQUIRED" : "ACCEPTED",
      quarantined: reasons.length > 0,
      reasons,
      rule: rules
    };
  }

  function inspectPayload(payload = {}, history = [], options = {}) {
    const evaluations = Object.keys(DEFAULT_RULES).map((metric) => evaluateReading(metric, payload[metric], history, options));
    const flagged = evaluations.filter((item) => item.quarantined);
    const safe = { ...payload };
    flagged.forEach((item) => {
      safe[item.metric] = null;
    });
    return { state: flagged.length ? "CONFIRMATION_REQUIRED" : "ACCEPTED", safe, original: { ...payload }, evaluations, flagged };
  }

  function auditEntry(input = {}) {
    const at = input.at || new Date().toISOString();
    const metric = input.metric || "weight";
    const originalValue = numeric(input.originalValue);
    const resolvedValue = numeric(input.resolvedValue);
    const resolution = String(input.resolution || "QUARANTINED").toUpperCase();
    return {
      id: input.id || `biometric-${metric}-${at}-${resolution}`,
      version: VERSION,
      date: String(input.date || at).slice(0, 10),
      metric,
      originalValue,
      resolvedValue,
      baseline: numeric(input.baseline),
      reasons: Array.isArray(input.reasons) ? [...input.reasons] : [],
      resolution,
      recordedAt: input.recordedAt || at,
      resolvedAt: ["CONFIRMED", "CORRECTED"].includes(resolution) ? at : null
    };
  }

  function resolveQuarantine(pending = {}, action = "", correctedValue = null, options = {}) {
    const resolution = String(action || "").toUpperCase();
    if (!pending.metric || !["CONFIRM", "CORRECT"].includes(resolution)) throw new Error("Choose Confirm value or Correct value.");
    const value = resolution === "CONFIRM" ? numeric(pending.originalValue ?? pending.value) : numeric(correctedValue);
    if (value === null) throw new Error("Enter a valid corrected value.");
    const evaluation = evaluateReading(pending.metric, value, [], { baseline: pending.baseline, rules: options.rules });
    if (resolution === "CORRECT" && evaluation.quarantined) throw new Error("The corrected value still needs confirmation.");
    return {
      value,
      audit: auditEntry({
        date: pending.date,
        metric: pending.metric,
        originalValue: pending.originalValue ?? pending.value,
        resolvedValue: value,
        baseline: pending.baseline,
        reasons: pending.reasons,
        resolution: resolution === "CONFIRM" ? "CONFIRMED" : "CORRECTED",
        at: options.at
      })
    };
  }

  return Object.freeze({
    VERSION,
    DEFAULT_RULES: JSON.parse(JSON.stringify(DEFAULT_RULES)),
    numeric,
    median,
    baselineFor,
    evaluateReading,
    inspectPayload,
    auditEntry,
    resolveQuarantine
  });
});
