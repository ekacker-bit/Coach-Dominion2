const assert = require("node:assert/strict");
const strength = require("../assets/js/strength-training.js");
const fs = require("node:fs");
const path = require("node:path");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

function draft(profile = {}, evidence = []) {
  return strength.buildStrengthProgram({
    goal: "GENERAL_STRENGTH",
    daysPerWeek: 3,
    equipment: "FULL_GYM",
    sessionMinutes: 60,
    experience: "INTERMEDIATE",
    ...profile
  }, evidence, {
    startDate: "2026-07-30",
    generatedAt: "2026-07-30T12:00:00.000Z"
  });
}

function approved(profile = {}, evidence = []) {
  return strength.approvePlan(draft(profile, evidence), "2026-07-30T12:05:00.000Z");
}

function prescription(plan = approved(), history = [], readiness = { state: "GREEN", pain: false }) {
  return strength.buildDailyPrescription(plan, history, { today: "2026-07-30", readiness });
}

test("profile defaults are bounded and conservative", () => {
  const profile = strength.normalizeProfile({ daysPerWeek: 9, sessionMinutes: 20, equipment: "UNKNOWN" });
  assert.equal(profile.daysPerWeek, 6);
  assert.equal(profile.sessionMinutes, 60);
  assert.equal(profile.equipment, "FULL_GYM");
});

test("draft requires explicit approval", () => {
  const plan = draft();
  assert.equal(plan.status, "DRAFT");
  assert.equal(strength.approvePlan(plan).status, "APPROVED");
});

test("three-day program creates balanced five-to-seven exercise sessions", () => {
  const plan = draft();
  assert.equal(plan.sessions.length, 3);
  plan.sessions.forEach((session) => {
    assert.ok(session.exercises.length >= 5);
    assert.ok(session.exercises.length <= 7);
    const patterns = new Set(session.exercises.map((item) => item.pattern));
    assert.ok([...patterns].some((item) => item === "SQUAT" || item === "UNILATERAL"));
    assert.ok([...patterns].some((item) => item === "HINGE" || item === "UNILATERAL"));
    assert.ok([...patterns].some((item) => item.includes("PUSH")));
    assert.ok([...patterns].some((item) => item.includes("PULL")));
  });
});

test("four-day split remains balanced", () => {
  const plan = draft({ daysPerWeek: 4 });
  assert.equal(plan.sessions.length, 4);
  plan.sessions.forEach((session) => assert.ok(session.exercises.length >= 5 && session.exercises.length <= 7));
  const coverage = new Set(strength.movementCoverage(plan).map((item) => item.code));
  ["SQUAT", "HINGE", "HORIZONTAL_PUSH", "HORIZONTAL_PULL", "UNILATERAL", "CORE"].forEach((code) => assert.ok(coverage.has(code)));
});

test("five- and six-day programs remain bounded and cover the full movement system", () => {
  [5, 6].forEach((daysPerWeek) => {
    ["FULL_GYM", "DUMBBELLS", "BODYWEIGHT_BANDS"].forEach((equipment) => {
      const plan = draft({ daysPerWeek, equipment });
      assert.equal(plan.sessions.length, daysPerWeek);
      plan.sessions.forEach((session) => assert.ok(session.exercises.length >= 5 && session.exercises.length <= 7));
      const coverage = new Set(strength.movementCoverage(plan).map((item) => item.code));
      ["SQUAT", "HINGE", "HORIZONTAL_PUSH", "HORIZONTAL_PULL", "UNILATERAL", "CORE"].forEach((code) => assert.ok(coverage.has(code), `${equipment} ${daysPerWeek} missing ${code}`));
    });
  });
});

test("evidence personalizes load without determining exercise inclusion", () => {
  const evidence = [
    { domain: "strength", activityName: "Bench Press", performanceDate: "2026-07-29", metrics: { weight: 185, repetitions: 5, weight_unit: "lb" } },
    { domain: "strength", activityName: "One-Arm Row", performanceDate: "2026-07-29", metrics: { weight: 70, repetitions: 8, weight_unit: "lb" } }
  ];
  const plan = draft({}, evidence);
  const first = plan.sessions[0];
  assert.equal(first.exercises.length, 6);
  assert.equal(first.exercises.find((item) => item.exerciseCode === "BENCH_PRESS").recommendedLoad, 185);
  assert.equal(first.exercises.find((item) => item.exerciseCode === "BENCH_PRESS").recommendedSets, 3);
  assert.equal(first.exercises.find((item) => item.exerciseCode === "ONE_ARM_ROW").recommendedLoad, 70);
  assert.ok(first.exercises.find((item) => item.exerciseCode === "BACK_SQUAT"));
  assert.ok(first.exercises.find((item) => item.exerciseCode === "ROMANIAN_DEADLIFT"));
});

test("missing load evidence produces technique-first guidance", () => {
  const squat = draft().sessions[0].exercises.find((item) => item.exerciseCode === "BACK_SQUAT");
  assert.equal(squat.recommendedLoad, 0);
  assert.equal(squat.action, "TECHNIQUE FIRST");
  assert.match(squat.rationale, /three reps in reserve/i);
});

test("yellow readiness reduces volume but not exercise coverage", () => {
  const green = prescription();
  const yellow = prescription(approved(), [], { state: "YELLOW", pain: false });
  assert.equal(yellow.exercises.length, green.exercises.length);
  yellow.exercises.forEach((item, index) => {
    assert.equal(item.recommendedSets, Math.max(1, green.exercises[index].recommendedSets - 1));
    assert.equal(item.recommendedLoad, green.exercises[index].recommendedLoad);
  });
});

test("red readiness and pain remove loaded work", () => {
  assert.equal(prescription(approved(), [], { state: "RED", pain: false }).exercises.length, 0);
  assert.equal(prescription(approved(), [], { state: "GREEN", pain: true }).state, "RECOVERY ONLY");
});

test("workout supports start, set logging, and undo", () => {
  const Rx = prescription();
  let execution = strength.executionForPrescription(Rx);
  execution = strength.startWorkout(execution, Rx, "2026-07-30T13:00:00.000Z");
  const exercise = Rx.exercises[0];
  execution = strength.recordSet(execution, exercise.exerciseCode, { reps: 5, load: 135, rpe: 7 }, "2026-07-30T13:05:00.000Z");
  assert.equal(strength.completedSetCount(execution), 1);
  assert.equal(execution.setLogs[exercise.exerciseCode][0].rpe, 7);
  execution = strength.undoLastSet(execution, exercise.exerciseCode);
  assert.equal(strength.completedSetCount(execution), 0);
});

test("warm-ups, set edits, rest, pause, resume, and review form a recoverable attempt", () => {
  const Rx = prescription();
  const exercise = Rx.exercises[0];
  let execution = strength.executionForPrescription(Rx);
  execution = strength.startWorkout(execution, Rx, "2026-07-30T13:00:00.000Z");
  execution = strength.recordSet(execution, exercise.exerciseCode, { reps: 5, load: 45, kind: "WARMUP" }, "2026-07-30T13:02:00.000Z");
  execution = strength.recordSet(execution, exercise.exerciseCode, { reps: 5, load: 135, rpe: 8, kind: "WORK" }, "2026-07-30T13:05:00.000Z");
  assert.equal(strength.completedSetCount(execution), 1);
  assert.equal(execution.setLogs[exercise.exerciseCode].length, 2);
  assert.equal(execution.restUntil, "2026-07-30T13:08:00.000Z");
  const workSet = execution.setLogs[exercise.exerciseCode][1];
  execution = strength.editSet(execution, exercise.exerciseCode, workSet.id, { reps: 6, load: 140, rpe: 7.5 }, "2026-07-30T13:06:00.000Z");
  assert.equal(execution.setLogs[exercise.exerciseCode][1].load, 140);
  execution = strength.pauseWorkout(execution, "2026-07-30T13:10:00.000Z");
  assert.equal(execution.state, "PAUSED");
  execution = strength.resumeWorkout(execution, "2026-07-30T13:20:00.000Z");
  execution = strength.prepareWorkoutReview(execution, "2026-07-30T13:30:00.000Z");
  assert.equal(execution.state, "REVIEW");
  assert.equal(strength.activeDurationMinutes(execution), 20);
  execution = strength.finishWorkout(execution, { notes: "Controlled work" }, "2026-07-30T13:31:00.000Z");
  assert.equal(execution.state, "PARTIAL");
  assert.equal(execution.summary.durationMinutes, 20);
  assert.equal(execution.summary.volume, 840);
});

test("interrupted sessions auto-pause and terminal attempts can restart without erasing history identity", () => {
  const Rx = prescription();
  let execution = strength.startWorkout(strength.executionForPrescription(Rx), Rx, "2026-07-30T13:00:00.000Z");
  execution = { ...execution, updatedAt: "2026-07-30T13:05:00.000Z" };
  execution = strength.recoverInterruptedExecution(execution, "2026-07-30T14:00:00.000Z", 30);
  assert.equal(execution.state, "PAUSED");
  assert.match(execution.pauseReason, /inactivity/i);
  execution = strength.finishWorkout(execution, { forceStop: true }, "2026-07-30T14:01:00.000Z");
  const priorId = execution.id;
  const retry = strength.restartWorkout(execution, "2026-07-30T14:02:00.000Z");
  assert.equal(retry.state, "READY");
  assert.equal(retry.attempt, 2);
  assert.notEqual(retry.id, priorId);
  assert.equal(retry.restartedFromExecutionId, priorId);
});

test("legacy wall-clock inflation is rejected when active-time segments are unavailable", () => {
  const Rx = prescription();
  const legacy = {
    ...strength.executionForPrescription(Rx),
    activeSegments: [],
    state: "STOPPED",
    startedAt: "2026-07-30T01:00:00.000Z",
    completedAt: "2026-07-30T11:16:00.000Z"
  };
  const summary = strength.sessionSummary(legacy, Rx);
  assert.equal(summary.durationMinutes, null);
  assert.equal(summary.durationStatus, "UNRELIABLE_LEGACY");
});

test("finishing early creates a durable partial result", () => {
  const Rx = prescription();
  let execution = strength.startWorkout(strength.executionForPrescription(Rx), Rx);
  execution = strength.recordSet(execution, Rx.exercises[0].exerciseCode, { reps: 5, load: 135 });
  execution = strength.finishWorkout(execution, { reason: "Time expired" }, "2026-07-30T13:30:00.000Z");
  assert.equal(execution.state, "PARTIAL");
  assert.equal(execution.reason, "Time expired");
  assert.equal(execution.summary.setsCompleted, 1);
  assert.ok(execution.summary.setsPlanned > 1);
});

test("all prescribed sets close the workout complete", () => {
  const Rx = prescription();
  let execution = strength.startWorkout(strength.executionForPrescription(Rx), Rx);
  Rx.exercises.forEach((exercise) => {
    for (let index = 0; index < exercise.recommendedSets; index += 1) {
      execution = strength.recordSet(execution, exercise.exerciseCode, { reps: exercise.targetReps, load: exercise.recommendedLoad });
    }
  });
  execution = strength.finishWorkout(execution);
  assert.equal(execution.state, "COMPLETE");
  assert.equal(execution.summary.setsCompleted, execution.summary.setsPlanned);
});

test("skip, substitution, and pain are captured explicitly", () => {
  const Rx = prescription();
  let execution = strength.startWorkout(strength.executionForPrescription(Rx), Rx);
  const exercise = Rx.exercises[0];
  execution = strength.useSubstitution(execution, exercise.exerciseCode, exercise.substitutions[0]);
  execution = strength.skipExercise(execution, Rx.exercises[1].exerciseCode, "Equipment unavailable");
  execution = strength.reportPain(execution);
  assert.equal(execution.state, "STOPPED");
  assert.equal(execution.painReported, true);
  assert.equal(execution.substitutions[exercise.exerciseCode].name, exercise.substitutions[0]);
  assert.equal(execution.summary.skippedExercises, 1);
});

test("session rotation advances only from terminal history", () => {
  const plan = approved();
  assert.equal(strength.selectSession(plan, []).id, plan.sessions[0].id);
  assert.equal(strength.selectSession(plan, [{ planId: plan.id, state: "IN_PROGRESS" }]).id, plan.sessions[0].id);
  assert.equal(strength.selectSession(plan, [{ planId: plan.id, state: "PARTIAL" }]).id, plan.sessions[1].id);
});

test("an approved plan session can launch the set logger directly", () => {
  const plan = approved({ daysPerWeek: 4 });
  const selected = plan.sessions.find((item) => item.id === "LOWER_A");
  const decision = strength.sessionLaunchDecision(plan, selected.id, {}, { state: "GREEN", pain: false });
  assert.equal(decision.allowed, true);
  assert.equal(decision.mode, "START");
  assert.equal(decision.label, "Log this workout");
});

test("the direct launcher resumes only the matching active session", () => {
  const plan = approved({ daysPerWeek: 4 });
  const lower = plan.sessions.find((item) => item.id === "LOWER_A");
  const upper = plan.sessions.find((item) => item.id !== lower.id);
  const lowerExecution = strength.startWorkout(
    strength.executionForPrescription(strength.buildSessionPrescription(plan, lower.id, { today: "2026-08-10" })),
    strength.buildSessionPrescription(plan, lower.id, { today: "2026-08-10" })
  );
  const same = strength.sessionLaunchDecision(plan, lower.id, lowerExecution, { state: "GREEN" });
  const different = strength.sessionLaunchDecision(plan, upper.id, lowerExecution, { state: "GREEN" });
  assert.equal(same.allowed, true);
  assert.equal(same.mode, "CONTINUE");
  assert.equal(different.allowed, false);
  assert.equal(different.mode, "ACTIVE_OTHER");
});

test("pain and preserved evidence remain hard launch boundaries", () => {
  const plan = approved({ daysPerWeek: 4 });
  const selected = plan.sessions.find((item) => item.id === "LOWER_A");
  const safety = strength.sessionLaunchDecision(plan, selected.id, {}, { state: "RED", pain: true });
  const terminal = strength.sessionLaunchDecision(plan, selected.id, { state: "COMPLETE", planId: plan.id, sessionId: selected.id }, { state: "GREEN" });
  assert.equal(safety.mode, "SAFETY_HOLD");
  assert.equal(terminal.mode, "COMPLETE_TODAY");
});

test("app integration includes account persistence and full lifecycle controls", () => {
  const root = path.join(__dirname, "..");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/016_strength_training_state.sql"), "utf8");
  assert.match(html, /strength-training\.js/);
  assert.match(app, /strength_training_state/);
  assert.match(app, /data-assignment-action="finish"/);
  assert.match(app, /data-assignment-action="stop"/);
  assert.match(app, /data-assignment-action="undo-set"/);
  assert.match(app, /data-assignment-action="restart"/);
  assert.match(app, /data-assignment-action="pause"/);
  assert.match(app, /data-strength-rest-until/);
  assert.match(app, /data-programming-action="train-session"/);
  assert.match(app, /function launchApprovedStrengthSession/);
  assert.match(app, /loadStrengthTrainingState/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});

console.log(`Strength training: ${passed} tests passed.`);
