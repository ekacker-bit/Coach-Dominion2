const test = require("node:test");
const assert = require("node:assert/strict");

const integrity = require("../assets/js/daily-decision-integrity.js");

const date = "2026-08-15";
const plans = [
  { id: "strength", label: "Strength plan", complete: true, status: "APPROVED", section: "performance" },
  { id: "running", label: "Running plan", complete: true, status: "APPROVED", section: "performance" },
  { id: "core", label: "Core plan", complete: true, status: "APPROVED", section: "performance" },
  { id: "nutrition", label: "Fuel plan", complete: true, status: "APPROVED", section: "nutrition" }
];

function base(overrides = {}) {
  return {
    operatingDate: date,
    decidedAt: `${date}T12:00:00.000Z`,
    truth: { state: "TODAY", date },
    command: { state: "EXECUTION_REQUIRED" },
    day: { date, activities: [{ id: "run-long", module: "running", title: "Long run", estimatedMinutes: 85, sessionWindow: "AM" }], longRunUncapped: true },
    plans,
    queue: { total: 2, completed: 0, steps: [{ id: "run-long", module: "running", state: "READY", label: "Long run" }, { id: "fuel", module: "nutrition", state: "READY", label: "Fuel totals" }] },
    readinessComplete: true,
    readiness: { classification: "READY", confidence: 84, energy: 8, soreness: 2, pain: false },
    nutritionEvidence: { date, record: null },
    ...overrides
  };
}

test("027F exposes one stable canonical decision", () => {
  const first = integrity.resolve(base());
  const second = integrity.resolve(base({ decidedAt: `${date}T14:00:00.000Z` }));
  assert.equal(integrity.VERSION, "027F.1");
  assert.equal(first.id, second.id);
  assert.equal(first.operatingDate, date);
  assert.equal(first.decisionVersion, "027F.1");
  assert.equal(first.authorizedTraining, true);
  assert.equal(first.primaryAction.module, "running");
  assert.equal(integrity.consistencyReport(first).valid, true);
});

test("all active plans authorize scheduled training", () => {
  const decision = integrity.resolve(base());
  assert.equal(decision.status, "TRAINING_AUTHORIZED");
  assert.equal(decision.authorization.running.state, "AUTHORIZED");
  assert.equal(decision.authorization.running.executable, true);
  assert.equal(decision.nutritionContext.trainingDay, true);
});

test("only Core missing blocks Core, not Strength or Running", () => {
  const decision = integrity.resolve(base({
    day: { date, activities: [
      { id: "lower-a", module: "strength", title: "Lower A", estimatedMinutes: 60 },
      { id: "run-easy", module: "running", title: "Easy run", estimatedMinutes: 30 },
      { id: "core-a", module: "core", title: "Core A", estimatedMinutes: 15 }
    ] },
    plans: plans.map((plan) => plan.id === "core" ? { ...plan, complete: false, status: "MISSING" } : plan)
  }));
  assert.equal(decision.status, "PARTIALLY_BLOCKED");
  assert.deepEqual(decision.blocker.affectedDomains, ["core"]);
  assert.equal(decision.authorization.core.blocked, true);
  assert.equal(decision.authorization.strength.authorized, true);
  assert.equal(decision.authorization.running.authorized, true);
  assert.equal(decision.nutritionContext.trainingDay, true);
});

test("a running assignment remains executable while Core is missing", () => {
  const decision = integrity.resolve(base({ plans: plans.map((plan) => plan.id === "core" ? { ...plan, complete: false, status: "MISSING" } : plan) }));
  assert.equal(decision.primaryAction.label, "Start Long run");
  assert.equal(decision.authorization.running.executable, true);
  assert.equal(integrity.moduleState(decision, "core").status, "BLOCKED");
  assert.equal(integrity.moduleState(decision, "running").status, "AUTHORIZED");
});

test("completed running evidence survives an unrelated Core blocker", () => {
  const decision = integrity.resolve(base({
    plans: plans.map((plan) => plan.id === "core" ? { ...plan, complete: false, status: "MISSING" } : plan),
    executions: { running: { state: "COMPLETE", completedAt: `${date}T14:00:00.000Z` } }
  }));
  assert.equal(decision.completedSessions.length, 1);
  assert.equal(decision.completedSessions[0].module, "running");
  assert.equal(decision.authorization.running.state, "COMPLETED");
  assert.equal(decision.nutritionContext.type, "POST_TRAINING");
  assert.equal(decision.primaryAction.section, "nutrition");
  assert.equal(integrity.consistencyReport(decision).valid, true);
});

test("an explicit recovery day stays distinct from a missing calendar", () => {
  const recovery = integrity.resolve(base({ day: { date, activities: [] } }));
  const missing = integrity.resolve(base({ day: null }));
  assert.equal(recovery.status, "RECOVERY_DAY");
  assert.equal(recovery.recoveryDay, true);
  assert.equal(recovery.nutritionContext.type, "RECOVERY_DAY");
  assert.equal(missing.status, "EMPTY");
  assert.equal(missing.primaryAction.section, "calendar");
});

test("scheduled training with missing execution evidence exposes the session action", () => {
  const decision = integrity.resolve(base({ queue: { total: 1, completed: 0, steps: [{ id: "run-long", module: "running", state: "READY", label: "Long run", actionLabel: "Start run" }] } }));
  assert.equal(decision.requiredEvidence.length, 1);
  assert.equal(decision.primaryAction.action, "START");
  assert.equal(decision.evidence.coverage, 0);
});

test("stale nutrition never rewrites a scheduled training day as recovery", () => {
  const decision = integrity.resolve(base({ nutritionEvidence: { date: "2026-08-14", record: { date: "2026-08-14", calories: 2200 } } }));
  assert.equal(decision.evidence.freshness, "STALE");
  assert.equal(decision.nutritionContext.trainingDay, true);
  assert.match(decision.nutritionContext.detail, /Update today's calories/);
  assert.equal(decision.authorization.running.authorized, true);
});

test("one assessed day and five unscored days lead with coverage", () => {
  const summary = integrity.reviewSummary({
    elapsedDayCount: 6,
    evidenceCoverage: 17,
    score: 100,
    counts: { assessedDays: 1, unscoredDays: 5 },
    strongestDomains: ["strength"],
    weakestDomains: ["nutrition"]
  });
  assert.equal(summary.headline, "1 of 6 elapsed days assessed");
  assert.equal(summary.scoreText, "100% of assessed observations");
  assert.equal(summary.scoreEmphasis, false);
  assert.equal(summary.strongest, null);
  assert.equal(summary.weakest, null);
});

test("finalized Contract and amendment mode stay visually distinct", () => {
  assert.equal(integrity.contractMode({ signed: true, draft: null }), "FINALIZED");
  assert.equal(integrity.contractMode({ signed: true, draft: { id: "draft" } }), "AMENDMENT");
  assert.equal(integrity.contractMode({ signed: false }), "SETUP");
});

test("mobile destinations are exact and secondary areas remain in More", () => {
  assert.deepEqual(integrity.resolveMobileDestination("today"), { section: "today" });
  assert.deepEqual(integrity.resolveMobileDestination("train"), { section: "performance", performanceView: "today_training" });
  assert.deepEqual(integrity.resolveMobileDestination("fuel"), { section: "nutrition" });
  assert.deepEqual(integrity.resolveMobileDestination("review"), { section: "inspection" });
  assert.equal(integrity.resolveMobileDestination("more").dialog, "mobile-more-dialog");
  assert.equal(integrity.mobileNavForSection("calendar"), "more");
  assert.equal(integrity.mobileNavForSection("connected"), "more");
});

test("connection states distinguish setup, demo, stale, failure, and current", () => {
  const now = new Date("2026-08-15T12:00:00.000Z");
  assert.equal(integrity.connectionState({ status: "NOT_CONNECTED" }, now).state, "SETUP_REQUIRED");
  assert.equal(integrity.connectionState({ status: "CONNECTED", isSimulated: true }, now).state, "DEMO");
  assert.equal(integrity.connectionState({ status: "CONNECTED", lastSyncAt: "2026-07-27T12:00:00.000Z" }, now).state, "STALE");
  assert.equal(integrity.connectionState({ status: "FAILED" }, now).state, "IMPORT_FAILED");
  assert.equal(integrity.connectionState({ status: "CONNECTED", lastSyncAt: "2026-08-15T10:00:00.000Z" }, now).state, "CURRENT");
});
