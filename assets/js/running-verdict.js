(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRunningVerdict = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025R.1";
  const KM_PER_MILE = 1.609344;

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function cleanText(value = "", maximum = 500) {
    return String(value || "").trim().slice(0, maximum);
  }

  function durationSeconds(input = {}) {
    const supplied = finite(input.durationSeconds);
    if (supplied !== null && supplied > 0) return Math.round(supplied);
    const hours = Math.max(0, Math.floor(finite(input.hours) || 0));
    const minutes = Math.max(0, Math.floor(finite(input.minutes) || 0));
    const seconds = Math.max(0, Math.floor(finite(input.seconds) || 0));
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  function validateActual(input = {}) {
    const errors = [];
    const distance = finite(input.distance);
    const duration = durationSeconds(input);
    const unit = String(input.unit || "mi").toLowerCase() === "km" ? "km" : "mi";
    const rpe = input.rpe === "" || input.rpe === null || input.rpe === undefined ? null : finite(input.rpe);
    const averageHeartRate = input.averageHeartRate === "" || input.averageHeartRate === null || input.averageHeartRate === undefined ? null : finite(input.averageHeartRate);
    const elevationGain = input.elevationGain === "" || input.elevationGain === null || input.elevationGain === undefined ? null : finite(input.elevationGain);
    if (distance === null || distance <= 0) errors.push({ field: "distance", message: "Enter the distance actually completed." });
    if (!duration) errors.push({ field: "duration", message: "Enter the run's actual elapsed time." });
    if (rpe !== null && (rpe < 1 || rpe > 10)) errors.push({ field: "rpe", message: "Effort must be between 1 and 10." });
    if (averageHeartRate !== null && (averageHeartRate < 30 || averageHeartRate > 240)) errors.push({ field: "averageHeartRate", message: "Average heart rate must be between 30 and 240 bpm." });
    if (elevationGain !== null && elevationGain < 0) errors.push({ field: "elevationGain", message: "Elevation gain cannot be negative." });
    const actual = {
      distance: distance === null ? null : Number(distance.toFixed(2)),
      unit,
      durationSeconds: duration,
      paceSecondsPerUnit: distance && duration ? Number((duration / distance).toFixed(2)) : null,
      rpe,
      averageHeartRate: averageHeartRate === null ? null : Math.round(averageHeartRate),
      elevationGain: elevationGain === null ? null : Number(elevationGain.toFixed(1)),
      notes: cleanText(input.notes),
      captureMethod: cleanText(input.captureMethod || "RUN_EXECUTION", 40) || "RUN_EXECUTION"
    };
    return { valid: errors.length === 0, errors, actual };
  }

  function convertDistance(distance, fromUnit = "mi", toUnit = "mi") {
    const value = finite(distance);
    if (value === null) return null;
    const from = String(fromUnit || "mi").toLowerCase();
    const to = String(toUnit || "mi").toLowerCase();
    if (from === to) return value;
    return from === "mi" && to === "km" ? value * KM_PER_MILE : value / KM_PER_MILE;
  }

  function expectedEffortRange(session = {}) {
    const matches = String(session.effortRpe || session.rpe || "").match(/\d+(?:\.\d+)?/g) || [];
    const values = matches.map(Number).filter(Number.isFinite);
    return values.length ? { low: Math.min(...values), high: Math.max(...values) } : null;
  }

  function buildVerdict(planned = {}, actual = {}, execution = {}) {
    const session = planned.session || planned;
    const plannedDistance = finite(session.distance);
    const plannedUnit = String(session.unit || actual.unit || "mi").toLowerCase() === "km" ? "km" : "mi";
    const actualInPlannedUnit = convertDistance(actual.distance, actual.unit, plannedUnit);
    const distanceRatio = plannedDistance && actualInPlannedUnit ? actualInPlannedUnit / plannedDistance : null;
    const pace = finite(actual.paceSecondsPerUnit) || (finite(actual.durationSeconds) && finite(actual.distance) ? actual.durationSeconds / actual.distance : null);
    const effortRange = expectedEffortRange(session);
    const completedSegments = (execution.segments || []).filter((segment) => segment.state === "COMPLETE").length;
    const segmentCount = (execution.segments || []).length;
    const segmentRatio = segmentCount ? completedSegments / segmentCount : null;
    let code = "ON_TARGET";
    let tone = "green";
    let completionState = "COMPLETE";
    let headline = "Run secured";
    let detail = "The recorded distance satisfies the assigned run. Keep the approved plan unchanged.";
    if (execution.painReported || actual.painReported) {
      code = "SAFETY_REVIEW";
      tone = "red";
      completionState = "PAIN_HOLD";
      headline = "Recovery order required";
      detail = "Pain overrides pace and volume. Stop the session and review readiness before the next run.";
    } else if (distanceRatio !== null && distanceRatio < 0.9) {
      code = "PARTIAL";
      tone = "yellow";
      completionState = "PARTIAL";
      headline = "Partial run secured";
      detail = "The work counts, but the recorded distance did not complete the assigned dose. No penalty and no silent plan change.";
    } else if (distanceRatio !== null && distanceRatio > 1.15) {
      code = "EXCEEDED";
      tone = "yellow";
      headline = "Assignment exceeded";
      detail = "The recorded distance materially exceeded the assignment. Atlas will watch recovery before recommending more work.";
    } else if (effortRange && finite(actual.rpe) !== null && actual.rpe > effortRange.high + 1.5) {
      code = "EFFORT_REVIEW";
      tone = "yellow";
      headline = "Effort exceeded the order";
      detail = "Distance was secured, but reported effort was materially higher than prescribed. The approved plan remains unchanged pending recovery evidence.";
    }
    return {
      version: VERSION,
      code,
      tone,
      completionState,
      headline,
      detail,
      plannedDistance,
      plannedUnit,
      actualDistance: finite(actual.distance),
      actualUnit: actual.unit || plannedUnit,
      distanceRatio: distanceRatio === null ? null : Number(clamp(distanceRatio, 0, 9.99).toFixed(3)),
      completionPercent: distanceRatio === null ? null : Math.round(clamp(distanceRatio * 100, 0, 999)),
      paceSecondsPerUnit: pace === null ? null : Number(pace.toFixed(2)),
      rpe: finite(actual.rpe),
      completedSegments,
      segmentCount,
      segmentCompletionPercent: segmentRatio === null ? null : Math.round(segmentRatio * 100)
    };
  }

  function applyActual(execution = {}, actual = {}, verdict = {}, completedAt = new Date().toISOString()) {
    return {
      ...execution,
      state: verdict.completionState || "PARTIAL",
      actual: { ...actual },
      verdict: { ...verdict },
      painReported: verdict.completionState === "PAIN_HOLD" || Boolean(execution.painReported),
      durationSeconds: actual.durationSeconds,
      notes: cleanText(actual.notes || execution.notes),
      completedAt,
      updatedAt: completedAt
    };
  }

  function formatDuration(totalSeconds = 0) {
    const total = Math.max(0, Math.round(finite(totalSeconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  return Object.freeze({ VERSION, durationSeconds, validateActual, convertDistance, buildVerdict, applyActual, formatDuration });
});
