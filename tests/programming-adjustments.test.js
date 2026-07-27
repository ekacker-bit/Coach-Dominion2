const assert = require("node:assert/strict");
const programming = require("../assets/js/programming.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

const entry = (overrides = {}) => ({
  domain: "strength", activityName: "Bench Press", performanceDate: "2026-07-27",
  evidenceStatus: "VERIFIED", source: "IMPORTED",
  metrics: { sets: 3, repetitions: 5, weight: 185, weight_unit: "lb" },
  ...overrides
});

test("GREEN readiness permits conservative progression", () => {
  assert.equal(programming.readinessPolicy({ state: "GREEN", pain: false }).code, "PROGRESS");
});
test("pain forces a deload policy", () => {
  assert.equal(programming.readinessPolicy({ state: "GREEN", pain: true }).code, "DELOAD");
});
test("two successful exposures support a small load increase", () => {
  const result = programming.buildProgrammingRecommendation({
    entries: [entry(), entry({ performanceDate: "2026-07-20" })],
    readiness: { state: "GREEN", pain: false },
    compliance: { strengthStatus: "completed" }
  });
  assert.equal(result.exercises[0].action, "PROGRESS");
  assert.equal(result.exercises[0].recommendedLoad, 190);
});
test("unconfirmed compliance repeats instead of progressing", () => {
  const result = programming.buildProgrammingRecommendation({
    entries: [entry(), entry({ performanceDate: "2026-07-20" })],
    readiness: { state: "GREEN", pain: false },
    compliance: { strengthStatus: "partial" }
  });
  assert.equal(result.exercises[0].action, "REPEAT");
});
test("YELLOW readiness reduces volume without adding load", () => {
  const result = programming.buildProgrammingRecommendation({
    entries: [entry()],
    readiness: { state: "YELLOW", soreness: 8, pain: false },
    compliance: { strengthStatus: "completed" }
  });
  assert.equal(result.exercises[0].action, "HOLD_LOAD_REDUCE_VOLUME");
  assert.equal(result.exercises[0].recommendedSets, 2);
  assert.equal(result.exercises[0].recommendedLoad, 185);
});
test("prescription formatting is deterministic", () => {
  const result = programming.buildProgrammingRecommendation({
    entries: [entry()],
    readiness: { state: "GREEN", pain: false },
    compliance: { strengthStatus: "completed" }
  });
  assert.equal(programming.formatPrescription(result), "Bench Press 3x5 @ 185 lb");
});

console.log(`Programming adjustments: ${passed} assertions passed.`);
