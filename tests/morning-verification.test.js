const assert = require("node:assert/strict");
const verification = require("../assets/js/morning-verification.js");

const date = "2026-08-10";
const greenRollCall = { date, energy: 8, soreness: 3, pain: false };
const greenReadiness = { state: "GREEN" };
const completeRecovery = {
  id: "mission-recovery:yesterday",
  date: "2026-08-09",
  status: "COMPLETE",
  tasks: [{ id: "hydrate", status: "COMPLETE" }],
  updatedAt: "2026-08-09T22:00:00.000Z"
};
const controlledDebrief = {
  id: "mission-debrief:yesterday",
  date: "2026-08-09",
  effort: 7,
  executionQuality: "CONTROLLED",
  recoveryConfidence: 8,
  painReported: false,
  updatedAt: "2026-08-09T21:00:00.000Z"
};

const proceed = verification.buildReceipt({
  date,
  rollCall: greenRollCall,
  readiness: greenReadiness,
  debriefHistory: [controlledDebrief],
  recoveryHistory: [completeRecovery],
  now: "2026-08-10T06:00:00.000Z"
});
assert.equal(proceed.version, "025E.1");
assert.equal(proceed.code, "PROCEED");
assert.equal(proceed.dailyOverride.trainingAllowed, true);
assert.equal(proceed.dailyOverride.volumeMultiplier, 1);
assert.equal(proceed.planMutationAllowed, false);
assert.ok(proceed.signals.length <= 3);

const reduced = verification.buildReceipt({
  date,
  rollCall: { ...greenRollCall, energy: 5 },
  readiness: { state: "YELLOW" },
  debriefHistory: [{ ...controlledDebrief, effort: 9, recoveryConfidence: 4 }],
  recoveryHistory: [{ ...completeRecovery, status: "ACTIVE", tasks: [{ id: "hydrate", status: "PENDING" }] }],
  now: "2026-08-10T06:01:00.000Z"
});
assert.equal(reduced.code, "REDUCE_TODAY");
assert.equal(reduced.dailyOverride.readinessState, "YELLOW");
assert.equal(reduced.dailyOverride.intensityCap, "EASY");
assert.equal(verification.applyToReadiness(reduced, greenRollCall).energy, 5);
assert.equal(verification.applyToReadiness(reduced, greenRollCall).soreness, 6);

const painHold = verification.buildReceipt({
  date,
  rollCall: { ...greenRollCall, pain: true },
  readiness: { state: "RED" },
  recoveryHistory: [completeRecovery],
  now: "2026-08-10T06:02:00.000Z"
});
assert.equal(painHold.code, "RECOVERY_ONLY");
assert.equal(painHold.dailyOverride.trainingAllowed, false);
assert.equal(verification.applyToReadiness(painHold, greenRollCall).pain, true);

const safetyCarryover = verification.buildReceipt({
  date,
  rollCall: greenRollCall,
  readiness: greenReadiness,
  debriefHistory: [{ ...controlledDebrief, painReported: true }],
  recoveryHistory: [{ ...completeRecovery, safetyHold: true, status: "SAFETY_HOLD", tasks: [{ id: "pain", status: "PENDING" }] }],
  now: "2026-08-10T06:03:00.000Z"
});
assert.equal(safetyCarryover.code, "RECOVERY_ONLY", "An unresolved prior safety hold must override a green morning state");

const clearedSafety = verification.buildReceipt({
  date,
  rollCall: greenRollCall,
  readiness: greenReadiness,
  debriefHistory: [{ ...controlledDebrief, painReported: true }],
  recoveryHistory: [{ ...completeRecovery, safetyHold: true }],
  now: "2026-08-10T06:03:30.000Z"
});
assert.equal(clearedSafety.code, "REDUCE_TODAY", "A completed pain-recovery order clears the hard hold but keeps the next day conservative");

const baselineReduction = verification.buildReceipt({
  date,
  rollCall: greenRollCall,
  readiness: { state: "YELLOW" },
  baselineProfile: {
    state: "ACTIVE",
    metrics: {
      sleep: { label: "Sleep", signal: { status: "SEVERE", severity: 2, ratio: 0.68 } },
      resting_heart_rate: { label: "Resting heart rate", signal: { status: "WITHIN BASELINE", severity: 0, ratio: 1 } },
      heart_rate_variability: { label: "HRV", signal: { status: "UNAVAILABLE", severity: 0, ratio: null } }
    }
  },
  now: "2026-08-10T06:04:00.000Z"
});
assert.equal(baselineReduction.code, "REDUCE_TODAY");
assert.ok(baselineReduction.signals.some((item) => item.label === "BASELINE"));

const idempotent = verification.buildReceipt({
  date,
  rollCall: greenRollCall,
  readiness: greenReadiness,
  debriefHistory: [controlledDebrief],
  recoveryHistory: [completeRecovery],
  previous: proceed,
  now: "2026-08-10T07:00:00.000Z"
});
assert.equal(idempotent, proceed, "Unchanged evidence must not create a new receipt revision");

const amended = verification.buildReceipt({
  date,
  rollCall: { ...greenRollCall, energy: 5 },
  readiness: { state: "YELLOW" },
  debriefHistory: [controlledDebrief],
  recoveryHistory: [completeRecovery],
  previous: proceed,
  now: "2026-08-10T07:05:00.000Z"
});
assert.equal(amended.revision, 2);
assert.notEqual(amended.fingerprint, proceed.fingerprint);

assert.equal(verification.buildReceipt({ date, rollCall: null, readiness: null }), null);
console.log("Morning Verification engine tests passed.");
