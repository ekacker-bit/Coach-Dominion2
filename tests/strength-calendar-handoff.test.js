const assert = require("node:assert/strict");
const handoff = require("../assets/js/strength-calendar-handoff.js");
const weekly = require("../assets/js/weekly-orchestrator.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

function plan(revision = 1, load = 185, changes = {}) {
  return {
    id: "strength-plan-1",
    status: "APPROVED",
    revision,
    profile: { daysPerWeek: 3, sessionMinutes: 60, goal: "GENERAL_STRENGTH" },
    sessions: [{
      id: "lower-a",
      name: "Lower A",
      exercises: [{
        id: "bench",
        exerciseCode: "BENCH_PRESS",
        exerciseName: "Bench Press",
        recommendedSets: changes.sets || 3,
        targetReps: 5,
        recommendedLoad: load,
        unit: "lb",
        action: revision > 1 ? "PROGRESSED" : "HOLD",
        rationale: revision > 1 ? "Earned." : "Baseline."
      }]
    }]
  };
}

function activity(date, revision = 1) {
  return {
    module: "STRENGTH",
    id: `strength-${date}`,
    title: "Lower A",
    type: "STRENGTH",
    estimatedMinutes: 60,
    planId: "strength-plan-1",
    planRevision: revision,
    sourceId: "lower-a",
    sourceDate: date
  };
}

function week() {
  const dates = ["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07", "2026-08-08", "2026-08-09"];
  return {
    id: "week-1",
    status: "COMMITTED",
    state: "COMMITTED",
    revision: 4,
    weekStart: dates[0],
    weekEnd: dates[6],
    sourceRefs: { strengthPlanId: "strength-plan-1", strengthPlanRevision: 1 },
    days: dates.map((date, index) => ({
      date,
      dayIndex: index,
      activities: [0, 2, 4].includes(index) ? [activity(date)] : index === 5 ? [{ module: "CORE", id: "core-1", planRevision: 3 }] : []
    }))
  };
}

test("load-only earned progress is safe to hand to the calendar", () => {
  const change = handoff.classifyPlanChange(plan(1, 185), plan(2, 190));
  assert.equal(change.code, "LOAD_ONLY");
  assert.equal(change.requiresReview, false);
});

test("sets, exercises, or session structure still require explicit calendar review", () => {
  const change = handoff.classifyPlanChange(plan(1, 185), plan(2, 190, { sets: 4 }));
  assert.equal(change.code, "STRUCTURAL_REVIEW");
  assert.equal(change.requiresReview, true);
});

test("future assignments rebind while past and in-progress dates remain immutable", () => {
  const result = handoff.rebindCommittedWeek(week(), plan(1, 185), plan(2, 190), {
    today: "2026-08-05",
    protectedDates: ["2026-08-05"],
    reconciledAt: "2026-08-05T18:00:00.000Z"
  });
  assert.equal(result.status, "REBOUND");
  assert.equal(result.week.revision, 5);
  assert.equal(result.week.supersedesId, "week-1");
  assert.equal(result.week.sourceRefs.strengthPlanRevision, 2);
  assert.equal(result.week.days[0].activities[0].planRevision, 1, "past assignment must keep its original plan stamp");
  assert.equal(result.week.days[2].activities[0].planRevision, 1, "in-progress assignment must stay frozen");
  assert.equal(result.week.days[4].activities[0].planRevision, 2, "future assignment should use the earned plan");
  assert.equal(result.week.days[5].activities[0].planRevision, 3, "other modules must not change");
  assert.deepEqual(result.receipt.changedDates, ["2026-08-07"]);
  assert.equal(result.receipt.datesUnchanged, true);
});

test("a structural change returns a review receipt and leaves the committed week untouched", () => {
  const original = week();
  const result = handoff.reconcileCommittedWeeks([original], plan(1, 185), plan(2, 190, { sets: 4 }), {
    today: "2026-08-05"
  });
  assert.equal(result.status, "REVIEW_REQUIRED");
  assert.equal(result.replacements.length, 0);
  assert.equal(result.receipt.status, "REVIEW_REQUIRED");
  assert.equal(original.revision, 4);
});

test("reconciliation is idempotent after every future assignment already points to the new plan", () => {
  const rebound = handoff.rebindCommittedWeek(week(), plan(1, 185), plan(2, 190), {
    today: "2026-08-05",
    reconciledAt: "2026-08-05T18:00:00.000Z"
  }).week;
  const again = handoff.rebindCommittedWeek(rebound, plan(1, 185), plan(2, 190), {
    today: "2026-08-05",
    reconciledAt: "2026-08-05T18:05:00.000Z"
  });
  assert.equal(again.status, "UNCHANGED");
  assert.equal(again.week.revision, rebound.revision);
});

test("the active block is rebound without changing its training phases", () => {
  const block = {
    id: "block-1",
    status: "ACTIVE",
    revision: 2,
    planId: "strength-plan-1",
    planRevision: 1,
    activatedPlanRevision: 1,
    weeks: [{ index: 1, phase: { code: "ACCUMULATION" }, setTargetPercent: 100 }]
  };
  const result = handoff.rebindActiveBlock(block, plan(1, 185), plan(2, 190), {
    reconciledAt: "2026-08-05T18:00:00.000Z"
  });
  assert.equal(result.status, "REBOUND");
  assert.equal(result.block.revision, 3);
  assert.equal(result.block.planRevision, 2);
  assert.deepEqual(result.block.weeks, block.weeks);
});

test("the derived strength schedule advertises the canonical plan revision even when a past assignment is older", () => {
  const result = handoff.rebindCommittedWeek(week(), plan(1, 185), plan(2, 190), {
    today: "2026-08-05",
    protectedDates: ["2026-08-05"],
    reconciledAt: "2026-08-05T18:00:00.000Z"
  });
  const schedule = weekly.strengthScheduleFromWeek(result.week);
  assert.equal(schedule.planRevision, 2);
  assert.equal(schedule.assignments[0].planRevision, 1);
  assert.equal(schedule.assignments.at(-1).planRevision, 2);
});

console.log(`Strength calendar handoff: ${passed} tests passed.`);
