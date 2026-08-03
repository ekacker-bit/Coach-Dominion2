const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/fasting-execution.js");

function protocol(overrides = {}) {
  return {
    status: "APPROVED",
    enabled: true,
    protocol: "14_10",
    label: "14:10",
    revision: 2,
    eatingStart: "10:00",
    targetPolicy: "APPROVED DAILY TARGETS UNCHANGED",
    ...overrides
  };
}

function active(overrides = {}) {
  return engine.startFast({ protocol: protocol() }, { now: overrides.now || "2026-08-03T18:00:00-05:00" });
}

function completed(input = {}, closeout = {}) {
  const running = engine.startFast({ protocol: protocol() }, { now: input.startedAt || "2026-08-03T18:00:00-05:00" });
  const ended = engine.finishFast(running, { now: input.endedAt || "2026-08-04T10:05:00-05:00", reason: input.reason || "COMPLETE" });
  return engine.attachCloseout(ended, {
    hunger: closeout.hunger ?? 3,
    energy: closeout.energy ?? 4,
    trainingQuality: closeout.trainingQuality ?? 4,
    symptoms: closeout.symptoms || "NONE"
  }, { now: input.closeoutAt || "2026-08-04T10:10:00-05:00" });
}

test("023D exposes a deterministic fasting execution engine", () => {
  assert.equal(engine.VERSION, "023D.1");
});

test("starting a fast records the actual start and next eating-window boundary", () => {
  const result = active();
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.protocol, "14_10");
  assert.equal(result.plannedMinutes, 960);
  assert.match(result.expectedEndAt, /2026-08-04T15:00:00\.000Z/);
  assert.match(result.targetPolicy, /UNCHANGED/);
});

test("ending early is protected evidence rather than a violation", () => {
  const result = engine.finishFast(active(), { now: "2026-08-04T08:00:00-05:00", reason: "COMPLETE" });
  assert.equal(result.status, "ENDED EARLY");
  assert.equal(result.protected, true);
  assert.equal(result.actualMinutes, 840);
});

test("training and pause actions close the window without penalty", () => {
  const training = engine.protectDay({ protocol: protocol(), active: active() }, { now: "2026-08-04T07:00:00-05:00", reason: "TRAINING" });
  const paused = engine.protectDay({ protocol: protocol() }, { now: "2026-08-03T20:00:00-05:00", reason: "PAUSE" });
  assert.equal(training.status, "OVERRIDDEN");
  assert.equal(paused.status, "PAUSED");
  assert.equal(training.protected && paused.protected, true);
});

test("the live command exposes one action and a stable countdown", () => {
  const result = engine.liveCommand({
    context: { enabled: true, status: "FAST ACTIVE", eatingStart: "10:00" },
    active: active(),
    now: "2026-08-04T08:30:00-05:00"
  });
  assert.equal(result.status, "FAST ACTIVE");
  assert.equal(result.countdown, "01:30");
  assert.equal(result.primaryAction.id, "END_FAST");
  assert.ok(result.secondaryActions.some((item) => item.id === "TRAINING_OVERRIDE"));
});

test("daily check-in requires bounded evidence and preserves the outcome", () => {
  const ended = engine.finishFast(active(), { now: "2026-08-04T10:05:00-05:00", reason: "COMPLETE" });
  const result = engine.attachCloseout(ended, { hunger: 2, energy: 5, trainingQuality: "", symptoms: "NONE", note: "Felt steady." });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.closeout.hunger, 2);
  assert.equal(result.closeout.trainingQuality, null);
  assert.throws(() => engine.attachCloseout(ended, { hunger: 8, energy: 5, symptoms: "NONE" }), /1 to 5/);
});

test("Atlas learns until three honest daily check-ins exist", () => {
  const verdict = engine.weeklyVerdict({ protocol: protocol(), history: [completed(), completed({ startedAt: "2026-08-02T18:00:00-05:00", endedAt: "2026-08-03T10:05:00-05:00" })] });
  assert.equal(verdict.verdict, "LEARNING");
  assert.equal(verdict.evidenceDays, 2);
});

test("reported symptoms produce a pause recommendation", () => {
  const history = [completed({}, { symptoms: "DIZZINESS" }), completed({ startedAt: "2026-08-02T18:00:00-05:00", endedAt: "2026-08-03T10:05:00-05:00" }), completed({ startedAt: "2026-08-01T18:00:00-05:00", endedAt: "2026-08-02T10:05:00-05:00" })];
  const verdict = engine.weeklyVerdict({ protocol: protocol(), history });
  assert.equal(verdict.verdict, "PAUSE");
  assert.equal(verdict.suggestedProtocol, "OFF");
});

test("low energy or training quality shortens the proposed window", () => {
  const history = [0, 1, 2].map((offset) => completed({ startedAt: `2026-08-0${3 - offset}T18:00:00-05:00`, endedAt: `2026-08-0${4 - offset}T10:05:00-05:00` }, { energy: 2, trainingQuality: 2, hunger: 4 }));
  const verdict = engine.weeklyVerdict({ protocol: protocol({ protocol: "16_8", label: "16:8" }), history });
  assert.equal(verdict.verdict, "SHORTEN");
  assert.equal(verdict.suggestedProtocol, "14_10");
});

test("seven strong days may suggest a wider window but never auto-approve it", () => {
  const windows = [
    ["2026-07-27", "2026-07-28"], ["2026-07-28", "2026-07-29"], ["2026-07-29", "2026-07-30"],
    ["2026-07-30", "2026-07-31"], ["2026-07-31", "2026-08-01"], ["2026-08-01", "2026-08-02"],
    ["2026-08-02", "2026-08-03"]
  ];
  const history = windows.map(([start, end]) => completed({ startedAt: `${start}T20:00:00-05:00`, endedAt: `${end}T10:05:00-05:00`, closeoutAt: `${end}T10:10:00-05:00` }, { hunger: 2, energy: 5, trainingQuality: 5 }));
  const verdict = engine.weeklyVerdict({ protocol: protocol({ protocol: "12_12", label: "12:12" }), history });
  assert.equal(verdict.verdict, "WIDEN");
  assert.equal(verdict.suggestedProtocol, "14_10");
  assert.equal(verdict.requiresApproval, true);
});

test("history merge is idempotent across account reconciliation", () => {
  const first = completed();
  const updated = { ...first, closeout: { ...first.closeout, energy: 5 }, updatedAt: "2026-08-04T16:00:00.000Z" };
  const result = engine.mergeRecord([first, first], updated);
  assert.equal(result.length, 1);
  assert.equal(result[0].closeout.energy, 5);
});
