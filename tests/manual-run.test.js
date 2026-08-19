const assert = require("node:assert/strict");
const test = require("node:test");
const manualRun = require("../assets/js/manual-run.js");

test("manual run capture converts clock time and calculates pace", () => {
  const result = manualRun.validate({ date: "2026-08-11", runType: "EASY", distance: 5, unit: "mi", hours: 0, minutes: 42, seconds: 30 }, { today: "2026-08-11" });
  assert.equal(result.valid, true);
  assert.equal(result.run.durationSeconds, 2550);
  assert.equal(result.run.paceSecondsPerUnit, 510);
  assert.equal(manualRun.formatPace(result.run.paceSecondsPerUnit, "mi"), "8:30 /mi");
});

test("manual run capture rejects missing distance and duration", () => {
  const result = manualRun.validate({ date: "2026-08-11", distance: 0, minutes: 0 }, { today: "2026-08-11" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map((error) => error.field), ["distance", "duration"]);
});

test("manual run becomes canonical self-reported Performance evidence", () => {
  const entry = manualRun.buildPerformanceEntry({
    date: "2026-08-11",
    runType: "LONG",
    distance: 12.4,
    unit: "mi",
    hours: 1,
    minutes: 48,
    seconds: 12,
    rpe: 7,
    averageHeartRate: 151,
    elevationGain: 620,
    countTowardToday: true,
    assignmentId: "run-long-2026-08-11",
    notes: "Steady finish"
  }, { userId: "recruit-1", today: "2026-08-11", createdAt: "2026-08-11T14:00:00.000Z" });
  assert.match(entry.id, /^manual-run-/);
  assert.equal(entry.domain, "running");
  assert.equal(entry.entryType, "WORKOUT_SUMMARY");
  assert.equal(entry.source, "MANUAL");
  assert.equal(entry.evidenceStatus, "SELF REPORTED");
  assert.equal(entry.metrics.capture_method, "MANUAL_RUN_FORM");
  assert.equal(entry.metrics.count_toward_today, true);
  assert.equal(entry.metrics.assignment_id, "run-long-2026-08-11");
  assert.equal(entry.metrics.average_heart_rate, 151);
});

test("race entry retains race classification", () => {
  const entry = manualRun.buildPerformanceEntry({ date: "2026-08-11", runType: "RACE", distance: 5, unit: "km", minutes: 22 }, { today: "2026-08-11", createdAt: "2026-08-11T14:00:00.000Z" });
  assert.equal(entry.entryType, "RACE");
  assert.equal(entry.metrics.run_type, "RACE");
});
