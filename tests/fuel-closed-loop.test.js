const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/fuel-closed-loop.js");

const confirmedMeal = {
  id: "meal-2026-08-04-2-1",
  date: "2026-08-04",
  status: "CONFIRMED",
  name: "chicken + rice recovery plate",
  slotLabel: "Post-training meal",
  actual: { calories: 650, protein: 48, carbs: 78, fat: 16 },
  confirmedAt: "2026-08-04T18:00:00.000Z",
  updatedAt: "2026-08-04T18:00:00.000Z"
};

function execution(overrides = {}) {
  return {
    date: "2026-08-04",
    status: "EXECUTE",
    source: "MYFITNESSPAL",
    sourceLabel: "MyFitnessPal",
    metrics: {
      calories: { actual: 1550, target: 2200, remaining: 650, status: "BELOW PLAN" },
      protein: { actual: 120, target: 180, remaining: 60, status: "BELOW PLAN" },
      carbs: { actual: 160, target: 240, remaining: 80, status: "BELOW PLAN" },
      fat: { actual: 52, target: 70, remaining: 18, status: "BELOW PLAN" }
    },
    ...overrides
  };
}

function mealLedger(current = confirmedMeal) {
  return { current, history: [current], preferences: {} };
}

test("023F exposes a versioned Fuel closed-loop engine", () => {
  assert.equal(engine.VERSION, "023F.1");
});

test("confirmed meals reconcile inside authoritative daily totals without double counting", () => {
  const result = engine.reconcileDay({ date: "2026-08-04", execution: execution(), mealLedger: mealLedger() });
  assert.equal(result.state, "RECONCILED");
  assert.equal(result.confirmed.calories, 650);
  assert.equal(result.metrics.calories.actual, 1550);
  assert.match(result.detail, /not counted twice/i);
  assert.match(result.doubleCountPolicy, /authoritative daily total is used once/i);
});

test("a stale daily total is flagged for refresh instead of adding the meal again", () => {
  const result = engine.reconcileDay({
    date: "2026-08-04",
    execution: execution({ metrics: { ...execution().metrics, calories: { actual: 400, target: 2200, remaining: 1800 } } }),
    mealLedger: mealLedger()
  });
  assert.equal(result.state, "SYNC_BEHIND");
  assert.equal(result.reviewRequired, true);
  assert.match(result.detail, /do not add the meal again/i);
});

test("missing daily totals remain incomplete evidence rather than noncompliance", () => {
  const empty = Object.fromEntries(Object.keys(execution().metrics).map((key) => [key, { actual: null, target: execution().metrics[key].target, remaining: execution().metrics[key].target }]));
  const result = engine.reconcileDay({ date: "2026-08-04", execution: execution({ sourceLabel: "No intake source", metrics: empty }), mealLedger: mealLedger() });
  assert.equal(result.state, "AWAITING_TOTALS");
  assert.equal(result.reviewRequired, false);
  assert.match(result.detail, /not added to the day/i);
});

test("a confirmed meal becomes a short post-meal check-in", () => {
  const loop = engine.buildFuelLoop({ date: "2026-08-04", execution: execution(), mealLedger: mealLedger(), ledger: {}, now: 18 });
  assert.equal(loop.status, "CHECK IN");
  assert.equal(loop.primaryAction.id, "rate-meal");
  const feedback = engine.buildMealFeedback(loop.latestMeal, { hungerAfter: 2, fullness: 4, energy: 5, cravings: 1, digestion: "GOOD", note: "Strong training recovery." }, { now: "2026-08-04T18:30:00.000Z" });
  assert.equal(feedback.mealId, confirmedMeal.id);
  assert.equal(feedback.energy, 5);
});

test("a post-meal check-in opens the daily closeout at day end", () => {
  const feedback = engine.buildMealFeedback(confirmedMeal, { hungerAfter: 2, fullness: 4, energy: 4, cravings: 1, digestion: "GOOD" });
  const loop = engine.buildFuelLoop({ date: "2026-08-04", execution: execution(), mealLedger: mealLedger(), ledger: { feedback: [feedback] }, now: 20 });
  assert.equal(loop.status, "CLOSE DAY");
  assert.equal(loop.primaryAction.id, "close-fuel");
  const closeout = engine.closeFuelDay(loop, { note: "Plan worked." }, { now: "2026-08-04T20:30:00.000Z" });
  assert.equal(closeout.status, "SEALED");
  assert.equal(closeout.source, "MyFitnessPal");
  assert.equal(closeout.evidenceConfidence, "VERIFIED DAILY TOTAL");
  assert.match(closeout.targetChangePolicy, /No approved target changed/i);
});

test("sealed closeouts are idempotent and amend by revision", () => {
  const feedback = engine.buildMealFeedback(confirmedMeal, { hungerAfter: 3, fullness: 3, energy: 4, cravings: 2, digestion: "OK" });
  const loop = engine.buildFuelLoop({ date: "2026-08-04", execution: execution(), mealLedger: mealLedger(), ledger: { feedback: [feedback] }, now: 20 });
  const first = engine.closeFuelDay(loop, {}, { now: "2026-08-04T20:00:00.000Z" });
  const amended = engine.closeFuelDay(loop, { note: "Updated note." }, { previous: first, now: "2026-08-04T21:00:00.000Z" });
  const records = engine.mergeById([first, first], amended);
  assert.equal(records.length, 1);
  assert.equal(records[0].revision, 2);
});

test("weekly summaries identify a repeatable meal pattern without changing targets", () => {
  const post = engine.buildMealFeedback(confirmedMeal, { hungerAfter: 2, fullness: 4, energy: 5, cravings: 1, digestion: "GOOD" });
  const breakfastMeal = { ...confirmedMeal, id: "meal-2026-08-03-1-1", date: "2026-08-03", slotLabel: "First meal", name: "yogurt + oats" };
  const breakfast = engine.buildMealFeedback(breakfastMeal, { hungerAfter: 4, fullness: 2, energy: 3, cravings: 4, digestion: "OK" });
  const summary = engine.summarizeWeek({ feedback: [post, breakfast], closeouts: [] }, { start: "2026-08-01", end: "2026-08-07" });
  assert.equal(summary.feedbackCount, 2);
  assert.equal(summary.bestPattern.label, "Post-training meal");
  assert.equal(summary.confidence, "EARLY");
});

