const test = require("node:test");
const assert = require("node:assert/strict");
const {
  VERSION,
  selectNextMeal,
  primaryAction,
  buildFuelCommand
} = require("../assets/js/fuel-command.js");

function execution(overrides = {}) {
  return {
    date: "2026-08-03",
    status: "EXECUTE",
    source: "MYFITNESSPAL",
    sourceLabel: "MyFitnessPal",
    freshness: { state: "CURRENT", label: "Current for today" },
    readiness: "GREEN",
    trainingDay: true,
    trainingWindowLabel: "Evening session",
    instruction: "Complete the approved daily targets.",
    metrics: {
      calories: { actual: 1400, target: 2400, remaining: 1000, percent: 58, status: "REMAINING" },
      protein: { actual: 95, target: 170, remaining: 75, percent: 56, status: "REMAINING" },
      carbs: { actual: 150, target: 300, remaining: 150, percent: 50, status: "REMAINING" },
      fat: { actual: 45, target: 75, remaining: 30, percent: 60, status: "REMAINING" }
    },
    warnings: [],
    safeguards: ["No compensatory restriction is recommended."],
    ...overrides
  };
}

function mealPlan(overrides = {}) {
  return {
    status: "FUELING MAP ACTIVE",
    evidenceMessage: "No meal-level import is available for this date; the map remains a planning aid.",
    meals: [],
    slots: [
      { label: "Breakfast", note: "Start protein distribution.", calories: 600, protein: 43, carbs: 75, fat: 19 },
      { label: "Midday meal", note: "Continue steady fueling.", calories: 600, protein: 43, carbs: 75, fat: 19 },
      { label: "Pre-training meal", note: "Use familiar fuel before training.", calories: 600, protein: 42, carbs: 75, fat: 18 },
      { label: "Post-training meal", note: "Prioritize recovery fuel.", calories: 600, protein: 42, carbs: 75, fat: 19 }
    ],
    ...overrides
  };
}

test("023A exposes a versioned deterministic Fuel engine", () => {
  assert.equal(VERSION, "023A.1");
});

test("023A makes baseline approval the one action when targets are missing", () => {
  const result = buildFuelCommand({ execution: execution({ status: "SETUP REQUIRED", metrics: {} }), mealPlan: { slots: [] } });
  assert.equal(result.primaryAction.id, "set-baseline");
  assert.equal(result.primaryAction.route, "plan");
  assert.match(result.headline, /baseline/i);
});

test("023A routes stale MyFitnessPal evidence to sync", () => {
  const result = buildFuelCommand({
    execution: execution({ status: "AWAITING INTAKE", freshness: { state: "HISTORICAL", label: "Latest evidence 2026-08-02" } }),
    mealPlan: mealPlan()
  });
  assert.deepEqual(primaryAction(result.status === "AWAITING INTAKE" ? execution({ status: result.status, freshness: { state: "HISTORICAL" } }) : null), {
    id: "sync-intake", label: "Sync nutrition", route: "connected"
  });
  assert.equal(result.primaryAction.id, "sync-intake");
  assert.match(result.detail, /Missing evidence is not a missed standard/);
});

test("023A chooses one next meal from distinct imported meal evidence", () => {
  const plan = mealPlan({ meals: [{ name: "Breakfast" }, { name: "Breakfast" }, { name: "Lunch" }] });
  const next = selectNextMeal(plan, 8);
  assert.equal(next.index, 2);
  assert.equal(next.label, "Pre-training meal");
  assert.equal(next.basis, "MEAL EVIDENCE");
});

test("023A uses time of day when meal evidence is absent", () => {
  assert.equal(selectNextMeal(mealPlan(), 9).label, "Breakfast");
  assert.equal(selectNextMeal(mealPlan(), 15).label, "Pre-training meal");
  assert.equal(selectNextMeal(mealPlan(), 20).label, "Post-training meal");
});

test("023A presents remaining targets without changing approved values", () => {
  const result = buildFuelCommand({ execution: execution(), mealPlan: mealPlan(), now: 15 });
  const protein = result.metrics.find((metric) => metric.key === "protein");
  assert.equal(protein.target, 170);
  assert.equal(protein.remaining, 75);
  assert.equal(result.nextMeal.label, "Pre-training meal");
  assert.ok(result.safeguards.some((item) => item.includes("No compensatory restriction")));
});


