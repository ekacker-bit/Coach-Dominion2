const assert = require("node:assert/strict");
const adaptive = require("../assets/js/adaptive-coaching.js");

const date = "2026-08-03";

function readiness(days = 7, overrides = {}) {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date("2026-07-28T12:00:00.000Z");
    day.setUTCDate(day.getUTCDate() + index);
    return {
      date: day.toISOString().slice(0, 10),
      energy: 8,
      soreness: 3,
      pain: false,
      state: "GREEN",
      resting_heart_rate: 52,
      heart_rate_variability: 62,
      ...overrides
    };
  });
}

function evidence(completed = 3, planned = 3) {
  return {
    STRENGTH: { planned, completed, sourceCount: completed },
    RUNNING: { planned, completed, sourceCount: completed },
    CORE: { planned, completed, sourceCount: completed },
    FUELING: { planned: 5, completed: Math.min(5, completed + 2), sourceCount: Math.min(5, completed + 2) }
  };
}

function input(overrides = {}) {
  return {
    date,
    contractApproved: true,
    contractId: "contract-1",
    contractRevision: 2,
    planCoverage: 4,
    readinessHistory: readiness(),
    evidence: evidence(),
    generatedAt: "2026-08-03T12:00:00.000Z",
    ...overrides
  };
}

{
  const proposal = adaptive.buildProposal(input({ contractApproved: false }));
  assert.equal(proposal.code, "SETUP_REQUIRED");
  assert.equal(proposal.status, "SETUP REQUIRED");
  assert.equal(proposal.changes.length, 0);
}

{
  const history = readiness().map((item, index) => index === 6 ? { ...item, pain: true, state: "RED" } : item);
  const proposal = adaptive.buildProposal(input({ readinessHistory: history }));
  assert.equal(proposal.code, "PROTECT");
  assert.equal(proposal.status, "PROPOSED");
  assert.equal(adaptive.domainChange(proposal, "STRENGTH").action, "RECOVERY_ONLY");
  assert.equal(proposal.bounds.painBlocksProgression, true);
}

{
  const proposal = adaptive.buildProposal(input({
    readinessHistory: readiness(7, { energy: 4, soreness: 7, state: "YELLOW" })
  }));
  assert.equal(proposal.code, "DELOAD");
  assert.equal(adaptive.domainChange(proposal, "RUNNING").volumeDeltaPercent, -20);
}

{
  const proposal = adaptive.buildProposal(input({ evidence: evidence(1, 3) }));
  assert.equal(proposal.code, "REBALANCE");
  assert.match(proposal.reason, /below the committed dose/i);
}

{
  const proposal = adaptive.buildProposal(input());
  assert.equal(proposal.code, "PROGRESS");
  assert.equal(proposal.confidence, "HIGH");
  assert.equal(proposal.bounds.maximumVolumeIncreasePercent, 5);
  assert.ok(proposal.changes.every((item) => item.requiresPlanApproval));
}

{
  const proposal = adaptive.buildProposal(input());
  const approved = adaptive.approveProposal(proposal, "2026-08-03T13:00:00.000Z", "2026-08-04");
  assert.equal(approved.status, "APPROVED");
  assert.equal(adaptive.directiveForDate(approved, "2026-08-03"), null);
  assert.equal(adaptive.directiveForDate(approved, "2026-08-04").id, approved.id);
  assert.equal(adaptive.directiveForDate(approved, "2026-08-11"), null);
  assert.equal(adaptive.holdProposal(approved, "2026-08-04T10:00:00.000Z").status, "HELD");
  const carried = adaptive.buildProposal(input({
    date: "2026-08-04",
    readinessHistory: readiness(7, { energy: 5, soreness: 6, state: "YELLOW" }),
    priorProposal: approved
  }));
  assert.equal(carried.status, "APPROVED");
  assert.equal(carried.id, approved.id);
}

{
  const proposal = adaptive.buildProposal(input({
    readinessHistory: readiness(7, { energy: 4, soreness: 7, state: "YELLOW" })
  }));
  const approved = adaptive.approveProposal(proposal, "2026-08-03T13:00:00.000Z", "2026-08-04");
  const assignment = adaptive.adaptStrengthAssignment({
    date: "2026-08-04",
    state: "READY",
    estimatedMinutes: 60,
    exercises: [
      { id: "squat", sets: 4, load: 200 },
      { id: "row", sets: 3, load: 100 }
    ]
  }, approved, "2026-08-04");
  assert.equal(assignment.readinessDelta.code, "ADAPTIVE_DELOAD");
  assert.equal(assignment.exercises[0].sets, 3);
  assert.equal(assignment.exercises[0].load, 180);
  assert.equal(assignment.estimatedMinutes, 50);
}

{
  const history = readiness().map((item, index) => index === 6 ? { ...item, pain: true, state: "RED" } : item);
  const proposal = adaptive.buildProposal(input({ readinessHistory: history }));
  const approved = adaptive.approveProposal(proposal, "2026-08-03T13:00:00.000Z", "2026-08-04");
  const running = adaptive.adaptRunningPrescription({
    date: "2026-08-04",
    status: "READY",
    session: { distance: 5, unit: "mi", type: "TEMPO" }
  }, approved, "2026-08-04");
  const core = adaptive.adaptCorePrescription({
    date: "2026-08-04",
    status: "READY",
    session: { estimatedMinutes: 20 },
    exercises: [{ id: "plank", sets: 3 }]
  }, approved, "2026-08-04");
  assert.equal(running.status, "ADAPTIVE_HOLD");
  assert.equal(running.session, null);
  assert.equal(core.status, "SAFETY_HOLD");
  assert.equal(core.exercises.length, 0);
}

{
  const approved = adaptive.approveProposal(adaptive.buildProposal(input()), "2026-08-03T13:00:00.000Z", "2026-08-04");
  const assignment = Object.freeze({
    date: "2026-08-04",
    state: "READY",
    exercises: Object.freeze([{ id: "bench", sets: 3, load: 150 }])
  });
  const result = adaptive.adaptStrengthAssignment(assignment, approved, "2026-08-04");
  assert.equal(result.exercises[0].load, 150);
  assert.equal(result.adaptiveCoaching.action, "STAGE_PROGRESS");
}

{
  const approved = {
    ...adaptive.approveProposal(adaptive.buildProposal(input()), "2026-08-03T13:00:00.000Z", "2026-08-04"),
    planChangesApproved: true
  };
  const strength = adaptive.adaptStrengthAssignment({
    date: "2026-08-04",
    state: "READY",
    exercises: [{ id: "bench", sets: 3, load: 150 }]
  }, approved, "2026-08-04");
  const running = adaptive.adaptRunningPrescription({
    date: "2026-08-04",
    status: "READY",
    session: { distance: 5, unit: "mi", type: "EASY" }
  }, approved, "2026-08-04");
  const core = adaptive.adaptCorePrescription({
    date: "2026-08-04",
    status: "READY",
    session: { estimatedMinutes: 20 },
    exercises: [{ id: "plank", sets: 3 }, { id: "carry", sets: 3 }]
  }, approved, "2026-08-04");
  assert.equal(strength.exercises[0].sets, 3);
  assert.ok(strength.exercises[0].load > 150);
  assert.equal(running.session.distance, 5.3);
  assert.equal(core.exercises[0].sets, 4);
  assert.equal(core.exercises[1].sets, 3);
}

console.log("Build 018I Adaptive Coaching tests passed.");
