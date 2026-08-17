const assert = require("node:assert/strict");
const daily = require("../assets/js/daily-coaching.js");

function loop(overrides = {}) {
  return daily.buildDailyCoachingLoop({
    readiness: { state: "GREEN", energy: 8, soreness: 2, pain: false },
    mission: { title: "Execute prescribed session", detail: "Proceed exactly as written." },
    recovery: { status: "ON PLAN", holdProgression: false, calorieCoverage: 100, proteinCoverage: 100 },
    programming: { status: "PROGRESSION AVAILABLE", requiresConfirmation: false },
    evidence: { trainingRecords: 3, nutritionRecords: 3, trainingVolume: 2410 },
    generatedAt: "2026-07-27T12:00:00.000Z",
    ...overrides
  });
}

{
  const result = loop({ readiness: {}, mission: {}, evidence: {} });
  assert.equal(result.posture, "ROLL CALL REQUIRED");
  assert.equal(result.nextAction, "roll_call");
  assert.equal(result.phases[1].state, "LOCKED");
}

{
  const result = loop({
    readiness: { state: "RED", energy: 7, soreness: 4, pain: true },
    recovery: { status: "PROTECT / RECOVER", holdProgression: true }
  });
  assert.equal(result.posture, "PROTECT / RECOVER");
  assert.equal(result.priority, "CRITICAL");
  assert.equal(result.nextAction, "review_recovery");
  assert.equal(result.safeguards.painOverride, true);
  assert.equal(result.safeguards.missionMutationAllowed, false);
}

{
  const result = loop({
    recovery: { status: "REFUEL REQUIRED", holdProgression: true, actions: ["Close the fueling gap."] }
  });
  assert.equal(result.posture, "HOLD & RECOVER");
  assert.equal(result.nextAction, "review_recovery");
  assert.equal(result.approvalRequired, true);
}

{
  const result = loop({
    programming: { status: "PROGRESSION AVAILABLE", requiresConfirmation: true },
    programmingApproved: false
  });
  assert.equal(result.posture, "REVIEW PROGRAMMING");
  assert.equal(result.nextAction, "review_programming");
  assert.equal(result.safeguards.programmingApprovalRequired, true);
}

{
  const result = loop({ programmingApproved: true, ordersApproved: false });
  assert.equal(result.posture, "EXECUTE");
  assert.equal(result.nextAction, "approve_orders");
  assert.equal(result.approvalRequired, true);
}

{
  const result = loop({ programmingApproved: true, ordersApproved: true, compliance: { saved: false } });
  assert.equal(result.posture, "REVIEW & RECORD");
  assert.equal(result.nextAction, "review_record");
}

{
  const result = loop({ programmingApproved: true, ordersApproved: true, compliance: { saved: true } });
  assert.equal(result.posture, "DAY CONTROLLED");
  assert.equal(result.nextAction, "refresh");
  assert.match(daily.formatApprovedOrders(result), /Today’s loop is current/);
}

{
  const queue = daily.buildDailyExecutionQueue({
    date: "2026-07-29",
    readinessComplete: false
  });
  assert.equal(queue.current.id, "roll_call");
  assert.equal(queue.steps[1].status, "BLOCKED");
  assert.equal(queue.completed, 0);
}

{
  const queue = daily.buildDailyExecutionQueue({
    date: "2026-07-29",
    readinessComplete: true,
    ordersApproved: true,
    trainingComplete: true,
    fuelingBaseline: false,
    recoveryComplete: false,
    recordComplete: false
  });
  assert.equal(queue.current.id, "fueling");
  assert.equal(queue.current.action, "open_fuel");
  assert.match(queue.current.detail, /fueling baseline/i);
  assert.equal(queue.completed, 3);
}

{
  const queue = daily.buildDailyExecutionQueue({
    readinessComplete: true,
    ordersApproved: false,
    recoveryRequired: true,
    recoveryApproved: false,
    ordersAction: "approve_orders"
  });
  assert.equal(queue.current.id, "orders");
  assert.equal(queue.current.action, "review_recovery");
}

{
  const queue = daily.buildDailyExecutionQueue({
    readinessComplete: true,
    ordersApproved: true,
    trainingComplete: true,
    fuelingBaseline: true,
    fuelingComplete: true,
    recoveryComplete: true,
    recordComplete: true,
    closeoutComplete: true
  });
  assert.equal(queue.complete, true);
  assert.equal(queue.state, "DAY COMPLETE");
  assert.equal(queue.percent, 100);
}

{
  const queue = daily.buildDailyExecutionQueue({
    readinessComplete: true,
    ordersApproved: true,
    trainingComplete: true,
    fuelingBaseline: true,
    fuelingComplete: true,
    recoveryComplete: true,
    recordComplete: true,
    closeoutComplete: false
  });
  assert.equal(queue.complete, false);
  assert.equal(queue.closeoutReady, true);
  assert.equal(queue.current.id, "closeout");
  assert.equal(queue.current.action, "open_closeout");
}

console.log("Daily coaching loop tests passed.");
