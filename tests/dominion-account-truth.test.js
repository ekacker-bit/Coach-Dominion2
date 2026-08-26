const assert = require("node:assert/strict");
const test = require("node:test");

const truth = require("../assets/js/dominion-account-truth");

function snapshot(input, options = {}) {
  return truth.buildSnapshot(input, {
    userId: "recruit-1",
    deviceId: options.deviceId || "device-1",
    capturedAt: options.capturedAt || "2026-08-14T12:00:00.000Z",
    programFingerprint: "program-12"
  });
}

test("account truth fingerprints ignore device capture timestamps", () => {
  const input = { evidence: { performance: [{ id: "set-1", load: 225 }] } };
  const morning = snapshot(input, { deviceId: "phone", capturedAt: "2026-08-14T08:00:00.000Z" });
  const evening = snapshot(input, { deviceId: "desktop", capturedAt: "2026-08-14T20:00:00.000Z" });
  assert.equal(morning.fingerprint, evening.fingerprint);
});

test("a completed orientation cannot be replaced by a newer incomplete copy", () => {
  const complete = { status: "COMPLETED", completedAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T10:00:00.000Z" };
  const incomplete = { status: "PROFILE_REQUIRED", updatedAt: "2026-08-14T10:00:00.000Z" };
  assert.deepEqual(truth.mergeOrientation(incomplete, complete), complete);
});

test("concurrent readiness, evidence, and coaching records merge without loss", () => {
  const device = snapshot({
    readiness: { history: [{ date: "2026-08-14", energy: 8 }] },
    evidence: { performance: [{ id: "lift-1", recordedAt: "2026-08-14T09:00:00.000Z" }], journeyReceipts: [{ id: "journey-phone", observedAt: "2026-08-14T09:30:00.000Z" }], dailyLoopReceipts: [{ id: "daily-loop-phone", securedAt: "2026-08-14T22:00:00.000Z" }] },
    coaching: { horizons: [{ id: "horizon-1", updatedAt: "2026-08-14T08:00:00.000Z" }] }
  });
  const account = snapshot({
    readiness: { history: [{ date: "2026-08-13", energy: 6 }] },
    evidence: { closeouts: [{ id: "close-1", date: "2026-08-13", sealedAt: "2026-08-13T22:00:00.000Z" }], journeyReceipts: [{ id: "journey-desktop", observedAt: "2026-08-13T22:15:00.000Z" }], dailyLoopReceipts: [{ id: "daily-loop-desktop", securedAt: "2026-08-13T22:30:00.000Z" }] },
    coaching: { outcomes: [{ id: "outcome-1", reviewedAt: "2026-08-14T07:00:00.000Z" }] }
  }, { deviceId: "account" });
  const merged = truth.reconcileSnapshots(device, account).snapshot;
  assert.equal(merged.domains.readiness.payload.history.length, 2);
  assert.equal(merged.domains.evidence.payload.performance.length, 1);
  assert.equal(merged.domains.evidence.payload.closeouts.length, 1);
  assert.equal(merged.domains.evidence.payload.journeyReceipts.length, 2);
  assert.equal(merged.domains.evidence.payload.dailyLoopReceipts.length, 2);
  assert.equal(merged.domains.coaching.payload.horizons.length, 1);
  assert.equal(merged.domains.coaching.payload.outcomes.length, 1);
});

test("the newer version of one entity wins while distinct entities survive", () => {
  const merged = truth.mergeCollection(
    [{ id: "lift-1", load: 235, updatedAt: "2026-08-14T10:00:00.000Z" }],
    [
      { id: "lift-1", load: 225, updatedAt: "2026-08-14T09:00:00.000Z" },
      { id: "run-1", miles: 5, updatedAt: "2026-08-14T08:00:00.000Z" }
    ]
  );
  assert.equal(merged.length, 2);
  assert.equal(merged.find((item) => item.id === "lift-1").load, 235);
});

test("the account snapshot covers the complete recruit loop", () => {
  const value = snapshot({});
  assert.deepEqual(Object.keys(value.domains), truth.TRUTH_DOMAINS);
  assert.equal(value.programFingerprint, "program-12");
  assert.equal(value.schemaVersion, truth.SCHEMA_VERSION);
});

test("the retry queue keeps only the newest complete snapshot", () => {
  const first = snapshot({ evidence: { performance: [{ id: "set-1" }] } });
  const second = snapshot({ evidence: { performance: [{ id: "set-2" }] } });
  const queued = truth.queueLatest(truth.queueLatest([], first, null, { now: "2026-08-14T10:00:00.000Z" }), second, { code: "NETWORK" }, { now: "2026-08-14T10:01:00.000Z" });
  assert.equal(queued.length, 1);
  assert.equal(queued[0].snapshot.fingerprint, second.fingerprint);
  assert.equal(queued[0].errorCode, "NETWORK");
});

test("health distinguishes verified, queued, and legacy accounts", () => {
  const value = snapshot({});
  assert.equal(truth.healthReport({ snapshot: value, accountRevision: 4, truthSchemaVersion: 1, serverConfirmed: true }).status, "VERIFIED");
  assert.equal(truth.healthReport({ snapshot: value, accountRevision: 4, truthSchemaVersion: 1, serverConfirmed: false }).status, "VERIFYING");
  assert.equal(truth.healthReport({ snapshot: value, pendingWrites: 1 }).status, "SAVE_QUEUED");
  assert.equal(truth.healthReport({ snapshot: value, lastError: "missing", legacyFallback: true }).status, "LEGACY_ACTIVE");
});
