const assert = require("assert");
const core = require("../assets/js/core-programming.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

function draft(overrides = {}, options = {}) {
  return core.buildFourWeekPlan({
    goal: "RUNNING_SUPPORT",
    sessionsPerWeek: 3,
    experience: "INTERMEDIATE",
    equipment: "MINIMAL",
    sessionMinutes: 15,
    ...overrides
  }, { today: "2026-07-27", generatedAt: "2026-07-27T12:00:00.000Z", ...options });
}

function approved(overrides = {}, options = {}) {
  return core.approvePlan(draft(overrides, options), "2026-07-27T12:05:00.000Z");
}

test("profile defaults are conservative and bounded", () => {
  const profile = core.normalizeProfile({ sessionsPerWeek: 9, sessionMinutes: 99 });
  assert.equal(profile.goal, "GENERAL_STRENGTH");
  assert.equal(profile.sessionsPerWeek, 4);
  assert.equal(profile.experience, "FOUNDATION");
  assert.equal(profile.equipment, "BODYWEIGHT");
  assert.equal(profile.sessionMinutes, 15);
});

test("four-week plan remains a draft until explicitly approved", () => {
  const plan = draft();
  assert.equal(plan.status, "DRAFT");
  assert.equal(plan.weeks.length, 4);
  assert.equal(core.planSessions(plan).length, 12);
  assert.equal(plan.startDate, "2026-07-27");
  assert.equal(plan.endDate, "2026-08-23");
  assert.equal(core.approvePlan(plan).status, "APPROVED");
});

test("approved cycle covers every core movement category", () => {
  const coverage = core.movementCoverage(approved());
  assert.equal(coverage.length, 5);
  coverage.forEach((category) => assert.ok(category.exposures > 0, `${category.code} has no exposure`));
});

test("green readiness preserves approved volume", () => {
  const result = core.buildDailyPrescription(approved(), [], {
    today: "2026-07-27",
    readiness: { state: "GREEN", pain: false }
  });
  assert.equal(result.status, "READY");
  result.exercises.forEach((exercise) => assert.equal(exercise.sets, exercise.plannedSets));
});

test("yellow readiness only reduces volume", () => {
  const result = core.buildDailyPrescription(approved(), [], {
    today: "2026-07-27",
    readiness: { state: "YELLOW", pain: false }
  });
  assert.equal(result.adjustment.code, "VOLUME_REDUCED");
  result.exercises.forEach((exercise) => {
    assert.equal(exercise.sets, Math.max(1, exercise.plannedSets - 1));
    assert.ok(exercise.sets <= exercise.plannedSets);
  });
});

test("red readiness and pain remove the session", () => {
  const plan = approved();
  const red = core.buildDailyPrescription(plan, [], { today: "2026-07-27", readiness: { state: "RED" } });
  const pain = core.buildDailyPrescription(plan, [], { today: "2026-07-27", readiness: { state: "GREEN", pain: true } });
  assert.equal(red.status, "SAFETY_HOLD");
  assert.equal(pain.status, "SAFETY_HOLD");
  assert.deepEqual(red.exercises, []);
  assert.deepEqual(pain.exercises, []);
});

test("execution cannot close until every prescribed movement is complete", () => {
  const prescription = core.buildDailyPrescription(approved(), [], {
    today: "2026-07-27",
    readiness: { state: "GREEN" }
  });
  let execution = core.startExecution(prescription, "2026-07-27T13:00:00.000Z");
  assert.equal(execution.state, "IN_PROGRESS");
  assert.equal(core.completeSession(execution, prescription, {}).valid, false);
  prescription.exercises.forEach((exercise) => {
    execution = core.completeExercise(execution, exercise.id);
  });
  const result = core.completeSession(execution, prescription, {
    quality: "CONTROLLED",
    effort: 7,
    completedAt: "2026-07-27T13:15:00.000Z"
  });
  assert.equal(result.valid, true);
  assert.equal(result.execution.state, "COMPLETE");
});

test("progression is earned by controlled sustainable evidence", () => {
  const result = core.deriveProgressionRecommendation([
    { date: "2026-07-20", state: "COMPLETE", quality: "CONTROLLED", effort: 7 },
    { date: "2026-07-23", state: "COMPLETE", quality: "CONTROLLED", effort: 8 }
  ]);
  assert.equal(result.code, "PROGRESS_NEXT_CYCLE");
});

test("pain or limited technique blocks progression", () => {
  const result = core.deriveProgressionRecommendation([
    { date: "2026-07-20", state: "COMPLETE", quality: "CONTROLLED", effort: 7 },
    { date: "2026-07-23", state: "COMPLETE", quality: "TECHNIQUE_LIMITED", effort: 8, painReported: true }
  ]);
  assert.equal(result.code, "REGRESS");
});

test("completed session produces performance evidence for each movement", () => {
  const prescription = core.buildDailyPrescription(approved(), [], {
    today: "2026-07-27",
    readiness: { state: "GREEN" }
  });
  let execution = core.startExecution(prescription);
  prescription.exercises.forEach((exercise) => {
    execution = core.completeExercise(execution, exercise.id);
  });
  execution = core.completeSession(execution, prescription, { quality: "CONTROLLED", effort: 7 }).execution;
  const entries = core.performanceEntriesForSession(prescription, execution);
  assert.equal(entries.length, prescription.exercises.length);
  entries.forEach((entry) => {
    assert.equal(entry.domain, "core");
    assert.match(entry.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.match(entry.notes, /CONTROLLED/);
  });
});

console.log(`Core programming: ${passed} tests passed.`);
