const test = require("node:test");
const assert = require("node:assert/strict");
const body = require("../assets/js/body-composition.js");

const checkIn = (date, metrics = {}) => ({
  id: `body-${date}`,
  performanceDate: date,
  domain: "body_metrics",
  activityCode: "body_composition_checkin",
  metrics: { circumference_unit: "in", ...metrics }
});

test("centimeters normalize to comparable inches", () => {
  assert.equal(body.circumferenceInches(81.28, "cm"), 32);
  assert.equal(body.displayCircumference(32, "cm"), 81.3);
});

test("weekly check-in requires a date and at least one measurement", () => {
  const result = body.buildCheckInEntry({}, { today: "2026-08-02" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /date/i);
  assert.match(result.errors.join(" "), /at least one/i);
});

test("weekly check-in rejects future evidence", () => {
  const result = body.buildCheckInEntry({ date: "2026-08-03", waist: 32 }, { today: "2026-08-02" });
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /future/i);
});

test("weekly check-in produces one multi-measurement performance entry", () => {
  const result = body.buildCheckInEntry({ date: "2026-08-02", unit: "in", waist: 32, chest: 41, body_fat: 14.5 }, {
    today: "2026-08-02", userId: "recruit-1", id: "entry-1", now: "2026-08-02T12:00:00Z"
  });
  assert.equal(result.valid, true);
  assert.equal(result.entry.domain, "body_metrics");
  assert.equal(result.entry.entryType, "MEASUREMENT");
  assert.equal(result.entry.metrics.waist, 32);
  assert.equal(result.entry.metrics.body_fat, 14.5);
});

test("legacy single measurements remain readable", () => {
  const normalized = body.normalizeBodyEntry({
    performanceDate: "2026-07-20",
    domain: "body_metrics",
    metrics: { measurement_location: "waist", measurement_value: 82, measurement_unit: "cm" }
  });
  assert.equal(Number(normalized.values.waist.toFixed(2)), 32.28);
});

test("measurement summary excludes future rows and calculates baseline change", () => {
  const summary = body.summarizeMeasurements([
    checkIn("2026-07-01", { waist: 34 }),
    checkIn("2026-08-01", { waist: 32.5 }),
    checkIn("2026-08-03", { waist: 20 })
  ], "2026-08-02", 84);
  assert.equal(summary.count, 2);
  assert.equal(summary.summaries.waist.latest, 32.5);
  assert.equal(summary.summaries.waist.change, -1.5);
});

test("weight uses a seven-day average rather than one daily value", () => {
  const result = body.summarizeWeight([
    { date: "2026-07-01", weight: 185 },
    { date: "2026-07-27", weight: 181 },
    { date: "2026-07-30", weight: 180 },
    { date: "2026-08-02", weight: 179 }
  ], "2026-08-02", 84);
  assert.equal(result.latest, 179);
  assert.equal(result.sevenDayAverage, 180);
  assert.equal(result.change, -5);
});

test("fat-loss outcomes continue when waist is moving", () => {
  const model = body.buildOutcomeModel({
    today: "2026-08-02",
    performanceEntries: [checkIn("2026-07-01", { waist: 34 }), checkIn("2026-08-01", { waist: 33 })],
    contract: { primaryGoal: "LOSE_FAT" }
  });
  assert.equal(model.decision.code, "CONTINUE");
  assert.match(model.decision.detail, /preserve/i);
});

test("an adjustment is only reviewed when outcome is flat and execution evidence is strong", () => {
  const entries = [checkIn("2026-06-15", { waist: 34 }), checkIn("2026-07-10", { waist: 34 }), checkIn("2026-08-01", { waist: 34 })];
  const weak = body.buildOutcomeModel({ today: "2026-08-02", performanceEntries: entries, contract: { primaryGoal: "LOSE_FAT" }, signals: { discipline: 50, nutrition: 45 } });
  const strong = body.buildOutcomeModel({ today: "2026-08-02", performanceEntries: entries, contract: { primaryGoal: "LOSE_FAT" }, signals: { discipline: 90, nutrition: 85 } });
  assert.equal(weak.decision.code, "MONITOR");
  assert.equal(strong.decision.code, "REVIEW_ADJUSTMENT");
  assert.match(strong.decision.detail, /No calorie or training change is automatic/i);
});

test("weekly outcome evidence is optional and never represented as noncompliance", () => {
  const model = body.buildOutcomeModel({ today: "2026-08-02", performanceEntries: [], contract: {} });
  const summary = body.weeklyOutcomeSummary(model, "2026-07-27", "2026-08-02");
  assert.equal(summary.state, "NOT CAPTURED");
  assert.match(summary.detail, /does not reduce the discipline score/i);
});

test("weekly cadence distinguishes due, upcoming, and captured checkpoints", () => {
  assert.equal(body.checkpointCadence([], "2026-08-02").status, "DUE");
  assert.equal(body.checkpointCadence([checkIn("2026-07-30", { waist: 34 })], "2026-08-02").status, "UPCOMING");
  assert.equal(body.checkpointCadence([checkIn("2026-07-26", { waist: 34 })], "2026-08-02").status, "DUE");
  assert.equal(body.checkpointCadence([checkIn("2026-08-02", { waist: 34 })], "2026-08-02").status, "CAPTURED");
});

test("four-week review stays locked until four comparable checkpoints span 21 days", () => {
  const short = body.buildOutcomeModel({
    today: "2026-08-02",
    performanceEntries: [checkIn("2026-07-12", { waist: 34 }), checkIn("2026-07-19", { waist: 34 }), checkIn("2026-07-26", { waist: 34 })],
    contract: { primaryGoal: "LOSE_FAT" },
    signals: { discipline: 90, nutrition: 85 }
  });
  assert.equal(short.review.status, "BUILDING");
  assert.equal(short.review.checkpointsNeeded, 1);
});

test("flat four-week outcomes create a review proposal rather than a plan change", () => {
  const model = body.buildOutcomeModel({
    today: "2026-08-02",
    performanceEntries: [
      checkIn("2026-07-12", { waist: 34 }),
      checkIn("2026-07-19", { waist: 34 }),
      checkIn("2026-07-26", { waist: 34 }),
      checkIn("2026-08-02", { waist: 34 })
    ],
    contract: { primaryGoal: "LOSE_FAT" },
    signals: { discipline: 90, nutrition: 85 }
  });
  assert.equal(model.review.status, "PROPOSED");
  assert.equal(model.review.code, "INVESTIGATE");
  assert.equal(model.review.plansChanged, false);
});

test("authorizing an outcome review records consent without changing a plan", () => {
  const proposal = {
    id: "body-outcome:2026-08-02:REVIEW_ADJUSTMENT",
    status: "PROPOSED",
    nextSection: "nutrition",
    checkpoints: 4,
    elapsedDays: 21
  };
  const resolved = body.resolveOutcomeReview(proposal, "AUTHORIZE_REVIEW", {
    resolvedAt: "2026-08-02T12:00:00Z",
    userId: "recruit-1"
  });
  assert.equal(resolved.status, "AUTHORIZED");
  assert.equal(resolved.plansChanged, false);
  assert.match(resolved.detail, /remain unchanged/i);
});
