const test = require("node:test");
const assert = require("node:assert/strict");
const Coach = require("../assets/js/atlas-coach.js");
const DailyCommand = require("../assets/js/atlas-daily-command.js");

function command(overrides = {}) {
  return {
    state: "EXECUTION_REQUIRED",
    title: "Lower A",
    duration: { minutes: 60, label: "60 min", open: false },
    primary: { action: "MODULE", module: "strength", label: "Start Strength" },
    orderFingerprint: "order-1234",
    adjustment: { available: true, active: false, choices: DailyCommand.CHOICES },
    ...overrides
  };
}

function context(overrides = {}) {
  return {
    date: "2026-08-16",
    contractId: "contract-9",
    contractRevision: 9,
    weekId: "week-4",
    weekRevision: 4,
    generatedAt: "2026-08-16T12:00:00.000Z",
    ...overrides
  };
}

test("offers one bounded coaching surface for the six real-world constraints", () => {
  assert.equal(Coach.VERSION, "028C.1");
  assert.deepEqual(Coach.REASONS.map((item) => item.id), ["PAIN", "FATIGUE", "TRAVEL", "EQUIPMENT", "TIME", "PREFERENCE"]);
});

test("pain creates a recovery order and preserves Fuel", () => {
  const proposal = Coach.buildProposal({ command: command(), reasonId: "pain", ...context() });
  assert.equal(proposal.status, "PROPOSED");
  assert.equal(proposal.safetyOverride, true);
  assert.equal(proposal.execution, "RECOVERY");
  assert.equal(proposal.calendarOverride.window, "RECOVERY");
  assert.equal(proposal.calendarOverride.futureWeekChanged, false);
  assert.equal(proposal.directive.changes.find((item) => item.domain === "FUELING").action, "HOLD_TARGETS");
  assert.equal(proposal.nextAction, "ROLL_CALL");
});

test("equipment and preference keep the dose while changing only today's pattern", () => {
  const equipment = Coach.buildProposal({ command: command(), reasonId: "EQUIPMENT", ...context() });
  const preference = Coach.buildProposal({ command: command(), reasonId: "PREFERENCE", ...context() });
  assert.equal(equipment.execution, "KEEP_DOSE");
  assert.equal(equipment.directive.changes[0].action, "SUBSTITUTE_EQUIPMENT");
  assert.equal(preference.directive.changes[0].action, "SUBSTITUTE_PATTERN");
  assert.match(preference.tradeoff, /does not authorize easier effort/i);
});

test("a time conflict becomes an account-ready, reversible daily command response", () => {
  const base = command();
  const proposal = Coach.buildProposal({ command: base, reasonId: "TIME", ...context() });
  const coachContext = Coach.responseContext(proposal, "Only 45 minutes available");
  const response = DailyCommand.createResponse(base, proposal.choiceId, {
    ...context(),
    ...coachContext,
    createdAt: "2026-08-16T12:01:00.000Z"
  });
  assert.equal(response.coach.reasonId, "TIME");
  assert.equal(response.calendarOverride.futureWeekChanged, false);
  assert.equal(response.directive.changes[0].action, "REDUCE_VOLUME");
  assert.equal(response.note, "Only 45 minutes available");

  const adjusted = DailyCommand.buildDailyCommand({
    truth: { date: context().date, state: "EXECUTION_REQUIRED", action: base.primary, modules: [], contradictions: [] },
    model: base,
    day: { activities: [{ module: "STRENGTH", estimatedMinutes: 60 }] },
    response,
    ...context()
  });
  assert.equal(adjusted.duration.label, "45 min");
  assert.equal(adjusted.adjustment.label, "Time");
  assert.match(adjusted.reason, /Tradeoff:/);
});

test("Atlas refuses casual mutation after execution begins", () => {
  assert.throws(() => Coach.buildProposal({
    command: command({ adjustment: { available: false } }),
    reasonId: "FATIGUE",
    ...context()
  }), /cannot be changed after execution begins/i);
});

test("a challenged automatic adaptation can enter the same coach without weakening normal execution locks", () => {
  const proposal = Coach.buildProposal({
    command: command({ adjustment: { available: false } }),
    reasonId: "PAIN",
    source: "LIVE_ADAPTATION",
    ...context()
  });
  assert.equal(proposal.source, "LIVE_ADAPTATION");
  const coachContext = Coach.responseContext(proposal);
  const response = DailyCommand.createResponse(command({ adjustment: { available: false } }), proposal.choiceId, {
    ...context(),
    ...coachContext,
    createdAt: "2026-08-16T12:05:00.000Z"
  });
  assert.equal(response.coach.reasonId, "PAIN");
});
