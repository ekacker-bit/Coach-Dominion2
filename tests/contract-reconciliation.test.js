"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Reconciliation = require("../assets/js/contract-reconciliation.js");
const AccountTruth = require("../assets/js/dominion-account-truth.js");

function approved(overrides = {}) {
  return {
    id: "contract-r12",
    revision: 12,
    status: "APPROVED",
    primaryGoal: "LOSE_FAT",
    target: "Reach a durable lean baseline",
    targetDate: "2026-12-31",
    trainingDaysPerWeek: 5,
    strengthDaysPerWeek: 3,
    runningDaysPerWeek: 3,
    coreDaysPerWeek: 3,
    sessionMinutes: 75,
    twoADays: false,
    nutritionCommitment: "TRACK_DAILY",
    signature: { contractRevision: 12, signedAt: "2026-08-01T12:00:00.000Z" },
    ...overrides
  };
}

function conflict(device = approved(), account = approved()) {
  return {
    domain: "contract",
    stateType: "APPROVED",
    stateKey: "current",
    choiceKey: "contract:APPROVED:current",
    reason: "Same immutable revision has different contents.",
    device,
    account,
    accountUpdatedAt: "2026-08-17T12:00:00.000Z"
  };
}

test("identical Contract contents resolve without manufacturing a revision", () => {
  const result = Reconciliation.reconcileContract(conflict(), "ACCOUNT", { resolvedAt: "2026-08-17T13:00:00.000Z" });
  assert.equal(result.canonicalChanged, false);
  assert.equal(result.resultRevision, 12);
  assert.equal(result.receipt.selectedSource, "ACCOUNT");
});

test("choosing divergent device contents creates a new immutable revision", () => {
  const source = conflict(approved({ twoADays: true, runningDaysPerWeek: 4 }), approved());
  const result = Reconciliation.reconcileContract(source, "DEVICE", { resolvedAt: "2026-08-17T13:00:00.000Z", protectedEvidenceCount: 9 });
  assert.equal(result.canonicalChanged, true);
  assert.equal(result.resultRevision, 13);
  assert.equal(result.canonical.revision, 13);
  assert.equal(result.canonical.reconciledFromRevision, 12);
  assert.notEqual(result.canonical.id, source.device.id);
  assert.equal(result.receipt.evidence.policy, "PRESERVED");
  assert.equal(result.receipt.evidence.protectedCount, 9);
});

test("the comparison exposes changed fields, origins, hashes, and downstream impact", () => {
  const source = conflict(approved({ twoADays: true, nutritionCommitment: "TRACK_5_DAYS" }), approved());
  const preview = Reconciliation.buildPreview(source, { protectedEvidenceCount: 4, previewed: true });
  assert.deepEqual(preview.diffs.map((item) => item.key), ["twoADays", "nutritionCommitment"]);
  assert.match(preview.consequences.DEVICE, /new immutable revision 13/i);
  assert.match(preview.impact.calendar, /active week stays protected/i);
  assert.match(preview.impact.fuel, /recalculated/i);
  assert.equal(preview.device.shortHash.length, 8);
  assert.equal(preview.account.updatedAt, "2026-08-17T12:00:00.000Z");
});

test("a Contract conflict freezes plan execution while raw evidence remains safe", () => {
  const policy = Reconciliation.executionPolicy([conflict(approved({ twoADays: true }), approved())]);
  assert.equal(policy.code, "CONTRACT_CONFLICT");
  assert.equal(policy.progressionAllowed, false);
  assert.equal(policy.rawEvidenceAllowed, true);
  assert.equal(policy.action.label, "Compare and choose saved Contract");
});

test("receipts survive account snapshot merge and a second session", () => {
  const result = Reconciliation.reconcileContract(conflict(approved({ twoADays: true }), approved()), "DEVICE", { resolvedAt: "2026-08-17T13:00:00.000Z", protectedEvidenceCount: 2 });
  const device = AccountTruth.buildSnapshot({ evidence: { reconciliationReceipts: [result.receipt] } }, { userId: "u1", deviceId: "d1", capturedAt: "2026-08-17T13:00:00.000Z" });
  const account = AccountTruth.buildSnapshot({ evidence: { reconciliationReceipts: [] } }, { userId: "u1", deviceId: "d2", capturedAt: "2026-08-17T12:00:00.000Z" });
  const secondSession = AccountTruth.reconcileSnapshots({}, AccountTruth.reconcileSnapshots(device, account).snapshot).snapshot;
  assert.equal(secondSession.domains.evidence.payload.reconciliationReceipts[0].id, result.receipt.id);
});

test("bulk resolution stays hidden until every conflict is previewed", () => {
  assert.equal(Reconciliation.allPreviewed([{ previewed: true }, { previewed: false }]), false);
  assert.equal(Reconciliation.allPreviewed([{ previewed: true }, { previewed: true }]), true);
});
