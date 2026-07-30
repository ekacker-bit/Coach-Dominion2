const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const review = require("../assets/js/strength-week-review.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

const plan = {
  id: "plan-1",
  status: "APPROVED",
  revision: 2,
  sessions: [{
    id: "session-a",
    name: "Foundation A",
    exercises: [
      { exerciseCode: "BACK_SQUAT", exerciseName: "Back Squat", recommendedSets: 3, pattern: "SQUAT" },
      { exerciseCode: "BENCH_PRESS", exerciseName: "Bench Press", recommendedSets: 3, pattern: "HORIZONTAL_PUSH" }
    ]
  }, {
    id: "session-b",
    name: "Foundation B",
    exercises: [
      { exerciseCode: "ROMANIAN_DEADLIFT", exerciseName: "Romanian Deadlift", recommendedSets: 3, pattern: "HINGE" },
      { exerciseCode: "ONE_ARM_ROW", exerciseName: "One-Arm Row", recommendedSets: 3, pattern: "HORIZONTAL_PULL" }
    ]
  }]
};

const schedule = {
  id: "strength-week:plan-1:2026-08-03",
  status: "APPROVED",
  planId: plan.id,
  planRevision: plan.revision,
  revision: 1,
  weekStart: "2026-08-03",
  weekEnd: "2026-08-09",
  preferredDays: [0, 3],
  assignments: [
    { id: "a1", planId: plan.id, sessionId: "session-a", sessionName: "Foundation A", date: "2026-08-03" },
    { id: "a2", planId: plan.id, sessionId: "session-b", sessionName: "Foundation B", date: "2026-08-06" }
  ]
};

function nativeExecution(overrides = {}) {
  return {
    id: "native-1",
    planId: plan.id,
    sessionId: "session-a",
    sessionName: "Foundation A",
    date: "2026-08-03",
    state: "COMPLETE",
    setLogs: {
      BACK_SQUAT: [{ reps: 8, load: 135, rpe: 7 }, { reps: 8, load: 135, rpe: 7.5 }, { reps: 8, load: 135, rpe: 8 }],
      BENCH_PRESS: [{ reps: 8, load: 95, rpe: 7 }, { reps: 8, load: 95, rpe: 7.5 }, { reps: 8, load: 95, rpe: 8 }]
    },
    summary: { setsCompleted: 6, setsPlanned: 6, volume: 5520, substitutions: 0, skippedExercises: 0 },
    completedAt: "2026-08-03T19:00:00.000Z",
    ...overrides
  };
}

function fitbodSession(id, date, exercises) {
  return {
    id,
    date,
    workoutName: "Fitbod Strength",
    exercises: exercises.map((item) => ({ code: review.normalizeExerciseName(item.name), ...item })),
    records: exercises.map((item, index) => ({ providerRecordId: `${id}-record-${index + 1}` }))
  };
}

test("native workout evidence is authoritative and imported overlap is not double counted", () => {
  const fitbod = fitbodSession("fit-1", "2026-08-03", [
    { name: "Barbell Back Squat", sets: 3, volume: 3240 },
    { name: "Barbell Bench Press", sets: 3, volume: 2280 }
  ]);
  const result = review.buildWeekReview(schedule, plan, [nativeExecution()], [fitbod], {
    today: "2026-08-04",
    generatedAt: "2026-08-04T12:00:00.000Z"
  });
  assert.equal(result.assignments[0].state, "COMPLETE");
  assert.equal(result.assignments[0].creditSource, "NATIVE");
  assert.equal(result.assignments[0].evidenceStatus, "NATIVE_WITH_IMPORT_CORROBORATION");
  assert.equal(result.summary.setsCompleted, 6);
  assert.equal(result.summary.nativeSessionCount, 1);
  assert.equal(result.summary.importedSessionCount, 0);
});

test("a complete exact-date Fitbod match can satisfy an assignment without mutating history", () => {
  const fitbod = fitbodSession("fit-2", "2026-08-06", [
    { name: "Romanian Deadlift", sets: 3, volume: 3600 },
    { name: "Dumbbell One Arm Row", sets: 3, volume: 1440 }
  ]);
  const item = review.reconcileAssignment(schedule.assignments[1], plan, [], [fitbod], "2026-08-07");
  assert.equal(item.state, "COMPLETE");
  assert.equal(item.creditSource, "FITBOD");
  assert.equal(item.primaryEvidence.confidence, "HIGH");
  assert.deepEqual(item.primaryEvidence.sourceIds, ["fit-2-record-1", "fit-2-record-2"]);
});

test("partial Fitbod matches stay partial and unmatched work receives no completion credit", () => {
  const partial = fitbodSession("fit-3", "2026-08-06", [{ name: "Romanian Deadlift", sets: 2, volume: 2200 }]);
  const unmatched = fitbodSession("fit-4", "2026-08-03", [{ name: "Biceps Curl", sets: 4, volume: 1200 }]);
  assert.equal(review.reconcileAssignment(schedule.assignments[1], plan, [], [partial], "2026-08-07").state, "PARTIAL");
  const missed = review.reconcileAssignment(schedule.assignments[0], plan, [], [unmatched], "2026-08-04");
  assert.equal(missed.state, "MISSED");
  assert.equal(missed.creditSource, "NONE");
  assert.equal(missed.evidenceStatus, "UNMATCHED_IMPORT");
});

test("equally strong imported candidates remain ambiguous and earn no credit", () => {
  const first = fitbodSession("fit-a", "2026-08-03", [{ name: "Back Squat", sets: 3, volume: 3000 }]);
  const second = fitbodSession("fit-b", "2026-08-03", [{ name: "Back Squat", sets: 3, volume: 3000 }]);
  const item = review.reconcileAssignment(schedule.assignments[0], plan, [], [first, second], "2026-08-04");
  assert.equal(item.state, "MISSED");
  assert.equal(item.creditSource, "NONE");
  assert.equal(item.evidenceStatus, "AMBIGUOUS_IMPORT");
});

test("an active unresolved week cannot be finalized", () => {
  const result = review.buildWeekReview(schedule, plan, [nativeExecution()], [], { today: "2026-08-04" });
  assert.equal(result.status, "IN_PROGRESS");
  assert.equal(result.finalizable, false);
  assert.throws(() => review.finalizeWeekReview(result), /cannot be finalized/i);
});

test("an ended week finalizes with an immutable recommendation and draft-only rollover intent", () => {
  const result = review.buildWeekReview(schedule, plan, [nativeExecution()], [], {
    today: "2026-08-10",
    generatedAt: "2026-08-10T08:00:00.000Z"
  });
  assert.equal(result.status, "READY");
  assert.equal(result.summary.completed, 1);
  assert.equal(result.summary.missed, 1);
  assert.equal(result.summary.adherencePercent, 50);
  assert.equal(result.recommendation.code, "REPEAT_WEEK");
  const finalized = review.finalizeWeekReview(result, "2026-08-10T08:05:00.000Z");
  assert.equal(finalized.status, "FINALIZED");
  assert.equal(finalized.immutableEvidence, true);
  const rollover = review.rolloverIntent(finalized);
  assert.equal(rollover.weekStart, "2026-08-10");
  assert.equal(rollover.sourceScheduleId, schedule.id);
});

test("pain creates a safety hold and blocks any implied progression", () => {
  const stopped = nativeExecution({
    state: "STOPPED",
    painReported: true,
    summary: { setsCompleted: 1, setsPlanned: 6, volume: 1080, substitutions: 0, skippedExercises: 1 }
  });
  const result = review.buildWeekReview(schedule, plan, [stopped], [], { today: "2026-08-10" });
  assert.equal(result.recommendation.code, "SAFETY_HOLD");
  assert.equal(result.summary.painCount, 1);
});

test("017D integration loads, persists, styles, tests, and migrates weekly review state", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/019_strength_week_review.sql"), "utf8");
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(html, /BUILD 017D/);
  assert.match(html, /strength-week-review\.js/);
  assert.match(app, /persistStrengthTrainingState\("WEEK_REVIEW", "current"/);
  assert.match(app, /data-strength-review-action="finalize"/);
  assert.match(app, /data-strength-review-action="rollover"/);
  assert.match(styles, /\.strength-week-review/);
  assert.match(migration, /'WEEK_REVIEW'/);
  assert.match(pkg, /strength-week-review\.test\.js/);
});

console.log(`Strength week review: ${passed} tests passed.`);
