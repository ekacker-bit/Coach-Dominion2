const assert = require("node:assert/strict");
const assignment = require("../assets/js/daily-assignment.js");

const programming = {
  policy: { code: "PROGRESS" },
  exercises: [
    { exerciseCode: "bench-press", exerciseName: "Bench Press", recommendedSets: 3, targetReps: 5, recommendedLoad: 185, unit: "lb", evidenceCount: 3, action: "HOLD", rationale: "Supported exposure." },
    { exerciseCode: "row", exerciseName: "Row", recommendedSets: 3, targetReps: 8, recommendedLoad: 70, unit: "lb", evidenceCount: 2, action: "PROGRESS", rationale: "Two successful exposures." }
  ]
};

const ready = assignment.buildDailyAssignment({ date: "2026-07-28", readiness: { state: "GREEN", pain: false }, programming, generatedAt: "2026-07-28T12:00:00.000Z" });
assert.equal(ready.version, "009B.1");
assert.equal(ready.state, "READY");
assert.equal(ready.exercises[0].sets, 3);
assert.equal(ready.exercises[0].restSeconds, 180);
assert.equal(ready.exercises[0].tempo, "2-1-X-1");
assert.ok(ready.estimatedMinutes >= 20);
assert.equal(ready.confidence, "MODERATE");

const pain = assignment.buildDailyAssignment({ date: "2026-07-28", readiness: { state: "RED", pain: true }, programming });
assert.equal(pain.state, "RECOVERY ONLY");
assert.equal(pain.exercises.length, 0);
assert.equal(pain.readinessDelta.code, "TRAINING_REMOVED");

const fitbod = assignment.buildDailyAssignment({
  date: "2026-07-28",
  readiness: { state: "GREEN", pain: false },
  programming,
  fitbodSessions: [{ id: "fitbod-1", date: "2026-07-28", exercises: [{ name: "Bench Press", setCount: 3 }, { name: "Row", setCount: 3 }] }]
});
assert.equal(fitbod.fitbod.state, "COMPLETE");
assert.equal(fitbod.state, "COMPLETE");

const unmatched = assignment.reconcileFitbod(ready, [{ id: "fitbod-2", date: "2026-07-28", exercises: [{ name: "Squat", setCount: 3 }] }]);
assert.equal(unmatched.state, "UNMATCHED");

console.log("daily assignment tests passed");
