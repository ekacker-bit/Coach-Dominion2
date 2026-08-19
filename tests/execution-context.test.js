const test = require("node:test");
const assert = require("node:assert/strict");
const Execution = require("../assets/js/execution-context.js");

test("current R12 week remains authoritative while R14 is staged for next week", () => {
  const context = Execution.resolve({
    date: "2026-08-18",
    currentContract: { revision: 14, effectiveDate: "2026-08-24" },
    contractHistory: [{ revision: 12, effectiveDate: "2026-08-01" }],
    activeWeek: { weekStart: "2026-08-17", weekEnd: "2026-08-23", contractRevision: 12 },
    stagedWeek: { weekStart: "2026-08-24", weekEnd: "2026-08-30", contractRevision: 14 },
    conflicts: [{ code: "WEEK_CONTRACT_MISMATCH", severity: "BLOCKING" }]
  });
  assert.equal(Execution.VERSION, "030C.1");
  assert.equal(context.activeContractRevision, 12);
  assert.equal(context.currentContractRevision, 14);
  assert.equal(context.expectedVersionSplit, true);
  assert.equal(context.currentWeekProtected, true);
  assert.equal(context.blocked, false);
  assert.equal(context.today.label, "Today executes active R12 assignment.");
  assert.equal(context.today.secondary, "Next week is ready to commit.");
  assert.equal(context.program, "Current week protected under R12 · R14 staged for August 24.");
  assert.equal(context.contractAction.label, "Commit next week");
});

test("only conflicts that affect the active date block execution", () => {
  const context = Execution.resolve({
    date: "2026-08-18",
    currentContract: { revision: 12, effectiveDate: "2026-08-01" },
    activeWeek: { weekStart: "2026-08-17", weekEnd: "2026-08-23", contractRevision: 12 },
    conflicts: [
      { code: "FUTURE_PLAN", severity: "BLOCKING", effectiveDate: "2026-08-24" },
      { code: "ACTIVE_RECEIPT_CONFLICT", severity: "BLOCKING", effectiveDate: "2026-08-18" }
    ]
  });
  assert.equal(context.blocked, true);
  assert.deepEqual(context.conflicts.map((item) => item.code), ["ACTIVE_RECEIPT_CONFLICT"]);
});
