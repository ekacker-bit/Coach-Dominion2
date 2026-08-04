const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/meal-execution.js");

function order(overrides = {}) {
  return engine.buildMealOrder({
    date: "2026-08-04",
    nextMeal: { index: 2, label: "Post-training meal", note: "Prioritize recovery fuel.", calories: 700, protein: 45, carbs: 85, fat: 20, basis: "CALENDAR PHASE" },
    remaining: { metrics: {
      calories: { remaining: 900 }, protein: { remaining: 65 }, carbs: { remaining: 120 }, fat: { remaining: 28 }
    } },
    preferences: { diet: "OMNIVORE", prep: "STANDARD", exclusions: [] },
    now: "2026-08-04T17:00:00.000Z",
    ...overrides
  });
}

test("023E exposes a deterministic precision-meal engine", () => {
  assert.equal(engine.VERSION, "023E.1");
  assert.equal(order().status, "READY");
});

test("a meal uses the remaining target without changing the approved target", () => {
  const result = order();
  assert.equal(result.target.protein, 45);
  assert.equal(result.target.carbs, 85);
  assert.ok(result.estimate.protein > 0);
  assert.ok(result.components.some((item) => item.kind === "protein"));
  assert.match(result.evidencePolicy, /never replace imported/i);
});

test("food swaps recalculate the meal while keeping the target stable", () => {
  const first = order();
  const swapped = order({ selection: { ...first.selection, protein: "SALMON", carb: "POTATO" } });
  assert.equal(swapped.selection.protein, "SALMON");
  assert.equal(swapped.selection.carb, "POTATO");
  assert.equal(swapped.target.protein, first.target.protein);
  assert.notDeepEqual(swapped.estimate, first.estimate);
});

test("diet and exclusion filters remove incompatible suggestions", () => {
  const result = order({ preferences: { diet: "PLANT_BASED", prep: "STANDARD", exclusions: ["SOY"] } });
  assert.equal(result.status, "READY");
  assert.equal(result.selection.protein, "LENTILS");
  assert.ok(result.options.protein.every((item) => !["CHICKEN", "SALMON", "GREEK_YOGURT", "TOFU"].includes(item.key)));
});

test("an impossible filter set blocks the suggestion instead of inventing food", () => {
  const result = order({ preferences: { diet: "PLANT_BASED", prep: "STANDARD", exclusions: ["SOY", "GLUTEN", "DAIRY", "FISH"] } });
  assert.notEqual(result.status, "NEEDS TARGETS");
});

test("planning and confirming create supplemental evidence only", () => {
  const planned = engine.planMeal(order(), { now: "2026-08-04T17:05:00.000Z" });
  const confirmed = engine.confirmMeal(planned, { calories: 675, protein: 48, carbs: 80, fat: 18 }, { now: "2026-08-04T18:00:00.000Z" });
  assert.equal(planned.status, "PLANNED");
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.actual.calories, 675);
  assert.equal(confirmed.actualSource, "SELF_REPORTED_ACTUAL");
  assert.match(confirmed.evidencePolicy, /Imported daily totals remain authoritative/);
});

test("record reconciliation is idempotent across devices", () => {
  const planned = engine.planMeal(order());
  const confirmed = engine.confirmMeal(planned, {}, { now: "2026-08-04T18:00:00.000Z" });
  const history = engine.mergeRecord([planned, planned], confirmed);
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "CONFIRMED");
});

test("missing targets return a setup state", () => {
  const result = engine.buildMealOrder({ date: "2026-08-04", nextMeal: null, remaining: {} });
  assert.equal(result.status, "NEEDS TARGETS");
});

