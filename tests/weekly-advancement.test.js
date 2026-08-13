const test = require("node:test");
const assert = require("node:assert/strict");

const {
  VERSION,
  buildWeeklyJudgment,
  buildPromotionGates,
  installExperience
} = require("../assets/js/weekly-advancement.js");

function eligibility(overrides = {}) {
  const requirements = [
    { requirement: "finalized_inspections", actual: 1, target: 2, passed: false },
    { requirement: "average_discipline_score", actual: 76, target: 70, passed: true },
    { requirement: "average_evidence_coverage", actual: 68, target: 60, passed: true },
    { requirement: "mission_domain_score", actual: 74, target: 70, passed: true },
    { requirement: "consecutive_qualifying_weeks", actual: 1, target: 1, passed: true },
    { requirement: "unresolved_confirmed_violations", actual: 0, target: 0, passed: true },
    { requirement: "unresolved_level_two_or_three_violations", actual: 0, target: 0, passed: true },
    { requirement: "corrective_period", actual: 1, target: 1, passed: true }
  ];
  return {
    status: "PROGRESSING",
    target: { minimumAverageDisciplineScore: 70, minimumAverageEvidenceCoverage: 60 },
    requirements,
    blockers: ["Finalize one more week"],
    ...overrides
  };
}

test("a live week is explicitly provisional and cannot claim advancement", () => {
  const result = buildWeeklyJudgment({
    inspection: { score: 82, evidenceCoverage: 76, scoreIsProvisional: true, weekComplete: false },
    eligibility: eligibility(),
    standards: []
  });
  assert.equal(result.phase, "IN_PROGRESS");
  assert.equal(result.state, "BUILDING");
  assert.equal(result.qualifying, false);
  assert.ok(Number.isFinite(result.promotionProgress));
});

test("a ready week asks for one deliberate finalization", () => {
  const result = buildWeeklyJudgment({
    inspection: { score: 80, evidenceCoverage: 72, canFinalize: true },
    eligibility: eligibility(),
    standards: []
  });
  assert.equal(result.state, "READY");
  assert.equal(result.nextAction.code, "FINALIZE");
});

test("a finalized qualifying week clearly says it was earned", () => {
  const result = buildWeeklyJudgment({
    inspection: { score: 84, evidenceCoverage: 78, finalizedAt: "2026-08-09T12:00:00Z" },
    eligibility: eligibility(),
    standards: []
  });
  assert.equal(result.state, "EARNED");
  assert.equal(result.qualifying, true);
});

test("missing evidence and open standards never masquerade as success", () => {
  const result = buildWeeklyJudgment({
    inspection: { score: 88, evidenceCoverage: 30, finalizedAt: "2026-08-09T12:00:00Z" },
    eligibility: eligibility(),
    standards: [{ status: "CONFIRMED" }]
  });
  assert.equal(result.state, "NOT_EARNED");
  assert.equal(result.qualifying, false);
  assert.equal(result.nextAction.code, "STANDARDS");
  assert.equal(result.proof.find((item) => item.id === "STANDARDS").passed, false);
});

test("promotion progress collapses detailed rules into four legible gates", () => {
  const gates = buildPromotionGates(eligibility());
  assert.deepEqual(gates.map((gate) => gate.id), ["HISTORY", "EXECUTION", "EVIDENCE", "STANDARDS"]);
  assert.equal(gates[0].passed, false);
  assert.equal(gates.slice(1).every((gate) => gate.passed), true);
  assert.equal(gates.every((gate) => Number.isFinite(gate.progress)), true);
});

test("eligible status produces one promotion order", () => {
  const requirements = eligibility().requirements.map((item) => ({ ...item, actual: item.target, passed: true }));
  const result = buildWeeklyJudgment({
    inspection: { score: 84, evidenceCoverage: 78, finalizedAt: "2026-08-09T12:00:00Z" },
    eligibility: eligibility({ status: "ELIGIBLE", requirements, blockers: [] }),
    standards: [],
    nextRank: "Cadet"
  });
  assert.equal(result.promotionProgress, 100);
  assert.equal(result.nextAction.code, "PROMOTE");
});

test("the experience installer replaces the dormant split UI", () => {
  const section = { dataset: {}, className: "", innerHTML: "legacy", setAttribute() {} };
  const rank = { removed: false, remove() { this.removed = true; } };
  const links = [{ removed: false, remove() { this.removed = true; } }];
  const doc = {
    getElementById(id) { return id === "inspection" ? section : id === "rank" ? rank : null; },
    querySelectorAll() { return links; }
  };
  assert.equal(installExperience(doc), true);
  assert.equal(section.dataset.weeklyAdvancement, VERSION);
  assert.match(section.innerHTML, /Did you earn the week\?/);
  assert.match(section.innerHTML, /Execution\. Evidence\. Standards\./);
  assert.equal(rank.removed, true);
  assert.equal(links[0].removed, true);
});
