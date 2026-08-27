"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Activation = require("../assets/js/morning-command-activation.js");

function fixture(overrides = {}) {
  const assignments = [
    { assignmentId: "strength-26", module: "strength", title: "Lower A", order: 1, state: "scheduled" },
    { assignmentId: "fuel-26", module: "nutrition", title: "Training-day Fuel", order: 2, state: "scheduled" }
  ];
  const handoff = {
    id: "next-day-command:2026-08-26:abc",
    type: "NEXT_DAY_COMMAND_HANDOFF",
    version: "030T.1",
    status: "CERTIFIED",
    targetDate: "2026-08-26",
    fingerprint: "handoff-abc",
    accountConfirmedAt: "2026-08-25T23:55:00Z",
    decision: { id: "decision-25", status: "ACTIVE", verdict: "MAINTAIN" },
    authority: {
      contractRevision: 14,
      weekId: "week-34",
      weekRevision: 3,
      canonicalId: "canonical-day-26",
      canonicalDate: "2026-08-26"
    },
    assignments: assignments.map((item) => ({ assignmentId: item.assignmentId, module: item.module }))
  };
  return {
    targetDate: "2026-08-26",
    handoff,
    contractRevision: 14,
    weekId: "week-34",
    weekRevision: 3,
    canonical: {
      id: "canonical-day-26",
      date: "2026-08-26",
      week: { id: "week-34", revision: 3 },
      schedule: {
        recoveryDay: false,
        sessions: [{ id: "strength-26", assignmentId: "strength-26", module: "strength", title: "Lower A", order: 1 }]
      }
    },
    assignments,
    previousExecutions: [],
    resolutions: [],
    accountReceipts: [],
    serverConfirmed: false,
    ...overrides
  };
}

function unfinishedRun() {
  return {
    id: "run-execution-25",
    assignmentId: "run-25",
    module: "running",
    title: "Tempo development",
    date: "2026-08-25",
    state: "PAUSED"
  };
}

test("030U requires an exact certified 030T handoff", () => {
  assert.equal(Activation.evaluate(fixture({ handoff: null })).state, "WAITING");
  assert.equal(Activation.evaluate(fixture({ handoff: { ...fixture().handoff, status: "PROTECTED" } })).state, "WAITING");
  assert.equal(Activation.evaluate(fixture({ handoff: { ...fixture().handoff, accountConfirmedAt: null } })).state, "WAITING");
});

test("030U never carries unfinished prior-day work silently", () => {
  const result = Activation.evaluate(fixture({ previousExecutions: [unfinishedRun()] }));
  assert.equal(result.state, "DECISION_REQUIRED");
  assert.equal(result.unfinished.selected.executionId, "run-execution-25");
  assert.equal(result.receipt, null);
  assert.match(result.view.detail, /Nothing carries/);
});

test("resume makes the prior execution the only active command", () => {
  const execution = unfinishedRun();
  const resolution = Activation.resolutionReceipt(execution, "RESUME", "2026-08-26", { decidedAt: "2026-08-26T06:00:00Z" });
  const result = Activation.evaluate(fixture({ previousExecutions: [execution], resolutions: [resolution] }));
  assert.equal(result.state, "PROTECTED");
  assert.equal(result.target.assignmentId, "run-25");
  assert.equal(result.target.carryover, true);
  assert.equal(result.target.route.section, "performance");
  assert.equal(result.target.route.module, "running");
});

test("reschedule and close-incomplete release today's canonical command", () => {
  const execution = unfinishedRun();
  ["RESCHEDULE", "CLOSE_INCOMPLETE"].forEach((action) => {
    const resolution = Activation.resolutionReceipt(execution, action, "2026-08-26", { decidedAt: "2026-08-26T06:00:00Z" });
    const result = Activation.evaluate(fixture({ previousExecutions: [execution], resolutions: [resolution] }));
    assert.equal(result.state, "PROTECTED");
    assert.equal(result.target.assignmentId, "strength-26");
    assert.equal(result.target.carryover, undefined);
    assert.equal(result.receipt.priorDayResolution.action, action);
  });
});

test("current Contract, week, and assignment identities must still match the handoff", () => {
  const contractDrift = Activation.evaluate(fixture({ contractRevision: 15 }));
  assert.equal(contractDrift.state, "ACTION_REQUIRED");
  assert.ok(contractDrift.issues.some((item) => item.code === "HANDOFF_CONTRACT_MISMATCH"));
  const assignmentDrift = Activation.evaluate(fixture({ assignments: [{ assignmentId: "other", module: "strength" }] }));
  assert.equal(assignmentDrift.state, "ACTION_REQUIRED");
  assert.ok(assignmentDrift.issues.some((item) => item.code === "HANDOFF_ASSIGNMENTS_CHANGED"));
});

test("multiple active prior sessions stop the line instead of choosing arbitrarily", () => {
  const result = Activation.evaluate(fixture({
    previousExecutions: [unfinishedRun(), { id: "strength-execution-25", assignmentId: "strength-25", module: "strength", date: "2026-08-25", state: "IN_PROGRESS" }]
  }));
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.ok(result.issues.some((item) => item.code === "MULTIPLE_ACTIVE_EXECUTIONS"));
});

test("exact account confirmation certifies the unchanged activation receipt", () => {
  const protectedResult = Activation.evaluate(fixture());
  const certified = Activation.evaluate(fixture({
    accountReceipts: [protectedResult.receipt],
    serverConfirmed: true,
    accountConfirmedAt: "2026-08-26T06:01:00Z",
    activatedAt: "2026-08-26T06:01:00Z"
  }));
  assert.equal(certified.state, "CERTIFIED");
  assert.equal(certified.receipt.id, protectedResult.receipt.id);
  assert.equal(certified.target.route.anchor, "daily-assignment-heading");
});

test("a second device restores the same certified command identity", () => {
  const first = Activation.evaluate(fixture());
  const second = Activation.evaluate(fixture({ accountReceipts: [first.receipt], serverConfirmed: true }));
  assert.equal(second.candidateReceiptId, first.candidateReceiptId);
  assert.equal(second.receipt.target.assignmentId, "strength-26");
});

test("recovery and each training domain resolve to the real execution surface", () => {
  assert.equal(Activation.routeFor({ module: "strength", title: "Lower A" }).anchor, "daily-assignment-heading");
  assert.equal(Activation.routeFor({ module: "running", title: "Tempo" }).anchor, "running-command-panel");
  assert.equal(Activation.routeFor({ module: "core", title: "Core 2.1" }).anchor, "today-core-detail");
  assert.equal(Activation.routeFor({ module: "nutrition", title: "Fuel" }).section, "nutrition");
  const recovery = Activation.evaluate(fixture({
    handoff: { ...fixture().handoff, decision: { id: "decision-25", status: "ACTIVE", verdict: "RECOVER" } },
    canonical: { ...fixture().canonical, schedule: { recoveryDay: true, sessions: [] } }
  }));
  assert.equal(recovery.target.module, "recovery");
  assert.equal(recovery.target.route.anchor, "today-recovery-card");
});

module.exports = { fixture, unfinishedRun };
