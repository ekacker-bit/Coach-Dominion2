const test = require("node:test");
const assert = require("node:assert/strict");
const coach = require("../assets/js/atlas-closed-loop.js");

const date = "2026-08-20";
const closeout = { date, status: "SEALED", revision: 1 };
const entries = [
  { module: "strength", state: "completed", complete: true, verified: false },
  { module: "running", state: "verified", complete: true, verified: true },
  { module: "core", state: "completed", complete: true, verified: false },
  { module: "nutrition", state: "completed", complete: true, verified: false }
];
const ledger = (overrides = {}) => ({
  date,
  entries,
  total: 4,
  completed: 4,
  complete: true,
  fingerprint: "execution-ledger:2026-08-20:abc123",
  consistency: { consistent: true, issues: [] },
  ...overrides
});
const input = (overrides = {}) => ({
  date,
  closeout,
  ledger: ledger(),
  readiness: { state: "GREEN", pain: false },
  effort: 7,
  contractRevision: 12,
  weekRevision: 4,
  generatedAt: "2026-08-21T01:00:00.000Z",
  ...overrides
});

test("030I waits for a sealed closeout", () => {
  const decision = coach.buildDecision(input({ closeout: null }));
  assert.equal(decision.status, "EVIDENCE_OPEN");
  assert.equal(decision.verdict, null);
});

test("030I proposes one conservative advance from complete GREEN evidence", () => {
  const decision = coach.buildDecision(input());
  assert.equal(decision.version, "030I.1");
  assert.equal(decision.verdict, "ADVANCE");
  assert.equal(decision.status, "PROPOSED");
  assert.deepEqual(decision.targetDomains, ["strength"]);
  assert.equal(decision.effectiveDate, "2026-08-21");
  assert.equal(decision.requiresApproval, true);
});

test("030I applies an accepted advance to one eligible primary target", () => {
  const proposed = coach.buildDecision(input());
  const approved = coach.resolveDecision(proposed, "ACCEPT", { resolvedAt: "2026-08-21T01:05:00.000Z" });
  const strength = coach.applyToStrength({ date: approved.effectiveDate, estimatedMinutes: 60, exercises: [{ id: "SQUAT", sets: 4, load: 200, unit: "lb" }, { id: "RDL", sets: 3, load: 185, unit: "lb" }] }, approved, approved.effectiveDate);
  const running = coach.applyToRunning({ date: approved.effectiveDate, session: { distance: 5, estimatedMinutes: 45, type: "EASY" } }, approved, approved.effectiveDate);
  assert.equal(approved.status, "APPROVED");
  assert.equal(strength.exercises[0].load, 205);
  assert.equal(strength.exercises[1].load, 185);
  assert.equal(running.session.distance, 5);
});

test("030I keeps the current plan automatically when evidence supports no change", () => {
  const decision = coach.buildDecision(input({ readiness: { state: "YELLOW", pain: false } }));
  assert.equal(decision.verdict, "MAINTAIN");
  assert.equal(decision.status, "ACTIVE");
  assert.equal(decision.requiresApproval, false);
  assert.equal(coach.calendarOverride(decision, "2026-08-21").verdict, "MAINTAIN");
});

test("030I proposes a bounded reduction when less than 75 percent is secured", () => {
  const reducedEntries = entries.map((entry, index) => index === 0 ? entry : { ...entry, state: "scheduled", complete: false, verified: false });
  const decision = coach.buildDecision(input({ ledger: ledger({ entries: reducedEntries, total: 4, completed: 1, complete: false, fingerprint: "low" }) }));
  assert.equal(decision.verdict, "REDUCE");
  assert.equal(decision.status, "PROPOSED");
  const approved = coach.resolveDecision(decision, "ACCEPT");
  const run = coach.applyToRunning({ session: { distance: 10, estimatedMinutes: 60, type: "TEMPO" } }, approved, approved.effectiveDate);
  assert.equal(run.session.distance, 8);
  assert.equal(run.session.estimatedMinutes, 48);
  assert.equal(run.session.type, "EASY");
});

test("030I makes pain a non-negotiable recovery hold without changing Fuel", () => {
  const decision = coach.buildDecision(input({ readiness: { state: "RED", pain: true } }));
  assert.equal(decision.verdict, "RECOVER");
  assert.equal(decision.status, "ACTIVE");
  assert.equal(decision.safetyOverride, true);
  const strength = coach.applyToStrength({ state: "READY", estimatedMinutes: 60, exercises: [{ sets: 4, load: 225 }] }, decision, decision.effectiveDate);
  const core = coach.applyToCore({ status: "READY", session: { estimatedMinutes: 20 }, exercises: [{ sets: 3 }] }, decision, decision.effectiveDate);
  assert.equal(strength.state, "RECOVERY ONLY");
  assert.equal(core.status, "SAFETY_HOLD");
  assert.ok(!decision.targetDomains.includes("nutrition"));
});

test("030I blocks decisions when assignment evidence is inconsistent", () => {
  const decision = coach.buildDecision(input({ ledger: ledger({ consistency: { consistent: false, issues: [{ code: "ORPHAN_EVIDENCE" }] } }) }));
  assert.equal(decision.status, "BLOCKED");
  assert.equal(decision.verdict, null);
  assert.equal(coach.calendarOverride(decision, decision.effectiveDate), null);
});

test("030I never applies a next-day verdict to the wrong date", () => {
  const approved = coach.resolveDecision(coach.buildDecision(input()), "ACCEPT");
  assert.equal(coach.decisionApplies(approved, "2026-08-21"), true);
  assert.equal(coach.decisionApplies(approved, "2026-08-22"), false);
  assert.equal(coach.applyToDay({ date: "2026-08-22", activities: [{ module: "STRENGTH", estimatedMinutes: 60 }] }, approved, "2026-08-22").activities[0].estimatedMinutes, 60);
});

test("030I preserves the recruit's resolution across an unchanged reload", () => {
  const approved = coach.resolveDecision(coach.buildDecision(input()), "ACCEPT", { resolvedAt: "2026-08-21T01:05:00.000Z" });
  const restored = coach.buildDecision(input({ previous: approved, generatedAt: "2026-08-21T02:00:00.000Z" }));
  assert.equal(restored.id, approved.id);
  assert.equal(restored.status, "APPROVED");
  assert.equal(restored.resolvedAt, approved.resolvedAt);
});

test("030I keeps private discipline answers outside training dose logic", () => {
  const first = coach.buildDecision(input({ closeout: { ...closeout, discipline: { score: 0 } } }));
  const second = coach.buildDecision(input({ closeout: { ...closeout, discipline: { score: 100 } } }));
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.verdict, second.verdict);
});
