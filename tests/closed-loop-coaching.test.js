const assert = require("assert");
const loop = require("../assets/js/closed-loop.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

function input(overrides = {}) {
  return {
    date: "2026-07-29",
    generatedAt: "2026-07-29T12:00:00.000Z",
    readiness: { state: "GREEN", pain: false, energy: 8, soreness: 3 },
    prescription: {
      posture: "EXECUTE",
      mission: "Execute the approved strength and core plan.",
      domains: {
        training: { planned: true, title: "Strength", target: "3 controlled movements" },
        running: { planned: false, title: "Running" },
        core: { planned: true, title: "Core", target: "15 minute approved session" },
        fueling: { planned: true, title: "Fueling", target: "Approved daily targets" },
        recovery: { planned: true, title: "Recovery", target: "Mobility and sleep window" },
        record: { planned: true, title: "Dominion Record", target: "Close today's record" }
      }
    },
    ...overrides
  };
}

function completeActual(overrides = {}) {
  return {
    training: { complete: true, evidenceCount: 3, sourceIds: ["strength-1"], quality: "CONTROLLED", effort: 7 },
    core: { complete: true, evidenceCount: 3, sourceIds: ["core-1"], quality: "CONTROLLED", effort: 7 },
    fueling: { complete: true, evidenceCount: 1, sourceIds: ["fuel-1"] },
    recovery: { complete: true, evidenceCount: 1, sourceIds: ["recovery-1"] },
    record: { complete: true, evidenceCount: 1, sourceIds: ["record-1"] },
    ...overrides
  };
}

test("current readiness is required before a decision", () => {
  const decision = loop.createDecisionSnapshot(input({ readiness: {} }));
  assert.equal(decision.valid, false);
  assert.equal(decision.status, "OBSERVATION_REQUIRED");
});

test("decision snapshot is deterministic for the same evidence", () => {
  const left = loop.createDecisionSnapshot(input());
  const right = loop.createDecisionSnapshot(input());
  assert.equal(left.id, right.id);
  assert.equal(left.fingerprint, right.fingerprint);
});

test("pain always creates a protect decision", () => {
  const decision = loop.createDecisionSnapshot(input({ readiness: { state: "RED", pain: true } }));
  assert.equal(decision.posture, "PROTECT / RECOVER");
  assert.equal(decision.safeguards.painOverride, true);
  assert.match(decision.mission, /Hard training is not authorized/);
});

test("execution cannot reconcile before deliberate authorization", () => {
  const draft = loop.createDecisionSnapshot(input());
  assert.equal(loop.reconcileDecision(draft, completeActual()).status, "DECISION_REQUIRED");
});

test("missing required evidence keeps verification open", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const result = loop.reconcileDecision(decision, { training: { complete: true, evidenceCount: 1 } });
  assert.equal(result.status, "EVIDENCE_REQUIRED");
  assert.equal(result.reviewReady, false);
  assert.ok(result.summary.missing > 0);
});

test("execution evidence does not invalidate an approved decision", () => {
  const draftState = loop.buildLoopState(input());
  const decision = loop.approveDecision(draftState.draft);
  const executionState = loop.buildLoopState({
    ...input(),
    decision,
    actual: { training: { partial: true, evidenceCount: 1, sourceIds: ["strength-set-1"] } }
  });
  assert.equal(executionState.decision.id, decision.id);
  assert.equal(executionState.decision.status, "APPROVED");
  assert.equal(executionState.current.code, "EXECUTE");
});

test("worsening readiness requires a new authorization", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const changed = loop.buildLoopState({
    ...input({ readiness: { state: "RED", pain: true, energy: 3, soreness: 8 } }),
    decision
  });
  assert.notEqual(changed.draft.id, decision.id);
  assert.equal(changed.decision.status, "DRAFT");
  assert.equal(changed.current.code, "AUTHORIZE");
  assert.equal(changed.decision.safeguards.painOverride, true);
});

test("verified domain evidence makes the review closable", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const result = loop.reconcileDecision(decision, completeActual());
  assert.equal(result.status, "REVIEW_READY");
  assert.equal(result.summary.completionPercent, 100);
  assert.equal(result.summary.confidence, "HIGH");
});

test("closed review proposes bounded progression without mutating a plan", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const reconciliation = loop.reconcileDecision(decision, completeActual());
  const result = loop.closeReview(decision, reconciliation, { closedAt: "2026-07-29T21:00:00.000Z" });
  assert.equal(result.valid, true);
  assert.equal(result.review.adaptation.code, "PROGRESS_CANDIDATE");
  assert.equal(result.review.adaptation.bounds.automaticPlanMutation, false);
  assert.equal(result.review.adaptation.bounds.maximumLoadIncreasePercent, 5);
});

test("technique limitation blocks progression", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const reconciliation = loop.reconcileDecision(decision, completeActual({
    training: { complete: true, evidenceCount: 1, quality: "TECHNIQUE_LIMITED", effort: 9 }
  }));
  assert.equal(loop.deriveAdaptation(decision, reconciliation).code, "REGRESS");
});

test("pain history keeps the next adaptation protective", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const reconciliation = loop.reconcileDecision(decision, completeActual());
  const adaptation = loop.deriveAdaptation(decision, reconciliation, {
    history: [{ adaptation: { code: "PROTECT" } }]
  });
  assert.equal(adaptation.code, "PROTECT");
});

test("adaptation remains proposed until approved", () => {
  const decision = loop.approveDecision(loop.createDecisionSnapshot(input()));
  const reconciliation = loop.reconcileDecision(decision, completeActual());
  const proposed = loop.deriveAdaptation(decision, reconciliation);
  const approved = loop.approveAdaptation(proposed, "2026-07-29T22:00:00.000Z", "2026-07-30");
  assert.equal(proposed.status, "PROPOSED");
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.effectiveDate, "2026-07-30");
});

test("six loop phases advance from decision to adaptation", () => {
  const draftState = loop.buildLoopState(input());
  assert.equal(draftState.phases.length, 6);
  assert.equal(draftState.current.code, "AUTHORIZE");
  const decision = loop.approveDecision(draftState.draft);
  const executionState = loop.buildLoopState({ ...input(), decision, actual: completeActual() });
  assert.equal(executionState.current.code, "VERIFY");
});

console.log(`Closed-loop coaching: ${passed} tests passed.`);
