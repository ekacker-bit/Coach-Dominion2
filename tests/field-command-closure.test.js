"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Closure = require("../assets/js/field-command-closure.js");

const date = "2026-08-29";
const authority = { contractRevision: 21, weekId: "week-35", weekRevision: 8 };
const ledger = {
  date,
  fingerprint: "execution-ledger:2026-08-29:abc123",
  consistency: { consistent: true, issues: [] },
  entries: [
    { assignmentId: "week-35:strength:lower-a", module: "strength", state: "completed", assignment: { title: "Lower A" } },
    { assignmentId: "week-35:running:easy", module: "running", state: "scheduled", assignment: { title: "Easy run" } },
    { assignmentId: "week-35:core:control", module: "core", state: "scheduled", assignment: { title: "Core control" } },
    { assignmentId: "week-35:nutrition", module: "nutrition", state: "scheduled", assignment: { title: "Fuel target" } }
  ]
};

function receipt(assignmentId, module, overrides = {}) {
  return {
    type: "COMMAND_COMPLETION_CERTIFICATION",
    id: `command-completion:${date}:${assignmentId}`,
    operationalDate: date,
    status: "CERTIFIED",
    verificationStatus: "VERIFIED",
    accountConfirmedAt: `${date}T18:00:00Z`,
    authority,
    completion: { assignmentId, module, state: "COMPLETE" },
    closure: { outcome: "COMPLETED", sourceEvidenceConfirmed: true },
    ...overrides
  };
}

test("030Z does not advance from device-only execution state", () => {
  const result = Closure.evaluate({ date, authority, ledger, receipts: [] });
  assert.equal(result.state, "OPEN");
  assert.equal(result.next.assignmentId, "week-35:strength:lower-a");
  assert.equal(result.terminal, 0);
  assert.equal(result.closeoutReady, false);
});

test("030Z advances only after exact account-confirmed assignment closure", () => {
  const strength = receipt("week-35:strength:lower-a", "strength");
  const result = Closure.evaluate({ date, authority, ledger, receipts: [strength] });
  assert.equal(result.state, "ADVANCED");
  assert.equal(result.next.assignmentId, "week-35:running:easy");
  assert.equal(result.assignments[0].receiptId, strength.id);
});

test("030Z rejects protected and stale-authority receipts", () => {
  const protectedReceipt = receipt("week-35:strength:lower-a", "strength", { status: "PROTECTED", accountConfirmedAt: null });
  const staleReceipt = receipt("week-35:strength:lower-a", "strength", { authority: { ...authority, weekRevision: 7 } });
  assert.equal(Closure.evaluate({ date, authority, ledger, receipts: [protectedReceipt] }).next.assignmentId, "week-35:strength:lower-a");
  assert.equal(Closure.evaluate({ date, authority, ledger, receipts: [staleReceipt] }).next.assignmentId, "week-35:strength:lower-a");
});

test("030Z unlocks Closeout only when every signed assignment is terminal", () => {
  const receipts = ledger.entries.map((entry) => receipt(entry.assignmentId, entry.module));
  const result = Closure.evaluate({ date, authority, ledger, receipts });
  assert.equal(result.state, "CLOSEOUT_READY");
  assert.equal(result.next, null);
  assert.equal(result.terminal, result.total);
  assert.equal(result.closeoutReady, true);
});

test("030Z keeps Recovery ahead of Fuel on a recovery day", () => {
  const recoveryLedger = {
    ...ledger,
    entries: [
      { assignmentId: `recovery:${date}`, module: "recovery", state: "scheduled", assignment: { title: "Recovery order" } },
      { assignmentId: "week-35:nutrition", module: "nutrition", state: "scheduled", assignment: { title: "Fuel target" } }
    ]
  };
  const fuelOnly = Closure.evaluate({
    date,
    authority,
    ledger: recoveryLedger,
    receipts: [receipt("week-35:nutrition", "nutrition")]
  });
  assert.equal(fuelOnly.next.assignmentId, `recovery:${date}`);
  assert.equal(fuelOnly.closeoutReady, false);
  const complete = Closure.evaluate({
    date,
    authority,
    ledger: recoveryLedger,
    receipts: [receipt(`recovery:${date}`, "recovery"), receipt("week-35:nutrition", "nutrition")]
  });
  assert.equal(complete.closeoutReady, true);
});

test("030Z yields the same next command after reload or on a second device", () => {
  const receipts = [receipt("week-35:strength:lower-a", "strength")];
  const first = Closure.evaluate({ date, authority, ledger, receipts });
  const restored = Closure.evaluate(JSON.parse(JSON.stringify({ date, authority, ledger, receipts })));
  assert.equal(restored.fingerprint, first.fingerprint);
  assert.equal(restored.nextFingerprint, first.nextFingerprint);
  assert.equal(restored.next.assignmentId, first.next.assignmentId);
});

test("030Z surface audit stops cross-route command disagreement", () => {
  const result = Closure.evaluate({ date, authority, ledger, receipts: [receipt("week-35:strength:lower-a", "strength")] });
  const agreed = Closure.surfaceAudit(result, {
    today: "week-35:running:easy",
    calendar: "week-35:running:easy",
    train: "week-35:running:easy",
    fuel: "week-35:running:easy"
  });
  assert.equal(agreed.matches, true);
  const drift = Closure.surfaceAudit(result, { today: "week-35:running:easy", calendar: "week-35:strength:lower-a" });
  assert.equal(drift.matches, false);
  assert.equal(drift.reports.find((item) => item.surface === "calendar").matches, false);
});
