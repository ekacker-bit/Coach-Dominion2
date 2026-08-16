const test = require("node:test");
const assert = require("node:assert/strict");
const replanning = require("../assets/js/weekly-replanning.js");

function week(start, values = {}) {
  return {
    id: values.id || start,
    weekStart: start,
    weekEnd: values.end || "2026-08-23",
    blockingConflictCount: values.blockers || 0,
    days: [
      { date: start, activities: [{ module: "STRENGTH", estimatedMinutes: values.strengthMinutes || 60 }], nutrition: { calories: 2300 } },
      { date: "2026-08-18", activities: [{ module: "RUNNING", estimatedMinutes: values.runningMinutes || 40 }], nutrition: { calories: 2400 } },
      { date: "2026-08-19", activities: [{ module: "CORE", estimatedMinutes: values.coreMinutes || 20 }], nutrition: { calories: 2300 } },
      { date: "2026-08-20", activities: values.extraStrength ? [{ module: "STRENGTH", estimatedMinutes: 55 }] : [], nutrition: { calories: 2300 } },
      { date: "2026-08-21", activities: [], nutrition: { calories: 2300 } },
      { date: "2026-08-22", activities: [], nutrition: { calories: 2300 } },
      { date: "2026-08-23", activities: [], nutrition: { calories: 2300 } }
    ]
  };
}

const proposal = {
  id: "adaptive-week",
  status: "PROPOSED",
  code: "REBALANCE",
  tone: "gold",
  confidence: "HIGH",
  targetWeekStart: "2026-08-17",
  targetWeekEnd: "2026-08-23",
  metrics: { executionPercent: 69, painDays: 0, redDays: 0, techniqueFlags: 0, stoppedSessions: 0 },
  signals: {
    evidence: {
      domains: {
        STRENGTH: { planned: 3, completed: 3, percent: 100 },
        RUNNING: { planned: 3, completed: 1, percent: 33 },
        CORE: { planned: 2, completed: 2, percent: 100 },
        FUELING: { planned: 7, completed: 5, percent: 71 }
      }
    }
  }
};

const command = {
  id: "weekly-command",
  status: "PROPOSED",
  code: "REBALANCE",
  tone: "gold",
  headline: "Rebalance the weekly demand",
  detail: "Execution is below the committed dose.",
  proposedChanges: [
    { domain: "RUNNING", label: "Running", action: "EASY_ONLY", detail: "Keep the next run easy." },
    { domain: "FUELING", label: "Fuel", action: "LOG_FIRST", detail: "Close the daily total before changing targets." }
  ]
};

test("weekly replanning compares prescribed work with secured evidence", () => {
  const model = replanning.buildReplan({ proposal, command, currentWeek: week("2026-08-10"), proposedWeek: week("2026-08-17", { extraStrength: true, runningMinutes: 35 }) });
  assert.equal(replanning.VERSION, "028D.1");
  assert.deepEqual(model.evidence, { planned: 15, completed: 11, adherencePercent: 73 });
  assert.equal(model.limiter.code, "RUNNING");
  assert.equal(model.limiter.value, "1/3 complete");
  assert.equal(model.current.trainingWindows, 3);
  assert.equal(model.next.trainingWindows, 4);
  assert.equal(model.approval.required, true);
});

test("the proposal exposes an exact before and after schedule", () => {
  const model = replanning.buildReplan({ proposal, command, currentWeek: week("2026-08-10"), proposedWeek: week("2026-08-17", { extraStrength: true, runningMinutes: 35 }) });
  const strength = model.domains.find((item) => item.code === "STRENGTH");
  const running = model.domains.find((item) => item.code === "RUNNING");
  assert.equal(strength.beforeLabel, "1 session / 60 min");
  assert.equal(strength.afterLabel, "2 sessions / 115 min");
  assert.equal(running.delta, "-5 min");
  assert.equal(model.adjustments.find((item) => item.domain === "RUNNING").after, "1 session / 35 min");
});

test("pain overrides adherence as the limiting factor", () => {
  const model = replanning.buildReplan({ proposal: { ...proposal, metrics: { ...proposal.metrics, painDays: 1 } }, command, currentWeek: week("2026-08-10"), proposedWeek: week("2026-08-17") });
  assert.equal(model.limiter.code, "RECOVERY");
  assert.equal(model.limiter.label, "Pain signal");
  assert.match(model.limiter.detail, /blocks progression/i);
});

test("one weekly decision creates a durable approval receipt", () => {
  const model = replanning.buildReplan({ proposal, command, currentWeek: week("2026-08-10"), proposedWeek: week("2026-08-17", { runningMinutes: 35 }) });
  const receipt = replanning.decisionReceipt(model, "APPROVED", "2026-08-16T12:00:00.000Z");
  assert.equal(receipt.status, "APPROVED");
  assert.equal(receipt.targetWeekStart, "2026-08-17");
  assert.equal(receipt.limitingFactor.code, "RUNNING");
  assert.equal(receipt.changes.length, 2);
  assert.equal(receipt.before.plannedMinutes, 120);
  assert.equal(receipt.after.plannedMinutes, 115);
});
