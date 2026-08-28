"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Completion = require("../assets/js/command-completion-certification.js");

function fixture(overrides = {}) {
  const assignments = [
    { assignmentId: "lower-a-27", module: "strength", title: "Lower A", sessionOrder: 1, trainingWindowId: "am", sessionLabel: "AM" },
    { assignmentId: "run-27", module: "running", title: "Easy run", sessionOrder: 2, trainingWindowId: "pm", sessionLabel: "PM" },
    { assignmentId: "core-27", module: "core", title: "Core control", sessionOrder: 1, trainingWindowId: "pm", sessionLabel: "PM", tertiary: true }
  ];
  const source = {
    id: "mission:2026-08-27:strength:lower-a-execution",
    date: "2026-08-27",
    module: "STRENGTH",
    assignmentId: "lower-a-27",
    sourceRecordId: "lower-a-execution",
    state: "COMPLETE",
    completedAt: "2026-08-27T13:00:00Z",
    summary: { completedSets: 16, plannedSets: 16 }
  };
  return {
    operationalDate: "2026-08-27",
    authority: { contractRevision: 14, weekId: "week-35", weekRevision: 4, calendarCommitId: "calendar-35" },
    assignments,
    source,
    history: [],
    accountReceipts: [],
    serverConfirmed: false,
    ...overrides
  };
}

test("030V protects a terminal completion until the exact account receipt returns", () => {
  const result = Completion.evaluate(fixture());
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.receipt.type, "COMMAND_COMPLETION_CERTIFICATION");
  assert.equal(result.receipt.assignmentId, "lower-a-27");
  assert.equal(result.receipt.verificationStatus, "PENDING_ACCOUNT_RECEIPT");
});

test("the exact returned receipt certifies without changing identity", () => {
  const first = Completion.evaluate(fixture());
  const second = Completion.evaluate(fixture({ accountReceipts: [first.receipt], serverConfirmed: true, accountConfirmedAt: "2026-08-27T13:00:02Z" }));
  assert.equal(second.state, "CERTIFIED");
  assert.equal(second.receipt.id, first.receipt.id);
  assert.equal(second.receipt.fingerprint, first.receipt.fingerprint);
  assert.equal(second.receipt.verificationStatus, "VERIFIED");
});

test("a duplicate click produces one deterministic completion identity", () => {
  const first = Completion.evaluate(fixture());
  const second = Completion.evaluate(fixture({ createdAt: "2026-08-27T13:10:00Z" }));
  const history = Completion.upsertHistory(Completion.upsertHistory([], first.receipt), second.receipt);
  assert.equal(first.receipt.id, second.receipt.id);
  assert.equal(history.length, 1);
});

test("a stale or mismatched Calendar assignment stops the line", () => {
  const stale = Completion.evaluate(fixture({ assignments: fixture().assignments.filter((item) => item.assignmentId !== "lower-a-27") }));
  assert.equal(stale.state, "ACTION_REQUIRED");
  assert.ok(stale.issues.some((item) => item.code === "STALE_ASSIGNMENT_REJECTED"));
  const wrongModule = Completion.evaluate(fixture({ assignments: fixture().assignments.map((item) => item.assignmentId === "lower-a-27" ? { ...item, module: "running" } : item) }));
  assert.ok(wrongModule.issues.some((item) => item.code === "ASSIGNMENT_MODULE_MISMATCH"));
});

test("two-a-day progression advances AM Strength to PM Run before tertiary Core", () => {
  const result = Completion.evaluate(fixture());
  assert.equal(result.next.assignmentId, "run-27");
  assert.equal(result.next.label, "PM Run");
  const runReceipt = Completion.evaluate(fixture({
    source: { ...fixture().source, id: "mission:run", module: "RUNNING", assignmentId: "run-27", sourceRecordId: "run-execution", completedAt: "2026-08-27T22:00:00Z" },
    history: [result.receipt]
  }));
  assert.equal(runReceipt.next.assignmentId, "core-27");
  assert.equal(runReceipt.next.tertiary, true);
});

test("the final scheduled session hands off to Daily Closeout", () => {
  const strength = Completion.evaluate(fixture()).receipt;
  const running = Completion.evaluate(fixture({ source: { ...fixture().source, id: "mission:run", module: "RUNNING", assignmentId: "run-27", sourceRecordId: "run-execution" }, history: [strength] })).receipt;
  const coreInput = fixture({ source: { ...fixture().source, id: "mission:core", module: "CORE", assignmentId: "core-27", sourceRecordId: "core-execution" }, history: [running, strength] });
  const protectedCore = Completion.evaluate(coreInput);
  const core = Completion.evaluate({ ...coreInput, accountReceipts: [protectedCore.receipt], serverConfirmed: true });
  assert.equal(core.next.type, "CLOSEOUT");
  assert.equal(core.receipt.dayComplete, true);
  assert.match(core.view.detail, /Close the day/);
});

test("partial work is preserved honestly and pain routes to Recovery", () => {
  const partial = Completion.evaluate(fixture({ source: { ...fixture().source, state: "PARTIAL" } }));
  assert.equal(partial.receipt.sessionComplete, false);
  assert.equal(partial.view.headline, "Securing completion");
  const pain = Completion.evaluate(fixture({ source: { ...fixture().source, state: "PAIN_HOLD" } }));
  assert.equal(pain.next.type, "SAFETY");
  assert.equal(pain.next.route.anchor, "today-recovery-card");
});

test("a sealed Fuel assignment certifies against the committed Calendar", () => {
  const fuel = Completion.evaluate(fixture({
    assignments: [{ assignmentId: "fuel-27", module: "nutrition", title: "Fuel target", sessionOrder: 4 }],
    source: {
      id: "fuel-closeout:2026-08-27",
      date: "2026-08-27",
      module: "NUTRITION",
      assignmentId: "fuel-27",
      sourceRecordId: "fuel-2026-08-27",
      state: "SEALED",
      completedAt: "2026-08-28T02:00:00Z",
      summary: { calories: { actual: 2450 }, protein: { actual: 190 } }
    }
  }));
  assert.equal(fuel.receipt.module, "nutrition");
  assert.equal(fuel.receipt.assignmentId, "fuel-27");
  assert.equal(fuel.receipt.sessionComplete, true);
  assert.equal(fuel.next.type, "CLOSEOUT");
});

test("a second device restores the same receipt and next command", () => {
  const first = Completion.evaluate(fixture());
  const restored = Completion.evaluate(fixture({ accountReceipts: [{ ...first.receipt, accountConfirmedAt: "2026-08-27T13:00:02Z" }], serverConfirmed: true }));
  assert.equal(restored.receipt.id, first.receipt.id);
  assert.equal(restored.next.assignmentId, "run-27");
  assert.equal(restored.state, "CERTIFIED");
});

module.exports = { fixture };
