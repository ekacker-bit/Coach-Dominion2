const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/running-progression.js");

const block = {
  id: "run-block-1", revision: 2, status: "APPROVED", startDate: "2026-08-03", endDate: "2026-08-30",
  weeks: [
    { weekStart: "2026-08-03", weekEnd: "2026-08-09", sessions: [{ date: "2026-08-08", type: "LONG", distance: 7, estimatedMinutes: 75, durationCapMinutes: null }] },
    { weekStart: "2026-08-10", weekEnd: "2026-08-16", sessions: [{ date: "2026-08-13", type: "EASY", distance: 5, estimatedMinutes: 50 }, { date: "2026-08-16", type: "LONG", distance: 8, estimatedMinutes: 85, durationCapMinutes: null }] }
  ]
};

function entry(id, date, completion, rpe = 5, verdict = "ON_TARGET") {
  return { id, performanceDate: date, domain: "running", metrics: { distance: completion / 20, distance_unit: "mi", duration_seconds: 2400, planned_distance: 5, completion_percent: completion, rpe, verdict_code: verdict } };
}

test("025S progresses after three secured runs and requires approval", () => {
  const proposal = engine.buildProposal({ block, today: "2026-08-12", entries: [entry("a", "2026-08-05", 100), entry("b", "2026-08-07", 98), entry("c", "2026-08-10", 102)] });
  assert.equal(engine.VERSION, "025S.1");
  assert.equal(proposal.code, "PROGRESS");
  assert.equal(proposal.distanceDeltaPercent, 5);
  assert.equal(proposal.approvalRequired, true);
});

test("pain and repeated partial evidence constrain progression", () => {
  const pain = engine.buildProposal({ block, today: "2026-08-12", entries: [entry("p", "2026-08-10", 50, 6, "PAIN_HOLD")] });
  const partial = engine.buildProposal({ block, today: "2026-08-12", entries: [entry("a", "2026-08-08", 70), entry("b", "2026-08-10", 75)] });
  assert.equal(pain.code, "RECOVER");
  assert.equal(partial.code, "REDUCE");
});

test("approved progression changes only future runs and never caps a long run", () => {
  const proposal = engine.buildProposal({ block, today: "2026-08-12", entries: [entry("a", "2026-08-05", 100), entry("b", "2026-08-07", 98), entry("c", "2026-08-10", 102)] });
  const decision = engine.approveProposal(proposal, "2026-08-12T12:00:00.000Z");
  const revised = engine.applyToBlock(block, decision, { appliedAt: "2026-08-12T12:01:00.000Z" });
  assert.equal(revised.revision, 3);
  assert.equal(revised.weeks[0].sessions[0].distance, 7);
  assert.equal(revised.weeks[1].sessions[0].distance, 5.3);
  assert.equal(revised.weeks[1].sessions[1].durationCapMinutes, null);
  assert.equal(revised.weeks[1].sessions[1].durationPolicy, "UNCAPPED_BY_TIME");
});
