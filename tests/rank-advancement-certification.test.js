const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/rank-advancement-certification.js");

const requirements = [
  { requirement: "finalized_inspections", actual: 2, target: 2, passed: true },
  { requirement: "average_discipline_score", actual: 78, target: 70, passed: true },
  { requirement: "average_evidence_coverage", actual: 82, target: 60, passed: true }
];
const inspections = [
  { id: "inspection-1", weekStartDate: "2026-08-10", finalizedAt: "2026-08-17T01:00:00Z", score: 77, evidenceCoverage: 80 },
  { id: "inspection-2", weekStartDate: "2026-08-17", finalizedAt: "2026-08-24T01:00:00Z", score: 79, evidenceCoverage: 84 }
];
const executionCertifications = [{
  id: "execution-2",
  weekStart: "2026-08-17",
  weekRevision: 4,
  contractRevision: 12,
  status: "CERTIFIED",
  locked: true,
  fingerprint: "execution-proof-2",
  certifiedAt: "2026-08-24T01:00:00Z"
}];

function eligible(overrides = {}) {
  return {
    currentRank: "RECRUIT",
    targetRank: "CADET",
    eligibility: { status: "ELIGIBLE", requirements },
    inspections,
    executionCertifications,
    standards: [],
    history: [],
    ...overrides
  };
}

test("certifies one immutable advancement from exact finalized-week proof", () => {
  const receipt = engine.certify({ ...eligible(), certifiedAt: "2026-08-24T02:00:00Z" });
  assert.equal(receipt.status, "CERTIFIED");
  assert.equal(receipt.locked, true);
  assert.equal(receipt.priorRank, "RECRUIT");
  assert.equal(receipt.newRank, "CADET");
  assert.equal(receipt.proof.inspections.length, 2);
  assert.equal(receipt.proof.latestExecution.id, "execution-2");
  assert.equal(receipt.proof.latestExecution.fingerprint, "execution-proof-2");
  assert.match(receipt.id, /^rank_advancement_certification:RECRUIT:CADET:/);
});

test("eligibility alone cannot promote without the latest certified execution seal", () => {
  const result = engine.assess(eligible({ executionCertifications: [] }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.canCertify, false);
  assert.ok(result.issues.some((item) => item.code === "LATEST_EXECUTION_NOT_CERTIFIED"));
  assert.equal(result.repair.code, "CERTIFY_WEEK");
});

test("open standards and skipped ranks stop advancement", () => {
  const standard = engine.assess(eligible({ standards: [{ id: "case-1", status: "CONFIRMED" }] }));
  assert.ok(standard.issues.some((item) => item.code === "OPEN_STANDARD"));

  const skipped = engine.assess(eligible({ targetRank: "OPERATOR" }));
  assert.ok(skipped.issues.some((item) => item.code === "INVALID_RANK_TRANSITION"));
});

test("a locked transition is idempotent and new evidence cannot rewrite it", () => {
  const receipt = engine.certify({ ...eligible(), certifiedAt: "2026-08-24T02:00:00Z" });
  const exact = engine.certify(eligible({ history: [receipt] }));
  assert.equal(exact.id, receipt.id);
  assert.equal(exact.idempotent, true);

  const changed = engine.certify(eligible({
    history: [receipt],
    inspections: inspections.map((item) => item.id === "inspection-2" ? { ...item, score: 100 } : item)
  }));
  assert.equal(changed.id, receipt.id);
  assert.equal(changed.fingerprint, receipt.fingerprint);
  assert.equal(changed.lateEvidence, true);
  assert.notEqual(changed.observedFingerprint, receipt.fingerprint);
});

test("history derives one current rank and rejects a broken chain", () => {
  const first = engine.certify({ ...eligible(), certifiedAt: "2026-08-24T02:00:00Z" });
  const second = engine.certify(eligible({
    currentRank: "CADET",
    targetRank: "OPERATOR",
    history: [first],
    certifiedAt: "2026-09-28T02:00:00Z"
  }));
  const chain = engine.validateHistory([second, first]);
  assert.equal(chain.valid, true);
  assert.equal(chain.currentRank, "OPERATOR");

  const broken = engine.validateHistory([{ ...second, currentRank: "VANGUARD", priorRank: "VANGUARD", targetRank: "DOMINION", newRank: "DOMINION" }, first]);
  assert.equal(broken.valid, false);
});

test("history keeps the first locked receipt for a transition", () => {
  const first = engine.certify({ ...eligible(), certifiedAt: "2026-08-24T02:00:00Z" });
  const competing = { ...first, id: "competing", fingerprint: "different" };
  const history = engine.upsertHistory([first], competing);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, first.id);
});
