const assert = require("assert");
const { buildWeeklyNutritionReview, approveWeeklyNutritionReview } = require("../assets/js/nutrition-review.js");

const base = {
  status: "PROVISIONAL",
  evidenceDays: 4,
  fourteenDay: { onTargetDays: 2, proteinAdherence: 0.9, calorieAdherence: 0.95 },
  training: { evidenceDays: 2, averageCalories: 2100 },
  recovery: { evidenceDays: 2, averageCalories: 1900 },
  trend: { status: "INSUFFICIENT EVIDENCE" }
};

assert.strictEqual(buildWeeklyNutritionReview({ intelligence: { status: "NEEDS TARGETS", evidenceDays: 1 } }).status, "NEEDS TARGETS");
assert.strictEqual(buildWeeklyNutritionReview({ intelligence: { status: "INSUFFICIENT EVIDENCE", evidenceDays: 1 } }).status, "INSUFFICIENT EVIDENCE");
const provisional = buildWeeklyNutritionReview({ intelligence: base, reviewEnd: "2026-07-27" });
assert.strictEqual(provisional.status, "PROVISIONAL REVIEW");
assert.ok(provisional.actions.some((item) => item.code === "EVIDENCE"));
assert.ok(provisional.wins.length);

const ready = buildWeeklyNutritionReview({ intelligence: { ...base, status: "READY", evidenceDays: 8 } });
assert.strictEqual(ready.status, "READY FOR REVIEW");
assert.ok(ready.actions.some((item) => item.code === "MAINTAIN"));
const protein = buildWeeklyNutritionReview({ intelligence: { ...base, fourteenDay: { ...base.fourteenDay, proteinAdherence: 0.7 } } });
assert.ok(protein.actions.some((item) => item.code === "PROTEIN"));
const under = buildWeeklyNutritionReview({ intelligence: { ...base, fourteenDay: { ...base.fourteenDay, calorieAdherence: 0.7 } } });
assert.ok(under.actions.some((item) => item.code === "RECOVERY"));
const high = buildWeeklyNutritionReview({ intelligence: { ...base, fourteenDay: { ...base.fourteenDay, calorieAdherence: 1.3 } } });
assert.ok(high.actions.some((item) => item.code === "PATTERN REVIEW"));
const training = buildWeeklyNutritionReview({ intelligence: { ...base, training: { evidenceDays: 2, averageCalories: 1700 }, recovery: { evidenceDays: 2, averageCalories: 2000 } } });
assert.ok(training.actions.some((item) => item.code === "TRAINING FUEL"));
assert.throws(() => approveWeeklyNutritionReview({ status: "INSUFFICIENT EVIDENCE" }));
assert.strictEqual(approveWeeklyNutritionReview(provisional, "2026-07-27T12:00:00Z", "review-1").status, "APPROVED");
assert.ok(provisional.safeguards.some((item) => item.includes("not approved calorie")));
console.log("nutrition review tests passed");
