"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Integrity = require("../assets/js/beta-state-integrity.js");

const signed = {
  id: "contract-r14",
  revision: 14,
  status: "APPROVED",
  signature: {
    signerName: "Eric Recruit",
    accepted: true,
    contractId: "contract-r14",
    contractRevision: 14,
    oathVersion: Integrity.OATH_VERSION,
    signedAt: "2026-08-14T12:00:00Z"
  }
};

const activeWeek = {
  id: "week-r14-2026-08-24",
  status: "COMMITTED",
  weekStart: "2026-08-24",
  weekEnd: "2026-08-30",
  contractRevision: 14,
  programId: "program-r14"
};

test("the signed active week outranks a stale activation receipt", () => {
  const authority = Integrity.resolveOperatingProgramAuthority({
    today: "2026-08-26",
    signedContract: signed,
    activeWeek,
    receipt: { contractRevision: 15, programId: "stale-program-r15" }
  });
  assert.equal(authority.source, "SIGNED_ACTIVE_WEEK");
  assert.equal(authority.contractRevision, 14);
  assert.equal(authority.programId, "program-r14");
  assert.equal(authority.receiptDeferred, true);
});

test("a historical active session is archived once it predates the signed week by seven days", () => {
  const stale = {
    id: "strength-upper-b-2026-08-06",
    assignmentId: "legacy-upper-b",
    date: "2026-08-06",
    sessionName: "Upper B",
    state: "IN_PROGRESS",
    setLogs: { press: [{ id: "set-1", reps: 8, load: 70 }] }
  };
  const today = { id: "upper-a-2026-08-26", assignmentId: "upper-a-2026-08-26", date: "2026-08-26", sessionName: "Upper A" };
  const result = Integrity.resolveActiveStrengthSession({
    today: "2026-08-26",
    signedContract: signed,
    committedWeek: activeWeek,
    executions: [stale],
    assignments: [today]
  });
  assert.equal(result.authority, "SIGNED_WEEK_ASSIGNMENT");
  assert.equal(result.activeExecution, null);
  assert.equal(result.historicalExecution.id, stale.id);
  assert.equal(result.scheduledAssignmentId, today.assignmentId);
  assert.equal(result.calendarAssignmentId, today.assignmentId);
  assert.equal(result.activeSessionId, null);
  assert.equal(result.requiresResolution, false);
  assert.equal(result.retirementCandidates.length, 1);
  assert.equal(result.retirementCandidates[0].action, "ARCHIVE_INCOMPLETE");
});

test("a recent unfinished session still requires a deliberate choice", () => {
  const recent = { id: "lower-a-2026-08-23", assignmentId: "lower-a-old", date: "2026-08-23", sessionName: "Lower A", state: "PAUSED" };
  const today = { id: "upper-a-2026-08-26", assignmentId: "upper-a-2026-08-26", date: "2026-08-26", sessionName: "Upper A" };
  const result = Integrity.resolveActiveStrengthSession({
    today: "2026-08-26",
    signedContract: signed,
    committedWeek: activeWeek,
    executions: [recent],
    assignments: [today]
  });
  assert.equal(result.activeSessionId, recent.id);
  assert.equal(result.requiresResolution, true);
  assert.equal(result.retirementCandidates.length, 0);
});

test("a current signed-week session survives while a separate stale attempt is archived", () => {
  const stale = { id: "upper-b-legacy", assignmentId: "upper-b-legacy", date: "2026-08-06", sessionName: "Upper B", state: "IN_PROGRESS" };
  const current = { id: "upper-a-live", assignmentId: "upper-a-2026-08-26", date: "2026-08-26", sessionName: "Upper A", state: "IN_PROGRESS" };
  const today = { id: "upper-a-2026-08-26", assignmentId: "upper-a-2026-08-26", date: "2026-08-26", sessionName: "Upper A" };
  const result = Integrity.resolveActiveStrengthSession({
    today: "2026-08-26",
    signedContract: signed,
    committedWeek: activeWeek,
    executions: [stale, current],
    assignments: [today]
  });
  assert.equal(result.activeExecution.id, current.id);
  assert.equal(result.authority, "ACTIVE_EXECUTION");
  assert.equal(result.retirementCandidates.length, 1);
  assert.equal(result.retirementCandidates[0].execution.id, stale.id);
});

test("a recovery day does not borrow another day's Strength assignment", () => {
  const result = Integrity.resolveActiveStrengthSession({
    today: "2026-08-30",
    signedContract: signed,
    committedWeek: activeWeek,
    assignments: [{ id: "monday-lower", assignmentId: "monday-lower", date: "2026-08-24", sessionName: "Lower A" }]
  });
  assert.equal(result.scheduledAssignment, null);
  assert.equal(result.lifecycleState, "UNSCHEDULED");
});
