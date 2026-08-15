const test = require("node:test");
const assert = require("node:assert/strict");
const connected = require("../assets/js/connected.js");
const evidence = require("../assets/js/connected-evidence.js");

let recordSequence = 0;
function record(overrides = {}) {
  recordSequence += 1;
  return connected.normalizeImportedRecord({
    userId: "user-1", connectedAccountId: "account-1", providerCode: "FITBOD",
    providerRecordId: overrides.providerRecordId || `record-${recordSequence}`,
    providerRecordType: "STRENGTH", dataType: "EXERCISE_SET", occurredAt: "2026-08-15T13:00:00.000Z",
    normalizedPayload: { exercise_name: "Squat", workout_name: "Lower A", sets: 1, repetitions: 5, load: 225 },
    validationStatus: "VALID", importStatus: "MAPPED", ...overrides
  });
}

const lowerA = { id: "lower-a", date: "2026-08-15", module: "STRENGTH", title: "Lower A" };

test("027D matches Fitbod sets to one committed Strength assignment", () => {
  const report = evidence.reconcile({ records: [record({ providerRecordId: "set-1" }), record({ providerRecordId: "set-2", normalizedPayload: { exercise_name: "RDL", workout_name: "Lower A", sets: 1, repetitions: 8, load: 185 } })], assignments: [lowerA], generatedAt: "2026-08-15T14:00:00.000Z" });
  assert.equal(report.version, "027D.1");
  assert.equal(report.status, "CLEAR");
  assert.equal(report.matches.length, 1);
  assert.equal(report.proofSources.length, 1);
  assert.equal(report.proofSources[0].provider, "FITBOD");
  assert.equal(report.proofSources[0].metrics.sets, 2);
});

test("027D prevents duplicate credit across close provider workout records", () => {
  const apple = record({ providerCode: "APPLE_HEALTH", providerRecordId: "run-a", providerRecordType: "WORKOUT", dataType: "RUN", normalizedPayload: { activity_name: "Easy Run", duration_seconds: 1800, distance: 5, distance_unit: "km" } });
  const android = record({ providerCode: "HEALTH_CONNECT", providerRecordId: "run-b", providerRecordType: "RUNNING", dataType: "RUN", normalizedPayload: { activity_name: "Easy Run", duration_seconds: 1820, distance: 5.05, distance_unit: "km" } });
  const report = evidence.reconcile({ records: [apple, android], assignments: [{ id: "easy-run", date: "2026-08-15", module: "RUNNING", title: "Easy Run" }] });
  assert.equal(report.status, "CLEAR");
  assert.equal(report.matches.length, 1);
  assert.equal(report.proofSources.length, 1);
  assert.deepEqual(report.matches[0].providers.sort(), ["APPLE_HEALTH", "HEALTH_CONNECT"]);
});

test("027D surfaces material provider conflicts instead of awarding credit", () => {
  const apple = record({ providerCode: "APPLE_HEALTH", providerRecordId: "run-c", providerRecordType: "WORKOUT", dataType: "RUN", normalizedPayload: { activity_name: "Tempo Run", duration_seconds: 1800, distance: 5, distance_unit: "km" } });
  const android = record({ providerCode: "HEALTH_CONNECT", providerRecordId: "run-d", providerRecordType: "RUNNING", dataType: "RUN", normalizedPayload: { activity_name: "Tempo Run", duration_seconds: 3000, distance: 9, distance_unit: "km" } });
  const report = evidence.reconcile({ records: [apple, android], assignments: [{ id: "tempo", date: "2026-08-15", module: "RUNNING", title: "Tempo Run" }] });
  assert.equal(report.status, "REVIEW");
  assert.equal(report.exceptions[0].type, "CONFLICTING_EVIDENCE");
  assert.equal(report.proofSources.length, 0);
  const resolved = evidence.resolve(report, report.exceptions[0].id, "USE_PRIMARY", { resolvedAt: "2026-08-15T16:00:00.000Z" });
  assert.equal(resolved.status, "CLEAR");
  assert.equal(resolved.proofSources.length, 1);
  assert.equal(resolved.proofSources[0].provider, "HEALTH_CONNECT");
});

test("027D shows only unmatched imported training as an exception", () => {
  const report = evidence.reconcile({ records: [record({ providerRecordId: "orphan" })], assignments: [] });
  assert.equal(report.status, "REVIEW");
  assert.equal(report.exceptions[0].type, "UNMATCHED_ACTIVITY");
  const ignored = evidence.resolve(report, report.exceptions[0].id, "IGNORE");
  assert.equal(ignored.status, "CLEAR");
  assert.equal(ignored.proofSources.length, 0);
});

test("027D maps MyFitnessPal daily totals once without requiring a Calendar item", () => {
  const nutrition = record({ providerCode: "MYFITNESSPAL", providerRecordId: "fuel-1", providerRecordType: "NUTRITION_MEAL", dataType: "MACRONUTRIENTS", occurredAt: "2026-08-15", normalizedPayload: { calories: 2400, protein_grams: 180, carbohydrate_grams: 250, fat_grams: 70 } });
  const report = evidence.reconcile({ records: [nutrition], assignments: [] });
  assert.equal(report.status, "CLEAR");
  assert.equal(report.proofSources[0].domain, "nutrition");
  assert.equal(report.proofSources[0].metrics.protein, 180);
});

test("027D is idempotent for the same imported evidence", () => {
  const input = { records: [record({ providerRecordId: "stable-set" })], assignments: [lowerA], generatedAt: "2026-08-15T14:00:00.000Z" };
  const left = evidence.reconcile(input), right = evidence.reconcile(input);
  assert.equal(left.id, right.id);
  assert.deepEqual(left.proofSources, right.proofSources);
  assert.equal(evidence.upsertHistory([left], right).length, 1);
});

test("027D parses user-controlled Health Connect health and workout evidence", () => {
  const parsed = connected.parseHealthConnectExportJson(JSON.stringify({ records: [
    { id: "steps-1", type: "StepsRecord", date: "2026-08-15", count: 8500 },
    { id: "hrv-1", type: "HeartRateVariabilityRmssdRecord", time: "2026-08-15T06:00:00Z", rmssd: 52, unit: "ms" },
    { id: "run-1", type: "ExerciseSessionRecord", exerciseType: "RUNNING", startTime: "2026-08-15T12:00:00Z", endTime: "2026-08-15T12:30:00Z", distanceMeters: 5000, title: "Easy Run" }
  ] }), { userId: "user-1" });
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.records.length, 3);
  assert.deepEqual(parsed.records.map((item) => item.dataType).sort(), ["HEART_RATE_VARIABILITY", "RUN", "STEPS"]);
  assert(parsed.records.every((item) => item.providerCode === "HEALTH_CONNECT"));
});

test("027D never adds the same day's Apple and Android step totals together", () => {
  const apple = record({ providerCode: "APPLE_HEALTH", providerRecordId: "steps-apple", providerRecordType: "STEPS", dataType: "STEPS", occurredAt: "2026-08-15", normalizedPayload: { value: 8000, unit: "count" } });
  const android = record({ providerCode: "HEALTH_CONNECT", providerRecordId: "steps-android", providerRecordType: "STEPS", dataType: "STEPS", occurredAt: "2026-08-15", normalizedPayload: { value: 8200, unit: "count" } });
  const summary = connected.summarizeHealthMetricsByDate([apple, android])[0];
  assert.equal(summary.steps, 8200);
  assert.deepEqual(summary.providers.sort(), ["APPLE_HEALTH", "HEALTH_CONNECT"]);
});
