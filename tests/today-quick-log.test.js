"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const QuickLog = require("../assets/js/today-quick-log.js");

test("normalizes a compact run duration without losing precision", () => {
  const run = QuickLog.normalizeRun({ runType: "LONG", runDistance: "12.5", runUnit: "mi", runMinutes: "125.5" });
  assert.equal(run.distance, 12.5);
  assert.equal(run.hours, 2);
  assert.equal(run.minutes, 5);
  assert.equal(run.seconds, 30);
});

test("requires complete run and Fuel totals only when those sections are started", () => {
  const partial = QuickLog.validate({ runDistance: "5", calories: "2200", protein: "180" });
  assert.equal(partial.valid, false);
  assert.match(partial.errors.map((item) => item.field).join(","), /runMinutes/);
  assert.match(partial.errors.map((item) => item.field).join(","), /carbs/);
  assert.match(partial.errors.map((item) => item.field).join(","), /fat/);

  const complete = QuickLog.validate({
    runDistance: "5", runMinutes: "42", runUnit: "mi", runType: "EASY",
    calories: "2200", protein: "180", carbs: "240", fat: "70",
    selfReportedSteps: "9000"
  }, { closeoutReady: true });
  assert.equal(complete.valid, true);
  assert.deepEqual(complete.sections, { run: true, fuel: true, closeout: true });
  assert.equal(complete.stepsWillDraft, false);
});

test("protects steps as a draft until closeout is ready", () => {
  const result = QuickLog.validate({ selfReportedSteps: "8400" }, { closeoutReady: false });
  assert.equal(result.valid, true);
  assert.equal(result.stepsWillDraft, true);
  assert.equal(result.closeout.selfReportedSteps, 8400);
});

test("does not manufacture a run draft from default selectors", () => {
  const empty = QuickLog.draftSections({ runType: "EASY", runUnit: "mi", calories: "", protein: "" });
  assert.deepEqual(empty.running, {});
  const started = QuickLog.draftSections({ runType: "TEMPO", runUnit: "km", runDistance: "8", runMinutes: "40" });
  assert.equal(started.running.distance, "8");
  assert.equal(started.running.runType, "TEMPO");
  const long = QuickLog.draftSections({ runType: "LONG", runUnit: "mi", runDistance: "12.5", runMinutes: "125.5" });
  assert.deepEqual([long.running.hours, long.running.minutes, long.running.seconds], ["2", "5", "30"]);
});

test("active recruits with a committed week are not sent back through stale setup", () => {
  assert.equal(QuickLog.shouldSuppressSetup({
    programState: "ACTIVE", hasCommittedWeek: true, truthState: "PLANS_REQUIRED", hardBlocker: ""
  }), true);
  assert.equal(QuickLog.shouldSuppressSetup({
    programState: "ACTIVE", hasCommittedWeek: true, truthState: "PLANS_REQUIRED", hardBlocker: "CONTRACT_CONFLICT"
  }), false);
  assert.equal(QuickLog.shouldSuppressSetup({
    programState: "DRAFT", hasCommittedWeek: false, truthState: "PLANS_REQUIRED", hardBlocker: ""
  }), false);
});

test("daily reporting progress counts only applicable work", () => {
  const result = QuickLog.progress({
    workoutApplicable: true, workoutComplete: true,
    runApplicable: false, runComplete: false,
    fuelComplete: true, closeoutComplete: false
  });
  assert.equal(result.completed, 2);
  assert.equal(result.total, 3);
  assert.equal(result.percent, 67);
  assert.deepEqual(result.missingLabels, ["Closeout"]);
});
