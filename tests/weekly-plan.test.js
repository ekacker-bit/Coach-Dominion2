const assert = require("assert");
const { buildWeeklyPlan, approveWeeklyPlan } = require("../assets/js/weekly-plan.js");

const finalized = {
  weekStartDate: "2026-07-20",
  weekEndDate: "2026-07-26",
  finalizedAt: "2026-07-27T00:00:00Z",
  evidenceCoverage: 80,
  score: 86,
  weakestDomain: "nutrition",
  nextWeekPriority: { code: "WEAKEST_DOMAIN", domain: "nutrition", text: "Raise Nutrition consistently." }
};

assert.strictEqual(buildWeeklyPlan(null).status, "UNAVAILABLE");
assert.strictEqual(buildWeeklyPlan({ ...finalized, finalizedAt: null }).status, "AWAITING FINALIZATION");
assert.strictEqual(buildWeeklyPlan({ ...finalized, evidenceCoverage: 49 }).status, "LIMITED EVIDENCE");
const ready = buildWeeklyPlan(finalized);
assert.strictEqual(ready.status, "READY FOR APPROVAL");
assert.strictEqual(ready.nextWeekStart, "2026-07-27");
assert.strictEqual(ready.nextWeekEnd, "2026-08-02");
assert.strictEqual(ready.days.length, 7);
assert.strictEqual(ready.focus, "Nutrition");
assert.ok(ready.guardrails.some((item) => item.includes("override")));
const safety = buildWeeklyPlan({ ...finalized, recoveryRiskSignal: true, nextWeekPriority: { code: "RECOVERY_SAFETY", text: "Protect recovery." } });
assert.strictEqual(safety.safety, true);
assert.ok(safety.guardrails[0].includes("pain"));
assert.throws(() => approveWeeklyPlan({ status: "LIMITED EVIDENCE" }));
assert.strictEqual(approveWeeklyPlan(ready, "2026-07-27T12:00:00Z").status, "APPROVED");
console.log("weekly plan tests passed");
