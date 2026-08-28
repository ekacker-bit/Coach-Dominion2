"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Engine = require("../assets/js/recruit-loop-certification.js");
const scenarios = require("../scripts/recruit-loop-scenarios.js");

test("030W certifies the complete exact 48-hour account chain", () => {
  const result = scenarios.COMPLETE_48_HOUR_LOOP_CERTIFIED();
  assert.equal(result.state, Engine.STATES.CERTIFIED);
  assert.equal(result.receipt.status, "CERTIFIED");
  assert.ok(result.receipt.accountConfirmedAt);
  assert.deepEqual(result.stages.slice(0, 6).map((item) => item.status), Array(6).fill("VERIFIED"));
});

test("030W refuses broken lineage, assignment drift, and missing evidence", () => {
  assert.equal(scenarios.MISSING_PRIOR_CLOSE_WAITS().state, Engine.STATES.WAITING);
  assert.equal(scenarios.HANDOFF_LINEAGE_MISMATCH_BREAKS().state, Engine.STATES.ACTION_REQUIRED);
  assert.equal(scenarios.MORNING_ASSIGNMENT_DRIFT_BREAKS().state, Engine.STATES.ACTION_REQUIRED);
  assert.equal(scenarios.CURRENT_COMMAND_REMAINS_IN_PROGRESS().state, Engine.STATES.WAITING);
});

test("030W protects pending writes and surfaces slow restore without changing identity", () => {
  assert.equal(scenarios.PENDING_WRITE_STAYS_PROTECTED().state, Engine.STATES.PROTECTED);
  const slow = scenarios.SLOW_RESTORE_IS_VISIBLE();
  assert.equal(slow.state, Engine.STATES.CERTIFIED);
  assert.equal(slow.stages.find((item) => item.key === "restore").status, "SLOW");
  assert.equal(scenarios.SECOND_DEVICE_RESTORES_SAME_CERTIFICATION().same, true);
});

test("030W requires the exact account fingerprint", () => {
  const certified = scenarios.EXACT_ACCOUNT_RECEIPT_CERTIFIES();
  const wrong = Engine.evaluate({
    targetDate: certified.targetDate,
    userId: "recruit-1",
    authority: certified.receipt.authority,
    assignments: [{ assignmentId: certified.receipt.links.assignmentId, module: "strength" }],
    dailyLoopReceipts: [certified.links.dailyLoop],
    nextDayHandoffs: [certified.links.handoff],
    morningActivations: [certified.links.morning],
    commandCompletions: [certified.links.completion],
    accountReceipts: [{ ...certified.receipt, fingerprint: "wrong" }],
    serverConfirmed: true
  });
  assert.equal(wrong.state, Engine.STATES.PROTECTED);
});
