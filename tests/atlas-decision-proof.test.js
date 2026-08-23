const test = require("node:test");
const assert = require("node:assert/strict");
const proof = require("../assets/js/atlas-decision-proof.js");

const sourceDate = "2026-08-20";
const effectiveDate = "2026-08-21";
const decision = (overrides = {}) => ({
  id: "atlas-loop:2026-08-20:advance",
  fingerprint: "advance-fingerprint",
  date: sourceDate,
  effectiveDate,
  status: "APPROVED",
  verdict: "ADVANCE",
  readiness: { state: "GREEN", pain: false },
  generatedAt: "2026-08-20T23:00:00.000Z",
  ...overrides
});
const ledger = (overrides = {}) => ({
  date: effectiveDate,
  total: 2,
  completed: 2,
  fingerprint: "ledger-complete",
  consistency: { consistent: true, issues: [] },
  entries: [
    { module: "strength", complete: true, verified: true },
    { module: "core", complete: true, verified: true }
  ],
  ...overrides
});
const input = (overrides = {}) => ({
  decision: decision(),
  baselineReadiness: { state: "GREEN", pain: false },
  effectiveReadiness: { state: "GREEN", pain: false },
  ledger: ledger(),
  closeout: { date: effectiveDate, status: "SEALED", revision: 1 },
  today: effectiveDate,
  evaluatedAt: `${effectiveDate}T23:30:00.000Z`,
  ...overrides
});

test("030J gives every coaching call a measurable expectation", () => {
  assert.equal(proof.VERSION, "030J.1");
  assert.match(proof.expectationFor("ADVANCE").text, /Complete the adjusted work/);
  assert.match(proof.expectationFor("RECOVER").text, /clearer readiness signal/);
  assert.equal(proof.attachExpectation(decision()).expectation.code, "EXECUTE_ADVANCE");
});

test("030J waits for the effective-day Closeout before claiming an outcome", () => {
  const result = proof.buildProof(input({ closeout: null }));
  assert.equal(result.status, "WAITING");
});

test("030J verifies a successful advance from next-day execution and readiness", () => {
  const result = proof.buildProof(input());
  assert.equal(result.status, "EVALUATED");
  assert.equal(result.code, "WORKED");
  assert.equal(result.verified, true);
  assert.equal(result.evidence.completionPercent, 100);
  assert.equal(result.confidence, "HIGH");
});

test("030J refuses to call conflicted assignment evidence a result", () => {
  const result = proof.buildProof(input({ ledger: ledger({ consistency: { consistent: false, issues: [{ code: "ORPHAN_EVIDENCE" }] } }) }));
  assert.equal(result.code, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.verified, false);
});

test("030J refuses to claim success without the effective-day readiness signal", () => {
  const result = proof.buildProof(input({ effectiveReadiness: { state: "UNKNOWN", pain: false } }));
  assert.equal(result.code, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.verified, false);
});

test("030J marks pain after an adjustment as a miss", () => {
  const result = proof.buildProof(input({ effectiveReadiness: { state: "RED", pain: true } }));
  assert.equal(result.code, "MISSED");
  assert.equal(result.evidence.pain, true);
});

test("030J holds a new change while the prior coaching call is still settling", () => {
  const prior = decision({ id: "prior", effectiveDate: "2026-08-20", status: "APPROVED" });
  const candidate = decision({ id: "candidate", date: "2026-08-20", effectiveDate: "2026-08-21", verdict: "REDUCE", status: "PROPOSED" });
  const held = proof.applyCooldown(candidate, [prior], [], null);
  assert.equal(held.verdict, "MAINTAIN");
  assert.equal(held.status, "ACTIVE");
  assert.equal(held.cooldown.active, true);
  assert.equal(held.cooldown.priorOutcome, "PENDING");
});

test("030J permits a conservative correction after a missed advance", () => {
  const prior = decision({ id: "prior", effectiveDate: "2026-08-20", status: "APPROVED" });
  const candidate = decision({ id: "candidate", effectiveDate: "2026-08-21", verdict: "REDUCE", status: "PROPOSED" });
  const result = proof.applyCooldown(candidate, [prior], [{ decisionId: "prior", code: "MISSED" }], null);
  assert.equal(result.verdict, "REDUCE");
  assert.equal(result.status, "PROPOSED");
});

test("030J summarizes only the selected decision-proof window", () => {
  const history = [
    { ...proof.buildProof(input()), effectiveDate: "2026-08-21" },
    { ...proof.buildProof(input({ decision: decision({ id: "mixed", verdict: "MAINTAIN" }), ledger: ledger({ completed: 1 }) })), effectiveDate: "2026-08-20", code: "MIXED" },
    { ...proof.buildProof(input()), decisionId: "old", effectiveDate: "2026-07-01" }
  ];
  const result = proof.summarize(history, { today: "2026-08-21", rangeDays: 28 });
  assert.equal(result.evaluated, 2);
  assert.equal(result.counts.WORKED, 1);
  assert.equal(result.counts.MIXED, 1);
});
