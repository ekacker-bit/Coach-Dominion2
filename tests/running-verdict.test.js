const test = require("node:test");
const assert = require("node:assert/strict");
const verdict = require("../assets/js/running-verdict.js");

const planned = { session: { type: "EASY", distance: 5, unit: "mi", effortRpe: "3-5" } };

test("actual run validation requires distance and elapsed time", () => {
  const invalid = verdict.validateActual({ distance: "", minutes: 0 });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 2);
  const valid = verdict.validateActual({ distance: 5.02, unit: "mi", minutes: 42, seconds: 7, rpe: 5, averageHeartRate: 148 });
  assert.equal(valid.valid, true);
  assert.equal(valid.actual.durationSeconds, 2527);
  assert.equal(valid.actual.paceSecondsPerUnit, 503.39);
});

test("a recorded run near the assigned distance is secured", () => {
  const actual = verdict.validateActual({ distance: 4.8, unit: "mi", minutes: 41, rpe: 5 }).actual;
  const result = verdict.buildVerdict(planned, actual, { segments: [{ state: "COMPLETE" }] });
  assert.equal(result.code, "ON_TARGET");
  assert.equal(result.completionState, "COMPLETE");
  assert.equal(result.completionPercent, 96);
});

test("a short run remains truthful partial evidence", () => {
  const actual = verdict.validateActual({ distance: 3.5, unit: "mi", minutes: 34, rpe: 7 }).actual;
  const result = verdict.buildVerdict(planned, actual, {});
  assert.equal(result.code, "PARTIAL");
  assert.equal(result.completionState, "PARTIAL");
});

test("excess volume and excess effort trigger bounded review without rewriting the plan", () => {
  const long = verdict.buildVerdict(planned, verdict.validateActual({ distance: 6, unit: "mi", minutes: 55, rpe: 6 }).actual, {});
  assert.equal(long.code, "EXCEEDED");
  assert.equal(long.completionState, "COMPLETE");
  const hard = verdict.buildVerdict(planned, verdict.validateActual({ distance: 5, unit: "mi", minutes: 50, rpe: 9 }).actual, {});
  assert.equal(hard.code, "EFFORT_REVIEW");
});

test("pain always wins and applying actuals preserves the prescribed session", () => {
  const actual = { ...verdict.validateActual({ distance: 2, unit: "mi", minutes: 20 }).actual, painReported: true };
  const result = verdict.buildVerdict(planned, actual, { painReported: true });
  const execution = verdict.applyActual({ session: planned.session }, actual, result, "2026-08-12T01:00:00.000Z");
  assert.equal(execution.state, "PAIN_HOLD");
  assert.equal(execution.session.distance, 5);
  assert.equal(execution.actual.distance, 2);
});

test("kilometres compare correctly with mile assignments", () => {
  const actual = verdict.validateActual({ distance: 8, unit: "km", minutes: 45 }).actual;
  const result = verdict.buildVerdict(planned, actual, {});
  assert.equal(result.code, "ON_TARGET");
  assert.ok(result.completionPercent >= 99 && result.completionPercent <= 100);
});
