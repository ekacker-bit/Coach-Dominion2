const test = require("node:test");
const assert = require("node:assert/strict");
const outcomes = require("../assets/js/atlas-adaptation-outcomes.js");

function proposal(overrides = {}) {
  return {
    id: "atlas-horizon:2026-08-10:abc",
    sourceDate: "2026-08-10",
    effectiveDate: "2026-08-11",
    reviewDate: "2026-08-13",
    status: "APPROVED",
    code: "DELOAD",
    readiness: { latest: { date: "2026-08-10", state: "YELLOW", energy: 4, soreness: 7, pain: false } },
    days: [
      { date: "2026-08-11", directiveCode: "DELOAD", activities: [{ id: "upper", module: "STRENGTH" }] },
      { date: "2026-08-12", directiveCode: "DELOAD", activities: [{ id: "easy", module: "RUNNING" }] },
      { date: "2026-08-13", directiveCode: null, activities: [] }
    ],
    ...overrides
  };
}

function evidence(overrides = {}) {
  return {
    proposal: proposal(),
    readinessHistory: [
      { date: "2026-08-11", state: "YELLOW", energy: 5, soreness: 5 },
      { date: "2026-08-13", state: "GREEN", energy: 7, soreness: 3 }
    ],
    evidenceByDate: [
      { date: "2026-08-11", receipts: [{ state: "COMPLETE" }], closeout: { status: "SEALED" } },
      { date: "2026-08-12", receipts: [{ state: "SECURED" }], closeout: { status: "SEALED" } },
      { date: "2026-08-13", receipts: [], closeout: { status: "SEALED" } }
    ],
    evaluatedAt: "2026-08-14T08:00:00.000Z",
    ...overrides
  };
}

test("Build 026H waits until the bounded window is closed", () => {
  const result = outcomes.buildOutcome(evidence({ evaluatedAt: "2026-08-12T08:00:00.000Z" }));
  assert.equal(result.status, "WAITING");
  assert.equal(result.verified, false);
});

test("Build 026H verifies when a short reduction restores readiness and execution", () => {
  const result = outcomes.buildOutcome(evidence());
  assert.equal(result.version, "026H.1");
  assert.equal(result.code, "HELPED");
  assert.equal(result.verified, true);
  assert.equal(result.calibrationTag, "SHORT_REDUCTION_EFFECTIVE");
  assert.match(result.evidenceSummary, /2 Roll Calls/);
});

test("Build 026H validates holding the plan only with stable readiness and execution", () => {
  const result = outcomes.buildOutcome(evidence({
    proposal: proposal({ status: "CURRENT", code: "CURRENT", readiness: { latest: { date: "2026-08-10", state: "GREEN" } }, days: proposal().days.map((day) => ({ ...day, directiveCode: null })) })
  }));
  assert.equal(result.code, "HELD_STANDARD");
  assert.equal(result.calibrationTag, "CURRENT_PLAN_TOLERATED");
});

test("Build 026H refuses to call an unresolved RED or pain signal successful", () => {
  const result = outcomes.buildOutcome(evidence({
    readinessHistory: [{ date: "2026-08-13", state: "RED", pain: true }],
    evidenceByDate: [{ date: "2026-08-11", receipts: [{ state: "PAIN_HOLD", painReported: true }], closeout: { status: "SEALED" } }]
  }));
  assert.equal(result.code, "NEEDS_REVIEW");
  assert.equal(result.tone, "red");
  assert.match(result.lesson, /Do not repeat/i);
});

test("Build 026H keeps thin evidence inconclusive and out of memory", () => {
  const result = outcomes.buildOutcome(evidence({ readinessHistory: [], evidenceByDate: [] }));
  assert.equal(result.code, "INSUFFICIENT_EVIDENCE");
  assert.equal(result.verified, false);
  assert.equal(result.calibrationEligible, false);
  assert.throws(() => outcomes.resolveOutcome(result, "KEEP_LESSON"), /verified result/i);
});

test("Build 026H excludes challenged conclusions from calibration memory", () => {
  const result = outcomes.buildOutcome(evidence());
  const challenged = outcomes.resolveOutcome(result, "CHALLENGE", { reason: "CONTEXT_MISSING", note: "Travel changed the week", resolvedAt: "2026-08-14T09:00:00.000Z" });
  assert.equal(challenged.status, "CHALLENGED");
  assert.equal(challenged.calibrationEligible, false);
  assert.deepEqual(outcomes.calibrationMemory([challenged]), []);
});

test("Build 026H remembers only acknowledged, verified lessons", () => {
  const result = outcomes.buildOutcome(evidence());
  const acknowledged = outcomes.resolveOutcome(result, "KEEP_LESSON", { resolvedAt: "2026-08-14T09:00:00.000Z" });
  const memory = outcomes.calibrationMemory([acknowledged, { ...result, id: "unacknowledged" }]);
  assert.equal(acknowledged.status, "ACKNOWLEDGED");
  assert.deepEqual(memory.map((item) => item.tag), ["SHORT_REDUCTION_EFFECTIVE"]);
});
