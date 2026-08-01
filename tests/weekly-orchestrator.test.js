const assert = require("node:assert/strict");
const recruit = require("../assets/js/recruit-contract.js");
const strength = require("../assets/js/strength-training.js");
const running = require("../assets/js/running-command.js");
const core = require("../assets/js/core-programming.js");
const orchestrator = require("../assets/js/weekly-orchestrator.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

function approvedContract(overrides = {}) {
  const draft = recruit.buildRecruitContract({
    age: 42,
    heightValue: 70,
    heightUnit: "in",
    gender: "MAN",
    trainingYears: 8,
    primaryGoal: "BALANCED_FITNESS",
    target: "Build a durable hybrid base",
    trainingDaysPerWeek: 5,
    strengthDaysPerWeek: 3,
    runningDaysPerWeek: 3,
    coreDaysPerWeek: 3,
    sessionMinutes: 60,
    twoADays: false,
    equipment: "FULL_GYM",
    experience: "INTERMEDIATE",
    runningGoal: "10K",
    preferredUnit: "mi",
    declaredWeeklyDistance: 18,
    nutritionCommitment: "TRACK_5_DAYS",
    effectiveDate: "2026-08-03",
    ...overrides
  }, { today: "2026-08-03", weekStart: "2026-08-03" });
  return recruit.approveRecruitContract(draft, null, {
    today: "2026-08-03",
    weekStart: "2026-08-03",
    approvedAt: "2026-08-02T12:00:00.000Z"
  });
}

function modules(contract = approvedContract()) {
  const strengthDraft = strength.buildStrengthProgram(contract.planningInputs.strength, [], {
    startDate: "2026-08-03",
    generatedAt: "2026-08-02T12:05:00.000Z"
  });
  const strengthPlan = strength.approvePlan(strengthDraft, "2026-08-02T12:10:00.000Z");
  const runningProfile = running.normalizeProfile({
    ...contract.planningInputs.running,
    approvedAt: "2026-08-02T12:10:00.000Z",
    updatedAt: "2026-08-02T12:10:00.000Z"
  });
  const runningBlock = running.approveRunningBlock(running.buildRunningBlock(runningProfile, [], {
    today: "2026-08-03",
    startDate: "2026-08-03",
    contractSchedule: contract.schedule,
    recruitContractId: contract.id,
    recruitContractRevision: contract.revision
  }), null, { approvedAt: "2026-08-02T12:15:00.000Z" });
  const corePlan = core.approvePlan(core.buildFourWeekPlan(contract.planningInputs.core, {
    today: "2026-08-03",
    generatedAt: "2026-08-02T12:20:00.000Z"
  }), "2026-08-02T12:25:00.000Z");
  return {
    contract,
    strengthPlan,
    runningBlock,
    corePlan,
    nutritionBaseline: {
      id: "fuel-1",
      status: "APPROVED",
      calories: 2200,
      protein: 170,
      approvedAt: "2026-08-02T12:30:00.000Z"
    }
  };
}

function draft(input = modules(), options = {}) {
  return orchestrator.buildUnifiedWeek(input, {
    today: "2026-08-03",
    weekStart: "2026-08-03",
    generatedAt: "2026-08-02T13:00:00.000Z",
    ...options
  });
}

test("a complete week coordinates every committed module", () => {
  const result = draft();
  assert.equal(result.status, "DRAFT");
  assert.equal(result.approvalBlocked, false);
  assert.equal(result.days.length, 7);
  assert.equal(result.actual.strength, 3);
  assert.equal(result.actual.running, 3);
  assert.equal(result.actual.core, 3);
  assert.equal(result.moduleStatus.nutrition, "READY");
  assert.ok(result.recoveryDays >= 1);
});

test("current-week nutrition uses today's effective baseline instead of Monday's stale state", () => {
  assert.equal(orchestrator.planningDateForWeek("2026-07-27", "2026-07-31"), "2026-07-31");
  assert.equal(orchestrator.planningDateForWeek("2026-08-03", "2026-07-31"), "2026-08-03");
});

test("loaded Strength is moved away from hard running", () => {
  const result = draft();
  result.days.forEach((day) => {
    const modulesOnDay = day.activities.map((item) => item.module);
    const hardRun = day.activities.find((item) => item.module === "RUNNING" && orchestrator.HARD_RUN_TYPES.includes(item.type));
    assert.equal(Boolean(hardRun && modulesOnDay.includes("STRENGTH")), false, `${day.date} contains a hard collision`);
  });
});

test("the signed Two-a-Day choice governs coordinated calendar days", () => {
  const result = draft(modules(approvedContract({ twoADays: true })));
  const twoADays = result.days.filter((day) => day.twoADay);
  assert.equal(result.twoADaysEnabled, true);
  assert.equal(result.twoADayCount, twoADays.length);
  assert.ok(twoADays.length > 0);
  twoADays.forEach((day) => {
    assert.equal(day.sessionCount, 2);
    assert.equal(day.durationTargetMinutes, 121);
    assert.equal(day.durationLimitMinutes, day.longRunUncapped ? null : 240);
  });
  assert.equal(result.conflicts.some((item) => item.code === "TWO_A_DAY_SESSION_LIMIT"), false);
  assert.ok(twoADays.every((day) => day.estimatedMinutes >= 121));
});

test("two short sessions remain a combined day until the 121-minute target is met", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 60 },
    [
      { module: "STRENGTH", estimatedMinutes: 40 },
      { module: "CORE", estimatedMinutes: 20 }
    ]
  );
  assert.equal(policy.twoADayCandidate, true);
  assert.equal(policy.twoADay, false);
  assert.equal(policy.twoADayAuthorizationRequired, false);
  assert.equal(policy.durationTargetUnmet, true);
  assert.equal(policy.targetMinutes, 121);
  assert.equal(policy.maximumMinutes, 240);
});

test("Two-a-Day capacity permits two sessions above 120 minutes through 240", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 75 },
    [
      { module: "STRENGTH", type: "STRENGTH", estimatedMinutes: 100 },
      { module: "RUNNING", type: "EASY", estimatedMinutes: 130 }
    ]
  );
  assert.equal(policy.twoADay, true);
  assert.equal(policy.targetMinutes, 121);
  assert.equal(policy.maximumMinutes, 240);
  assert.equal(policy.estimatedMinutes, 230);
  assert.equal(policy.durationLimitExceeded, false);
  assert.equal(policy.sessionLimitExceeded, false);
});

test("Two-a-Day capacity blocks a third session or more than 240 minutes", () => {
  const overTime = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 90 },
    [
      { module: "STRENGTH", estimatedMinutes: 120 },
      { module: "RUNNING", type: "EASY", estimatedMinutes: 121 }
    ]
  );
  const overSessions = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 90 },
    [
      { module: "STRENGTH", estimatedMinutes: 75 },
      { module: "RUNNING", type: "EASY", estimatedMinutes: 75 },
      { module: "CORE", estimatedMinutes: 20 }
    ]
  );
  assert.equal(overTime.durationLimitExceeded, true);
  assert.equal(overSessions.sessionLimitExceeded, true);
});

test("long-run duration is never capped by standard or Two-a-Day time limits", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 90 },
    [
      { module: "RUNNING", type: "LONG", estimatedMinutes: 360 },
      { module: "CORE", estimatedMinutes: 20 }
    ]
  );
  assert.equal(policy.longRunUncapped, true);
  assert.equal(policy.maximumMinutes, null);
  assert.equal(policy.durationLimitExceeded, false);
  assert.equal(policy.estimatedMinutes, 380);
});

test("Two-a-Day sessions receive a deterministic execution order and recovery bridge", () => {
  const sessions = orchestrator.buildSessionSequence(
    { twoADays: true, primaryGoal: "BUILD_STRENGTH", sessionMinutes: 75 },
    [
      { id: "easy-run", module: "RUNNING", type: "EASY", estimatedMinutes: 70 },
      { id: "lift", module: "STRENGTH", type: "STRENGTH", estimatedMinutes: 75 }
    ]
  );
  assert.deepEqual(sessions.map((item) => item.id), ["lift", "easy-run"]);
  assert.deepEqual(sessions.map((item) => item.sessionWindow), ["AM", "PM"]);
  assert.deepEqual(sessions.map((item) => item.sessionLabel), ["AM SESSION", "PM SESSION"]);
  assert.equal(sessions[0].separationBeforeMinutes, 0);
  assert.equal(sessions[1].separationBeforeMinutes, 240);
  assert.equal(sessions[1].fuelingCheckpoint, true);
  assert.equal(sessions[1].command, "EXECUTE AFTER REFUEL");
});

test("an unsigned split-day capacity is surfaced as a Contract authorization requirement", () => {
  const result = draft(modules(approvedContract({ twoADays: false, sessionMinutes: 90 })));
  const unauthorized = result.days.filter((day) => day.twoADayAuthorizationRequired);
  assert.ok(unauthorized.length > 0);
  assert.ok(unauthorized.every((day) => day.twoADay === false && day.estimatedMinutes >= 121));
  assert.ok(result.conflicts.some((item) => item.code === "TWO_A_DAY_AUTHORIZATION_REQUIRED"));
  assert.equal(result.conflicts.some((item) => item.code === "TIME_COMMITMENT_EXCEEDED" && unauthorized.some((day) => day.date === item.date)), false);
});

test("a long run remains first and time-open inside a split-day command", () => {
  const activities = [
    { id: "core", module: "CORE", type: "CORE", estimatedMinutes: 20 },
    { id: "long", module: "RUNNING", type: "LONG", estimatedMinutes: 180 }
  ];
  const policy = orchestrator.dailyDurationPolicy({ twoADays: true, sessionMinutes: 60 }, activities);
  const sessions = orchestrator.buildSessionSequence({ twoADays: true, primaryGoal: "BUILD_STRENGTH", sessionMinutes: 60 }, activities, policy);
  assert.equal(policy.longRunUncapped, true);
  assert.equal(policy.maximumMinutes, null);
  assert.equal(sessions[0].id, "long");
  assert.equal(sessions[1].id, "core");
});

test("missing module approvals are explicit blockers", () => {
  const input = modules();
  const result = draft({ ...input, runningBlock: null, nutritionBaseline: null });
  assert.equal(result.approvalBlocked, true);
  assert.ok(result.conflicts.some((item) => item.code === "RUNNING_PLAN_REQUIRED"));
  assert.ok(result.conflicts.some((item) => item.code === "NUTRITION_BASELINE_REQUIRED"));
  assert.throws(() => orchestrator.approveWeek(result), /blocking weekly conflicts/i);
});

test("a ready draft requires explicit commitment", () => {
  const result = draft();
  assert.equal(orchestrator.weekState(result, "2026-08-03"), "DRAFT");
  const approved = orchestrator.approveWeek(result, null, { approvedAt: "2026-08-02T14:00:00.000Z" });
  assert.equal(approved.status, "COMMITTED");
  assert.equal(approved.revision, 1);
  assert.equal(orchestrator.weekState(approved, "2026-08-01"), "COMMITTED");
  assert.equal(orchestrator.weekState(approved, "2026-08-05"), "ACTIVE");
  assert.equal(orchestrator.weekState(approved, "2026-08-10"), "COMPLETED");
});

test("committing a future week preserves the active current week", () => {
  const current = orchestrator.approveWeek(draft(), null, { approvedAt: "2026-08-02T14:00:00.000Z" });
  const futureDraft = draft(modules(), { weekStart: "2026-08-10", today: "2026-08-05", generatedAt: "2026-08-05T14:00:00.000Z" });
  const future = orchestrator.approveWeek(futureDraft, null, { approvedAt: "2026-08-05T14:05:00.000Z" });
  const history = orchestrator.mergeCommittedWeek([current], future);
  assert.equal(orchestrator.weekForDate(history, "2026-08-05").id, current.id);
  assert.equal(orchestrator.weekForDate(history, "2026-08-12").id, future.id);
  assert.equal(history.find((item) => item.id === current.id).status, "COMMITTED");
});

test("a same-week replacement preserves lineage and marks the prior revision replaced", () => {
  const first = orchestrator.approveWeek(draft(), null, { approvedAt: "2026-08-02T14:00:00.000Z" });
  const second = orchestrator.approveWeek(draft(), first, { approvedAt: "2026-08-02T15:00:00.000Z" });
  const history = orchestrator.mergeCommittedWeek([first], second);
  assert.equal(second.revision, 2);
  assert.equal(second.supersedesId, first.id);
  assert.equal(history.find((item) => item.id === first.id).status, "REPLACED");
  assert.equal(orchestrator.weekForDate(history, "2026-08-05").id, second.id);
});

test("Today can resolve the exact committed assignment", () => {
  const approved = orchestrator.approveWeek(draft(), null, { approvedAt: "2026-08-02T14:00:00.000Z" });
  const day = orchestrator.dayForDate(approved, "2026-08-03");
  assert.equal(day.date, "2026-08-03");
  assert.ok(day.nutrition);
  assert.ok(day.activities.length > 0);
});

test("the committed week produces the exact Strength schedule consumed by Today", () => {
  const approved = orchestrator.approveWeek(draft(), null, { approvedAt: "2026-08-02T14:00:00.000Z" });
  const schedule = orchestrator.strengthScheduleFromWeek(approved);
  const expected = approved.days.flatMap((day) => day.activities.filter((item) => item.module === "STRENGTH"));
  assert.equal(schedule.status, "APPROVED");
  assert.equal(schedule.assignments.length, expected.length);
  assert.deepEqual(schedule.assignments.map((item) => item.date), approved.days.filter((day) => day.activities.some((item) => item.module === "STRENGTH")).map((day) => day.date));
});

test("recovery protection blocks a plan that consumes all seven days", () => {
  const input = modules();
  input.contract = {
    ...input.contract,
    trainingDaysPerWeek: 6,
    schedule: input.contract.schedule.map((day) => ({ ...day, isTrainingDay: true, isRecoveryDay: false }))
  };
  input.runningBlock = {
    ...input.runningBlock,
    weeks: [{
      weekStart: "2026-08-03",
      weekEnd: "2026-08-09",
      sessions: Array.from({ length: 7 }, (_, index) => ({ id: `run-${index}`, date: orchestrator.addDays("2026-08-03", index), type: "EASY", estimatedMinutes: 30 }))
    }]
  };
  const result = draft(input);
  assert.equal(result.trainingDays, 7);
  assert.ok(result.conflicts.some((item) => item.code === "RECOVERY_MINIMUM_VIOLATED" && item.severity === "BLOCKING"));
});

console.log(`Weekly orchestrator: ${passed} tests passed.`);
