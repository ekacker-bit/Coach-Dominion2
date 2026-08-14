const test = require("node:test");
const assert = require("node:assert/strict");
const horizon = require("../assets/js/atlas-adaptive-horizon.js");

const sourceDay = {
  date: "2026-08-13",
  activities: [{ id: "lower-a", module: "STRENGTH", title: "Lower A", estimatedMinutes: 60 }]
};

function committedDays(overrides = {}) {
  return [
    { date: "2026-08-14", weekId: "week-3", weekRevision: 3, activities: [{ id: "upper-a", module: "STRENGTH", title: "Upper A", estimatedMinutes: 60 }], sessionSequence: [{ id: "upper-a", module: "STRENGTH", title: "Upper A", estimatedMinutes: 60 }], nutrition: { calories: 2500, protein: 180 } },
    { date: "2026-08-15", weekId: "week-3", weekRevision: 3, activities: [{ id: "long-run", module: "RUNNING", title: "Long run", estimatedMinutes: 110 }], sessionSequence: [{ id: "long-run", module: "RUNNING", title: "Long run", estimatedMinutes: 110 }], longRunUncapped: true, nutrition: { calories: 2700, protein: 180 } },
    { date: "2026-08-16", weekId: "week-4", weekRevision: 1, activities: [], recoveryDay: true, nutrition: { calories: 2300, protein: 180 } }
  ].map((day) => ({ ...day, ...(overrides[day.date] || {}) }));
}

function input(overrides = {}) {
  return {
    sourceDate: "2026-08-13",
    contractId: "contract-8",
    contractRevision: 8,
    sourceWeekId: "week-3",
    sourceWeekRevision: 3,
    sourceDay,
    committedDays: committedDays(),
    readinessHistory: [{ date: "2026-08-13", state: "GREEN", energy: 8, soreness: 2, pain: false }],
    receipts: [{ id: "lower-a-receipt", module: "STRENGTH", state: "COMPLETE", completedAt: "2026-08-13T18:00:00.000Z" }],
    missionComplete: true,
    closeoutSealed: true,
    generatedAt: "2026-08-13T22:00:00.000Z",
    ...overrides
  };
}

test("Build 026G keeps a verified green horizon on the committed plan", () => {
  const proposal = horizon.buildProposal(input());
  assert.equal(proposal.version, "026G.1");
  assert.equal(proposal.status, "CURRENT");
  assert.equal(proposal.code, "CURRENT");
  assert.equal(proposal.days.length, 3);
  assert.equal(proposal.approvalRequired, false);
  assert.equal(proposal.bounds.sessionsAdded, 0);
});

test("Build 026G waits for verified execution instead of guessing tomorrow", () => {
  const proposal = horizon.buildProposal(input({ receipts: [], missionComplete: false, closeoutSealed: false }));
  assert.equal(proposal.status, "WAITING");
  assert.match(proposal.reason, /unlock/i);
  assert.equal(horizon.directiveForDate(proposal, "2026-08-14", { contractRevision: 8, weekId: "week-3", weekRevision: 3 }), null);
});

test("Build 026G proposes a bounded 48-hour deload for yellow readiness", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "YELLOW", energy: 4, soreness: 7 }] }));
  assert.equal(proposal.code, "DELOAD");
  assert.equal(proposal.status, "PROPOSED");
  assert.deepEqual(proposal.days.map((day) => day.status), ["DELOAD", "DELOAD", "RECOVERY"]);
  const approved = horizon.resolveProposal(proposal, "ACCEPT", { resolvedAt: "2026-08-13T22:05:00.000Z" });
  const directive = horizon.directiveForDate(approved, "2026-08-14", { contractRevision: 8, weekId: "week-3", weekRevision: 3 });
  assert.equal(directive.code, "DELOAD");
  assert.equal(directive.changes.find((item) => item.domain === "FUELING").action, "HOLD_TARGETS");
});

test("Build 026G turns a partial session into one recovery day without repayment", () => {
  const proposal = horizon.buildProposal(input({
    receipts: [{ id: "lower-a-receipt", module: "STRENGTH", state: "PARTIAL" }],
    missionComplete: false
  }));
  assert.equal(proposal.code, "RECOVER");
  assert.equal(proposal.days[0].status, "RECOVER");
  assert.equal(proposal.days[1].status, "CURRENT");
});

test("Build 026G makes pain protection automatic but clearable by fresh green readiness", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "RED", energy: 5, soreness: 6, pain: true }] }));
  assert.equal(proposal.status, "AUTO_PROTECTED");
  assert.equal(proposal.days[0].status, "PROTECT");
  assert.throws(() => horizon.resolveProposal(proposal, "KEEP"), /fresh pain-free Roll Call/i);
  assert.ok(horizon.directiveForDate(proposal, "2026-08-14", { contractRevision: 8, weekId: "week-3", weekRevision: 3 }));
  assert.equal(horizon.directiveForDate(proposal, "2026-08-14", { contractRevision: 8, weekId: "week-3", weekRevision: 3, readinessComplete: true, readinessState: "GREEN", pain: false }), null);
});

test("Build 026G records context without applying a proposed change", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "YELLOW", energy: 4, soreness: 7 }] }));
  const challenged = horizon.resolveProposal(proposal, "NOT_FIT", { reason: "SCHEDULE_CONFLICT", note: "Travel day", resolvedAt: "2026-08-13T22:05:00.000Z" });
  assert.equal(challenged.status, "NEEDS_CONTEXT");
  assert.equal(challenged.responseReason, "SCHEDULE_CONFLICT");
  assert.equal(horizon.directiveForDate(challenged, "2026-08-14", { contractRevision: 8, weekId: "week-3", weekRevision: 3 }), null);
});

test("Build 026G invalidates an approved horizon when the target calendar revision changes", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "YELLOW", energy: 4, soreness: 7 }] }));
  const approved = horizon.resolveProposal(proposal, "ACCEPT");
  assert.equal(horizon.proposalApplies(approved, { date: "2026-08-14", contractRevision: 8, weekId: "week-3", weekRevision: 4 }), false);
  assert.equal(horizon.proposalApplies(approved, { date: "2026-08-14", contractRevision: 8, weekId: "week-3", weekRevision: 3 }), true);
});

test("Build 026G reduces a day without adding sessions, changing Fuel, or capping a long run", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "YELLOW", energy: 4, soreness: 7 }] }));
  const approved = horizon.resolveProposal(proposal, "ACCEPT");
  const strength = committedDays()[0];
  const adaptedStrength = horizon.applyToDay(strength, approved, { date: strength.date, contractRevision: 8, weekId: "week-3", weekRevision: 3 });
  assert.equal(adaptedStrength.activities.length, strength.activities.length);
  assert.equal(adaptedStrength.activities[0].estimatedMinutes, 45);
  assert.deepEqual(adaptedStrength.nutrition, strength.nutrition);
  const longRun = committedDays()[1];
  const adaptedRun = horizon.applyToDay(longRun, approved, { date: longRun.date, contractRevision: 8, weekId: "week-3", weekRevision: 3 });
  assert.equal(adaptedRun.longRunUncapped, true);
  assert.equal(adaptedRun.activities[0].estimatedMinutes, 110);
  assert.equal(adaptedRun.activities[0].adaptiveHorizon.durationOpen, true);
});

test("Build 026G converts the next command to recovery when safety governs", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "RED", pain: true }] }));
  const command = horizon.applyToCommand({ state: "EXECUTION_REQUIRED", title: "Upper A", primary: { action: "MISSION_SPINE" } }, proposal, { date: "2026-08-14", contractRevision: 8, weekId: "week-3", weekRevision: 3 });
  assert.equal(command.primary.module, "recovery");
  assert.equal(command.duration.label, "20 min");
});

test("Build 026G expires after three days and never reaches an uncommitted date", () => {
  const proposal = horizon.buildProposal(input({ readinessHistory: [{ date: "2026-08-13", state: "YELLOW", energy: 4, soreness: 7 }] }));
  const approved = horizon.resolveProposal(proposal, "ACCEPT");
  assert.equal(horizon.directiveForDate(approved, "2026-08-17", { contractRevision: 8 }), null);
  assert.equal(proposal.days[2].weekId, "week-4");
});
