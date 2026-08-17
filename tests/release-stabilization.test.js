const test = require("node:test");
const assert = require("node:assert/strict");

const Stabilization = require("../assets/js/release-stabilization.js");
const Execution = require("../assets/js/frictionless-execution.js");

test("normalizes mixed percentage scales through one utility", () => {
  const cases = [
    [0, "0%"],
    [0.008, "0.8%"],
    [0.8, "80%"],
    [1, "100%"],
    [17, "17%"],
    [80, "80%"],
    [100, "100%"],
    [null, "—"],
    ["invalid", "—"]
  ];
  cases.forEach(([input, expected]) => assert.equal(Stabilization.formatPercent(input), expected));
});

test("save queue IDs are stable, rerenders are idempotent, and acknowledgements remove work", () => {
  const now = "2026-08-16T12:00:00.000Z";
  const input = { key: "account-truth", payload: { answer: 42 } };
  const once = Stabilization.enqueue([], input, { now });
  const rerender = Stabilization.enqueue(once, input, { now: "2026-08-16T12:00:10.000Z" });
  assert.equal(once.length, 1);
  assert.equal(rerender.length, 1);
  assert.equal(rerender[0].id, once[0].id);
  assert.equal(rerender[0].attempts, 0);
  assert.deepEqual(Stabilization.acknowledge(rerender, once[0].id), []);
});

test("failed saves back off with bounded jitter and do not multiply on reload", () => {
  const input = { key: "account-truth", payload: { revision: 7 } };
  const first = Stabilization.enqueue([], input, { now: "2026-08-16T12:00:00.000Z", failedAttempt: true, random: 0.5 });
  const reloaded = JSON.parse(JSON.stringify(first));
  const unchanged = Stabilization.enqueue(reloaded, input, { now: "2026-08-16T12:00:00.500Z" });
  const secondFailure = Stabilization.enqueue(unchanged, input, { now: "2026-08-16T12:00:01.000Z", failedAttempt: true, random: 1 });
  assert.equal(unchanged.length, 1);
  assert.equal(secondFailure.length, 1);
  assert.equal(secondFailure[0].attempts, 2);
  assert.equal(Stabilization.ready(secondFailure, { now: "2026-08-16T12:00:01.100Z" }).length, 0);
  assert.ok(Stabilization.retryDelay(99, { random: 1 }) <= 36 * 60 * 1000);
  assert.equal(Stabilization.oldestAge(secondFailure, { now: "2026-08-16T13:01:00.000Z" }).label, "1 HR");
});

test("canonical lifecycle keeps an active plan distinct from an amendment draft", () => {
  const common = { contractApproved: true, plansApproved: true, calendarReady: true };
  assert.equal(Stabilization.lifecycle({}), "INCOMPLETE");
  assert.equal(Stabilization.lifecycle(common), "READY");
  assert.equal(Stabilization.lifecycle({ ...common, active: true }), "ACTIVE");
  assert.equal(Stabilization.lifecycle({ ...common, active: true, hasDraft: true }), "DRAFT_REVISION");
  assert.equal(Stabilization.lifecycle({ ...common, repairRequired: true }), "REPAIR_REQUIRED");
  assert.equal(Stabilization.lifecycle({ ...common, launchPending: true }), "LAUNCH_PENDING");
  assert.equal(Stabilization.lifecycle({ ...common, paused: true }), "PAUSED");
  assert.match(Stabilization.lifecycleLabel("DRAFT_REVISION"), /ACTIVE PLAN UNCHANGED/);
});

test("recovery days remove training from the denominator and unlock closeout with recovery evidence", () => {
  const recovery = Stabilization.recoveryDay({ recoveryDay: true, recoveryComplete: true, fuelComplete: true });
  assert.equal(recovery.status, "RECOVERY");
  assert.equal(recovery.training.strength.label, "REST");
  assert.equal(recovery.training.running.applicable, false);
  assert.equal(recovery.training.core.applicable, false);
  assert.equal(recovery.priority, "RECOVER / PROTECT");
  assert.equal(recovery.progression, "N/A — HELD");
  assert.equal(recovery.complete, true);

  const dashboard = Execution.buildDashboard({ modules: {
    strength: { planned: false }, running: { planned: false }, core: { planned: false },
    fuel: { planned: true, state: "COMPLETE" }, recovery: { planned: true, state: "COMPLETE" },
    closeout: { planned: true, state: "READY" }
  } });
  assert.equal(dashboard.total, 3);
  assert.equal(dashboard.completed, 2);
  assert.equal(dashboard.percent, 67);
});

test("provider states distinguish every user-facing condition", () => {
  const now = "2026-08-16T12:00:00.000Z";
  assert.equal(Stabilization.connectionState({ status: "NOT_CONNECTED" }, { now }).state, "SETUP_REQUIRED");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", evidenceCount: 0 }, { now }).state, "NO_EVIDENCE");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", lastSuccessfulAt: "2026-08-16T10:00:00.000Z", evidenceCount: 2 }, { now }).state, "CURRENT");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", lastSuccessfulAt: "2026-08-01T10:00:00.000Z", evidenceCount: 2 }, { now }).state, "STALE");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", pending: true }, { now }).state, "SYNC_PENDING");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", conflict: true }, { now }).state, "CONFLICT");
  assert.equal(Stabilization.connectionState({ status: "CONNECTED", failed: true }, { now }).state, "IMPORT_FAILED");
});
