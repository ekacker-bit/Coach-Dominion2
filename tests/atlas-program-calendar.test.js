const assert = require("node:assert/strict");
const orchestrator = require("../assets/js/weekly-orchestrator.js");

const weekStart = "2026-08-10";
const contract = {
  id: "contract-atlas-calendar",
  revision: 6,
  status: "APPROVED",
  primaryGoal: "BALANCED_FITNESS",
  trainingDaysPerWeek: 5,
  strengthDaysPerWeek: 3,
  runningDaysPerWeek: 3,
  coreDaysPerWeek: 3,
  sessionMinutes: 60,
  twoADays: true,
  schedule: [
    { activities: ["STRENGTH", "CORE"] },
    { activities: ["RUNNING"] },
    { activities: ["STRENGTH"] },
    { activities: ["RUNNING", "CORE"] },
    { activities: ["STRENGTH"] },
    { activities: ["RUNNING", "CORE"] },
    { activities: [], isTrainingDay: false, isRecoveryDay: true }
  ]
};

const input = {
  contract,
  strengthPlan: {
    id: "strength-6",
    revision: 2,
    status: "APPROVED",
    sessions: [
      { id: "lift-a", name: "Upper strength", estimatedMinutes: 60 },
      { id: "lift-b", name: "Lower strength", estimatedMinutes: 60 },
      { id: "lift-c", name: "Total strength", estimatedMinutes: 60 }
    ]
  },
  runningBlock: {
    id: "running-6",
    revision: 3,
    status: "APPROVED",
    weeks: [{
      weekStart,
      weekEnd: "2026-08-16",
      sessions: [
        { id: "run-hard", date: "2026-08-10", title: "Intervals", type: "INTERVAL", estimatedMinutes: 50 },
        { id: "run-easy", date: "2026-08-12", title: "Easy run", type: "EASY", estimatedMinutes: 70 },
        { id: "run-long", date: "2026-08-14", title: "Long run", type: "LONG", estimatedMinutes: 180 }
      ]
    }]
  },
  corePlan: {
    id: "core-6",
    revision: 4,
    status: "APPROVED",
    profile: { sessionMinutes: 20 },
    sessions: [
      { id: "core-a", date: "2026-08-10", name: "Anti-extension" },
      { id: "core-b", date: "2026-08-13", name: "Anti-rotation" },
      { id: "core-c", date: "2026-08-15", name: "Carry and brace" }
    ]
  },
  nutritionBaseline: {
    id: "fuel-6",
    status: "APPROVED",
    trainingTargets: { calories: 2600, protein: 180 },
    recoveryTargets: { calories: 2300, protein: 180 }
  }
};

const draft = orchestrator.buildUnifiedWeek(input, {
  today: weekStart,
  weekStart,
  programId: "atlas-program:contract-atlas-calendar:r6",
  generatedAt: "2026-08-09T12:00:00.000Z"
});

assert.equal(orchestrator.VERSION, "024D.1");
assert.equal(draft.generatedBy, "ATLAS_PROGRAM");
assert.equal(draft.programId, "atlas-program:contract-atlas-calendar:r6");
assert.equal(draft.programRevision, 6);
assert.deepEqual(draft.actual, draft.expected);
assert.equal(draft.placementDecisions.length, 9);
assert.equal(draft.approvalBlocked, false);
assert.ok(draft.recoveryDays >= 1);

draft.days.forEach((day) => {
  const hardRun = day.activities.some((item) => item.module === "RUNNING" && orchestrator.HARD_RUN_TYPES.includes(item.type));
  const strength = day.activities.some((item) => item.module === "STRENGTH");
  assert.equal(hardRun && strength, false, `${day.date} contains a prohibited hard-run and Strength collision`);
});

const longRunDay = draft.days.find((day) => day.activities.some((item) => item.type === "LONG"));
assert.ok(longRunDay);
assert.equal(longRunDay.longRunUncapped, true);
assert.equal(longRunDay.durationLimitMinutes, null);
assert.ok(draft.days.some((day) => day.corePaired && day.activities.some((item) => item.module === "CORE" && item.tertiary)));
assert.ok(draft.days.filter((day) => day.twoADay).every((day) => day.sessionCount === 2 && day.estimatedMinutes <= 240));

const movable = draft.days.flatMap((day) => day.activities).find((item) => item.module === "CORE");
const sourceDay = draft.days.find((day) => day.activities.some((item) => item.id === movable.id));
const targetDay = draft.days.find((day) => !day.isRecoveryDay && day.date !== sourceDay.date);
const edited = orchestrator.moveDraftActivity(draft, movable.id, targetDay.date);
assert.equal(edited.generatedBy, "ATLAS_PROGRAM");
assert.equal(edited.programId, draft.programId);
assert.ok(edited.days.find((day) => day.date === targetDay.date).activities.find((item) => item.id === movable.id)?.calendarEdited);

console.log("Build 024D Atlas Program Calendar tests passed.");
