const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/atlas-progression-engine.js");
const running = require("../assets/js/running-progression.js");
const core = require("../assets/js/core-programming.js");

const contract = { id: "contract-1", revision: 7 };
const campaign = { id: "campaign-1", currentWeek: 3 };
const program = { id: "program-1", revision: 4 };

test("a completed Strength result becomes one exact approval order", () => {
  const order = engine.buildDecision({
    contract, campaign, program, generatedAt: "2026-08-15T12:00:00.000Z",
    strength: {
      plan: { id: "strength-1", revision: 2, status: "APPROVED" },
      proposal: {
        id: "adjustment-1", planId: "strength-1", planRevision: 2, status: "PENDING", sessionName: "Lower A",
        decisions: [{ exerciseCode: "SQUAT", exerciseName: "Back Squat", action: "PROGRESS_LOAD", changed: true, proposedLoad: 190, proposedReps: 5, unit: "lb", reason: "Two controlled exposures earned the smallest load step." }]
      }
    }
  });
  assert.equal(order.status, "AWAITING_APPROVAL");
  assert.equal(order.domain, "STRENGTH");
  assert.match(order.prescription, /Back Squat: 190 lb × 5 reps/);
  assert.equal(order.action.type, "APPLY_STRENGTH");
  assert.deepEqual(order.bindings, { contractId: "contract-1", contractRevision: 7, campaignId: "campaign-1", campaignRevision: 3, programId: "program-1", programRevision: 4 });
});

test("a safety hold outranks an earned progression in another domain", () => {
  const order = engine.buildDecision({
    contract, campaign, program,
    strength: {
      plan: { id: "strength-1", revision: 2, status: "APPROVED" },
      proposal: { id: "adjustment-2", planId: "strength-1", planRevision: 2, safetyHold: true, decisions: [{ action: "SAFETY_HOLD", reason: "Pain was recorded." }] }
    },
    running: {
      block: { id: "running-1", revision: 1, status: "APPROVED" },
      proposal: { id: "run-change", blockId: "running-1", blockRevision: 1, status: "PROPOSED", code: "PROGRESS", tone: "green", progressionMode: "DURATION", durationDeltaPercent: 5, detail: "Three runs earned more duration." }
    }
  });
  assert.equal(order.status, "BLOCKED");
  assert.equal(order.domain, "STRENGTH");
  assert.match(order.rationale, /Pain was recorded/);
});

test("resolved orders remain terminal for the same evidence fingerprint", () => {
  const input = {
    contract, campaign, program,
    running: {
      block: { id: "running-1", revision: 1, status: "APPROVED" },
      proposal: { id: "run-change", blockId: "running-1", blockRevision: 1, status: "PROPOSED", code: "REDUCE", tone: "yellow", progressionMode: "DURATION", durationDeltaPercent: -10, detail: "Repeated high effort supports a smaller next dose." }
    }
  };
  const proposed = engine.buildDecision(input);
  const held = engine.resolveDecision(proposed, "HELD", { resolvedAt: "2026-08-15T13:00:00.000Z" });
  const rebuilt = engine.buildDecision({ ...input, previous: held });
  assert.equal(rebuilt.status, "HELD");
  assert.equal(rebuilt.resolvedAt, held.resolvedAt);
});

test("quality Running evidence progresses pace without increasing distance", () => {
  const block = {
    id: "run-block", revision: 1, status: "APPROVED", startDate: "2026-08-01", endDate: "2026-08-31",
    profile: { preferredUnit: "mi" },
    weeks: [{ weekStart: "2026-08-10", weekEnd: "2026-08-16", sessions: [{ date: "2026-08-16", type: "TEMPO", distance: 4, paceFast: 480, paceSlow: 510, estimatedMinutes: 34, unit: "mi" }] }]
  };
  const entries = ["10", "11", "12"].map((day, index) => ({
    id: `run-${day}`, domain: "running", performanceDate: `2026-08-${day}`,
    metrics: { distance: 4, duration_seconds: 2000 + index * 10, planned_distance: 4, completion_percent: 100, rpe: 6, run_type: index < 2 ? "TEMPO" : "EASY", distance_unit: "mi" }
  }));
  const proposal = running.buildProposal({ block, entries, today: "2026-08-15" });
  assert.equal(proposal.progressionMode, "PACE");
  assert.equal(proposal.distanceDeltaPercent, 0);
  assert.equal(proposal.paceDeltaSecondsPerUnit, -5);
  const revised = running.applyToBlock(block, running.approveProposal(proposal), { appliedAt: "2026-08-15T12:00:00.000Z" });
  assert.equal(revised.weeks[0].sessions[0].distance, 4);
  assert.equal(revised.weeks[0].sessions[0].paceFast, 475);
  assert.equal(revised.weeks[0].sessions[0].paceSlow, 505);
});

test("an earned Core cycle advances targets but never sets", () => {
  const plan = core.approvePlan(core.buildFourWeekPlan({ sessionsPerWeek: 2, sessionMinutes: 10 }, { startDate: "2026-07-06", generatedAt: "2026-07-06T10:00:00.000Z" }), "2026-07-06T11:00:00.000Z");
  const history = [
    { planId: plan.id, date: "2026-07-06", state: "COMPLETE", quality: "CONTROLLED", effort: 7 },
    { planId: plan.id, date: "2026-07-09", state: "COMPLETE", quality: "CONTROLLED", effort: 8 }
  ];
  const next = core.buildNextCycleDraft(plan, history, { generatedAt: "2026-08-03T10:00:00.000Z" });
  const prior = core.buildFourWeekPlan(plan.profile, { startDate: next.startDate, generatedAt: next.generatedAt });
  assert.equal(next.cycleRevision, 2);
  assert.equal(next.weeks[0].sessions[0].exercises[0].sets, prior.weeks[0].sessions[0].exercises[0].sets);
  assert.ok(next.weeks[0].sessions[0].exercises[0].target > prior.weeks[0].sessions[0].exercises[0].target);
});
