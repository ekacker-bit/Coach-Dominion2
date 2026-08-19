(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionManualRun = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";
  const RUN_TYPES = Object.freeze([
    { code: "EASY", label: "Easy run" },
    { code: "LONG", label: "Long run" },
    { code: "TEMPO", label: "Tempo run" },
    { code: "INTERVAL", label: "Intervals" },
    { code: "RECOVERY", label: "Recovery run" },
    { code: "RACE", label: "Race" },
    { code: "TREADMILL", label: "Treadmill run" },
    { code: "OTHER", label: "Other run" }
  ]);

  function numberOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function dateIso(value) {
    const text = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function durationSeconds(input = {}) {
    const explicit = numberOrNull(input.durationSeconds ?? input.duration_seconds);
    if (explicit !== null) return Math.round(explicit);
    const hours = Math.max(0, numberOrNull(input.hours) || 0);
    const minutes = Math.max(0, numberOrNull(input.minutes) || 0);
    const seconds = Math.max(0, numberOrNull(input.seconds) || 0);
    return Math.round((hours * 3600) + (minutes * 60) + seconds);
  }

  function paceSecondsPerUnit(input = {}) {
    const distance = numberOrNull(input.distance);
    const duration = durationSeconds(input);
    return distance && distance > 0 && duration > 0 ? Number((duration / distance).toFixed(2)) : null;
  }

  function formatPace(seconds, unit = "mi") {
    const value = numberOrNull(seconds);
    if (value === null || value <= 0) return "—";
    const minutes = Math.floor(value / 60);
    const remainder = Math.round(value % 60);
    return `${minutes}:${String(remainder).padStart(2, "0")} /${unit === "km" ? "km" : "mi"}`;
  }

  function normalize(input = {}, options = {}) {
    const runTypeCode = String(input.runType || input.run_type || "EASY").trim().toUpperCase();
    const runType = RUN_TYPES.some((item) => item.code === runTypeCode) ? runTypeCode : "OTHER";
    const unit = String(input.unit || input.distanceUnit || input.distance_unit || "mi").toLowerCase() === "km" ? "km" : "mi";
    const distance = numberOrNull(input.distance);
    const duration = durationSeconds(input);
    const rpe = numberOrNull(input.rpe);
    const averageHeartRate = numberOrNull(input.averageHeartRate ?? input.average_heart_rate);
    const elevationGain = numberOrNull(input.elevationGain ?? input.elevation_gain);
    return {
      version: VERSION,
      performanceDate: dateIso(input.performanceDate || input.performance_date || input.date) || dateIso(options.today),
      runType,
      runTypeLabel: RUN_TYPES.find((item) => item.code === runType)?.label || "Run",
      distance: distance === null ? null : Number(distance.toFixed(2)),
      unit,
      durationSeconds: duration,
      paceSecondsPerUnit: paceSecondsPerUnit({ distance, durationSeconds: duration }),
      rpe: rpe === null ? null : Number(rpe.toFixed(1)),
      averageHeartRate: averageHeartRate === null ? null : Math.round(averageHeartRate),
      elevationGain: elevationGain === null ? null : Number(elevationGain.toFixed(1)),
      notes: String(input.notes || "").trim().slice(0, 500),
      countTowardToday: Boolean(input.countTowardToday ?? input.count_toward_today),
      assignmentId: String(input.assignmentId || input.assignment_id || "").trim() || null
    };
  }

  function validate(input = {}, options = {}) {
    const run = normalize(input, options);
    const errors = [];
    if (!run.performanceDate) errors.push({ field: "date", message: "Choose the date of the run." });
    if (!(run.distance > 0)) errors.push({ field: "distance", message: "Enter a distance greater than zero." });
    if (!(run.durationSeconds > 0)) errors.push({ field: "duration", message: "Enter the total run time." });
    if (run.rpe !== null && (run.rpe < 1 || run.rpe > 10)) errors.push({ field: "rpe", message: "Effort must be between 1 and 10." });
    if (run.averageHeartRate !== null && (run.averageHeartRate < 30 || run.averageHeartRate > 240)) errors.push({ field: "averageHeartRate", message: "Average heart rate must be between 30 and 240 bpm." });
    if (run.elevationGain !== null && run.elevationGain < 0) errors.push({ field: "elevationGain", message: "Elevation gain cannot be negative." });
    return { valid: errors.length === 0, errors, run };
  }

  function stableId(run = {}, options = {}) {
    const identity = [options.userId || "local", run.performanceDate, run.runType, run.distance, run.unit, run.durationSeconds, options.createdAt || "manual"].join(":");
    let hash = 2166136261;
    for (let index = 0; index < identity.length; index += 1) {
      hash ^= identity.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `manual-run-${(hash >>> 0).toString(16)}`;
  }

  function buildPerformanceEntry(input = {}, options = {}) {
    const result = validate(input, options);
    if (!result.valid) throw new Error(result.errors[0]?.message || "Run evidence is incomplete.");
    const run = result.run;
    const createdAt = options.createdAt || new Date().toISOString();
    return {
      id: stableId(run, { ...options, createdAt }),
      userId: options.userId || null,
      performanceDate: run.performanceDate,
      domain: "running",
      entryType: run.runType === "RACE" ? "RACE" : "WORKOUT_SUMMARY",
      activityCode: `manual_${run.runType.toLowerCase()}`,
      activityName: run.runTypeLabel,
      sessionName: run.runTypeLabel,
      source: "MANUAL",
      evidenceStatus: "SELF REPORTED",
      assignmentId: run.assignmentId,
      notes: run.notes,
      metrics: {
        distance: run.distance,
        distance_unit: run.unit,
        duration_seconds: run.durationSeconds,
        pace_seconds_per_unit: run.paceSecondsPerUnit,
        run_type: run.runType,
        rpe: run.rpe,
        average_heart_rate: run.averageHeartRate,
        elevation_gain: run.elevationGain,
        capture_method: "MANUAL_RUN_FORM",
        count_toward_today: run.countTowardToday,
        assignment_id: run.assignmentId
      },
      createdAt,
      updatedAt: createdAt
    };
  }

  return Object.freeze({
    VERSION,
    RUN_TYPES: [...RUN_TYPES],
    durationSeconds,
    paceSecondsPerUnit,
    formatPace,
    normalize,
    validate,
    buildPerformanceEntry
  });
});
