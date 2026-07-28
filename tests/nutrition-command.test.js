const assert = require("assert");
const { buildMetric, buildNutritionCommand } = require("../assets/js/nutrition-command.js");

assert.strictEqual(buildMetric(1800, 2000, "calories").status, "ON TARGET");
assert.strictEqual(buildMetric(1500, 2000, "calories").status, "LOW");
assert.strictEqual(buildMetric(80, 150, "protein").status, "LOW");
assert.strictEqual(buildNutritionCommand({ actual: {}, targets: {} }).status, "NEEDS TARGETS");
assert.strictEqual(buildNutritionCommand({ actual: {}, targets: { calories: 2000 } }).status, "AWAITING DATA");
assert.strictEqual(buildNutritionCommand({ actual: { calories: 1500, protein: 90 }, targets: { calories: 2000, protein: 150 } }).status, "UNDER-FUELED");
assert.strictEqual(buildNutritionCommand({ actual: { calories: 2600, protein: 150 }, targets: { calories: 2000, protein: 150 } }).status, "REVIEW NEEDED");
const onTarget = buildNutritionCommand({ actual: { calories: 2000, protein: 150, carbs: 220, fat: 70 }, targets: { calories: 2000, protein: 150, carbs: 220, fat: 70 }, trainingDay: true, readiness: "GREEN", source: "MYFITNESSPAL" });
assert.strictEqual(onTarget.status, "ON TARGET");
assert.ok(onTarget.guidance.some((item) => item.includes("Training evidence")));
const reduced = buildNutritionCommand({ actual: { calories: 2000 }, targets: { calories: 2000 }, readiness: "YELLOW" });
assert.ok(reduced.guidance.some((item) => item.includes("restrictive")));
assert.ok(reduced.safeguards.some((item) => item.includes("Missing data")));
console.log("nutrition command tests passed");
