const test = require("node:test");
const assert = require("node:assert/strict");
const commissioning = require("../assets/js/campaign-commissioning.js");

function contract(overrides = {}) {
  return {
    id: "contract-27a",
    revision: 4,
    status: "APPROVED",
    age: 42,
    heightCm: 178,
    weightKg: 80,
    trainingYears: 12,
    athleteType: "VETERAN",
    ...overrides
  };
}

const orientation = {
  status: "COMPLETE",
  profile: { age: 42, heightCm: 178, trainingYears: 12, athleteType: "VETERAN" }
};
const readyPackage = { status: "READY_FOR_APPROVAL" };
const clearPreflight = { status: "READY_TO_ACTIVATE", blockers: [] };

test("an unsigned Contract is the only first commissioning order", () => {
  const model = commissioning.buildCommissioning({});
  assert.equal(model.status, "CONTRACT_REQUIRED");
  assert.equal(model.nextAction.code, "EDIT_CONTRACT");
  assert.equal(model.progress.complete, 0);
});
test("profile and Week One protocol are real baseline blockers", () => {
  const model = commissioning.buildCommissioning({
    contract: contract({ weightKg: null }),
    signatureValid: true,
    orientation: { status: "IN_PROGRESS", profile: orientation.profile }
  });
  assert.equal(model.status, "BASELINE_REQUIRED");
  assert.equal(model.nextAction.code, "OPEN_ORIENTATION");
  assert.match(model.blockers[0].detail, /current weight/i);
});

test("recommended evidence strengthens Week One without blocking launch", () => {
  const model = commissioning.buildCommissioning({
    contract: contract(),
    signatureValid: true,
    orientation,
    programPackage: readyPackage,
    preflight: clearPreflight,
    baseline: { bodyBaseline: false, performanceBaseline: false, recoveryBaseline: false }
  });
  assert.equal(model.status, "READY_TO_LAUNCH");
  assert.equal(model.nextAction.code, "BEGIN_CAMPAIGN");
  assert.equal(model.baseline.recommended.length, 3);
  assert.equal(model.blockers.length, 0);
  assert.equal(model.progress.complete, 4);
});

test("preflight exposes precise blockers instead of partial activation", () => {
  const model = commissioning.buildCommissioning({
    contract: contract(),
    signatureValid: true,
    orientation,
    programPackage: readyPackage,
    preflight: {
      status: "BLOCKED",
      blockers: [{ code: "CALENDAR_COLLISION", title: "Opening week collision", detail: "Tuesday exceeds the signed capacity.", action: "Move the second session." }]
    }
  });
  assert.equal(model.status, "BLOCKED");
  assert.equal(model.nextAction.code, "REVIEW_BLOCKERS");
  assert.equal(model.blockers[0].id, "CALENDAR_COLLISION");
  assert.match(model.message, /prevent the program and calendar/i);
});

test("an existing active program is commissioned without repeating setup", () => {
  const activeProgram = {
    id: "program-receipt-27a",
    status: "ACTIVE",
    contractId: "contract-27a",
    contractRevision: 4,
    weekId: "week-27a",
    weekStart: "2026-08-17",
    activatedAt: "2026-08-15T12:00:00.000Z"
  };
  const week = { id: "week-27a", status: "APPROVED", weekStart: "2026-08-17" };
  const model = commissioning.buildCommissioning({
    contract: contract(),
    signatureValid: true,
    orientation: { status: "IN_PROGRESS", profile: {} },
    programReceipt: activeProgram,
    committedWeek: week
  });
  assert.equal(model.status, "ACTIVE");
  assert.equal(model.legacyActive, true);
  assert.equal(model.nextAction.code, "OPEN_TODAY");
  const receipt = commissioning.createReceipt(model, activeProgram, week, { launchedAt: "2026-08-15T12:00:00.000Z" });
  assert.equal(receipt.id, "commission:contract-27a:r4");
  assert.equal(receipt.source, "ACTIVE_PROGRAM_BACKFILL");
  assert.equal(receipt.weekId, "week-27a");
});

test("commissioning receipts remain bound to one Contract revision", () => {
  const receipt = { status: "ACTIVE", contractId: "contract-27a", contractRevision: 4 };
  assert.equal(commissioning.commissioningActive(receipt, contract()), true);
  assert.equal(commissioning.commissioningActive(receipt, contract({ revision: 5 })), false);
});
