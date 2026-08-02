const test = require("node:test");
const assert = require("node:assert/strict");
const revision = require("../assets/js/outcome-plan-revision.js");

const baseline = {
  id: "nutrition-1",
  goal: "FAT_LOSS",
  effectiveDate: "2026-07-01",
  recoveryTargets: { calories: 2200, protein: 180, carbs: 240, fat: 70 },
  trainingTargets: { calories: 2350, protein: 180, carbs: 270, fat: 70 },
  trainingAdjustments: { calories: 150, carbs: 30 }
};

const outcome = {
  confidence: 82,
  goal: "LOSE_FAT",
  review: {
    id: "body-review-1",
    status: "AUTHORIZED",
    checkpoints: 4,
    elapsedDays: 28,
    sourceLatestDate: "2026-08-01"
  }
};

const validInput = (overrides = {}) => ({
  today: "2026-08-02",
  outcome,
  outcomeReview: outcome.review,
  contract: { primaryGoal: "LOSE_FAT" },
  nutritionBaseline: baseline,
  readiness: { value: 7.2, pain: false },
  generatedAt: "2026-08-02T12:00:00Z",
  ...overrides
});

test("the next operating week begins on the next Monday", () => {
  assert.equal(revision.nextOperatingWeek("2026-08-02"), "2026-08-03");
  assert.equal(revision.nextOperatingWeek("2026-08-03"), "2026-08-10");
});

test("investigation blocks an unauthorized or low-confidence review", () => {
  const unauthorized = revision.buildProposal(validInput({
    outcomeReview: { ...outcome.review, status: "PROPOSED" }
  }));
  assert.equal(unauthorized.status, "HOLD");
  assert.equal(unauthorized.plansChanged, false);
  assert.match(unauthorized.detail, /authorized/i);

  const lowConfidence = revision.buildProposal(validInput({
    outcome: { ...outcome, confidence: 48 }
  }));
  assert.equal(lowConfidence.status, "HOLD");
  assert.match(lowConfidence.detail, /confidence/i);
});

test("recovery and pain signals create a safety hold", () => {
  const lowReadiness = revision.buildProposal(validInput({ readiness: { value: 4.2, pain: false } }));
  const pain = revision.buildProposal(validInput({ readiness: { value: 8, pain: true } }));
  assert.equal(lowReadiness.status, "HOLD");
  assert.equal(pain.status, "HOLD");
  assert.equal(lowReadiness.investigation.clear, false);
  assert.equal(pain.investigation.clear, false);
});

test("authorized evidence produces one bounded nutrition revision", () => {
  const proposal = revision.buildProposal(validInput());
  assert.equal(proposal.status, "DRAFT");
  assert.equal(proposal.lever, "NUTRITION");
  assert.equal(proposal.effectiveDate, "2026-08-03");
  assert.equal(proposal.observationEnd, "2026-08-16");
  assert.equal(proposal.currentPlan.recoveryTargets.calories, 2200);
  assert.equal(proposal.proposedPlan.recoveryTargets.calories, 2090);
  assert.equal(proposal.proposedPlan.recoveryTargets.protein, 180);
  assert.equal(proposal.proposedPlan.change.trainingChanged, false);
  assert.equal(proposal.plansChanged, false);
});

test("approval schedules the revision but does not silently activate it", () => {
  const proposal = revision.buildProposal(validInput());
  const approved = revision.resolveProposal(proposal, "APPROVE", {
    resolvedAt: "2026-08-02T13:00:00Z",
    userId: "recruit-1"
  });
  assert.equal(approved.status, "SCHEDULED");
  assert.equal(approved.plansChanged, false);
  assert.equal(revision.refreshLifecycle(approved, "2026-08-02").status, "SCHEDULED");
  assert.equal(revision.refreshLifecycle(approved, "2026-08-03").status, "OBSERVING");
  assert.equal(revision.refreshLifecycle(approved, "2026-08-17").status, "REVIEW_DUE");
});

test("keep-current and reassess decisions preserve the approved plan", () => {
  const proposal = revision.buildProposal(validInput());
  const held = revision.resolveProposal(proposal, "KEEP_CURRENT", { resolvedAt: "2026-08-02T13:00:00Z" });
  const deferred = revision.resolveProposal(proposal, "REASSESS_LATER", { resolvedAt: "2026-08-02T13:00:00Z" });
  assert.equal(held.status, "HELD");
  assert.equal(deferred.status, "DEFERRED");
  assert.equal(deferred.reassessDate, "2026-08-09");
  assert.equal(held.plansChanged, false);
  assert.equal(deferred.plansChanged, false);
});

test("the observation closes with an explicit retain or rollback decision", () => {
  const observing = {
    ...revision.resolveProposal(revision.buildProposal(validInput()), "APPROVE"),
    status: "REVIEW_DUE"
  };
  const retained = revision.completeObservation(observing, "RETAIN", { closedAt: "2026-08-17T12:00:00Z" });
  const reverted = revision.completeObservation(observing, "ROLLBACK", { closedAt: "2026-08-17T12:00:00Z", rollbackBaselineId: "nutrition-rollback" });
  assert.equal(retained.status, "RETAINED");
  assert.equal(reverted.status, "REVERTED");
  assert.equal(reverted.rollbackBaselineId, "nutrition-rollback");
});

