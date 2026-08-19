const test = require("node:test");
const assert = require("node:assert/strict");
const orchestrator = require("../assets/js/weekly-orchestrator.js");
const canonical = require("../assets/js/canonical-daily-command.js");
const strength = require("../assets/js/strength-training.js");
const mission = require("../assets/js/mission-execution.js");

function committedWeek() {
  const activity = {
    id: "week-r12:2026-08-19:strength:lower-a",
    assignmentId: "week-r12:2026-08-19:strength:lower-a",
    module: "STRENGTH",
    sourceId: "lower-a",
    sessionId: "lower-a",
    planId: "strength-plan-r7",
    planRevision: 7,
    title: "Lower A",
    type: "STRENGTH",
    sessionOrder: 1,
    sessionWindow: "AM",
    sessionLabel: "AM SESSION",
    trainingWindowId: "window-am",
    estimatedMinutes: 70
  };
  return {
    id: "week-r12",
    revision: 12,
    status: "APPROVED",
    weekStart: "2026-08-17",
    weekEnd: "2026-08-23",
    sourceRefs: { strengthPlanId: "strength-plan-r7", strengthPlanRevision: 7 },
    days: [{
      date: "2026-08-19",
      dayIndex: 2,
      activities: [activity],
      sessionSequence: [activity],
      twoADay: false,
      nutrition: { calories: 2450, protein: 180 }
    }]
  };
}

test("Calendar activity identity survives the strength schedule and Today command", () => {
  const week = committedWeek();
  const schedule = orchestrator.strengthScheduleFromWeek(week);
  assert.equal(schedule.assignments[0].assignmentId, "week-r12:2026-08-19:strength:lower-a");
  assert.equal(schedule.assignments[0].id, "week-r12:2026-08-19:strength:lower-a");
  assert.equal(schedule.assignments[0].sessionId, "lower-a");
  assert.equal(schedule.assignments[0].weekRevision, 12);

  const command = canonical.build({
    date: "2026-08-19",
    contract: { id: "contract-r4" },
    committedWeek: week,
    committedDay: week.days[0]
  });
  assert.equal(command.schedule.sessions[0].id, "week-r12:2026-08-19:strength:lower-a");
  assert.equal(command.schedule.sessions[0].assignmentId, "week-r12:2026-08-19:strength:lower-a");
  assert.equal(command.schedule.sessions[0].sessionId, "lower-a");
  assert.equal(command.schedule.sessions[0].planId, "strength-plan-r7");
});

test("one Calendar assignment follows the workout, set log, and completion receipt", () => {
  const prescription = {
    date: "2026-08-19",
    planId: "strength-plan-r7",
    planRevision: 7,
    sessionId: "lower-a",
    sessionName: "Lower A",
    assignmentId: "week-r12:2026-08-19:strength:lower-a",
    calendarWeekId: "week-r12",
    calendarRevision: 12,
    trainingWindowId: "window-am",
    sessionWindow: "AM",
    sessionLabel: "AM SESSION",
    exercises: [{
      exerciseCode: "BACK_SQUAT",
      exerciseName: "Back Squat",
      recommendedSets: 1,
      targetReps: 5,
      recommendedLoad: 225,
      unit: "lb",
      restSeconds: 120
    }]
  };
  let execution = strength.executionForPrescription(prescription);
  assert.equal(execution.assignmentId, prescription.assignmentId);
  assert.equal(execution.calendarRevision, 12);
  execution = strength.startWorkout(execution, prescription, "2026-08-19T12:00:00.000Z");
  execution = strength.recordSet(execution, "BACK_SQUAT", { reps: 5, load: 225, rpe: 8 }, "2026-08-19T12:05:00.000Z");
  assert.equal(execution.setLogs.BACK_SQUAT[0].assignmentId, prescription.assignmentId);
  assert.equal(execution.setLogs.BACK_SQUAT[0].sessionId, "lower-a");

  const receipt = mission.buildEvidenceReceipt({
    date: "2026-08-19",
    module: "strength",
    execution: { ...execution, state: "COMPLETE", completedAt: "2026-08-19T13:00:00.000Z" }
  });
  assert.equal(receipt.assignmentId, prescription.assignmentId);
  assert.equal(receipt.planId, "strength-plan-r7");
  assert.equal(receipt.state, "COMPLETE");
});
