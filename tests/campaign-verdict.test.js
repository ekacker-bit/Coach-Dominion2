const test = require("node:test");
const assert = require("node:assert/strict");
const Verdict = require("../assets/js/campaign-verdict.js");

const contract = {
  id: "contract-27",
  revision: 4,
  primaryGoal: "LOSE_FAT",
  target: "Prove durable body composition change",
  trainingDaysPerWeek: 6,
  strengthDaysPerWeek: 4,
  runningDaysPerWeek: 3,
  coreDaysPerWeek: 4,
  sessionMinutes: 90,
  twoADays: true,
  nutritionCommitment: "Fuel the work"
};

function campaign(overrides = {}) {
  const conditions = ["EXECUTION", "EVIDENCE", "WEEKS", "OUTCOME", "STANDARDS"].map((id) => ({
    id,
    label: id[0] + id.slice(1).toLowerCase(),
    detail: `${id} condition cleared.`,
    passed: true
  }));
  return {
    id: "campaign-27",
    contractId: contract.id,
    contractRevision: contract.revision,
    status: "WON",
    startDate: "2026-05-18",
    endDate: "2026-08-09",
    execution: { rate: 91 },
    evidence: { rate: 94 },
    weekly: { qualifying: 10 },
    objective: { primaryGoal: contract.primaryGoal, target: contract.target },
    conditions,
    ...overrides
  };
}

function bodyOutcome(overrides = {}) {
  return {
    confidence: 92,
    weight: { baselineAverage: 205.4, sevenDayAverage: 190.2 },
    measurements: {
      count: 2,
      summaries: {
        waist: { baseline: 39.5, latest: 35.5, observations: 2, latestDate: "2026-08-08", series: [{ date: "2026-05-18" }, { date: "2026-08-08" }] },
        body_fat: { baseline: 22, latest: 16.8, observations: 2, latestDate: "2026-08-08", series: [{ date: "2026-05-18" }, { date: "2026-08-08" }] }
      }
    },
    ...overrides
  };
}

const performanceEntries = [
  { domain: "STRENGTH", activityCode: "bench", activityName: "Bench press", performanceDate: "2026-05-20", evidenceStatus: "VERIFIED", metrics: { weight: 185, repetitions: 5, weight_unit: "lb" } },
  { domain: "STRENGTH", activityCode: "bench", activityName: "Bench press", performanceDate: "2026-08-05", evidenceStatus: "VERIFIED", metrics: { weight: 205, repetitions: 5, weight_unit: "lb" } },
  { domain: "RUNNING", activityCode: "five-k", activityName: "5K pace", performanceDate: "2026-05-22", evidenceStatus: "SELF_REPORTED", metrics: { distance: 5, duration_seconds: 1800, distance_unit: "km" } },
  { domain: "RUNNING", activityCode: "five-k", activityName: "5K pace", performanceDate: "2026-08-07", evidenceStatus: "VERIFIED", metrics: { distance: 5, duration_seconds: 1620, distance_unit: "km" } }
];

const adaptationOutcomes = [{
  id: "adaptation-1",
  reviewDate: "2026-07-15",
  updatedAt: "2026-07-15T12:00:00.000Z",
  status: "ACKNOWLEDGED",
  verified: true,
  code: "HELPED",
  calibrationTag: "SHORT_REDUCTION_EFFECTIVE",
  headline: "A short reduction restored output",
  lesson: "Reduce secondary volume before cutting the primary session.",
  confidence: "HIGH"
}];

function input(overrides = {}) {
  return {
    today: "2026-08-10",
    campaign: campaign(),
    contract,
    bodyOutcome: bodyOutcome(),
    photos: [{ date: "2026-05-18", angle: "front" }, { date: "2026-08-08", angle: "front" }],
    performanceEntries,
    adaptationOutcomes,
    generatedAt: "2026-08-10T12:00:00.000Z",
    ...overrides
  };
}

test("027E keeps an active campaign in execution mode", () => {
  const result = Verdict.buildVerdict(input({
    today: "2026-06-01",
    campaign: campaign({ status: "ACTIVE", currentWeek: 3 })
  }));
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.nextAction.code, "FINISH_CAMPAIGN");
});

test("027E requires a final body checkpoint before issuing a verdict", () => {
  const result = Verdict.buildVerdict(input({
    bodyOutcome: bodyOutcome({ measurements: { count: 1, summaries: {} } })
  }));
  assert.equal(result.status, "EVIDENCE_DUE");
  assert.equal(result.nextAction.code, "CAPTURE_FINISH");
});

test("027E compares the opening and closing body, photo, and performance record", () => {
  const result = Verdict.buildVerdict(input());
  assert.equal(result.version, "027E.1");
  assert.equal(result.status, "READY_TO_SEAL");
  assert.equal(result.decision.code, "ADVANCE");
  assert.equal(result.body.metrics.find((item) => item.key === "weight").change, -15.2);
  assert.equal(result.body.photos.comparable, true);
  assert.equal(result.performance.comparisons.length, 2);
  assert.equal(result.performance.improved, 2);
  assert.equal(result.adaptations.worked, 1);
  assert.equal(result.learned[0].headline, "A short reduction restored output");
});

test("027E issues an immutable verdict and generates the next Contract seed from proof", () => {
  const ready = Verdict.buildVerdict(input());
  const sealed = Verdict.sealVerdict(ready, { sealedAt: "2026-08-10T13:00:00.000Z" });
  assert.equal(sealed.status, "SEALED");
  assert.equal(sealed.nextAction.code, "PREPARE_REENLISTMENT");
  const preserved = Verdict.buildVerdict(input({ previous: sealed, performanceEntries: [] }));
  assert.deepEqual(preserved, sealed);

  const seed = Verdict.reEnlistmentSeed(sealed, contract, { createdAt: "2026-08-10T14:00:00.000Z" });
  assert.equal(seed.sourceVerdictId, sealed.id);
  assert.equal(seed.carryForward.twoADays, true);
  assert.equal(seed.evidence.performanceComparisons, 2);
  assert.equal(seed.verifiedLessons.length, 1);

  const prepared = Verdict.withReEnlistment(sealed, { id: "draft-28", status: "DRAFT" });
  assert.equal(prepared.status, "REENLISTMENT_READY");
  assert.equal(prepared.reEnlistment.draftId, "draft-28");
  assert.equal(prepared.nextAction.code, "REVIEW_NEXT_CONTRACT");
});

test("027E distinguishes a credible re-enlistment from a recommission", () => {
  const nearMissConditions = campaign().conditions.map((item, index) => ({ ...item, passed: index < 3 }));
  const nearMiss = Verdict.buildVerdict(input({ campaign: campaign({ status: "CLOSED", execution: { rate: 78 }, conditions: nearMissConditions }) }));
  assert.equal(nearMiss.decision.code, "RE_ENLIST");

  const shortConditions = campaign().conditions.map((item, index) => ({ ...item, passed: index < 2 }));
  const short = Verdict.buildVerdict(input({ campaign: campaign({ status: "CLOSED", execution: { rate: 58 }, conditions: shortConditions }) }));
  assert.equal(short.decision.code, "RECOMMISSION");
  assert.throws(() => Verdict.reEnlistmentSeed(short, contract), /Issue the campaign verdict/i);
});
