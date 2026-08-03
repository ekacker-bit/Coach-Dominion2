const assert = require("node:assert/strict");
const mobile = require("../assets/js/mobile-command.js");

const date = "2026-08-03";

assert.equal(mobile.VERSION, "022G.1");
assert.deepEqual(mobile.resolveMobileDestination("train"), { section: "performance", performanceView: "today_training" });
assert.deepEqual(mobile.resolveMobileDestination("review"), { section: "inspection" });
assert.equal(mobile.resolveMobileDestination("more").dialog, "mobile-more-dialog");
assert.equal(mobile.mobileNavForSection("calendar"), "more");
assert.equal(mobile.mobileNavForSection("contract"), "more");
assert.equal(mobile.mobileNavForSection("inspection"), "review");
assert.equal(mobile.mobileNavForSection("performance"), "train");

function base(overrides = {}) {
  return {
    date,
    dailyState: { date, energy: 7, soreness: 3, pain: false },
    strengthAssignment: { state: "READY", title: "Upper body", exercises: [{ id: "bench" }] },
    strengthExecution: { state: "READY" },
    runningPrescription: { status: "READY", session: { distance: 3, unit: "mi", type: "EASY" } },
    runningExecution: null,
    corePrescription: { status: "READY", session: { estimatedMinutes: 15 }, exercises: [{ id: "plank" }] },
    coreExecution: null,
    nutrition: null,
    online: true,
    pendingWrites: 0,
    ...overrides
  };
}

{
  const payload = mobile.normalizeRollCall({
    energy: "8",
    soreness: "4",
    pain: "no",
    weight: "185.4",
    resting_heart_rate: "54",
    heart_rate_variability: "62",
    comments: "Travel day"
  }, { date, userId: "user-1", now: "2026-08-03T12:00:00.000Z" });
  assert.equal(payload.energy, 8);
  assert.equal(payload.soreness, 4);
  assert.equal(payload.pain, false);
  assert.equal(payload.weight, 185.4);
  assert.deepEqual(Object.keys(payload.objective_metric_sources).sort(), ["heart_rate_variability", "resting_heart_rate", "weight"]);
  assert.throws(() => mobile.normalizeRollCall({ energy: 11, soreness: 2, pain: "no" }, { date }), /Energy must be between 1 and 10/);
}

{
  const nutrition = mobile.normalizeNutrition({ calories: "2300", protein: "180", carbs: "", fat: "72" }, { date, now: "2026-08-03T18:00:00.000Z" });
  assert.equal(nutrition.calories, 2300);
  assert.equal(nutrition.protein, 180);
  assert.equal(nutrition.carbs, null);
  assert.throws(() => mobile.normalizeNutrition({}, { date }), /at least one nutrition total/i);
}

{
  const command = mobile.buildMobileCommand(base({ dailyState: null }));
  assert.equal(command.next.action, "ROLL_CALL");
  assert.equal(command.next.label, "Complete Roll Call");
}

{
  const command = mobile.buildMobileCommand(base({ strengthExecution: { state: "PAUSED" } }));
  assert.equal(command.next.action, "MODULE");
  assert.equal(command.next.module, "strength");
  assert.equal(command.modules[0].actionLabel, "Resume strength");
}

{
  const command = mobile.buildMobileCommand(base({
    strengthAssignment: { state: "RECOVERY ONLY", title: "Recovery", exercises: [] },
    strengthExecution: { state: "PAUSED" }
  }));
  assert.equal(command.modules[0].status, "SAFETY HOLD");
  assert.equal(command.modules[0].actionLabel, "Review hold");
}

{
  const command = mobile.buildMobileCommand(base({
    strengthExecution: { state: "COMPLETE" },
    runningExecution: { state: "COMPLETE" },
    coreExecution: { state: "COMPLETE" }
  }));
  assert.equal(command.next.action, "NUTRITION");
  assert.equal(command.progress.completed, 4);
}

{
  const command = mobile.buildMobileCommand(base({
    strengthExecution: { state: "COMPLETE" },
    runningExecution: { state: "COMPLETE" },
    coreExecution: { state: "COMPLETE" },
    nutrition: { date, calories: 2200 },
    online: false,
    pendingWrites: 2
  }));
  assert.equal(command.next.action, "TODAY");
  assert.equal(command.progress.percent, 100);
  assert.equal(command.sync.label, "2 saved offline");
}

{
  const first = mobile.enqueueWrite([], { resource: "DAILY_STATE", key: date, payload: { energy: 7 }, createdAt: "2026-08-03T10:00:00.000Z" });
  const replaced = mobile.enqueueWrite(first, { resource: "DAILY_STATE", key: date, payload: { energy: 8 }, createdAt: "2026-08-03T10:05:00.000Z" });
  assert.equal(replaced.length, 1);
  assert.equal(replaced[0].payload.energy, 8);
  assert.equal(mobile.acknowledgeWrite(replaced, `DAILY_STATE:${date}`).length, 0);
}

console.log("Build 022G Mobile Command tests passed.");
