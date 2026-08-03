const assert = require("assert");
const { buildMealCoachingPlan } = require("../assets/js/meal-coaching.js");
const targets = { calories: 2200, protein: 170, carbs: 250, fat: 70 };

assert.strictEqual(buildMealCoachingPlan({ targets: {} }).status, "NEEDS TARGETS");
const recovery = buildMealCoachingPlan({ targets, trainingDay: false, trainingWindow: "EVENING" });
assert.strictEqual(recovery.status, "FUELING MAP ACTIVE");
assert.strictEqual(recovery.slots.length, 4);
assert.strictEqual(recovery.slots.reduce((sum, slot) => sum + slot.protein, 0), targets.protein);
assert.strictEqual(recovery.slots.reduce((sum, slot) => sum + slot.calories, 0), targets.calories);

const morning = buildMealCoachingPlan({ targets, trainingDay: true, trainingWindow: "MORNING" });
assert.strictEqual(morning.slots[0].label, "Pre-training fuel");
assert.strictEqual(morning.slots[1].label, "Post-training meal");
assert.ok(morning.slots[1].carbs > morning.slots[3].carbs);
const evening = buildMealCoachingPlan({ targets, trainingDay: true, trainingWindow: "EVENING" });
assert.strictEqual(evening.slots[3].label, "Post-training meal");
assert.ok(evening.slots[3].carbs > evening.slots[0].carbs);
assert.ok(evening.slots[3].note.includes("do not skip"));

const imported = buildMealCoachingPlan({
  targets, trainingDay: true, trainingWindow: "MIDDAY",
  meals: [{ name: "Breakfast", calories: 600, protein: 40, carbs: 70, fat: 18 }]
});
assert.strictEqual(imported.status, "MEAL EVIDENCE ACTIVE");
assert.strictEqual(imported.meals[0].protein, 40);
assert.ok(imported.evidenceMessage.includes("1 imported meal"));
assert.ok(imported.safeguards.some((item) => item.includes("flexible")));

const splitDay = buildMealCoachingPlan({ targets, trainingDay: true, trainingWindow: "SPLIT_DAY" });
assert.strictEqual(splitDay.slots[1].label, "Between-session recovery");
assert.strictEqual(splitDay.slots.reduce((sum, slot) => sum + slot.calories, 0), targets.calories);
assert.strictEqual(splitDay.slots.reduce((sum, slot) => sum + slot.protein, 0), targets.protein);

const longRun = buildMealCoachingPlan({ targets, trainingDay: true, trainingWindow: "LONG_RUN" });
assert.strictEqual(longRun.slots[1].label, "During-run plan");
assert.strictEqual(longRun.slots.reduce((sum, slot) => sum + slot.carbs, 0), targets.carbs);
assert.ok(longRun.safeguards.some((item) => item.includes("never approved daily totals")));
console.log("meal coaching tests passed");
