const test = require("node:test");
const assert = require("node:assert/strict");
const Trust = require("../assets/js/trust-layer.js");

function lineage(overrides = {}) {
  return {
    modules: {
      contract: { state: "CURRENT", required: true },
      strength: { state: "CURRENT", required: true },
      running: { state: "CURRENT", required: true },
      core: { state: "CURRENT", required: true },
      nutrition: { state: "CURRENT", required: true },
      calendar: { state: "CURRENT", required: true },
      ...overrides
    }
  };
}

function healthy(overrides = {}) {
  return {
    online: true,
    accountHealth: { initialized: true, status: "VERIFIED", lastVerifiedAt: "2026-08-16T12:00:00.000Z" },
    lineage: lineage(),
    conflicts: [],
    pendingWrites: 0,
    programFingerprint: "program-1",
    accountProgramFingerprint: "program-1",
    decision: { id: "decision-1", operatingDate: "2026-08-16" },
    decisionConsistency: true,
    startupIssues: [],
    ...overrides
  };
}

test("verifies the complete Contract to evidence chain", () => {
  const report = Trust.evaluate(healthy());
  assert.equal(report.status, "VERIFIED");
  assert.deepEqual(report.repairActions, []);
  assert.equal(report.checks.program, "CURRENT");
  assert.equal(report.checks.calendar, "CURRENT");
  assert.equal(report.checks.today, "CURRENT");
  assert.equal(report.checks.evidence, "SAVED");
});

test("protects offline and queued work without inventing a failure", () => {
  assert.equal(Trust.evaluate(healthy({ online: false })).status, "PROTECTED");
  const queued = Trust.evaluate(healthy({ pendingWrites: 2, accountHealth: { initialized: true, status: "SAVE_QUEUED" } }));
  assert.equal(queued.status, "PROTECTED");
  assert.equal(queued.checks.evidence, "SYNC PENDING");
});

test("does not call account state verified before a server receipt", () => {
  const report = Trust.evaluate(healthy({ accountHealth: { initialized: true, status: "VERIFYING" } }));
  assert.equal(report.status, "CHECKING");
  assert.equal(report.headline, "Verifying your account");
});

test("repairs safe account and Today drift automatically", () => {
  const fingerprint = Trust.evaluate(healthy({ accountProgramFingerprint: "program-2" }));
  assert.equal(fingerprint.status, "REPAIRING");
  assert.deepEqual(fingerprint.repairActions, ["SYNC_ACCOUNT_STATE"]);

  const missingToday = Trust.evaluate(healthy({ decision: null, decisionConsistency: false }));
  assert.equal(missingToday.status, "REPAIRING");
  assert.deepEqual(missingToday.repairActions, ["REBUILD_TODAY"]);

  const inconsistentToday = Trust.evaluate(healthy({ decisionConsistency: false }));
  assert.deepEqual(inconsistentToday.repairActions, ["REBUILD_TODAY"]);
});

test("requires a recruit choice for missing approvals or program conflict", () => {
  const missingCalendar = Trust.evaluate(healthy({ lineage: lineage({ calendar: { state: "MISSING", required: true } }) }));
  assert.equal(missingCalendar.status, "ACTION_REQUIRED");
  assert.equal(missingCalendar.primaryAction.code, "OPEN_CALENDAR");

  const conflict = Trust.evaluate(healthy({ conflicts: [{ key: "running" }] }));
  assert.equal(conflict.status, "ACTION_REQUIRED");
  assert.equal(conflict.primaryAction.code, "CHOOSE_SAVED_COPY");
  assert.deepEqual(conflict.repairActions, []);
});

test("telemetry is an allowlisted operational envelope with no personal fields", () => {
  const report = Trust.evaluate(healthy());
  const payload = Trust.telemetryPayload("trust_check", report, {
    pendingWrites: 3,
    conflictCount: 1,
    route: "contract#private?email=recruit@example.com",
    email: "recruit@example.com",
    userId: "private-user"
  });
  assert.equal(payload.event, "trust_check");
  assert.equal(payload.pendingWrites, 3);
  assert.equal(payload.email, undefined);
  assert.equal(payload.userId, undefined);
  assert.equal(payload.route, "app");
  assert.doesNotMatch(JSON.stringify(payload), /recruit@example\.com|private-user/);
});
