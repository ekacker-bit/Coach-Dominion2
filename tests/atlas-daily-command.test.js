const test = require("node:test");
const assert = require("node:assert/strict");
const command = require("../assets/js/atlas-daily-command.js");

const stages = ["contract", "plans", "week", "today", "evidence", "review"].map((id, index) => ({
  id,
  label: id,
  complete: index < 3,
  current: index === 3,
  locked: index > 3
}));

function baseModel(overrides = {}) {
  return {
    state: "EXECUTION_REQUIRED",
    stateLabel: "EXECUTION REQUIRED",
    mode: "EXECUTE",
    title: "Execute Strength",
    detail: "Lower A",
    primary: { action: "MODULE", label: "Open Strength", section: "performance", module: "strength" },
    progress: { complete: 3, total: 6, percent: 50, current: "Today" },
    stages,
    modules: [],
    context: { source: "Contract 4 · 4/4 plans · Week r2", evidence: "0/3 assigned domains verified" },
    ...overrides
  };
}

function executionTruth(overrides = {}) {
  return {
    date: "2026-08-11",
    state: "EXECUTION_REQUIRED",
    title: "Execute Strength",
    detail: "Lower A",
    action: { action: "MODULE", label: "Open Strength", section: "performance", module: "strength" },
    stages,
    modules: [{ id: "strength", label: "Strength", scheduled: true, status: "READY" }],
    evidence: { complete: 0, total: 3 },
    contradictions: [],
    ...overrides
  };
}

const day = {
  date: "2026-08-11",
  twoADay: true,
  estimatedMinutes: 125,
  activities: [
    { id: "lower-a", module: "STRENGTH", title: "Lower A", estimatedMinutes: 65, sessionWindow: "AM" },
    { id: "easy-run", module: "RUNNING", title: "Easy Run", estimatedMinutes: 60, sessionWindow: "PM" }
  ]
};

test("Atlas issues one timed, confident command from the approved day", () => {
  const model = command.buildDailyCommand({
    truth: executionTruth(),
    model: baseModel(),
    day,
    date: day.date,
    readinessComplete: true,
    continuityCurrent: true,
    contractRevision: 4,
    weekRevision: 2
  });
  assert.equal(model.version, "025O.1");
  assert.equal(model.verb, "START");
  assert.equal(model.primary.label, "START · Strength");
  assert.equal(model.duration.label, "65 min");
  assert.equal(model.window, "AM");
  assert.equal(model.confidence.label, "HIGH");
  assert.equal(model.adjustment.available, true);
  assert.match(model.reason, /highest-priority unfinished order/i);
});

test("program integrity blockers outrank normal work and cannot be casually modified", () => {
  const truth = executionTruth({
    state: "PLANS_REQUIRED",
    title: "Link the Core plan",
    action: { action: "PLAN", label: "Open Core", section: "performance", module: "core" },
    contradictions: [{ severity: "BLOCKING", message: "Core is stale." }]
  });
  const model = command.buildDailyCommand({
    truth,
    model: baseModel({ state: "PLANS_REQUIRED", title: truth.title, primary: truth.action }),
    day,
    date: day.date,
    contractRevision: 4,
    weekRevision: 2
  });
  assert.equal(model.verb, "FIX");
  assert.equal(model.priority, 86);
  assert.equal(model.duration.label, "About 3 min");
  assert.equal(model.adjustment.available, false);
  assert.equal(model.confidence.label, "HIGH");
});

test("an in-progress session is preserved and resumes ahead of repair work", () => {
  const truth = executionTruth({ modules: [{ id: "strength", label: "Strength", scheduled: true, status: "IN_PROGRESS" }] });
  const model = command.buildDailyCommand({ truth, model: baseModel(), day, date: day.date, contractRevision: 4, weekRevision: 2 });
  assert.equal(model.verb, "RESUME");
  assert.equal(model.adjustment.available, false);
});

test("a shortened-day response is bounded, reversible, and changes the executable dose", () => {
  const model = command.buildDailyCommand({
    truth: executionTruth(),
    model: baseModel(),
    day,
    date: day.date,
    readinessComplete: true,
    contractRevision: 4,
    weekRevision: 2
  });
  const response = command.createResponse(model, "REDUCE_TODAY", {
    date: day.date,
    contractId: "contract-4",
    contractRevision: 4,
    weekId: "week-2",
    weekRevision: 2,
    note: "Only 45 minutes available",
    createdAt: "2026-08-11T12:00:00.000Z"
  });
  assert.equal(response.status, "ACTIVE");
  assert.equal(response.calendarOverride.futureWeekChanged, false);
  assert.equal(response.directive.status, "APPROVED");
  assert.equal(response.directive.reviewDate, day.date);
  assert.equal(response.directive.changes.find((item) => item.domain === "STRENGTH").action, "REDUCE_VOLUME");
  assert.ok(command.responseApplies(response, { date: day.date, contractRevision: 4, weekRevision: 2 }));
  assert.equal(command.responseApplies(response, { date: day.date, contractRevision: 5, weekRevision: 2 }), false);

  const adjusted = command.buildDailyCommand({
    truth: executionTruth(), model: baseModel(), day, date: day.date, response, contractRevision: 4, weekRevision: 2
  });
  assert.equal(adjusted.adjustment.active, true);
  assert.equal(adjusted.duration.label, "50 min");
  assert.match(adjusted.title, /^Shortened:/);
});

test("move-later reconciles the day without mutating the prescription", () => {
  const model = command.buildDailyCommand({ truth: executionTruth(), model: baseModel(), day, date: day.date, contractRevision: 4, weekRevision: 2 });
  const response = command.createResponse(model, "MOVE_LATER", {
    date: day.date,
    contractRevision: 4,
    weekRevision: 2,
    createdAt: "2026-08-11T12:00:00.000Z"
  });
  assert.equal(response.directive, null);
  assert.equal(response.calendarOverride.window, "LATER");
  const adjusted = command.buildDailyCommand({ truth: executionTruth(), model: baseModel(), day, date: day.date, response, contractRevision: 4, weekRevision: 2 });
  assert.equal(adjusted.window, "LATER TODAY");
  assert.equal(adjusted.duration.label, "65 min");
});

test("recovery response protects every training domain and preserves Fuel", () => {
  const model = command.buildDailyCommand({ truth: executionTruth(), model: baseModel(), day, date: day.date, contractRevision: 4, weekRevision: 2 });
  const response = command.createResponse(model, "RECOVERY_ONLY", {
    date: day.date,
    contractRevision: 4,
    weekRevision: 2,
    createdAt: "2026-08-11T12:00:00.000Z"
  });
  const adjusted = command.buildDailyCommand({ truth: executionTruth(), model: baseModel(), day, date: day.date, response, contractRevision: 4, weekRevision: 2 });
  assert.equal(adjusted.primary.module, "recovery");
  assert.equal(adjusted.window, "RECOVERY");
  assert.equal(response.directive.changes.find((item) => item.domain === "RUNNING").action, "RECOVERY_ONLY");
  assert.equal(response.directive.changes.find((item) => item.domain === "FUELING").action, "HOLD_TARGETS");
});

test("a long run keeps an open duration", () => {
  const runDay = {
    ...day,
    twoADay: false,
    longRunUncapped: true,
    activities: [{ id: "long-run", module: "RUNNING", title: "Long Run", estimatedMinutes: 180 }]
  };
  const truth = executionTruth({
    title: "Execute Run",
    action: { action: "MODULE", label: "Open Run", section: "performance", module: "running" }
  });
  const model = command.buildDailyCommand({ truth, model: baseModel({ title: truth.title, primary: truth.action }), day: runDay, date: day.date });
  assert.equal(model.duration.label, "Open duration");
  assert.equal(model.duration.open, true);
});

test("instrumentation records intent without storing free-form notes", () => {
  const model = command.buildDailyCommand({ truth: executionTruth(), model: baseModel(), day, date: day.date });
  const event = command.createEvent(model, "adjustment applied", {
    date: day.date,
    choiceId: "MOVE_LATER",
    occurredAt: "2026-08-11T12:00:00.000Z",
    note: "private detail"
  });
  assert.equal(event.eventType, "ADJUSTMENT_APPLIED");
  assert.equal(event.choiceId, "MOVE_LATER");
  assert.equal(Object.prototype.hasOwnProperty.call(event, "note"), false);
});
