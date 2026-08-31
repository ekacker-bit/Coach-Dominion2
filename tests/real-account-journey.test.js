"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Journey = require("../assets/js/real-account-journey.js");

function completeInput(overrides = {}) {
  const assignments = overrides.assignments || [
    { id: "lower-a", module: "STRENGTH", status: "COMPLETED" },
    { id: "fuel-day", module: "NUTRITION", status: "LOGGED" }
  ];
  return {
    date: "2026-08-31",
    authority: {
      contractSigned: true,
      contractRevision: 14,
      programContractRevision: 14,
      weekContractRevision: 14,
      programId: "program-r14",
      weekId: "week-r14",
      todayId: "today-2026-08-31"
    },
    assignments,
    surfaces: {
      calendar: assignments,
      today: assignments,
      activeExecutionId: "lower-a"
    },
    evidence: [
      { id: "strength-receipt", assignmentId: "lower-a", module: "STRENGTH", verificationStatus: "VERIFIED" },
      { id: "fuel-receipt", assignmentId: "fuel-day", module: "NUTRITION", accountConfirmedAt: "2026-08-31T20:00:00.000Z" }
    ],
    fuel: { recordId: "manual-day:2026-08-31", receiptId: "fuel-receipt", confirmed: true },
    closeout: { id: "closeout-2026-08-31", date: "2026-08-31", status: "SEALED", accountConfirmedAt: "2026-09-01T03:00:00.000Z" },
    review: { operatingDate: "2026-08-31" },
    account: { serverConfirmed: true, lastVerifiedAt: "2026-09-01T03:01:00.000Z", online: true, pendingWrites: 0 },
    localReceipts: [],
    accountReceipts: [],
    observedAt: "2026-09-01T03:02:00.000Z",
    ...overrides
  };
}

test("an unfinished operating day stays in progress without inventing a failure", () => {
  const assignments = [
    { id: "lower-a", module: "STRENGTH", status: "ACTIVE" },
    { id: "fuel-day", module: "NUTRITION", status: "OPEN" }
  ];
  const report = Journey.evaluate(completeInput({
    assignments,
    surfaces: { calendar: assignments, today: assignments, activeExecutionId: "lower-a" },
    evidence: [],
    fuel: {},
    closeout: null,
    review: {}
  }));
  assert.equal(report.state, "IN_PROGRESS");
  assert.equal(report.firstProblem, null);
  assert.equal(report.candidate, null);
  assert.equal(report.stages.find((item) => item.id === "execution").state, "OPEN");
});

test("a complete account-backed day produces one stable final receipt", () => {
  const first = Journey.evaluate(completeInput());
  const second = Journey.evaluate(completeInput({ observedAt: "2026-09-01T04:00:00.000Z", authority: { ...completeInput().authority, unsignedDraftRevision: 15 } }));
  assert.equal(first.state, "READY_TO_SAVE");
  assert.equal(first.shouldSave, true);
  assert.equal(first.candidate.type, "REAL_ACCOUNT_JOURNEY");
  assert.equal(first.candidate.id, second.candidate.id);
  assert.equal(first.candidate.fingerprint, second.candidate.fingerprint);
});

test("the first session protects the receipt while the account confirms it", () => {
  const ready = Journey.evaluate(completeInput());
  const report = Journey.evaluate(completeInput({ localReceipts: [ready.candidate] }));
  assert.equal(report.state, "PROTECTED");
  assert.equal(report.localExact, true);
  assert.equal(report.accountExact, false);
  assert.equal(report.label, "SECURING");
});

test("an unchanged second session verifies the exact account receipt", () => {
  const ready = Journey.evaluate(completeInput());
  const restored = Journey.evaluate(completeInput({ accountReceipts: [ready.candidate], observedAt: "2026-09-01T10:00:00.000Z" }));
  assert.equal(restored.state, "VERIFIED");
  assert.equal(restored.verified, true);
  assert.equal(restored.accountExact, true);
  assert.equal(restored.label, "DAY SECURE");
});

test("a completed assignment without exact account evidence blocks advancement", () => {
  const report = Journey.evaluate(completeInput({
    evidence: [{ id: "fuel-receipt", assignmentId: "fuel-day", module: "NUTRITION", accountConfirmedAt: "2026-08-31T20:00:00.000Z" }]
  }));
  assert.equal(report.state, "ACTION_REQUIRED");
  assert.equal(report.firstProblem.code, "EXECUTION_RECEIPT_MISSING");
  assert.deepEqual(report.firstProblem.assignmentIds, ["lower-a"]);
});

test("surface disagreement routes to Calendar before any receipt is saved", () => {
  const report = Journey.evaluate(completeInput({
    surfaces: { calendar: [{ id: "upper-b" }], today: completeInput().assignments, activeExecutionId: "lower-a" }
  }));
  assert.equal(report.state, "ACTION_REQUIRED");
  assert.equal(report.firstProblem.code, "ASSIGNMENT_SURFACE_MISMATCH");
  assert.equal(report.primaryAction.section, "calendar");
  assert.equal(report.candidate, null);
});

test("pending Fuel and Closeout writes remain protected", () => {
  const report = Journey.evaluate(completeInput({
    fuel: { recordId: "manual-day:2026-08-31", pending: true },
    closeout: { id: "closeout-2026-08-31", date: "2026-08-31", status: "SEALED" },
    account: { serverConfirmed: false, online: false, pendingWrites: 2 }
  }));
  assert.equal(report.state, "PROTECTED");
  assert.equal(report.protected, true);
  assert.equal(report.label, "SAVED HERE");
});

test("receipt history is idempotent and keeps the newest observation", () => {
  const receipt = Journey.evaluate(completeInput()).candidate;
  const newer = { ...receipt, observedAt: "2026-09-01T12:00:00.000Z" };
  const history = Journey.appendReceipt([receipt], newer);
  assert.equal(history.length, 1);
  assert.equal(history[0].observedAt, newer.observedAt);
});
