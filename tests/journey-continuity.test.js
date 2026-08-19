"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const continuity = require("../assets/js/journey-continuity.js");

function certifiedJourney(overrides = {}) {
  return {
    certified: true,
    fingerprint: "journey-fingerprint",
    lineage: {
      date: "2026-08-18",
      contractRevision: 14,
      operatingContractRevision: 12,
      programId: "program-12",
      weekId: "week-12",
      todayId: "today-18"
    },
    ...overrides
  };
}

function receipt(options = {}) {
  return continuity.buildReceipt(certifiedJourney(), {
    assignments: [
      { id: "lower-a", module: "STRENGTH", title: "Lower A", estimatedMinutes: 65 },
      { id: "core-a", module: "CORE", title: "Core A", estimatedMinutes: 15 }
    ],
    evidenceIds: ["set-2", "set-1"],
    closeout: { id: "close-18", status: "SEALED" },
    observedAt: options.observedAt || "2026-08-18T12:00:00.000Z"
  });
}

test("creates one stable continuity identity across devices and timestamps", () => {
  const phone = receipt({ observedAt: "2026-08-18T12:00:00.000Z" });
  const desktop = receipt({ observedAt: "2026-08-18T20:00:00.000Z" });
  assert.equal(phone.id, desktop.id);
  assert.equal(phone.proofFingerprint, desktop.proofFingerprint);
  assert.notEqual(phone.observedAt, desktop.observedAt);
  assert.deepEqual(phone.assignmentIds, ["core-a", "lower-a"]);
  assert.deepEqual(phone.evidenceIds, ["set-1", "set-2"]);
});

test("saves a complete journey once before account verification", () => {
  const candidate = receipt();
  const report = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [], accountReceipts: [], serverConfirmed: true, pendingWrites: 0, syncState: "synced" });
  assert.equal(report.state, "READY_TO_SAVE");
  assert.equal(report.shouldSave, true);
  assert.equal(continuity.appendReceipt([], candidate).length, 1);
  assert.equal(continuity.appendReceipt([candidate], candidate).length, 1);
});

test("protects an exact local receipt while account sync is pending or offline", () => {
  const candidate = receipt();
  const queued = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [candidate], pendingWrites: 1, syncState: "transient_retry", online: true });
  const offline = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [candidate], pendingWrites: 1, syncState: "offline_queued", online: false });
  assert.equal(queued.state, "PROTECTED");
  assert.equal(queued.label, "SYNCING");
  assert.equal(offline.state, "PROTECTED");
  assert.equal(offline.label, "SAVED HERE");
});

test("verifies the exact account receipt on another device", () => {
  const candidate = receipt();
  const report = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [], accountReceipts: [candidate], serverConfirmed: true, pendingWrites: 0, syncState: "synced" });
  assert.equal(report.state, "VERIFIED");
  assert.equal(report.verified, true);
  assert.equal(report.label, "ACCOUNT VERIFIED");
});

test("refuses to certify a device that drops evidence from the saved lineage", () => {
  const saved = receipt();
  const candidate = continuity.buildReceipt(certifiedJourney(), {
    assignments: saved.assignments,
    evidenceIds: ["set-1"],
    closeout: saved.closeout,
    observedAt: "2026-08-18T21:00:00.000Z"
  });
  const report = continuity.evaluate({ journey: certifiedJourney(), candidate, accountReceipts: [saved], serverConfirmed: true, pendingWrites: 0, syncState: "synced" });
  assert.equal(report.state, "EVIDENCE_MISMATCH");
  assert.equal(report.evidencePreserved, false);
  assert.equal(report.action.code, "OPEN_ACCOUNT_HEALTH");
});

test("requires a deliberate repair for conflict and user-action sync states", () => {
  const candidate = receipt();
  const conflict = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [candidate], syncState: "conflict" });
  const repair = continuity.evaluate({ journey: certifiedJourney(), candidate, localReceipts: [candidate], syncState: "user_action_required" });
  assert.equal(conflict.state, "ACCOUNT_CONFLICT");
  assert.equal(conflict.action.code, "RESOLVE_CONTINUITY");
  assert.equal(repair.state, "ACCOUNT_ACTION_REQUIRED");
  assert.equal(repair.action.code, "OPEN_ACCOUNT_HEALTH");
});
