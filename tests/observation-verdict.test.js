const test = require("node:test");
const assert = require("node:assert/strict");
const verdict = require("../assets/js/observation-verdict.js");

const command = (domain = "NUTRITION") => ({
  id: `plan-command:review:${domain}`,
  status: "REVIEW_DUE",
  domain,
  effectiveDate: "2026-08-03",
  observationEnd: "2026-08-16",
  proposedPlan: { recoveryTargets: { calories: 1900, protein: 180 } }
});

const readiness = [
  ...["2026-07-21", "2026-07-23", "2026-07-25", "2026-07-27", "2026-07-29"].map((date, index) => ({ date, energy: 6, weight: index ? null : 181 })),
  ...["2026-08-03", "2026-08-05", "2026-08-07", "2026-08-10", "2026-08-14", "2026-08-16"].map((date, index) => ({ date, energy: 6.5, weight: index === 0 ? 180 : index === 5 ? 179 : null }))
];

test("Nutrition retains a well-executed change with improving outcome and stable recovery", () => {
  const nutritionDays = ["2026-07-23", "2026-07-26", "2026-07-29"].map((date) => ({ date, calories: 2200, protein: 150 })).concat(["03", "04", "05", "06", "07", "08", "09", "10"].map((day) => ({
    date: `2026-08-${day}`, calories: 1900, protein: 180
  })));
  const result = verdict.buildObservationVerdict({
    today: "2026-08-17",
    command: command(),
    dailyStates: readiness,
    nutritionDays
  });
  assert.equal(result.status, "READY");
  assert.equal(result.recommendation, "RETAIN");
  assert.equal(result.observed.nutritionAdherence, 100);
  assert.equal(result.observed.weightChange, -1);
});

test("Missing domain evidence extends observation instead of guessing", () => {
  const result = verdict.buildObservationVerdict({
    today: "2026-08-17",
    command: command("RUNNING"),
    dailyStates: readiness,
    performanceEntries: []
  });
  assert.equal(result.recommendation, "EXTEND");
  assert.match(result.rationale, /enough evidence/i);
});

test("Pain and readiness regression trigger the rollback safeguard", () => {
  const regressed = readiness.map((item) => item.date >= "2026-08-03" ? { ...item, energy: 4, pain: true } : item);
  const strengthHistory = [
    { date: "2026-07-23", state: "COMPLETE", setLogs: {} },
    { date: "2026-07-29", state: "COMPLETE", setLogs: {} },
    { date: "2026-08-05", state: "COMPLETE", setLogs: {}, painReported: true },
    { date: "2026-08-12", state: "COMPLETE", setLogs: {}, painReported: true }
  ];
  const result = verdict.buildObservationVerdict({
    today: "2026-08-17",
    command: command("STRENGTH"),
    dailyStates: regressed,
    strengthHistory
  });
  assert.equal(result.recommendation, "ROLLBACK");
  assert.match(result.rationale, /safeguard/i);
});

test("A verdict produces an auditable decision receipt and bounded extension", () => {
  const ready = verdict.buildObservationVerdict({
    today: "2026-08-17",
    command: command("RUNNING"),
    dailyStates: readiness,
    performanceEntries: []
  });
  const receipt = verdict.resolveVerdict(ready, "EXTEND", {
    decidedAt: "2026-08-17T12:00:00.000Z",
    userId: "recruit-1"
  });
  assert.equal(receipt.status, "EXTENDED");
  assert.equal(receipt.nextObservationEnd, "2026-08-23");
  assert.equal(receipt.extensionCount, 1);
  assert.match(receipt.receiptId, /EXTEND/);
});

console.log(`Build 022E observation verdict: ${verdict.VERSION}`);
