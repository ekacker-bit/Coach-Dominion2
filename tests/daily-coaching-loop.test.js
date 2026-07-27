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

console.log("Daily coaching loop tests passed.");
