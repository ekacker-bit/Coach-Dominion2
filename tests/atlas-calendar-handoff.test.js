const assert = require("node:assert/strict");
const activation = require("../assets/js/atlas-activation.js");
const orchestrator = require("../assets/js/weekly-orchestrator.js");

const weekStart = "2026-08-03";
const contract = {
  id: "contract-live-repair",
  revision: 10,
  status: "APPROVED",
  effectiveDate: weekStart,
  primaryGoal: "LOSE_FAT",
  trainingDaysPerWeek: 6,
  strengthDaysPerWeek: 4,
  runningDaysPerWeek: 5,
  coreDaysPerWeek: 3,
  sessionMinutes: 60,
  twoADays: true,
  schedule: [
    { activities: ["STRENGTH", "CORE"] },
    { activities: ["RUNNING"] },
    { activities: ["STRENGTH", "CORE"] },
    { activities: ["RUNNING"] },
    { activities: ["STRENGTH", "CORE"] },
    { activities: ["STRENGTH", "RUNNING"] },
    { activities: [], isTrainingDay: false, isRecoveryDay: true }
  ]
};

const candidates = {
  strength: {
    id: "strength-r10", revision: 2, status: "APPROVED",
    recruitContractId: contract.id, recruitContractRevision: contract.revision,
    sessions: Array.from({ length: 4 }, (_, index) => ({ id: `lift-${index + 1}`, title: `Lift ${index + 1}`, estimatedMinutes: 60 }))
  },
  running: {
    id: "running-r10", revision: 3, status: "APPROVED",
    recruitContractId: contract.id, recruitContractRevision: contract.revision,
    weeks: [{
      weekStart, weekEnd: "2026-08-09",
      sessions: [
        { id: "run-1", date: "2026-08-03", type: "INTERVAL", estimatedMinutes: 45 },
        { id: "run-2", date: "2026-08-04", type: "EASY", estimatedMinutes: 35 },
        { id: "run-3", date: "2026-08-05", type: "TEMPO", estimatedMinutes: 45 },
        { id: "run-4", date: "2026-08-06", type: "EASY", estimatedMinutes: 35 },
        { id: "run-5", date: "2026-08-08", type: "LONG", estimatedMinutes: 120 }
      ]
    }]
  },
  core: {
    id: "core-r10", revision: 1, status: "APPROVED",
    recruitContractId: contract.id, recruitContractRevision: contract.revision,
    profile: { sessionMinutes: 15 },
    weeks: [{
      weekStart, weekEnd: "2026-08-09",
      sessions: [
        { id: "core-1", date: "2026-08-03", estimatedMinutes: 15 },
        { id: "core-2", date: "2026-08-05", estimatedMinutes: 15 },
        { id: "core-3", date: "2026-08-07", estimatedMinutes: 15 }
      ]
    }]
  },
  nutrition: {
    id: "fuel-r10", status: "APPROVED",
    recruitContractId: contract.id, recruitContractRevision: contract.revision,
    trainingTargets: { calories: 2600, protein: 180 },
    recoveryTargets: { calories: 2200, protein: 180 }
  }
};

const staleWeek = orchestrator.buildUnifiedWeek({
  contract,
  strengthPlan: { ...candidates.strength, id: "strength-r9", recruitContractRevision: 9 },
  runningBlock: { ...candidates.running, id: "running-r9", recruitContractRevision: 9 },
  corePlan: null,
  nutritionBaseline: candidates.nutrition
}, { weekStart, today: "2026-08-07", programId: `atlas-program:${contract.id}:r10`, generatedAt: "2026-08-07T08:00:00.000Z" });

const freshWeek = orchestrator.buildUnifiedWeek({
  contract,
  strengthPlan: candidates.strength,
  runningBlock: candidates.running,
  corePlan: candidates.core,
  nutritionBaseline: candidates.nutrition
}, { weekStart, today: "2026-08-07", programId: `atlas-program:${contract.id}:r10`, generatedAt: "2026-08-07T09:00:00.000Z" });

assert.equal(staleWeek.programId, freshWeek.programId, "the stale and replacement drafts intentionally share a program identity");
assert.equal(activation.calendarLinkedToCandidates(staleWeek, candidates), false, "a same-program draft with old plan refs must not be reused");
assert.equal(activation.calendarLinkedToCandidates(freshWeek, candidates), true);
assert.deepEqual(freshWeek.actual, freshWeek.expected);
assert.equal(freshWeek.conflicts.some((item) => item.severity === "BLOCKING"), false);

const program = {
  id: `atlas-program:${contract.id}:r10`,
  status: "READY_FOR_APPROVAL",
  modules: ["strength", "running", "core", "nutrition"].map((id) => ({ id, included: true }))
};
const preflight = activation.preflightActivation({ contract, program, candidates, weekDraft: freshWeek });
assert.equal(preflight.status, "READY_TO_ACTIVATE");
assert.equal(preflight.blockers.length, 0);

console.log("Build 024G Atlas calendar handoff regression tests passed.");
