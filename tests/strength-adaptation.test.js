const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const strength = require("../assets/js/strength-training.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

function planWithBenchEvidence() {
  const draft = strength.buildStrengthProgram({
    goal: "GENERAL_STRENGTH",
    daysPerWeek: 3,
    equipment: "FULL_GYM",
    sessionMinutes: 60,
    experience: "INTERMEDIATE"
  }, [
    { domain: "strength", activityName: "Bench Press", performanceDate: "2026-07-28", metrics: { weight: 185, repetitions: 5, weight_unit: "lb" } }
  ], {
    startDate: "2026-07-30",
    generatedAt: "2026-07-30T12:00:00.000Z"
  });
  return strength.approvePlan(draft, "2026-07-30T12:05:00.000Z");
}

function prescriptionFor(plan, date = "2026-07-30", sessionIndex = 0) {
  const session = plan.sessions[sessionIndex];
  return {
    version: strength.VERSION,
    planId: plan.id,
    sessionId: session.id,
    sessionName: session.name,
    date,
    status: "READY",
    state: "READY",
    profile: plan.profile,
    adjustment: { code: "APPROVED_VOLUME", state: "READY", detail: "Approved." },
    exercises: session.exercises.map((item) => ({ ...item, plannedSets: item.recommendedSets }))
  };
}

function completedExecution(plan, date, rpe = 7, loads = {}) {
  const rx = prescriptionFor(plan, date);
  let execution = strength.startWorkout(strength.executionForPrescription(rx), rx, `${date}T13:00:00.000Z`);
  rx.exercises.forEach((exercise) => {
    const load = Object.prototype.hasOwnProperty.call(loads, exercise.exerciseCode)
      ? loads[exercise.exerciseCode]
      : exercise.recommendedLoad;
    for (let index = 0; index < exercise.recommendedSets; index += 1) {
      execution = strength.recordSet(execution, exercise.exerciseCode, {
        reps: exercise.targetReps,
        load,
        rpe
      }, `${date}T13:${String(5 + index).padStart(2, "0")}:00.000Z`);
    }
  });
  return strength.finishWorkout(execution, {}, `${date}T14:00:00.000Z`);
}

test("one controlled exposure establishes a baseline without calling it progression", () => {
  const plan = planWithBenchEvidence();
  const execution = completedExecution(plan, "2026-07-30", 7, { BACK_SQUAT: 135 });
  const proposal = strength.buildAdjustmentProposal(plan, [execution], { createdAt: "2026-07-30T14:01:00.000Z" });
  const squat = proposal.decisions.find((item) => item.exerciseCode === "BACK_SQUAT");
  assert.equal(squat.action, "ESTABLISH_BASELINE");
  assert.equal(squat.proposedLoad, 135);
  assert.equal(squat.qualityExposures, 1);
});

test("two consecutive controlled exposures unlock only the smallest load step", () => {
  const plan = planWithBenchEvidence();
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(plan, "2026-07-30", 7.5, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  const bench = proposal.decisions.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(bench.action, "PROGRESS_LOAD");
  assert.equal(bench.proposedLoad, 190);
  assert.equal(bench.qualityExposures, 2);
});

test("a newly increased load must earn its own second exposure", () => {
  const original = planWithBenchEvidence();
  const first = completedExecution(original, "2026-07-16", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(original, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const firstProposal = strength.buildAdjustmentProposal(original, [second, first]);
  const revised = strength.applyAdjustmentProposal(original, firstProposal, "2026-07-23T14:05:00.000Z").plan;
  const atNewLoad = completedExecution(revised, "2026-07-30", 7, { BENCH_PRESS: 190 });
  const nextProposal = strength.buildAdjustmentProposal(revised, [atNewLoad, second, first]);
  const bench = nextProposal.decisions.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(bench.action, "REPEAT");
  assert.equal(bench.qualityExposures, 1);
  assert.equal(bench.proposedLoad, 190);
});

test("high exertion proposes a conservative load reduction", () => {
  const plan = planWithBenchEvidence();
  const execution = completedExecution(plan, "2026-07-30", 9, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [execution]);
  const bench = proposal.decisions.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(bench.action, "REDUCE_LOAD");
  assert.equal(bench.proposedLoad, 175);
});

test("missing RPE never authorizes progression", () => {
  const plan = planWithBenchEvidence();
  const execution = completedExecution(plan, "2026-07-30", null, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [execution]);
  const bench = proposal.decisions.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(bench.action, "REPEAT");
  assert.match(bench.reason, /RPE was not recorded/);
});

test("partial sessions preserve completed evidence but keep the plan unchanged", () => {
  const plan = planWithBenchEvidence();
  const rx = prescriptionFor(plan);
  let execution = strength.startWorkout(strength.executionForPrescription(rx), rx);
  execution = strength.recordSet(execution, "BENCH_PRESS", { reps: 5, load: 185, rpe: 7 });
  execution = strength.finishWorkout(execution);
  const proposal = strength.buildAdjustmentProposal(plan, [execution]);
  assert.equal(proposal.sourceState, "PARTIAL");
  assert.ok(proposal.decisions.every((item) => item.action === "REPEAT"));
  assert.equal(proposal.summary.progressedCount, 0);
});

test("pain creates a safety hold that cannot be approved", () => {
  const plan = planWithBenchEvidence();
  const rx = prescriptionFor(plan);
  let execution = strength.startWorkout(strength.executionForPrescription(rx), rx);
  execution = strength.recordSet(execution, "BENCH_PRESS", { reps: 5, load: 185, rpe: 8 });
  execution = strength.reportPain(execution, "2026-07-30T13:10:00.000Z");
  const proposal = strength.buildAdjustmentProposal(plan, [execution]);
  assert.equal(proposal.safetyHold, true);
  assert.ok(proposal.decisions.every((item) => item.action === "SAFETY_HOLD"));
  assert.throws(() => strength.applyAdjustmentProposal(plan, proposal), /pain hold/i);
});

test("approval revises the same plan without silently adding volume", () => {
  const plan = planWithBenchEvidence();
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  const result = strength.applyAdjustmentProposal(plan, proposal, "2026-07-30T14:05:00.000Z");
  const oldBench = plan.sessions[0].exercises.find((item) => item.exerciseCode === "BENCH_PRESS");
  const newBench = result.plan.sessions[0].exercises.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(result.plan.id, plan.id);
  assert.equal(result.plan.revision, 2);
  assert.equal(newBench.recommendedLoad, 190);
  assert.equal(newBench.recommendedSets, oldBench.recommendedSets);
  assert.equal(result.adjustment.status, "APPROVED");
});

test("recruit can activate one earned exercise while holding another", () => {
  const plan = planWithBenchEvidence();
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185, BACK_SQUAT: 135 });
  const second = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185, BACK_SQUAT: 135 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  const result = strength.applyAdjustmentProposal(plan, proposal, "2026-07-30T14:05:00.000Z", {
    selectedExerciseCodes: ["BENCH_PRESS"]
  });
  const oldSession = plan.sessions.find((item) => item.id === proposal.sessionId);
  const newSession = result.plan.sessions.find((item) => item.id === proposal.sessionId);
  assert.equal(newSession.exercises.find((item) => item.exerciseCode === "BENCH_PRESS").recommendedLoad, 190);
  assert.equal(
    newSession.exercises.find((item) => item.exerciseCode === "BACK_SQUAT").recommendedLoad,
    oldSession.exercises.find((item) => item.exerciseCode === "BACK_SQUAT").recommendedLoad
  );
  assert.deepEqual(result.adjustment.appliedDecisionCodes, ["BENCH_PRESS"]);
  assert.ok(result.adjustment.heldDecisionCodes.includes("BACK_SQUAT"));
  assert.equal(result.adjustment.summary.appliedCount, 1);
});

test("activated targets govern the next prescription without mutating the completed snapshot", () => {
  const plan = planWithBenchEvidence();
  const completedSnapshot = strength.buildSessionPrescription(plan, plan.sessions[0].id, { today: "2026-07-30" });
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  const result = strength.applyAdjustmentProposal(plan, proposal, "2026-07-30T14:05:00.000Z", { selectedExerciseCodes: ["BENCH_PRESS"] });
  const nextPrescription = strength.buildSessionPrescription(result.plan, plan.sessions[0].id, { today: "2026-08-06" });
  assert.equal(completedSnapshot.exercises.find((item) => item.exerciseCode === "BENCH_PRESS").recommendedLoad, 185);
  assert.equal(nextPrescription.exercises.find((item) => item.exerciseCode === "BENCH_PRESS").recommendedLoad, 190);
  assert.equal(nextPrescription.planRevision, 2);
  assert.equal(nextPrescription.lastAdjustmentId, proposal.id);
});

test("latest activation can be undone only by creating a newer audit revision", () => {
  const plan = planWithBenchEvidence();
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  const approved = strength.applyAdjustmentProposal(plan, proposal, "2026-07-30T14:05:00.000Z", { selectedExerciseCodes: ["BENCH_PRESS"] });
  const rolledBack = strength.rollbackAdjustment(approved.plan, approved.adjustment, "2026-07-30T14:10:00.000Z");
  const restored = rolledBack.plan.sessions[0].exercises.find((item) => item.exerciseCode === "BENCH_PRESS");
  assert.equal(restored.recommendedLoad, 185);
  assert.equal(rolledBack.plan.revision, 3);
  assert.equal(rolledBack.plan.rolledBackAdjustmentId, proposal.id);
  assert.equal(rolledBack.adjustment.status, "ROLLED_BACK");
  assert.equal(rolledBack.adjustment.rollbackRevision, 3);
  assert.throws(
    () => strength.rollbackAdjustment({ ...approved.plan, revision: 3 }, approved.adjustment),
    /latest plan revision/i
  );
});

test("a recommendation cannot overwrite a newer plan revision", () => {
  const plan = planWithBenchEvidence();
  const first = completedExecution(plan, "2026-07-23", 7, { BENCH_PRESS: 185 });
  const second = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [second, first]);
  assert.throws(
    () => strength.applyAdjustmentProposal({ ...plan, revision: 2 }, proposal, "2026-07-30T14:05:00.000Z"),
    /older plan revision/i
  );
});

test("holding a recommendation leaves an auditable terminal state", () => {
  const plan = planWithBenchEvidence();
  const execution = completedExecution(plan, "2026-07-30", 7, { BENCH_PRESS: 185 });
  const proposal = strength.buildAdjustmentProposal(plan, [execution]);
  const held = strength.holdAdjustment(proposal, "2026-07-30T14:05:00.000Z");
  assert.equal(held.status, "HELD");
  assert.equal(held.heldAt, "2026-07-30T14:05:00.000Z");
});

test("017B UI and account persistence expose explicit adjustment approval", () => {
  const root = path.join(__dirname, "..");
  const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/017_strength_adaptation.sql"), "utf8");
  assert.match(html, /STRENGTH SESSION/);
  assert.match(app, /data-programming-action="approve-adjustment"/);
  assert.match(app, /data-programming-action="hold-adjustment"/);
  assert.match(app, /persistStrengthTrainingState\("ADJUSTMENT"/);
  assert.match(migration, /'ADJUSTMENT'/);
  assert.match(migration, /strength_training_state_state_type_check/);
});

console.log(`Strength adaptation: ${passed} tests passed.`);
