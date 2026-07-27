Exit code: 0
Wall time: 0.8 seconds
Output:
const assert = require("node:assert/strict");
const fs = require("node:fs");
const connected = require("../assets/js/connected.js");
const performance = require("../assets/js/app.js");

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log(`âœ“ ${name}`); }
  catch (error) { console.error(`âœ— ${name}`); throw error; }
}
const account = connected.normalizeConnectedAccount({
  id: "acct-1", userId: "user-1", providerCode: "STRAVA", connectionStatus: "CONNECTED",
  permissions: ["READ_ACTIVITY"], isSimulated: true, createdAt: "2026-01-01T00:00:00Z"
});
const job = connected.normalizeSyncJob({
  id: "job-1", userId: "user-1", connectedAccountId: account.id, providerCode: "STRAVA",
  syncType: "MANUAL", status: "RUNNING", requestedAt: "2026-01-01T00:00:00Z",
  startedAt: "2026-01-01T00:00:00Z", isDemo: true
});
function run(overrides = {}) {
  return connected.normalizeImportedRecord({
    id: "import-1", userId: "user-1", connectedAccountId: account.id, providerCode: "STRAVA",
    providerRecordId: "run-1", providerRecordType: "ACTIVITY", occurredAt: "2026-01-02T07:00:00-06:00",
    timezone: "America/Chicago", dataType: "RUN", normalizedPayload: { distance: 3.1, distance_unit: "mi", duration_seconds: 1500 },
    rawPayload: { original: true }, sourceSyncJobId: job.id, isDemo: true, ...overrides
  });
}

test("1 provider catalog is deterministic", () => assert.deepEqual(connected.getConnectedProviderCatalog(), connected.getConnectedProviderCatalog()));
test("2 unknown providers are rejected", () => assert.equal(connected.normalizeProviderCode("unknown"), null));
test("3 providers remain architecture-only or planned", () => assert.ok(connected.getConnectedProviderCatalog().every((item) => ["ARCHITECTURE_ONLY", "PLANNED"].includes(item.implementationStatus))));
test("4 account normalization supports camelCase", () => assert.equal(account.providerCode, "STRAVA"));
test("5 account normalization supports snake_case", () => assert.equal(connected.normalizeConnectedAccount({ provider_code: "GARMIN", user_id: "u" }).providerCode, "GARMIN"));
test("6 unsupported permissions are rejected", () => assert.equal(connected.validatePermissionSelection("STRAVA", ["READ_SLEEP"]).valid, false));
test("7 permissions are deduplicated", () => assert.deepEqual(connected.normalizePermissionList(["READ_ACTIVITY", "READ_ACTIVITY"]), ["READ_ACTIVITY"]));
test("8 valid connection transitions pass", () => assert.equal(connected.validateConnectionTransition("CONNECTED", "DISCONNECTED"), true));
test("9 invalid connection transitions fail", () => assert.equal(connected.validateConnectionTransition("DISCONNECTED", "CONNECTED"), false));
test("10 disconnected accounts retain identity/history", () => assert.equal(connected.transitionConnectedAccount(account, "DISCONNECTED").account.id, account.id));
test("11 simulated account stays visibly simulated", () => assert.equal(account.isSimulated, true));
test("12 sync normalization supports camelCase", () => assert.equal(job.connectedAccountId, "acct-1"));
test("12b sync normalization supports snake_case", () => assert.equal(connected.normalizeSyncJob({ connected_account_id: "a", provider_code: "STRAVA" }).connectedAccountId, "a"));
test("13 valid sync transitions pass", () => assert.equal(connected.validateSyncTransition("RUNNING", "SUCCEEDED"), true));
test("14 terminal sync jobs do not restart", () => assert.equal(connected.validateSyncTransition("FAILED", "RUNNING"), false));
test("15 failed jobs remain auditable", () => assert.equal(connected.transitionSyncJob(job, "FAILED").job.id, job.id));
test("16 retry creates a new job id", () => assert.notEqual(connected.createRetrySyncJob({ ...job, status: "FAILED" }, { now: "2026-01-02T00:00:00Z" }).id, job.id));
test("17 retry references original without mutation", () => {
  const original = { ...job, status: "FAILED" };
  const retry = connected.createRetrySyncJob(original, { now: "2026-01-02T00:00:00Z" });
  assert.equal(retry.summary.retryOf, original.id); assert.equal(original.syncType, "MANUAL");
});
test("18 provider record id creates stable key", () => assert.equal(run().deduplicationKey, run().deduplicationKey));
test("19 same provider record deduplicates", () => assert.equal(connected.reconcileImportedRecord(run({ id: "two" }), [run()]).importStatus, "DUPLICATE"));
test("20 different providers do not deduplicate", () => assert.notEqual(run().deduplicationKey, connected.buildImportedRecordDeduplicationKey({ ...run(), providerCode: "GARMIN" })));
test("21 fallback dedup is deterministic", () => {
  const source = { userId: "u", providerCode: "STRAVA", dataType: "RUN", occurredAt: "2026-01-01", normalizedPayload: { distance: 5, duration_seconds: 100 } };
  assert.equal(connected.buildImportedRecordDeduplicationKey(source), connected.buildImportedRecordDeduplicationKey(source));
});
test("22 timezone is preserved", () => assert.equal(run().timezone, "America/Chicago"));
test("23 imported record supports snake_case", () => assert.equal(connected.normalizeImportedRecord({ provider_code: "STRAVA", data_type: "RUN", occurred_at: "2026-01-01" }).dataType, "RUN"));
test("24 invalid numeric values are rejected", () => assert.equal(connected.validateImportedRecord(run({ normalizedPayload: { distance: "bad", duration_seconds: 10 } })).valid, false));
test("25 unsupported data remains explicit", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(connected.normalizeImportedRecord({ ...run(), dataType: "SLEEP" }), { permissions: ["READ_SLEEP"] }).status, "UNMAPPED"));
test("26 run maps to valid Performance entry", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"], normalizePerformanceEntry: performance.normalizePerformanceEntry, validatePerformanceEntry: performance.validatePerformanceEntry }).status, "MAPPED"));
test("27 run preserves distance and duration", () => {
  const entry = connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] }).entry;
  assert.equal(entry.metrics.distance, 3.1); assert.equal(entry.metrics.duration_seconds, 1500);
});
test("28 strength maps with sufficient detail", () => {
  const record = run({ providerCode: "FITBOD", dataType: "EXERCISE_SET", normalizedPayload: { exercise_code: "squat", exercise_name: "Squat", sets: 3, repetitions: 5, load: 225 } });
  assert.equal(connected.mapImportedRecordToPerformanceEntry(record, { permissions: ["READ_STRENGTH_WORKOUTS"] }).status, "MAPPED");
});
test("29 partial strength remains unmapped", () => {
  const record = run({ providerCode: "FITBOD", dataType: "EXERCISE_SET", normalizedPayload: { exercise_name: "Squat", sets: 3 } });
  assert.equal(connected.mapImportedRecordToPerformanceEntry(record, { permissions: ["READ_STRENGTH_WORKOUTS"] }).status, "UNMAPPED");
});
test("30 bodyweight maps to body metrics", () => {
  const record = run({ providerCode: "APPLE_HEALTH", dataType: "BODYWEIGHT", normalizedPayload: { value: 180, unit: "lb" } });
  assert.equal(connected.mapImportedRecordToPerformanceEntry(record, { permissions: ["READ_BODY_METRICS"] }).entry.domain, "body_metrics");
});
test("31 bodyweight is not an athletic PR", () => {
  const record = run({ providerCode: "APPLE_HEALTH", dataType: "BODYWEIGHT", normalizedPayload: { value: 180 } });
  assert.equal(connected.mapImportedRecordToPerformanceEntry(record, { permissions: ["READ_BODY_METRICS"] }).entry.entryType, "MEASUREMENT");
});
test("32 conditioning requires exact protocol", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run({ dataType: "CONDITIONING_SESSION", normalizedPayload: { duration_seconds: 600 } }), { permissions: ["READ_ACTIVITY"] }).status, "UNMAPPED"));
test("33 mapping preserves provenance", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] }).entry.provenance.sourceProvider, "STRAVA"));
test("34 mapping preserves demo designation", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] }).entry.provenance.sourceIsDemo, true));
test("35 mapping is idempotent", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] }).entry.id, connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] }).entry.id));
test("36 duplicate does not create a second mapped id", () => {
  const first = connected.mapImportedRecordToPerformanceEntry(run(), { permissions: ["READ_ACTIVITY"] });
  const duplicate = connected.reconcileImportedRecord(run({ id: "again" }), [{ ...run(), mappedPerformanceEntryId: first.entry.id }]);
  assert.equal(duplicate.mappedPerformanceEntryId, first.entry.id);
});
test("37 manual entries are not provider-deduplicated", () => assert.notEqual(connected.buildImportedRecordDeduplicationKey(run()), performance.normalizePerformanceEntry({ domain: "running", activityName: "Run", performanceDate: "2026-01-02", metrics: { distance: 3.1 } }).id));
test("38 permission removal blocks mapping", () => assert.equal(connected.mapImportedRecordToPerformanceEntry(run(), { permissions: [] }).status, "UNMAPPED"));
test("39 sources are not mutated", () => {
  const source = { providerCode: "STRAVA", dataType: "RUN", occurredAt: "2026-01-01", normalizedPayload: { tags: ["a"], distance: 1 } };
  const before = JSON.stringify(source); connected.normalizeImportedRecord(source); assert.equal(JSON.stringify(source), before);
});
test("40 local and remote storage states remain distinct", () => {
  assert.equal(connected.deriveConnectedViewState({ remoteLoadFailed: true, localFallback: true }), "LOCAL_FALLBACK_ACTIVE");
  assert.equal(connected.deriveConnectedViewState({ remoteLoadFailed: true }), "REMOTE_LOAD_FAILED");
});
test("41 sync summaries count statuses", () => assert.deepEqual(connected.summarizeSyncJob([{ ...run(), importStatus: "MAPPED" }, { ...run(), id: "d", importStatus: "DUPLICATE" }, { ...run(), id: "r", importStatus: "REJECTED" }, { ...run(), id: "u", importStatus: "UNMAPPED" }]), { imported: 1, duplicate: 1, rejected: 1, unmapped: 1, total: 4 }));
test("42 demo records remain labeled", () => assert.ok(connected.createDemoRecords(account, job).every((item) => item.isDemo)));
test("43 provider catalog objects do not leak mutations", () => { const list = connected.getConnectedProviderCatalog(); list[0].displayName = "Changed"; assert.equal(connected.getProviderDefinition("STRAVA").displayName, "Strava"); });
test("44 date-only values are not shifted", () => assert.equal(connected.normalizeImportedRecord({ providerCode: "STRAVA", dataType: "BODYWEIGHT", occurredAt: "2026-01-01" }).occurredAt, "2026-01-01"));
test("45 unknown data type validates unsupported", () => assert.equal(connected.validateImportedRecord({ providerCode: "STRAVA", dataType: "ALIEN", occurredAt: "2026-01-01" }).record.validationStatus, "UNSUPPORTED"));
test("46 storage keys are user scoped", () => assert.notEqual(connected.storageKey("connected-accounts", "a"), connected.storageKey("connected-accounts", "b")));
test("47 exact stable IDs survive normalization", () => assert.equal(connected.normalizeConnectedAccount({ ...account, id: "exact-id" }).id, "exact-id"));
test("48 overview exposes explicit counts", () => assert.equal(connected.buildConnectedOverviewModel({ accounts: [account], jobs: [job], records: [run()] }).providerCount, 5));
test("49 weekly inspection render cannot abort Connected Dominion initialization", () => {
  const appSource = fs.readFileSync(require.resolve("../assets/js/app.js"), "utf8");
  assert.ok(appSource.includes('const inspectionSection = document.getElementById("inspection");'));
  assert.ok(!appSource.includes('document.getElementById("weekly-inspection").dataset'));
});

console.log(`Connected Dominion: ${passed} assertions passed.`);

