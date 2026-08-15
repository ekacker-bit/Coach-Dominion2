const test = require("node:test");
const assert = require("node:assert/strict");
const recovery = require("../assets/js/recovery-command.js");

function input(overrides = {}) {
  return {
    date: "2026-08-15",
    readinessComplete: true,
    readiness: { date: "2026-08-15", state: "GREEN", energy: 8, soreness: 3, pain: false, sleep: 7.5 },
    trainingLoad: { scheduledMinutes: 60, sessionsToday: 1, sessionsLast7: 4, consecutiveTrainingDays: 2 },
    day: { date: "2026-08-15", activities: [{ id: "lower-a", module: "STRENGTH", title: "Lower A", estimatedMinutes: 60 }] },
    contract: { id: "contract-9", revision: 9 },
    week: { id: "week-1", revision: 2 },
    generatedAt: "2026-08-15T11:00:00.000Z",
    ...overrides
  };
}

test("027C clears a green recruit to execute without changing the day", () => {
  const command = recovery.buildCommand(input());
  assert.equal(command.version, "027C.1");
  assert.equal(command.posture, "GREEN");
  assert.match(command.order, /exactly as prescribed/i);
  const day = recovery.applyToDay(input().day, command, { date: "2026-08-15", contractRevision: 9, weekRevision: 2 });
  assert.equal(day.activities[0].estimatedMinutes, 60);
});

test("027C converts pain into a red recovery-only command across training domains", () => {
  const command = recovery.buildCommand(input({ readiness: { date: "2026-08-15", state: "RED", energy: 4, soreness: 8, pain: true } }));
  assert.equal(command.posture, "RED");
  assert.deepEqual(command.changes.filter((item) => ["STRENGTH", "RUNNING", "CORE"].includes(item.domain)).map((item) => item.action), ["RECOVERY_ONLY", "RECOVERY_ONLY", "RECOVERY_ONLY"]);
  const day = recovery.applyToDay(input().day, command, { date: "2026-08-15", contractRevision: 9, weekRevision: 2 });
  assert.equal(day.activities.length, 1);
  assert.equal(day.activities[0].module, "RECOVERY");
  assert.equal(day.recoveryDay, true);
});

test("027C uses sleep RHR and HRV personal-baseline concerns to produce amber", () => {
  const command = recovery.buildCommand(input({
    readiness: {
      date: "2026-08-15", state: "GREEN", energy: 7, soreness: 4, pain: false, sleep: 5.5,
      baseline: { metrics: {
        sleep: { label: "Sleep", current: 5.5, signal: { status: "CONCERN", severity: 1, ratio: 0.78 } },
        resting_heart_rate: { label: "Resting HR", current: 72, signal: { status: "CONCERN", severity: 1, ratio: 1.12 } },
        heart_rate_variability: { label: "HRV", current: 42, signal: { status: "WITHIN BASELINE", severity: 0, ratio: 0.95 } }
      } }
    }
  }));
  assert.equal(command.posture, "AMBER");
  assert.match(command.difference, /volume drop/i);
});

test("027C protects an uncapped long run while removing secondary Strength and Core", () => {
  const day = {
    date: "2026-08-15",
    longRunUncapped: true,
    activities: [
      { id: "long-run", module: "RUNNING", title: "Long run", runType: "LONG_RUN", estimatedMinutes: 130 },
      { id: "upper", module: "STRENGTH", title: "Upper B", estimatedMinutes: 50 },
      { id: "core", module: "CORE", title: "Core", estimatedMinutes: 15 }
    ]
  };
  const command = recovery.buildCommand(input({ readiness: { date: "2026-08-15", state: "YELLOW", energy: 5, soreness: 6, pain: false }, day }));
  const adjusted = recovery.applyToDay(day, command, { date: "2026-08-15", contractRevision: 9, weekRevision: 2 });
  assert.equal(command.posture, "AMBER");
  assert.deepEqual(adjusted.activities.map((item) => item.id), ["long-run"]);
  assert.equal(adjusted.activities[0].estimatedMinutes, 130);
  assert.equal(adjusted.activities[0].durationOpen, true);
  assert.equal(recovery.calendarOverride(command, { date: "2026-08-15", contractRevision: 9, weekRevision: 2 }).longRunTimeOpen, true);
});

test("027C reduces a normal amber day without mutating Fuel targets", () => {
  const command = recovery.buildCommand(input({ readiness: { date: "2026-08-15", state: "YELLOW", energy: 5, soreness: 7, pain: false } }));
  const adjusted = recovery.applyToDay(input().day, command, { date: "2026-08-15", contractRevision: 9, weekRevision: 2 });
  assert.equal(adjusted.activities[0].estimatedMinutes, 45);
  assert.equal(command.changes.find((item) => item.domain === "FUEL").action, "HOLD_TARGETS");
  assert.match(command.safeguard, /never changes the Recruit Contract/i);
});

test("027C measures whether a completed recovery intervention helped", () => {
  const command = recovery.complete(recovery.buildCommand(input({ readiness: { date: "2026-08-15", state: "YELLOW", energy: 4, soreness: 8, pain: false } })), { completedAt: "2026-08-15T20:00:00.000Z" });
  const outcome = recovery.buildOutcome(command, [{ date: "2026-08-16", state: "GREEN", energy: 7, soreness: 4, pain: false }], { evaluatedAt: "2026-08-16T12:00:00.000Z" });
  assert.equal(outcome.code, "HELPED");
  assert.equal(outcome.verified, true);
  assert.match(outcome.lesson, /AMBER to GREEN/i);
});

test("027C refuses to call unresolved pain successful", () => {
  const command = recovery.complete(recovery.buildCommand(input({ readiness: { date: "2026-08-15", state: "RED", energy: 4, soreness: 8, pain: true } })));
  const outcome = recovery.buildOutcome(command, [{ date: "2026-08-16", state: "RED", energy: 4, soreness: 8, pain: true }]);
  assert.equal(outcome.code, "NOT_RESOLVED");
  assert.match(outcome.lesson, /do not restore loaded work/i);
});
