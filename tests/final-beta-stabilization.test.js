const test = require("node:test");
const assert = require("node:assert/strict");

const Stabilization = require("../assets/js/final-beta-stabilization.js");

test("029G exposes the five explicit adaptation states", () => {
  assert.deepEqual(Object.values(Stabilization.ADAPTATION_STATES), [
    "MISSION_ACTIVE",
    "ADAPTATION_PROPOSED",
    "ADAPTATION_ACCEPTED",
    "ADAPTATION_DECLINED",
    "MISSION_COMPLETED"
  ]);
  assert.equal(Stabilization.adaptationState({ status: "PROPOSED" }), "ADAPTATION_PROPOSED");
  assert.equal(Stabilization.adaptationState({ status: "APPROVED" }), "ADAPTATION_ACCEPTED");
  assert.equal(Stabilization.adaptationState({ status: "HELD" }), "ADAPTATION_DECLINED");
});

test("029G gives a recovery proposal three unambiguous decisions", () => {
  assert.deepEqual(Stabilization.adaptationControls({ status: "PROPOSED" }).map((item) => item.label), [
    "Accept recovery",
    "Hold current mission",
    "This doesn’t fit"
  ]);
});

test("029G reports one canonical queue count without double-counting the account snapshot", () => {
  const continuity = [{ id: "strength" }, { id: "core" }, { id: "fuel" }];
  const aggregate = [{ mutationId: "account-truth" }];
  assert.equal(Stabilization.pendingState(continuity, aggregate).count, 3);
  assert.equal(Stabilization.pendingState(continuity, aggregate).label, "Sync · 3");
  assert.equal(Stabilization.pendingState([], aggregate).count, 1);
});

test("029G defaults Calendar to the protected active week and requires an explicit staged view", () => {
  const activeWeek = { id: "active" };
  const stagedWeek = { id: "staged" };
  assert.equal(Stabilization.weekView({ activeWeek, stagedWeek }).week.id, "active");
  assert.equal(Stabilization.weekView({ activeWeek, stagedWeek, requested: "STAGED" }).week.id, "staged");
});

test("029G separates elapsed time, evidence, execution, promotion, and setup", () => {
  const unscored = Stabilization.campaignMetrics({
    status: "ACTIVE",
    totalWeeks: 12,
    elapsedDays: 21,
    evidence: { rate: 64 },
    weekly: { finalized: 0, qualifying: 0, disciplineAverage: 0 }
  });
  assert.equal(unscored.campaignElapsed, 25);
  assert.equal(unscored.evidenceCoverage, 64);
  assert.equal(unscored.assessedExecutionScore, null);
  assert.equal(unscored.setupCompleteness, 100);
});

test("029G mobile disclosure keeps action open and moves full forms out of Today", () => {
  const disclosure = Stabilization.mobileDisclosure({ bodyCheckpointDue: true });
  assert.equal(disclosure.commandOpen, true);
  assert.equal(disclosure.quickLogOpen, true);
  assert.equal(disclosure.currentMissionOpen, true);
  assert.equal(disclosure.bodyCheckpointCollapsed, true);
  assert.equal(disclosure.fullFormsUseDedicatedView, true);
});
