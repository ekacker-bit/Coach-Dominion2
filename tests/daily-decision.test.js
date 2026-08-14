const test = require("node:test");
const assert = require("node:assert/strict");

const {
  VERSION,
  buildDailyDecision,
  applyToCommand,
  moduleState
} = require("../assets/js/daily-decision.js");

const operatingDate = "2026-08-13";
const approvedPlans = [
  { id: "strength", label: "Strength plan", included: true, complete: true, section: "performance" },
  { id: "running", label: "Running plan", included: true, complete: true, section: "performance" },
  { id: "core", label: "Core plan", included: true, complete: true, section: "performance" },
  { id: "nutrition", label: "Fuel plan", included: true, complete: true, section: "nutrition" }
];

function input(overrides = {}) {
  return {
    operatingDate,
    decidedAt: "2026-08-13T12:00:00.000Z",
    truth: { state: "TODAY", date: operatingDate, action: { action: "TRAIN", label: "Start Lower A", section: "today" } },
    command: { state: "EXECUTION_REQUIRED", verb: "START", primary: { action: "TRAIN", label: "Start Lower A", section: "today" } },
    day: {
      date: operatingDate,
      activities: [
        { id: "lower-a", module: "strength", title: "Lower A", estimatedMinutes: 65, sessionWindow: "AM" },
        { id: "core-a", module: "core", title: "Core A", estimatedMinutes: 15, sessionWindow: "AM" }
      ]
    },
    queue: { total: 2, completed: 0, steps: [{ id: "lower-a", label: "Lower A", state: "READY", actionLabel: "Start workout" }] },
    plans: approvedPlans,
    contractRevision: 8,
    readinessComplete: true,
    readiness: { classification: "READY", confidence: 84, energy: 8, soreness: 2, pain: false },
    ...overrides
  };
}

test("Build 026E exposes a stable Daily Decision contract", () => {
  const first = buildDailyDecision(input());
  const second = buildDailyDecision(input({ decidedAt: "2026-08-13T13:00:00.000Z" }));
  assert.equal(VERSION, "026E.1");
  assert.equal(first.id, second.id);
  assert.equal(first.authorizedTraining, true);
  assert.equal(first.status, "TRAINING_AUTHORIZED");
  assert.deepEqual(first.schedule.sessions.map((item) => item.module), ["strength", "core"]);
});

test("the first missing required plan outranks an executable workout everywhere", () => {
  const plans = approvedPlans.map((plan) => plan.id === "core" ? { ...plan, complete: false, status: "MISSING" } : plan);
  const decision = buildDailyDecision(input({ plans }));
  const command = applyToCommand(input().command, decision);
  assert.equal(decision.status, "BLOCKED");
  assert.equal(decision.blocker.code, "MISSING_CORE_PLAN");
  assert.equal(decision.nextAction.module, "core");
  assert.equal(decision.authorizedTraining, false);
  assert.equal(command.state, "BLOCKED");
  assert.equal(command.title, decision.blocker.title);
  for (const domain of ["strength", "running", "core"]) {
    const state = moduleState(decision, domain);
    assert.equal(state.status, "BLOCKED");
    assert.equal(state.executable, false);
    assert.equal(state.progressionAllowed, false);
    assert.equal(state.detail, decision.blocker.detail);
    assert.equal(state.action.label, decision.nextAction.label);
  }
  const fuel = moduleState(decision, "nutrition");
  assert.equal(fuel.status, "PROGRAM BLOCKED");
  assert.equal(fuel.executable, true);
  assert.equal(fuel.progressionAllowed, false);
  assert.equal(decision.nutritionContext.trainingDay, false);
});

test("loading and stale evidence never authorize training", () => {
  const loading = buildDailyDecision(input({ loading: true }));
  assert.equal(loading.status, "LOADING");
  assert.equal(loading.authorizedTraining, false);
  assert.equal(moduleState(loading, "strength").status, "LOADING");

  const stale = buildDailyDecision(input({ staleData: true }));
  assert.equal(stale.status, "STALE");
  assert.equal(stale.blocker.code, "STALE_DATA");
  assert.equal(stale.authorizedTraining, false);
  assert.equal(moduleState(stale, "running").progressionAllowed, false);
});

test("an empty operating day is distinct from an explicit recovery day", () => {
  const empty = buildDailyDecision(input({ day: null }));
  assert.equal(empty.status, "EMPTY");
  assert.equal(empty.schedule.available, false);
  assert.equal(empty.recoveryDay, false);
  assert.equal(empty.authorizedTraining, false);
  assert.equal(empty.nextAction.section, "calendar");
  assert.equal(moduleState(empty, "strength").status, "NO SCHEDULE");
  assert.equal(moduleState(empty, "strength").executable, false);
  assert.equal(moduleState(empty, "nutrition").executable, true);
  assert.equal(empty.nutritionContext.type, "SCHEDULE_REQUIRED");
});

test("Roll Call, recovery, pain, and completion have distinct safe states", () => {
  const rollCall = buildDailyDecision(input({ readinessComplete: false, readiness: {} }));
  assert.equal(rollCall.status, "READINESS_REQUIRED");
  assert.equal(rollCall.authorizedTraining, false);

  const recovery = buildDailyDecision(input({ day: { date: operatingDate, activities: [] } }));
  assert.equal(recovery.status, "RECOVERY_DAY");
  assert.equal(recovery.recoveryDay, true);
  assert.equal(recovery.authorizedTraining, false);
  assert.equal(moduleState(recovery, "recovery").executable, true);

  const pain = buildDailyDecision(input({ readiness: { classification: "CAUTION", confidence: 62, pain: true } }));
  assert.equal(pain.blocker.code, "PAIN_SAFETY_HOLD");
  assert.equal(pain.authorizedTraining, false);

  const completed = buildDailyDecision(input({ command: { state: "SECURED", primary: { action: "CLOSE", label: "Close the day", section: "today" } } }));
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.authorizedTraining, false);
});
