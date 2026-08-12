const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/fuel-execution.js");

function execution(calories = 2100, protein = 175) {
  return { date: "2026-08-12", metrics: { calories: { actual: calories, target: 2200, remaining: 100 }, protein: { actual: protein, target: 180, remaining: 5 }, carbs: { actual: 220, target: 240, remaining: 20 }, fat: { actual: 65, target: 70, remaining: 5 } }, calendarContext: { trainingDay: true, splitDay: true, sessions: [{ windowLabel: "AM" }, { windowLabel: "PM" }] } };
}

test("025T issues a secured Fuel verdict without changing targets", () => {
  const verdict = engine.buildVerdict({ execution: execution(), loop: { reconciliation: { source: "MyFitnessPal", reviewRequired: false } } });
  assert.equal(engine.VERSION, "025T.1");
  assert.equal(verdict.code, "ON_TARGET");
  assert.match(verdict.safeguard, /never change/i);
});

test("missing intake is incomplete evidence and under-fueling does not trigger restriction", () => {
  const missing = engine.buildVerdict({ execution: { metrics: {} }, loop: {} });
  const low = engine.buildVerdict({ execution: execution(1500, 120), loop: { reconciliation: { reviewRequired: false } } });
  assert.equal(missing.code, "INCOMPLETE_EVIDENCE");
  assert.equal(low.code, "UNDER_FUELED");
  assert.match(low.detail, /do not compensate or restrict/i);
});

test("split days receive an inter-session order and verdict receipt", () => {
  const loop = { status: "CLOSE DAY", primaryAction: { id: "close-fuel", label: "Close Fuel" }, reconciliation: { source: "Manual", reviewRequired: false } };
  const order = engine.buildOrder({ execution: execution(), loop, calendarContext: execution().calendarContext });
  const receipt = engine.attachVerdict({ date: "2026-08-12", status: "SEALED" }, order);
  assert.equal(order.splitDay, true);
  assert.equal(order.hydrationLiters, 3.5);
  assert.match(order.timing, /AM and PM/i);
  assert.equal(receipt.verdict.code, "ON_TARGET");
});
