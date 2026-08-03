const test = require("node:test");
const assert = require("node:assert/strict");
const command = require("../assets/js/plan-command.js");

const review = (domain) => ({
  id: `review-${domain.toLowerCase()}`,
  status: "CONFIRMED",
  sourceLatestDate: "2026-08-02",
  recommendation: { domain, requiresPlanApproval: true }
});

const nutrition = () => ({
  id: "nutrition-current",
  status: "APPROVED",
  goal: "FAT_LOSS",
  recoveryTargets: { calories: 2000, protein: 180, carbs: 200, fat: 53 },
  trainingTargets: { calories: 2200, protein: 180, carbs: 250, fat: 53 },
  trainingAdjustments: { calories: 200, carbs: 50 }
});

const strength = () => ({
  id: "strength-current",
  status: "APPROVED",
  revision: 2,
  profile: { daysPerWeek: 2 },
  sessions: [
    { id: "upper", exercises: [{ id: "press", recommendedSets: 4, plannedSets: 4, load: 100 }, { id: "row", recommendedSets: 2, plannedSets: 2, load: 90 }] },
    { id: "lower", exercises: [{ id: "squat", recommendedSets: 3, plannedSets: 3, load: 200 }] }
  ]
});

const running = () => ({
  id: "running-current",
  status: "APPROVED",
  revision: 1,
  baselineDistance: 20,
  profile: { preferredUnit: "mi", runningDaysPerWeek: 2 },
  weeks: Array.from({ length: 4 }, (_, index) => ({
    weekStart: command.shiftDate("2026-07-06", index * 7),
    weekEnd: command.shiftDate("2026-07-06", index * 7 + 6),
    weeklyDistance: 20,
    sessions: [
      { id: `easy-${index}`, type: "EASY", dayIndex: 1, date: command.shiftDate("2026-07-06", index * 7 + 1), distance: 8, estimatedMinutes: 64, durationCapMinutes: 90 },
      { id: `long-${index}`, type: "LONG", dayIndex: 6, date: command.shiftDate("2026-07-06", index * 7 + 6), distance: 12, estimatedMinutes: 110, durationCapMinutes: 120 }
    ]
  }))
});

function build(domain, currentPlans) {
  return command.buildPlanCommand({
    today: "2026-08-02",
    review: review(domain),
    currentPlans,
    generatedAt: "2026-08-02T13:00:00.000Z"
  });
}

test("Nutrition changes one bounded energy lever next Monday", () => {
  const result = build("NUTRITION", { nutrition: nutrition() });
  assert.equal(result.status, "DRAFT");
  assert.equal(result.effectiveDate, "2026-08-03");
  assert.equal(result.observationEnd, "2026-08-16");
  assert.equal(result.proposedPlan.recoveryTargets.calories, 1900);
  assert.equal(result.proposedPlan.recoveryTargets.protein, 180);
  assert.deepEqual(result.proposedPlan.trainingAdjustments, result.currentPlan.trainingAdjustments);
  assert.equal(result.impact.sessionsAffected, 0);
});

test("Strength removes one set only from movements above two sets", () => {
  const result = build("STRENGTH", { strength: strength() });
  assert.equal(result.proposedPlan.sessions[0].exercises[0].recommendedSets, 3);
  assert.equal(result.proposedPlan.sessions[0].exercises[0].load, 100);
  assert.equal(result.proposedPlan.sessions[0].exercises[1].recommendedSets, 2);
  assert.equal(result.proposedPlan.sessions[1].exercises[0].recommendedSets, 2);
  assert.equal(result.proposedPlan.profile.daysPerWeek, 2);
});

test("Running trims distance while preserving days, types, and an uncapped long run", () => {
  const result = build("RUNNING", { running: running() });
  assert.equal(result.proposedPlan.weeks[0].weeklyDistance, 19);
  assert.deepEqual(result.proposedPlan.weeks[0].sessions.map((item) => item.dayIndex), [1, 6]);
  assert.deepEqual(result.proposedPlan.weeks[0].sessions.map((item) => item.type), ["EASY", "LONG"]);
  const longRun = result.proposedPlan.weeks[0].sessions[1];
  assert.equal(longRun.durationCapMinutes, null);
  assert.equal(longRun.durationPolicy, "UNCAPPED_BY_TIME");
});

test("calendar blockers prevent approval", () => {
  const draft = build("NUTRITION", { nutrition: nutrition() });
  const blocked = command.withCalendarPreview(draft, { blockingConflictCount: 2, conflicts: [{ severity: "BLOCKING" }] });
  assert.equal(blocked.approvalBlocked, true);
  assert.throws(() => command.resolvePlanCommand(blocked, "APPROVE"), /calendar blockers/i);
});

test("approval schedules without activating, then opens a 14-day observation", () => {
  const draft = build("NUTRITION", { nutrition: nutrition() });
  const scheduled = command.resolvePlanCommand(draft, "APPROVE", { resolvedAt: "2026-08-02T14:00:00.000Z" });
  assert.equal(scheduled.status, "SCHEDULED");
  assert.equal(scheduled.plansChanged, false);
  assert.throws(() => command.markApplied(scheduled, { appliedAt: "2026-08-02T15:00:00.000Z" }), /effective date/i);
  const observing = command.markApplied(scheduled, { appliedAt: "2026-08-03T12:00:00.000Z" });
  assert.equal(observing.status, "OBSERVING");
  assert.equal(command.refreshLifecycle(observing, "2026-08-17").status, "REVIEW_DUE");
  assert.equal(command.completeObservation(command.refreshLifecycle(observing, "2026-08-17"), "RETAIN").status, "RETAINED");
});

test("hold and reject never change an approved plan", () => {
  const draft = build("STRENGTH", { strength: strength() });
  assert.equal(command.resolvePlanCommand(draft, "HOLD").plansChanged, false);
  assert.equal(command.resolvePlanCommand(draft, "REJECT").plansChanged, false);
});

console.log(`Build 022D plan command: ${command.VERSION}`);
