const test = require("node:test");
const assert = require("node:assert/strict");
const intervention = require("../assets/js/atlas-intervention.js");

function proposal(code, overrides = {}) {
  return {
    id: `adaptive-2026-08-03-${code.toLowerCase()}`,
    code,
    status: ["PROTECT", "DELOAD", "REBALANCE", "PROGRESS"].includes(code) ? "PROPOSED" : "CURRENT",
    confidence: "HIGH",
    effectiveDate: "2026-08-04",
    reviewDate: "2026-08-10",
    signals: {
      readiness: { painDays: 0, strainFlag: false, averageEnergy: 7.4 },
      evidence: { adherencePercent: 86 }
    },
    changes: [{ domain: "STRENGTH", label: "Bounded change", detail: "Reviewable." }],
    ...overrides
  };
}

test("022A reduces a coaching proposal to one priority and one move", () => {
  const result = intervention.buildIntervention(proposal("DELOAD"));
  assert.equal(result.issue, "Fatigue is accumulating");
  assert.equal(result.move, "Reduce today's strength and running demand.");
  assert.equal(result.stateLabel, "YOUR CALL");
  assert.equal(result.canApprove, false);
});

test("022A asks one short validation question only when judgment is required", () => {
  const result = intervention.buildIntervention(proposal("PROGRESS"));
  assert.equal(result.question.id, "clean-execution");
  assert.equal(result.question.answers.length, 2);
  assert.equal(intervention.buildIntervention(proposal("HOLD")).question, null);
});

test("022A makes approval contingent on the recruit answer", () => {
  const initial = intervention.buildIntervention(proposal("DELOAD"));
  const response = intervention.answerIntervention(initial, "YES_SYSTEMIC", "2026-08-03T12:00:00.000Z");
  const answered = intervention.buildIntervention(proposal("DELOAD"), response);
  assert.equal(answered.canApprove, true);
  assert.equal(answered.primaryLabel, "Approve reduced demand");
  assert.equal(answered.response.label, "Yes — reduce demand");
});

test("022A lets the recruit reject a progression without mutating the plan", () => {
  const initial = intervention.buildIntervention(proposal("PROGRESS"));
  const response = intervention.answerIntervention(initial, "NO_NOT_READY", "2026-08-03T12:00:00.000Z");
  const answered = intervention.buildIntervention(proposal("PROGRESS"), response);
  assert.equal(answered.canApprove, false);
  assert.equal(answered.canHold, true);
  assert.equal(answered.primaryLabel, "Keep current plan");
});

test("022A preserves the question and answer on the reviewable proposal", () => {
  const source = proposal("REBALANCE");
  const initial = intervention.buildIntervention(source);
  const response = intervention.answerIntervention(initial, "TIME", "2026-08-03T12:00:00.000Z");
  const attached = intervention.attachResponse(source, response);
  assert.equal(attached.status, "PROPOSED");
  assert.equal(attached.atlasIntervention.issue, "The week is not executable");
  assert.equal(attached.atlasIntervention.response.answerId, "TIME");
});

test("022A keeps safety-first pain feedback from silently restoring training", () => {
  const source = proposal("PROTECT", {
    signals: { readiness: { painDays: 1, strainFlag: false, averageEnergy: 6 }, evidence: { adherencePercent: 80 } }
  });
  const initial = intervention.buildIntervention(source);
  const response = intervention.answerIntervention(initial, "NO_LIMITING", "2026-08-03T12:00:00.000Z");
  const answered = intervention.buildIntervention(source, response);
  assert.equal(answered.canApprove, false);
  assert.equal(answered.needsRollCallReview, true);
  assert.equal(answered.primaryLabel, "Review Roll Call");
});

console.log("Build 022A Atlas Intervention tests passed.");
