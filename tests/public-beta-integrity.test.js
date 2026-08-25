"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Integrity = require("../assets/js/beta-state-integrity.js");
const FuelState = require("../assets/js/nutrition-state-contract.js");

const signed = {
  id: "contract-r14", revision: 14, status: "APPROVED",
  signature: { signerName: "Eric Recruit", accepted: true, contractId: "contract-r14", contractRevision: 14, oathVersion: Integrity.OATH_VERSION, signedAt: "2026-08-14T12:00:00Z" }
};
const week = { id: "week-r14-2026-08-24", contractRevision: 14 };

const matrix = [
  { name: "desktop signed week ready", viewport: "desktop", assignments: [{ id: "lower-a", assignmentId: "lower-a", date: "2026-08-24", sessionName: "Lower A" }], expected: ["contract-r14", week.id, "lower-a", null, null, false, "READY", "Lower A"] },
  { name: "mobile restores the same ready assignment", viewport: "mobile-390", assignments: [{ id: "lower-a", assignmentId: "lower-a", date: "2026-08-24", sessionName: "Lower A" }], expected: ["contract-r14", week.id, "lower-a", null, null, false, "READY", "Lower A"] },
  { name: "historical active session remains explicit", viewport: "desktop", executions: [{ id: "exec-old", assignmentId: "lower-old", date: "2026-08-22", sessionName: "Lower A", state: "IN_PROGRESS", evidenceId: "evidence-old" }], assignments: [{ id: "upper-today", assignmentId: "upper-today", date: "2026-08-24", sessionName: "Upper A" }], evidence: [{ id: "evidence-old", assignmentId: "lower-old" }], expected: ["contract-r14", week.id, "lower-old", "exec-old", "evidence-old", true, "IN_PROGRESS", "Lower A"] },
  { name: "paused session restores without renaming", viewport: "mobile-390", executions: [{ id: "exec-pause", assignmentId: "upper-b", date: "2026-08-23", sessionName: "Upper B", state: "PAUSED" }], assignments: [{ id: "lower-today", assignmentId: "lower-today", date: "2026-08-24", sessionName: "Lower B" }], expected: ["contract-r14", week.id, "upper-b", "exec-pause", null, true, "PAUSED", "Upper B"] },
  { name: "closed history yields to today", viewport: "desktop", executions: [{ id: "exec-old", assignmentId: "lower-old", date: "2026-08-22", sessionName: "Lower A", state: "STOPPED" }], assignments: [{ id: "upper-today", assignmentId: "upper-today", date: "2026-08-24", sessionName: "Upper A" }], expected: ["contract-r14", week.id, "upper-today", null, null, false, "READY", "Upper A"] },
  { name: "review lifecycle stays active", viewport: "desktop", executions: [{ id: "exec-review", assignmentId: "core-lift", date: "2026-08-24", sessionName: "Full Body", state: "REVIEW" }], assignments: [{ id: "core-lift", assignmentId: "core-lift", date: "2026-08-24", sessionName: "Full Body" }], expected: ["contract-r14", week.id, "core-lift", "exec-review", null, false, "REVIEW", "Full Body"] },
  { name: "no strength assignment stays unscheduled", viewport: "mobile-390", expected: ["contract-r14", week.id, null, null, null, false, "UNSCHEDULED", null] },
  { name: "duplicate history keeps oldest active identity", viewport: "desktop", executions: [{ id: "exec-first", assignmentId: "lower-a", date: "2026-08-21", sessionName: "Lower A", state: "IN_PROGRESS" }, { id: "exec-second", assignmentId: "upper-a", date: "2026-08-23", sessionName: "Upper A", state: "IN_PROGRESS" }], assignments: [{ id: "today", assignmentId: "today", date: "2026-08-24", sessionName: "Lower B" }], expected: ["contract-r14", week.id, "lower-a", "exec-first", null, true, "IN_PROGRESS", "Lower A"] }
];

test("eight-case revision, week, assignment, session, evidence, pending, and name matrix", async (t) => {
  for (const scenario of matrix) {
    await t.test(scenario.name, () => {
      const result = Integrity.resolveActiveStrengthSession({ today: "2026-08-24", signedContract: signed, committedWeek: week, executions: scenario.executions || [], assignments: scenario.assignments || [], evidence: scenario.evidence || [] });
      assert.deepEqual([
        result.signedContractRevisionId, result.committedWeekId, result.calendarAssignmentId,
        result.activeSessionId, result.evidenceId, result.requiresResolution, result.lifecycleState, result.sessionName
      ], scenario.expected, scenario.viewport);
    });
  }
});

test("unsigned R15 and an unchanged draft cannot replace signed R14 authority", () => {
  const r15 = { ...signed, id: "contract-r15", revision: 15, status: "DRAFT", signature: null };
  const lifecycle = Integrity.resolveContractLifecycle({ approved: signed, draft: r15, history: [signed] });
  const draft = Integrity.resolvePlanRevisionStatus({ activeSignedContract: signed, draftContract: { ...signed, id: "draft-r15", revision: 15, signature: null }, activeWeek: week });
  assert.equal(lifecycle.activeSignedContractRevision, 14);
  assert.equal(lifecycle.draftAuthoritative, false);
  assert.equal(draft.draft.status, "NO_OPERATING_CHANGES");
  assert.equal(draft.draft.requiredCount, 0);
});

test("pending Fuel identity survives until the same payload is confirmed", () => {
  const payload = { revision: 14, calories: 2200, protein: 180 };
  const identity = FuelState.writeIdentity({ userId: "recruit", stateType: "manual_day", stateKey: "2026-08-24", payload });
  assert.match(identity.key, /recruit:MANUAL_DAY:2026-08-24:14:fuel-/);
  assert.equal(FuelState.shouldPersist({ userId: "recruit", stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload, pending: [{ stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload }] }).reason, "ALREADY_QUEUED");
});
