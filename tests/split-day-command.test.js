const test = require("node:test");
const assert = require("node:assert/strict");
const splitDay = require("../assets/js/split-day-command.js");

const day = {
  date: "2026-08-01",
  twoADay: true,
  sessionSequence: [
    { activityId: "run", module: "RUNNING", sessionOrder: 1 },
    { activityId: "strength", module: "STRENGTH", sessionOrder: 2 }
  ]
};

function checkpoint(overrides = {}) {
  return splitDay.createCheckpoint({
    energy: 7,
    newPain: "NO",
    refueled: true,
    hydrated: true,
    ...overrides
  }, {
    date: day.date,
    weekId: "week-1",
    sessionOneActivityId: "run",
    sessionOneCompletedAt: "2026-08-01T08:00:00.000Z",
    recordedAt: "2026-08-01T11:30:00.000Z"
  });
}

function evaluate(overrides = {}) {
  return splitDay.evaluate({
    day,
    weekId: "week-1",
    sessionOne: { state: "COMPLETE", completedAt: "2026-08-01T08:00:00.000Z" },
    sessionTwo: { state: "READY" },
    checkpoint: checkpoint(),
    morningReadiness: { state: "GREEN", pain: false },
    now: "2026-08-01T12:00:00.000Z",
    ...overrides
  });
}

test("Session 2 waits for terminal Session 1 evidence", () => {
  const result = evaluate({ sessionOne: { state: "IN_PROGRESS", startedAt: "2026-08-01T07:00:00.000Z" } });
  assert.equal(result.status, "AWAITING_SESSION_1");
  assert.equal(result.allowed, false);
});

test("the four-hour recovery interval is calculated from actual completion time", () => {
  const result = evaluate({ now: "2026-08-01T10:00:00.000Z" });
  assert.equal(result.status, "RECOVERING");
  assert.equal(result.minutesRemaining, 120);
  assert.equal(result.unlockAt, "2026-08-01T12:00:00.000Z");
});

test("Session 2 clears only after separation, refueling, hydration, and readiness", () => {
  const result = evaluate();
  assert.equal(result.status, "CLEARED");
  assert.equal(result.allowed, true);
});

test("a missing checkpoint remains an explicit blocker after four hours", () => {
  const result = evaluate({ checkpoint: null });
  assert.equal(result.status, "CHECKPOINT_REQUIRED");
  assert.equal(result.allowed, false);
  assert.match(result.blockers.join(" "), /checkpoint/i);
});

test("fuel and hydration confirmations are independently required", () => {
  const result = evaluate({ checkpoint: checkpoint({ refueled: false, hydrated: false }) });
  assert.equal(result.status, "CHECKPOINT_REQUIRED");
  assert.equal(result.blockers.length, 2);
});

test("new pain or low energy creates a safety hold", () => {
  const pain = evaluate({ checkpoint: checkpoint({ newPain: "YES" }) });
  const lowEnergy = evaluate({ checkpoint: checkpoint({ energy: 3 }) });
  assert.equal(pain.status, "HELD");
  assert.equal(lowEnergy.status, "HELD");
  assert.equal(pain.allowed, false);
  assert.equal(lowEnergy.allowed, false);
});

test("RED morning readiness continues to override the second session", () => {
  const result = evaluate({ morningReadiness: { state: "RED", pain: true } });
  assert.equal(result.status, "HELD");
  assert.match(result.blockers[0], /readiness|pain/i);
});

test("a missing Morning Roll Call cannot be bypassed by the midday checkpoint", () => {
  const result = evaluate({ morningReadiness: { state: "UNKNOWN", pain: false } });
  assert.equal(result.status, "CHECKPOINT_REQUIRED");
  assert.equal(result.allowed, false);
  assert.match(result.blockers.join(" "), /Morning Roll Call/i);
});

test("completed Session 2 closes the split-day gate", () => {
  const result = evaluate({ sessionTwo: { state: "COMPLETE", completedAt: "2026-08-01T13:30:00.000Z" } });
  assert.equal(result.status, "COMPLETE");
  assert.equal(result.allowed, false);
});

console.log("Build 020B split-day safety engine passed.");
