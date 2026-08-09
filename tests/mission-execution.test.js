const assert = require("node:assert/strict");
const mission = require("../assets/js/mission-execution.js");

const day = {
  date: "2026-08-10",
  twoADay: true,
  sessionSequence: [
    { id: "lift-a", module: "STRENGTH", type: "STRENGTH", title: "Upper strength", estimatedMinutes: 70, trainingWindowId: "am", sessionOrder: 1, sessionLabel: "AM" },
    { id: "core-a", module: "CORE", type: "CORE", title: "Trunk control", estimatedMinutes: 15, trainingWindowId: "am", sessionOrder: 1, sessionLabel: "AM", tertiary: true },
    { id: "run-a", module: "RUNNING", type: "INTERVAL", title: "Track intervals", estimatedMinutes: 55, trainingWindowId: "pm", sessionOrder: 2, sessionLabel: "PM" }
  ]
};

{
  const cockpit = mission.buildCockpit({
    date: day.date,
    day,
    readinessComplete: false,
    splitGate: { allowed: false, status: "AWAITING_SESSION_1", blockers: ["Finish AM first."] },
    records: { STRENGTH: { state: "READY" }, CORE: { state: "READY" }, RUNNING: { state: "READY" } }
  });
  assert.equal(cockpit.windows.length, 2);
  assert.equal(cockpit.windows[0].sessions.length, 2);
  assert.equal(cockpit.windows[1].sessions[0].locked, true);
  assert.equal(cockpit.primary.code, "ROLL_CALL");
  assert.equal(cockpit.total, 3);
}

{
  const cockpit = mission.buildCockpit({
    day,
    readinessComplete: true,
    splitGate: { allowed: false, status: "AWAITING_SESSION_1", blockers: ["Finish AM first."] },
    records: { STRENGTH: { state: "COMPLETE" }, CORE: { state: "COMPLETE" }, RUNNING: { state: "READY" } }
  });
  assert.equal(cockpit.completed, 2);
  assert.equal(cockpit.percent, 67);
  assert.equal(cockpit.current.module, "RUNNING");
  assert.equal(cockpit.current.locked, true);
  assert.equal(cockpit.primary.code, "CHECKPOINT");
}

{
  const cockpit = mission.buildCockpit({
    day,
    readinessComplete: true,
    splitGate: { allowed: true, status: "CLEARED", blockers: [] },
    records: { STRENGTH: { state: "COMPLETE" }, CORE: { state: "COMPLETE" }, RUNNING: { state: "PAUSED" } }
  });
  assert.equal(cockpit.state, "IN_PROGRESS");
  assert.equal(cockpit.primary.code, "RESUME");
  assert.equal(cockpit.primary.module, "RUNNING");
}

{
  const cockpit = mission.buildCockpit({
    day,
    readinessComplete: true,
    splitGate: { allowed: true, status: "CLEARED", blockers: [] },
    records: { STRENGTH: { state: "COMPLETE" }, CORE: { state: "COMPLETE" }, RUNNING: { state: "REVIEW" } }
  });
  assert.equal(cockpit.primary.code, "FINALIZE");
}

{
  const cockpit = mission.buildCockpit({
    day,
    readinessComplete: true,
    splitGate: { allowed: true, status: "COMPLETE", blockers: [] },
    records: { STRENGTH: { state: "COMPLETE" }, CORE: { state: "COMPLETE" }, RUNNING: { state: "PARTIAL" } }
  });
  assert.equal(cockpit.complete, true);
  assert.equal(cockpit.primary.code, "COMPLETE");
}

{
  const cockpit = mission.buildCockpit({
    day,
    readinessComplete: true,
    splitGate: { allowed: false, status: "HELD", blockers: ["Pain overrides PM training."] },
    records: { STRENGTH: { state: "PAIN_HOLD", painReported: true }, CORE: { state: "READY" }, RUNNING: { state: "READY" } }
  });
  assert.equal(cockpit.state, "SAFETY_HOLD");
  assert.equal(cockpit.complete, false);
  assert.equal(cockpit.primary.code, "SAFETY");
  assert.equal(cockpit.primary.module, "STRENGTH");
}

const intervalPrescription = {
  date: "2026-08-10",
  session: { id: "run-a", type: "INTERVAL", title: "Track intervals", distance: 5, unit: "mi", intervalCount: 4 },
  steps: [
    { code: "WARM_UP", title: "Warm-up", instruction: "Easy running." },
    { code: "WORK", title: "Main set", instruction: "Controlled repetitions." },
    { code: "COOL_DOWN", title: "Cooldown", instruction: "Easy running." }
  ]
};

{
  const segments = mission.runningSegments(intervalPrescription);
  assert.equal(segments.length, 9);
  assert.equal(segments.filter((item) => item.kind === "WORK").length, 4);
  assert.equal(segments.filter((item) => item.kind === "RECOVER").length, 3);
  assert.equal(segments.at(-1).kind, "COOL_DOWN");
}

{
  let execution = mission.startRunningExecution(intervalPrescription, null, "2026-08-10T18:00:00.000Z");
  assert.equal(execution.state, "IN_PROGRESS");
  assert.equal(mission.activeRunningSegment(execution).id, "warm-up");
  execution = mission.completeRunningSegment(execution, null, "2026-08-10T18:10:00.000Z");
  assert.equal(mission.activeRunningSegment(execution).id, "work-1");
  execution = mission.pauseRunningExecution(execution, "2026-08-10T18:20:00.000Z");
  assert.equal(execution.state, "PAUSED");
  assert.equal(mission.runningDurationSeconds(execution, "2026-08-10T19:20:00.000Z"), 1200);
  execution = mission.resumeRunningExecution(execution, "2026-08-10T19:20:00.000Z");
  assert.equal(execution.state, "IN_PROGRESS");
  execution = mission.completeAllRunningSegments(execution, "2026-08-10T19:40:00.000Z");
  assert.equal(execution.state, "REVIEW");
  execution = mission.finishRunningExecution(execution, {}, "2026-08-10T19:41:00.000Z");
  assert.equal(execution.state, "COMPLETE");
  assert.equal(execution.durationSeconds, 2400);
}

{
  let execution = mission.startRunningExecution(intervalPrescription, null, "2026-08-10T18:00:00.000Z");
  execution = mission.completeRunningSegment(execution, null, "2026-08-10T18:10:00.000Z");
  execution = mission.prepareRunningReview(execution, "2026-08-10T18:11:00.000Z");
  execution = mission.finishRunningExecution(execution, {}, "2026-08-10T18:12:00.000Z");
  assert.equal(execution.state, "PARTIAL");
}

{
  let execution = mission.startRunningExecution(intervalPrescription, null, "2026-08-10T18:00:00.000Z");
  execution = mission.reportRunningPain(execution, "2026-08-10T18:05:00.000Z");
  assert.equal(execution.state, "PAIN_HOLD");
  assert.equal(execution.painReported, true);
}

{
  const receipt = mission.buildEvidenceReceipt({
    date: "2026-08-10",
    module: "RUNNING",
    windowLabel: "PM",
    execution: { id: "run-a", state: "COMPLETE", completedAt: "2026-08-10T19:41:00.000Z" },
    summary: { distance: 5, distanceUnit: "mi" }
  });
  assert.equal(receipt.id, "mission:2026-08-10:running:run-a");
  assert.equal(receipt.source, "COACH_DOMINION_EXECUTION");
  assert.equal(receipt.windowLabel, "PM");
}

console.log("Build 025B Mission Execution tests passed.");
