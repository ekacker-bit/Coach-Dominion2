const assert = require("node:assert/strict");
const trends = require("../assets/js/trends-intelligence.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

const today = "2026-08-02";
const inspection = (date, score, evidence = 80, finalized = true) => ({
  week_start_date: date,
  weekly_discipline_score: score,
  evidence_coverage: evidence,
  finalized_at: finalized ? `${date}T18:00:00Z` : null,
  domain_scores: {}
});
const daily = (date, values = {}) => ({ date, energy: 7, weight: 180, ...values });
const performance = (date, domain, metrics = {}) => ({ performanceDate: date, domain, metrics });

test("supported ranges normalize and invalid values fall back to four weeks", () => {
  assert.equal(trends.normalizeRangeDays(56), 56);
  assert.equal(trends.normalizeRangeDays("84"), 84);
  assert.equal(trends.normalizeRangeDays(30), 28);
});

test("range windows exclude future evidence and separate prior evidence", () => {
  const result = trends.splitRange([
    { date: "2026-06-15" },
    { date: "2026-07-10" },
    { date: "2026-08-01" },
    { date: "2026-08-03" }
  ], today, 28);
  assert.deepEqual(result.current.map((item) => item.date), ["2026-07-10", "2026-08-01"]);
  assert.deepEqual(result.prior.map((item) => item.date), ["2026-06-15"]);
});

test("discipline uses finalized weeks only and exposes the latest change", () => {
  const result = trends.summarizeDiscipline([
    inspection("2026-07-06", 72),
    inspection("2026-07-13", 78),
    inspection("2026-07-20", 99, 100, false),
    inspection("2026-07-27", 84)
  ], today, 28);
  assert.equal(result.value, 84);
  assert.equal(result.delta, 6);
  assert.equal(result.observations, 3);
  assert.equal(result.tone, "positive");
});

test("readiness compares the latest seven days with the prior seven", () => {
  const rows = [];
  for (let day = 20; day <= 26; day += 1) rows.push(daily(`2026-07-${day}`, { energy: 5 }));
  for (let day = 27; day <= 31; day += 1) rows.push(daily(`2026-07-${day}`, { energy: 7 }));
  rows.push(daily("2026-08-01", { energy: 7 }), daily("2026-08-02", { energy: 7 }));
  const result = trends.summarizeReadiness(rows, today, 28);
  assert.equal(result.value, 7);
  assert.equal(result.delta, 2);
  assert.equal(result.tone, "positive");
});

test("training counts unique session days and converts kilometers to miles", () => {
  const result = trends.summarizeTraining([
    performance("2026-07-20", "strength", { sets: 3 }),
    performance("2026-07-20", "strength", { sets: 2 }),
    performance("2026-07-22", "running", { distance: 10, distance_unit: "km" }),
    performance("2026-07-24", "core", { duration_seconds: 900 })
  ], [{ date: "2026-07-26", state: "COMPLETE" }], [], today, 28);
  assert.equal(result.strengthSessions, 2);
  assert.equal(result.runSessions, 1);
  assert.equal(result.runMiles, 6.2);
  assert.equal(result.coreSessions, 1);
  assert.equal(result.totalSessionDays, 4);
});

test("nutrition adherence requires both approved targets and complete days", () => {
  const rows = [
    { date: "2026-07-29", calories: 2000, protein: 160 },
    { date: "2026-07-30", calories: 1800, protein: 150 },
    { date: "2026-07-31", calories: 2600, protein: 90 }
  ];
  const result = trends.summarizeNutrition(rows, { calories: 2000, protein: 150 }, today, 28);
  assert.equal(result.value, 67);
  assert.equal(result.evidenceDays, 3);
  assert.equal(trends.summarizeNutrition(rows, null, today, 28).value, null);
});

test("weight is evidence-backed and neutral rather than judged", () => {
  const result = trends.summarizeWeight([
    daily("2026-07-10", { weight: 182.5 }),
    daily("2026-07-22", { weight: 181 }),
    daily("2026-08-01", { weight: 179.8 })
  ], today, 28);
  assert.equal(result.value, 179.8);
  assert.equal(result.change, -2.7);
  assert.equal(result.tone, "neutral");
  assert.equal(result.observations, 3);
});

test("body-measurement adapter is ready without inventing measurements", () => {
  const empty = trends.bodyMeasurementFoundation([]);
  assert.equal(empty.state, "CAPTURE NOT YET ENABLED");
  const available = trends.bodyMeasurementFoundation([
    performance("2026-08-01", "body_metrics", { waist: 32.5, chest: 41 })
  ]);
  assert.equal(available.state, "AVAILABLE");
  assert.deepEqual(available.series.waist, [{ date: "2026-08-01", value: 32.5 }]);
});

test("full model returns six primary KPIs, coaching readout, and source confidence", () => {
  const model = trends.buildProgramTrendModel({
    today,
    rangeDays: 28,
    inspections: [inspection("2026-07-13", 74), inspection("2026-07-20", 78), inspection("2026-07-27", 84)],
    dailyStates: [daily("2026-07-20", { weight: 182 }), daily("2026-07-27", { weight: 181 }), daily("2026-08-02", { weight: 180 })],
    performanceEntries: [performance("2026-07-28", "running", { distance: 5, distance_unit: "mi" })],
    strengthHistory: [{ date: "2026-07-29", state: "COMPLETE" }],
    nutritionDays: [
      { date: "2026-07-29", calories: 2000, protein: 160 },
      { date: "2026-07-30", calories: 1900, protein: 155 },
      { date: "2026-07-31", calories: 2100, protein: 150 }
    ],
    nutritionTargets: { calories: 2000, protein: 150 }
  });
  assert.equal(model.version, "021L.1");
  assert.deepEqual(model.kpis.map((item) => item.id), ["discipline", "readiness", "strength", "running", "nutrition", "weight"]);
  assert.equal(model.coaching.signal, "The standard is rising");
  assert.ok(model.evidence.score >= 80);
});

test("analytics calculations do not mutate source evidence", () => {
  const source = [daily("2026-08-01", { weight: 180 })];
  const before = structuredClone(source);
  trends.buildProgramTrendModel({ today, dailyStates: source });
  assert.deepEqual(source, before);
});

console.log(`${passed} trends intelligence tests passed`);
