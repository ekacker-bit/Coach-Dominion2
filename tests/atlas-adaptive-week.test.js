const assert = require("node:assert/strict");
const adaptiveWeek = require("../assets/js/atlas-adaptive-week.js");

const contract = { id: "contract-1", revision: 4, status: "APPROVED" };
const activeWeek = {
  id: "week-current",
  weekStart: "2026-08-03",
  weekEnd: "2026-08-09",
  status: "COMMITTED"
};

function readiness(overrides = {}) {
  return Array.from({ length: 7 }, (_, index) => ({
    date: adaptiveWeek.addDays(activeWeek.weekStart, index),
    energy: 8,
    soreness: 3,
    pain: false,
    state: "GREEN",
    resting_heart_rate: 52,
    heart_rate_variability: 64,
    ...overrides
  }));
}

function evidence(completed = 3) {
  return {
    STRENGTH: { planned: 3, completed, sourceCount: completed },
    RUNNING: { planned: 3, completed, sourceCount: completed },
    CORE: { planned: 3, completed, sourceCount: completed },
    FUELING: { planned: 7, completed: Math.min(7, completed + 4), sourceCount: Math.min(7, completed + 4) }
  };
}

function input(overrides = {}) {
  return {
    today: "2026-08-08",
    contract,
    activeWeek,
    planCoverage: 4,
    readinessHistory: readiness(),
    evidence: evidence(),
    performance: { events: 9, techniqueFlags: 0, stoppedSessions: 0 },
    generatedAt: "2026-08-08T12:00:00.000Z",
    ...overrides
  };
}

function draft() {
  return {
    version: "024D.1",
    id: "week-next",
    status: "DRAFT",
    state: "DRAFT",
    weekStart: "2026-08-10",
    weekEnd: "2026-08-16",
    contractId: contract.id,
    contractRevision: contract.revision,
    generatedBy: "ATLAS_PROGRAM",
    calendarPolicy: { twoADays: false, sessionMinutes: 120, primaryGoal: "BALANCED_FITNESS" },
    twoADaysEnabled: false,
    days: [
      { date: "2026-08-10", activities: [{ id: "lift", module: "STRENGTH", type: "STRENGTH", title: "Strength A", estimatedMinutes: 60 }], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } },
      { date: "2026-08-11", activities: [{ id: "run", module: "RUNNING", type: "TEMPO", title: "Tempo run", estimatedMinutes: 40 }], conflicts: [], nutrition: { module: "NUTRITION", calories: 2300 } },
      { date: "2026-08-12", activities: [{ id: "core", module: "CORE", type: "CORE", title: "Core", estimatedMinutes: 20 }], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } },
      { date: "2026-08-13", activities: [], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } },
      { date: "2026-08-14", activities: [], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } },
      { date: "2026-08-15", activities: [], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } },
      { date: "2026-08-16", activities: [], conflicts: [], nutrition: { module: "NUTRITION", calories: 2200 } }
    ],
    conflicts: [],
    approvalBlocked: false,
    blockingConflictCount: 0,
    advisoryCount: 0,
    sourceRefs: { strengthPlanId: "strength-1", runningBlockId: "run-1", corePlanId: "core-1", nutritionBaselineId: "fuel-1" }
  };
}

{
  const proposal = adaptiveWeek.buildProposal(input({ today: "2026-08-05" }));
  assert.equal(proposal.status, "MONITORING");
  assert.equal(proposal.reviewWindow.opensAt, "2026-08-07");
  assert.equal(adaptiveWeek.gate(proposal).canBuild, false);
}

{
  const proposal = adaptiveWeek.buildProposal(input());
  assert.equal(proposal.status, "PROPOSED");
  assert.equal(proposal.code, "PROGRESS");
  assert.equal(proposal.targetWeekStart, "2026-08-10");
  assert.equal(proposal.metrics.executionPercent, 100);
  assert.equal(proposal.metrics.rollCalls, 6);
  assert.equal(proposal.approvalRequired, true);
}

{
  const proposal = adaptiveWeek.buildProposal(input({
    readinessHistory: readiness().map((item, index) => index === 5 ? { ...item, pain: true, state: "RED" } : item)
  }));
  assert.equal(proposal.code, "PROTECT");
  assert.equal(proposal.tone, "red");
  assert.equal(proposal.status, "PROPOSED");
}

{
  const stopped = adaptiveWeek.buildProposal(input({ performance: { events: 9, stoppedSessions: 1, techniqueFlags: 0 } }));
  const technique = adaptiveWeek.buildProposal(input({ performance: { events: 9, stoppedSessions: 0, techniqueFlags: 2 } }));
  assert.equal(stopped.code, "REBALANCE");
  assert.match(stopped.reason, /blocks progression/i);
  assert.equal(technique.code, "DELOAD");
  assert.match(technique.reason, /technique-limited/i);
}

{
  const proposal = adaptiveWeek.buildProposal(input({
    evidence: {
      STRENGTH: { planned: 0, completed: 0, sourceCount: 0 },
      RUNNING: { planned: 0, completed: 0, sourceCount: 0 },
      CORE: { planned: 0, completed: 0, sourceCount: 0 },
      FUELING: { planned: 0, completed: 0, sourceCount: 0 }
    },
    readinessHistory: readiness().slice(0, 1)
  }));
  assert.equal(proposal.status, "CURRENT");
  assert.equal(proposal.code, "HOLD");
  assert.match(proposal.detail, /partial week/i);
}

{
  const proposal = adaptiveWeek.buildProposal(input());
  const approved = adaptiveWeek.approveProposal(proposal, "2026-08-09T12:00:00.000Z");
  const adapted = adaptiveWeek.applyToDraft(draft(), approved, { appliedAt: "2026-08-09T12:01:00.000Z" });
  const lift = adapted.days[0].activities[0];
  const run = adapted.days[1].activities[0];
  const core = adapted.days[2].activities[0];
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.planChangesApproved, true);
  assert.ok(lift.estimatedMinutes > 60);
  assert.ok(run.estimatedMinutes > 40);
  assert.ok(core.estimatedMinutes > 20);
  assert.equal(adapted.generatedBy, "ATLAS_ADAPTIVE_WEEK");
  assert.equal(adapted.atlasAdaptiveWeek.decisionId, approved.id);
  assert.equal(adaptiveWeek.draftMatchesDecision(adapted, approved), true);
  assert.equal(adapted.days.some((day) => day.activities.some((item) => item.calendarEdited)), false);
  assert.deepEqual(draft().days[0].activities[0].estimatedMinutes, 60);
}

{
  const proposal = adaptiveWeek.buildProposal(input({ readinessHistory: readiness({ energy: 4, soreness: 8, state: "YELLOW" }) }));
  const approved = adaptiveWeek.approveProposal(proposal, "2026-08-09T12:00:00.000Z");
  const adapted = adaptiveWeek.applyToDraft(draft(), approved);
  assert.equal(proposal.code, "DELOAD");
  assert.ok(adapted.days[0].activities[0].estimatedMinutes < 60);
  assert.equal(adapted.days[1].activities[0].type, "EASY");
  assert.ok(adapted.days[2].activities[0].estimatedMinutes < 20);
}

{
  const proposal = adaptiveWeek.buildProposal(input());
  const held = adaptiveWeek.holdProposal(proposal, "2026-08-09T12:00:00.000Z");
  assert.equal(held.status, "HELD");
  assert.equal(held.decision, "HOLD");
  assert.equal(held.changes.length, 0);
  assert.equal(adaptiveWeek.gate(held).canBuild, true);
}

{
  const proposal = adaptiveWeek.buildProposal(input());
  const approved = adaptiveWeek.approveProposal(proposal, "2026-08-09T12:00:00.000Z");
  const rebuilt = adaptiveWeek.buildProposal(input({
    evidence: evidence(2),
    priorProposal: approved,
    generatedAt: "2026-08-09T13:00:00.000Z"
  }));
  assert.equal(rebuilt.status, "APPROVED");
  assert.equal(rebuilt.id, approved.id);
}

console.log("Build 025A Atlas Adaptive Week tests passed.");
