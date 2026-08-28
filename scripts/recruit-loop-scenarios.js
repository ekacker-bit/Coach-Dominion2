"use strict";

const Engine = require("../assets/js/recruit-loop-certification.js");

const date = "2026-08-28";
const authority = { contractRevision: 9, weekId: "week-2026-08-24", weekRevision: 4, calendarCommitId: "calendar:week-2026-08-24:r4" };
const dailyLoop = { type: "DAILY_LOOP_CERTIFICATION", id: "daily-loop:2026-08-27:a1", status: "CERTIFIED", accountConfirmedAt: "2026-08-28T04:00:00.000Z", lineage: { contractRevision: 9, weekId: authority.weekId, weekRevision: 4 } };
const handoff = { type: "NEXT_DAY_COMMAND_HANDOFF", id: "handoff:2026-08-28:h1", fingerprint: "h1", targetDate: date, sourceReceiptId: dailyLoop.id, status: "CERTIFIED", accountConfirmedAt: "2026-08-28T04:01:00.000Z", authority };
const morning = { type: "MORNING_COMMAND_ACTIVATION", id: "morning:2026-08-28:m1", fingerprint: "m1", targetDate: date, sourceHandoffId: handoff.id, status: "CERTIFIED", accountConfirmedAt: "2026-08-28T11:00:00.000Z", authority, target: { assignmentId: "lower-a", module: "strength", title: "Lower A" } };
const completion = { type: "COMMAND_COMPLETION_CERTIFICATION", id: "completion:lower-a:c1", fingerprint: "c1", operationalDate: date, status: "CERTIFIED", accountConfirmedAt: "2026-08-28T13:00:00.000Z", completedAt: "2026-08-28T12:59:00.000Z", authority, completion: { assignmentId: "lower-a", module: "strength" } };

function base(overrides = {}) {
  return {
    targetDate: date,
    userId: "recruit-1",
    authority,
    assignments: [{ assignmentId: "lower-a", module: "strength" }],
    dailyLoopReceipts: [dailyLoop],
    nextDayHandoffs: [handoff],
    morningActivations: [morning],
    commandCompletions: [completion],
    accountReceipts: [],
    serverConfirmed: true,
    pendingWrites: 0,
    accountConfirmedAt: "2026-08-28T13:01:00.000Z",
    restoreDurationMs: 2100,
    startupIssues: [],
    createdAt: "2026-08-28T13:00:00.000Z",
    ...overrides
  };
}

function exactAccountInput(overrides = {}) {
  const first = Engine.evaluate(base(overrides));
  return base({ ...overrides, accountReceipts: [first.receipt] });
}

module.exports = Object.freeze({
  COMPLETE_48_HOUR_LOOP_CERTIFIED: () => Engine.evaluate(exactAccountInput()),
  MISSING_PRIOR_CLOSE_WAITS: () => Engine.evaluate(base({ dailyLoopReceipts: [], nextDayHandoffs: [], morningActivations: [], commandCompletions: [] })),
  HANDOFF_LINEAGE_MISMATCH_BREAKS: () => Engine.evaluate(base({ nextDayHandoffs: [{ ...handoff, sourceReceiptId: "daily-loop:wrong" }] })),
  MORNING_ASSIGNMENT_DRIFT_BREAKS: () => Engine.evaluate(base({ assignments: [{ assignmentId: "upper-b", module: "strength" }] })),
  CURRENT_COMMAND_REMAINS_IN_PROGRESS: () => Engine.evaluate(base({ commandCompletions: [] })),
  PENDING_WRITE_STAYS_PROTECTED: () => Engine.evaluate(exactAccountInput({ pendingWrites: 1 })),
  SLOW_RESTORE_IS_VISIBLE: () => Engine.evaluate(exactAccountInput({ restoreDurationMs: 6200 })),
  EXACT_ACCOUNT_RECEIPT_CERTIFIES: () => Engine.evaluate(exactAccountInput()),
  SECOND_DEVICE_RESTORES_SAME_CERTIFICATION: () => {
    const first = Engine.evaluate(exactAccountInput({ restoreDurationMs: 1200 }));
    const second = Engine.evaluate(exactAccountInput({ restoreDurationMs: 7800 }));
    return { first, second, same: first.receipt.id === second.receipt.id && first.receipt.fingerprint === second.receipt.fingerprint };
  }
});
