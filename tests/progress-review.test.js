const test = require("node:test");
const assert = require("node:assert/strict");
const review = require("../assets/js/progress-review.js");

function checkIns(waists = [36, 35.8, 35.5, 35.2], start = "2026-07-05") {
  const base = new Date(`${start}T12:00:00Z`);
  return waists.map((waist, index) => ({
    date: new Date(base.getTime() + index * 7 * 86400000).toISOString().slice(0, 10),
    values: { waist, body_fat: 20 - index * 0.2 }
  }));
}

function trends(overrides = {}) {
  return {
    weight: { observations: 12, change: -2 },
    nutrition: { evidenceDays: 21, value: 88 },
    training: { observations: 12, strengthSessions: 10, strengthDelta: 1, runSessions: 6, runDelta: 4, totalSessionDays: 16 },
    readiness: { observations: 20, value: 7 },
    discipline: { observations: 4, value: 91 },
    ...overrides
  };
}

function input(overrides = {}) {
  return {
    today: "2026-07-27",
    contract: { primaryGoal: "LOSE_FAT" },
    bodyOutcome: {
      goal: "LOSE_FAT",
      measurements: { checkIns: checkIns() },
      weight: { change: -2 }
    },
    trends: trends(),
    generatedAt: "2026-07-27T13:00:00.000Z",
    ...overrides
  };
}

test("a four-week comparable window creates one progress review", () => {
  const result = review.buildProgressReview(input());
  assert.equal(result.status, "READY");
  assert.equal(result.classification, "ADVANCING");
  assert.equal(result.evidence.score, 100);
  assert.equal(result.recommendation.code, "HOLD_PLAN");
  assert.equal(result.plansChanged, false);
});

test("fewer than four checkpoints keeps the review in evidence-building mode", () => {
  const result = review.buildProgressReview(input({
    bodyOutcome: { measurements: { checkIns: checkIns().slice(0, 3) }, weight: { change: -1 } }
  }));
  assert.equal(result.status, "BUILDING");
  assert.equal(result.cycleCount, 3);
  assert.match(result.headline, /1 checkpoint/);
});

test("flat fat-loss outcome with strong execution recommends a bounded Nutrition review", () => {
  const flat = checkIns([36, 36, 36, 36]).map((item) => ({ ...item, values: { ...item.values, body_fat: 20 } }));
  const result = review.buildProgressReview(input({
    bodyOutcome: { goal: "LOSE_FAT", measurements: { checkIns: flat }, weight: { change: 0 } },
    trends: trends({ weight: { observations: 12, change: 0 } })
  }));
  assert.equal(result.classification, "HOLDING");
  assert.equal(result.recommendation.code, "REVIEW_NUTRITION");
  assert.equal(result.recommendation.requiresPlanApproval, true);
});

test("low readiness overrides outcome momentum and protects recovery", () => {
  const result = review.buildProgressReview(input({
    readinessPain: true,
    trends: trends({ readiness: { observations: 20, value: 4.5 } })
  }));
  assert.equal(result.classification, "REGRESSING");
  assert.equal(result.recommendation.code, "PROTECT_RECOVERY");
  assert.equal(result.recommendation.requiresPlanApproval, false);
});

test("a completed review starts a fresh four-checkpoint cycle", () => {
  const ready = review.buildProgressReview(input());
  const completed = review.resolveProgressReview(ready, "ACCEPT", {
    resolvedAt: "2026-07-27T14:00:00.000Z",
    userId: "user-1"
  });
  const oneNew = [...checkIns(), ...checkIns([35.1], "2026-08-02")];
  const result = review.buildProgressReview(input({
    today: "2026-08-02",
    priorReview: completed,
    bodyOutcome: { goal: "LOSE_FAT", measurements: { checkIns: oneNew }, weight: { change: -2.2 } }
  }));
  assert.equal(result.status, "MONITORING");
  assert.equal(result.cycleCount, 1);
  assert.equal(result.cycleTarget, 4);
});

test("review decisions never mutate a plan directly", () => {
  const ready = review.buildProgressReview(input());
  const accepted = review.resolveProgressReview(ready, "ACCEPT", { resolvedAt: "2026-07-27T14:00:00.000Z" });
  const held = review.resolveProgressReview(ready, "HOLD", { resolvedAt: "2026-07-27T14:00:00.000Z" });
  const deferred = review.resolveProgressReview(ready, "REASSESS_LATER", { resolvedAt: "2026-07-27T14:00:00.000Z" });
  assert.equal(accepted.status, "CONFIRMED");
  assert.equal(accepted.plansChanged, false);
  assert.equal(held.status, "HELD");
  assert.equal(deferred.status, "DEFERRED");
  assert.equal(deferred.reassessDate, "2026-08-03");
});

test("a deferred review reopens on its reassessment date", () => {
  const ready = review.buildProgressReview(input());
  const deferred = review.resolveProgressReview(ready, "REASSESS_LATER", { resolvedAt: "2026-07-27T14:00:00.000Z" });
  const reopened = review.buildProgressReview(input({ today: "2026-08-03", priorReview: deferred }));
  assert.equal(reopened.id, ready.id);
  assert.equal(reopened.status, "READY");
});

console.log(`Build 022C progress review: ${review.VERSION}`);

