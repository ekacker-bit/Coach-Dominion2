const test = require("node:test");
const assert = require("node:assert/strict");
const Handoff = require("../assets/js/next-day-command-handoff.js");

function fixture(overrides = {}) {
  const decision = {
    id: "atlas-loop:2026-08-25:abc",
    date: "2026-08-25",
    effectiveDate: "2026-08-26",
    status: "ACTIVE",
    verdict: "MAINTAIN",
    headline: "Hold steady",
    reason: "2/2 assignments secured.",
    impact: "Tomorrow keeps the committed plan.",
    contractRevision: 14,
    weekRevision: 3
  };
  const sourceReceipt = {
    id: "daily-loop:2026-08-25:source",
    type: "DAILY_LOOP_CERTIFICATION",
    version: "030S.1",
    status: "CERTIFIED",
    date: "2026-08-25",
    decision: { id: decision.id, effectiveDate: decision.effectiveDate },
    lineage: { weekId: "week-34" },
    counts: { COMPLETE: 2, PARTIAL: 0, MISSED: 0 }
  };
  const assignments = [
    { assignmentId: "strength-1", module: "strength", state: "scheduled" },
    { assignmentId: "fuel-1", module: "nutrition", state: "scheduled" }
  ];
  const surfaceAssignments = {
    calendar: assignments,
    today: assignments,
    train: assignments.filter((item) => item.module === "strength"),
    quickLog: assignments.filter((item) => ["running", "nutrition"].includes(item.module)),
    fuel: assignments.filter((item) => item.module === "nutrition")
  };
  return {
    targetDate: "2026-08-26",
    decision,
    sourceReceipt,
    sourceWeekId: "week-34",
    contractRevision: 14,
    weekId: "week-34",
    weekRevision: 3,
    canonical: { id: "canonical-day-26", date: "2026-08-26", week: { id: "week-34", revision: 3 } },
    assignments,
    surfaceAssignments,
    accountReceipts: [],
    serverConfirmed: false,
    ...overrides
  };
}

test("a certified prior day produces one protected command receipt", () => {
  const result = Handoff.evaluate(fixture());
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.command.mode, "PRESERVED");
  assert.match(result.receipt.id, /^next-day-command:2026-08-26:/);
});

test("an unresolved bounded change asks for one decision", () => {
  const input = fixture();
  input.decision = { ...input.decision, status: "PROPOSED", verdict: "REDUCE", headline: "Reduce the next dose" };
  input.sourceReceipt = { ...input.sourceReceipt, decision: { id: input.decision.id, effectiveDate: input.decision.effectiveDate } };
  const result = Handoff.evaluate(input);
  assert.equal(result.state, "REVIEW_REQUIRED");
  assert.equal(result.receipt, null);
});

test("a proposed change cannot act without the certified source receipt", () => {
  const input = fixture({ sourceReceipt: null });
  input.decision = { ...input.decision, status: "PROPOSED", verdict: "ADVANCE" };
  const result = Handoff.evaluate(input);
  assert.equal(result.state, "WAITING");
});

test("a surface mismatch stops the command", () => {
  const input = fixture();
  input.surfaceAssignments = { ...input.surfaceAssignments, quickLog: [] };
  const result = Handoff.evaluate(input);
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.equal(result.issues[0].code, "COMMAND_SURFACE_MISMATCH");
});

test("a newer signed Contract preserves its command instead of applying a stale decision", () => {
  const input = fixture({ contractRevision: 15 });
  const result = Handoff.evaluate(input);
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.command.mode, "PRESERVED");
  assert.equal(result.command.headline, "Current Contract governs");
});

test("a new committed week outranks the prior day's adjustment", () => {
  const input = fixture({ sourceWeekId: "week-34", weekId: "week-35", canonical: { id: "canonical-day-26", date: "2026-08-26", week: { id: "week-35", revision: 1 } }, weekRevision: 1 });
  const result = Handoff.evaluate(input);
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.command.headline, "Committed week governs");
});

test("exact account confirmation upgrades the unchanged receipt", () => {
  const protectedResult = Handoff.evaluate(fixture());
  const result = Handoff.evaluate(fixture({ accountReceipts: [protectedResult.receipt], serverConfirmed: true, accountConfirmedAt: "2026-08-26T12:00:00Z" }));
  assert.equal(result.state, "CERTIFIED");
  assert.equal(result.receipt.id, protectedResult.receipt.id);
});

test("a second device restores the same deterministic command", () => {
  const first = Handoff.evaluate(fixture());
  const second = Handoff.evaluate(fixture({ accountReceipts: [first.receipt], serverConfirmed: true }));
  assert.equal(second.candidateReceiptId, first.candidateReceiptId);
  assert.equal(second.view.headline, "Plan holds");
});
