const test = require("node:test");
const assert = require("node:assert/strict");
const ledger = require("../assets/js/fuel-day-ledger.js");

const date = "2026-08-15";
const complete = { date, calories: 2200, protein: 180, carbs: 240, fat: 70 };

test("026L normalizes one complete manual day", () => {
  const record = ledger.normalizeRecord(complete, { source: "MANUAL", now: "2026-08-15T21:00:00.000Z" });
  assert.equal(ledger.VERSION, "026L.1");
  assert.equal(record.id, `fuel-day:${date}`);
  assert.equal(record.status, "LOGGED");
  assert.equal(record.complete, true);
  assert.deepEqual(record.totals, { calories: 2200, protein: 180, carbs: 240, fat: 70 });
});

test("a complete manual day remains canonical while an import is incomplete", () => {
  const result = ledger.selectRecord({
    date,
    manual: complete,
    imported: { date, calories: 900, protein: null, carbs: null, fat: null }
  });
  assert.equal(result.source, "MANUAL");
  assert.equal(result.complete, true);
  assert.equal(result.record.calories, 2200);
});

test("a complete MyFitnessPal day takes precedence without deleting manual evidence", () => {
  const result = ledger.selectRecord({
    date,
    manual: complete,
    imported: { date, calories: 2180, protein: 182, carbs: 235, fat: 72 }
  });
  assert.equal(result.source, "MYFITNESSPAL");
  assert.equal(result.manual.calories, 2200);
  assert.equal(result.reconciliation.status, "MATCH");
});

test("Fuel evidence requires calories and protein but never invents completion", () => {
  const partial = ledger.selectRecord({ date, manual: { date, calories: 2200 } });
  const completeDay = ledger.selectRecord({ date, manual: complete });
  assert.equal(ledger.evidence(partial).state, "INCOMPLETE");
  assert.equal(ledger.evidence(completeDay).state, "COMPLETE");
  assert.equal(ledger.evidence(completeDay).sourceType, "FUEL_DAY_TOTAL");
});

test("daily progress uses approved targets without mutating them", () => {
  const day = ledger.selectRecord({ date, manual: complete });
  const targets = { calories: 2400, protein: 190, carbs: 260, fat: 75 };
  const progress = ledger.progress(day, targets);
  assert.equal(progress.calories.remaining, 200);
  assert.equal(progress.protein.percent, 95);
  assert.deepEqual(targets, { calories: 2400, protein: 190, carbs: 260, fat: 75 });
});
