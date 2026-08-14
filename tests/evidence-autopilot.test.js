const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/evidence-autopilot.js");

const strength = (overrides = {}) => ({
  sourceType: "STRENGTH_EXECUTION",
  id: "strength-lower-a-2026-08-14",
  date: "2026-08-14",
  domain: "strength",
  kind: "SESSION",
  state: "COMPLETE",
  completedAt: "2026-08-14T13:00:00.000Z",
  sessionId: "lower-a",
  sessionName: "Lower A",
  metrics: { sets: 12, repetitions: 96, weight: 225, weight_unit: "lb" },
  ...overrides
});

test("the same source produces one stable receipt across capture times", () => {
  const first = engine.buildReceipts([strength({ updatedAt: "2026-08-14T13:01:00.000Z" })]);
  const second = engine.buildReceipts([strength({ updatedAt: "2026-08-14T13:05:00.000Z" })], first);
  assert.equal(second.length, 1);
  assert.equal(second[0].id, first[0].id);
  assert.equal(second[0].actionKey, "2026-08-14:strength:SESSION:lower-a");
});

test("unfinished work never becomes secured proof", () => {
  const receipt = engine.normalizeReceipt(strength({ state: "IN_PROGRESS", completedAt: null }));
  assert.equal(receipt.status, "INCOMPLETE");
  const proof = engine.dailyProof("2026-08-14", [receipt], ["strength"]);
  assert.equal(proof.coveragePercent, 0);
  assert.deepEqual(proof.missingDomains, ["strength"]);
});

test("connected provider evidence stays distinct from self reported work", () => {
  const verified = engine.normalizeReceipt({
    id: "apple-roll-call-1",
    date: "2026-08-14",
    domain: "readiness",
    kind: "ROLL_CALL",
    state: "COMPLETE",
    source: "APPLE_HEALTH",
    machineVerified: true
  });
  const reported = engine.normalizeReceipt(strength());
  assert.equal(verified.status, "VERIFIED");
  assert.equal(reported.status, "SELF_REPORTED");
  const proof = engine.dailyProof("2026-08-14", [verified, reported], ["readiness", "strength"]);
  assert.equal(proof.coveragePercent, 100);
  assert.equal(proof.verified.length, 1);
  assert.equal(proof.selfReported.length, 1);
});

test("performance entries link back to their Mission receipt instead of duplicating it", () => {
  const receipt = {
    id: "mission-running-2026-08-14",
    date: "2026-08-14",
    module: "RUNNING",
    kind: "SESSION",
    state: "COMPLETE",
    completedAt: "2026-08-14T14:00:00.000Z",
    summary: { distance: 5, distanceUnit: "mi", durationSeconds: 2400 }
  };
  const performance = {
    id: "perf-run-1",
    performanceDate: "2026-08-14",
    domain: "running",
    entryType: "WORKOUT_SUMMARY",
    evidenceStatus: "SELF REPORTED",
    notes: "Mission Execution receipt mission-running-2026-08-14. COMPLETE.",
    metrics: { distance: 5, distance_unit: "mi", duration_seconds: 2400 }
  };
  const results = engine.buildReceipts([receipt, performance]);
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceRefs.length, 2);
  assert.equal(results[0].domain, "running");
});

test("two sessions in one day remain separate proof", () => {
  const receipts = engine.buildReceipts([
    strength({ id: "upper-a", sessionId: "upper-a", sessionName: "Upper A" }),
    strength({ id: "lower-a", sessionId: "lower-a", sessionName: "Lower A", completedAt: "2026-08-14T20:00:00.000Z" })
  ]);
  assert.equal(receipts.length, 2);
  assert.notEqual(receipts[0].id, receipts[1].id);
});

test("a newer source revision wins without changing receipt identity", () => {
  const original = engine.normalizeReceipt(strength({ revision: 1, metrics: { sets: 10, repetitions: 80 } }));
  const amended = engine.normalizeReceipt(strength({ revision: 2, updatedAt: "2026-08-14T15:00:00.000Z", metrics: { sets: 12, repetitions: 96 } }));
  const [merged] = engine.mergeReceipts([original], [amended]);
  assert.equal(merged.id, original.id);
  assert.equal(merged.sourceRevision, 2);
  assert.equal(merged.metrics.sets, 12);
});

test("weekly proof uses scheduled domain requirements as its denominator", () => {
  const receipts = engine.buildReceipts([
    strength(),
    { id: "roll-1", date: "2026-08-14", domain: "readiness", kind: "ROLL_CALL", status: "COMPLETE" }
  ]);
  const weekly = engine.weeklyProof(
    { start: "2026-08-10", end: "2026-08-16" },
    receipts,
    [{ date: "2026-08-14", domains: ["readiness", "strength", "nutrition"] }]
  );
  assert.equal(weekly.coveragePercent, 67);
  assert.deepEqual(weekly.missing, [{ date: "2026-08-14", domain: "nutrition" }]);
});

test("secured training proof can repair a missing performance summary", () => {
  const receipt = engine.normalizeReceipt(strength());
  const entry = engine.performanceEntryFor(receipt);
  assert.equal(entry.id, `perf-${receipt.id}`);
  assert.equal(entry.domain, "strength");
  assert.equal(entry.metrics.source_evidence_id, receipt.id);
  assert.equal(entry.evidenceStatus, "SELF REPORTED");
});
