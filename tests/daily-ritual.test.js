const assert = require("node:assert/strict");
const ritual = require("../assets/js/daily-ritual.js");

assert.equal(ritual.VERSION, "022F.1");
assert.deepEqual(ritual.MILESTONES.map((item) => item.id), ["execute", "record", "verify", "adapt"]);

const openQueue = {
  completed: 2,
  total: 7,
  percent: 29,
  complete: false,
  current: { label: "Execute training" },
  steps: [{ id: "record", complete: false }]
};
let state = ritual.buildDailyRitual({ date: "2026-07-31", queue: openQueue, closedLoop: { state: "EXECUTION OPEN" } });
assert.equal(state.state, "IN_MOTION");
assert.equal(state.action, "continue_execution");
assert.equal(state.evidence.percent, 29);

const completeQueue = {
  completed: 7,
  total: 7,
  percent: 100,
  complete: true,
  closeoutReady: true,
  steps: [{ id: "record", complete: true }, { id: "closeout", complete: true }]
};
state = ritual.buildDailyRitual({ date: "2026-07-31", queue: completeQueue, closedLoop: { state: "REVIEW READY", reconciliation: { summary: { completionPercent: 100, confidence: "HIGH" } } } });
assert.equal(state.state, "CLOSEOUT_READY");
assert.equal(state.action, "open_closeout");

state = ritual.buildDailyRitual({ date: "2026-07-31", queue: completeQueue, closeout: { status: "SEALED" }, closedLoop: { state: "REVIEW READY", reconciliation: { summary: { completionPercent: 100, confidence: "HIGH" } } } });
assert.equal(state.state, "READY_TO_SEAL");
assert.equal(state.action, "close_review");
assert.equal(state.evidence.confidence, "HIGH");
assert.equal(state.milestones[0].complete, true);
assert.equal(state.milestones[3].current, true);

state = ritual.buildDailyRitual({
  date: "2026-07-31",
  queue: completeQueue,
  closedLoop: { state: "ADAPTATION PROPOSED", review: { status: "CLOSED" }, adaptation: { status: "PROPOSED", reason: "Repeat the controlled exposure." } }
});
assert.equal(state.state, "LESSON_READY");
assert.equal(state.action, "approve_adaptation");
assert.equal(state.milestones[2].complete, true);

state = ritual.buildDailyRitual({
  date: "2026-07-31",
  queue: completeQueue,
  history: [
    { date: "2026-07-29", status: "CLOSED" },
    { date: "2026-07-30", status: "CLOSED" },
    { date: "2026-07-31", status: "CLOSED" }
  ],
  rank: "FIELD_OPERATOR",
  closedLoop: { state: "LOOP CLOSED", review: { status: "CLOSED" }, adaptation: { status: "APPROVED", label: "Repeat current exposure", effectiveDate: "2026-08-01" } }
});
assert.equal(state.state, "SEALED");
assert.equal(state.sealed, true);
assert.equal(state.stats.total, 3);
assert.equal(state.stats.streak, 3);
assert.equal(state.rank, "FIELD OPERATOR");
assert.equal(state.milestones.every((item) => item.complete), true);

state = ritual.buildDailyRitual({ date: "2026-07-31", queue: openQueue, readinessState: "RED" });
assert.equal(state.tone, "protect");

console.log("Build 022F Daily Seal tests passed.");
