const assert = require("node:assert/strict");
const trialApi = require("../assets/js/strength-progression-trial.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok ${passed} ${name}`);
}

function approvedPlan(revision = 2) {
  return {
    id: "strength-plan-1",
    status: "APPROVED",
    revision,
    sessions: [{
      id: "lower-a",
      name: "Lower A",
      exercises: [
        { exerciseCode: "BACK_SQUAT", exerciseName: "Back Squat", recommendedLoad: 190, unit: "lb", recommendedSets: 3, targetReps: 5, action: "PROGRESSED", rationale: "Earned." },
        { exerciseCode: "RDL", exerciseName: "Romanian Deadlift", recommendedLoad: 185, unit: "lb", recommendedSets: 3, targetReps: 8 }
      ]
    }]
  };
}

function approvedAdjustment(overrides = {}) {
  return {
    id: "adjustment-1",
    status: "APPROVED",
    planId: "strength-plan-1",
    appliedRevision: 2,
    approvedAt: "2026-08-01T12:00:00.000Z",
    sessionId: "lower-a",
    sessionName: "Lower A",
    activation: { scheduledDate: "2026-08-04" },
    appliedChanges: [
      { sessionId: "lower-a", exerciseCode: "BACK_SQUAT", exerciseName: "Back Squat", previousLoad: 185, previousUnit: "lb", previousAction: "REPEAT", previousRationale: "Previous.", appliedLoad: 190, appliedUnit: "lb", decision: "PROGRESS_LOAD" },
      { sessionId: "lower-a", exerciseCode: "RDL", exerciseName: "Romanian Deadlift", previousLoad: 195, previousUnit: "lb", appliedLoad: 185, appliedUnit: "lb", decision: "REDUCE_LOAD" }
    ],
    ...overrides
  };
}

function trial() {
  return trialApi.createTrial(approvedPlan(), approvedAdjustment(), { createdAt: "2026-08-01T12:00:00.000Z" });
}

function execution(overrides = {}) {
  return {
    id: "execution-1",
    planId: "strength-plan-1",
    sessionId: "lower-a",
    sessionName: "Lower A",
    date: "2026-08-04",
    state: "COMPLETE",
    completedAt: "2026-08-04T13:00:00.000Z",
    sessionSnapshot: {
      planRevision: 2,
      exercises: [{ exerciseCode: "BACK_SQUAT", recommendedSets: 3, targetReps: 5 }]
    },
    setLogs: {
      BACK_SQUAT: [
        { kind: "WORK", load: 190, reps: 5, rpe: 7.5 },
        { kind: "WORK", load: 190, reps: 5, rpe: 8 },
        { kind: "WORK", load: 190, reps: 5, rpe: 8 }
      ]
    },
    skipped: {},
    substitutions: {},
    ...overrides
  };
}

test("creates a trial only for approved load progressions", () => {
  const result = trial();
  assert.equal(result.status, "SCHEDULED");
  assert.equal(result.planRevision, 2);
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].exerciseCode, "BACK_SQUAT");
  assert.equal(result.changes[0].previousLoad, 185);
  assert.equal(result.changes[0].trialLoad, 190);
});

test("does not create a trial for a reduction-only activation", () => {
  const adjustment = approvedAdjustment({ appliedChanges: approvedAdjustment().appliedChanges.slice(1) });
  assert.equal(trialApi.createTrial(approvedPlan(), adjustment), null);
});

test("matches only the terminal next exposure on the exact plan revision and session", () => {
  const current = trial();
  assert.equal(trialApi.trialMatchesExecution(current, execution()), true);
  assert.equal(trialApi.trialMatchesExecution(current, execution({ state: "IN_PROGRESS" })), false);
  assert.equal(trialApi.trialMatchesExecution(current, execution({ sessionId: "upper-a" })), false);
  assert.equal(trialApi.trialMatchesExecution(current, execution({ sessionSnapshot: { planRevision: 3, exercises: [] } })), false);
});

test("a complete controlled exposure produces a retain verdict", () => {
  const result = trialApi.evaluateTrial(trial(), execution());
  assert.equal(result.status, "VERDICT_READY");
  assert.equal(result.verdict, "RETAIN");
  assert.equal(result.evidence.decisions[0].averageRpe, 7.8);
});

test("pain or RPE 9 produces a rollback recommendation", () => {
  const highRpe = execution({ setLogs: { BACK_SQUAT: [{ kind: "WORK", load: 190, reps: 5, rpe: 9 }, { kind: "WORK", load: 190, reps: 5, rpe: 9 }, { kind: "WORK", load: 190, reps: 5, rpe: 9 }] } });
  assert.equal(trialApi.evaluateTrial(trial(), highRpe).verdict, "ROLLBACK_RECOMMENDED");
  assert.equal(trialApi.evaluateTrial(trial(), execution({ painReported: true, state: "STOPPED" })).verdict, "ROLLBACK_RECOMMENDED");
});

test("incomplete modified or unscored work repeats the trial", () => {
  const partial = execution({ state: "PARTIAL", setLogs: { BACK_SQUAT: [{ kind: "WORK", load: 190, reps: 5, rpe: 8 }] } });
  assert.equal(trialApi.evaluateTrial(trial(), partial).verdict, "REPEAT_TRIAL");
  assert.equal(trialApi.evaluateTrial(trial(), execution({ substitutions: { BACK_SQUAT: { name: "Goblet Squat" } } })).verdict, "REPEAT_TRIAL");
  const missingRpe = execution({ setLogs: { BACK_SQUAT: [{ kind: "WORK", load: 190, reps: 5, rpe: null }, { kind: "WORK", load: 190, reps: 5, rpe: null }, { kind: "WORK", load: 190, reps: 5, rpe: null }] } });
  assert.equal(trialApi.evaluateTrial(trial(), missingRpe).verdict, "REPEAT_TRIAL");
});

test("evaluation is idempotent and does not mutate the plan", () => {
  const plan = approvedPlan();
  const before = JSON.stringify(plan);
  const evaluated = trialApi.evaluateTrial(trial(), execution());
  assert.deepEqual(trialApi.evaluateTrial(evaluated, execution()), evaluated);
  assert.equal(JSON.stringify(plan), before);
});

test("retaining resolves the trial without creating a plan revision", () => {
  const evaluated = trialApi.evaluateTrial(trial(), execution());
  const retained = trialApi.retainTrial(evaluated, "2026-08-04T13:05:00.000Z");
  assert.equal(retained.status, "RETAINED");
  assert.equal(retained.planRevision, 2);
  assert.equal(retained.resolution, "RETAIN");
});

test("repeating increments the attempt and preserves prior evidence", () => {
  const evaluated = trialApi.evaluateTrial(trial(), execution({ state: "PARTIAL", setLogs: { BACK_SQUAT: [{ kind: "WORK", load: 190, reps: 5, rpe: 8 }] } }));
  const repeated = trialApi.repeatTrial(evaluated, "2026-08-11", "2026-08-04T13:05:00.000Z");
  assert.equal(repeated.status, "REPEAT_SCHEDULED");
  assert.equal(repeated.attempt, 2);
  assert.equal(repeated.scheduledDate, "2026-08-11");
  assert.equal(repeated.evidenceHistory.length, 1);
  assert.equal(repeated.evidenceHistory[0].verdict, "REPEAT_TRIAL");
});

test("rollback restores only the trial targets in a newer immutable revision", () => {
  const evaluated = trialApi.evaluateTrial(trial(), execution({ painReported: true, state: "STOPPED" }));
  const result = trialApi.rollbackTrial(approvedPlan(), evaluated, "2026-08-04T13:05:00.000Z");
  assert.equal(result.plan.revision, 3);
  assert.equal(result.plan.sessions[0].exercises[0].recommendedLoad, 185);
  assert.equal(result.plan.sessions[0].exercises[1].recommendedLoad, 185);
  assert.equal(result.trial.status, "ROLLED_BACK");
  assert.throws(() => trialApi.rollbackTrial(approvedPlan(3), evaluated), /latest plan revision/i);
});

console.log(`Strength progression trial: ${passed} tests passed.`);
