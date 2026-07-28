const assert = require("assert");
const { buildNutritionIntelligence } = require("../assets/js/nutrition-intelligence.js");

const targets = { calories: 2000, protein: 150, carbs: 220, fat: 70 };
const day = (date, calories = 2000, protein = 150) => ({ date, calories, protein, carbs: 220, fat: 70 });
const dates = Array.from({ length: 14 }, (_, index) => `2026-07-${String(14 + index).padStart(2, "0")}`);

assert.strictEqual(buildNutritionIntelligence({ windowEnd: "2026-07-27", targets: {}, nutritionDays: [day("2026-07-27")] }).status, "NEEDS TARGETS");
assert.strictEqual(buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: [day("2026-07-27")] }).status, "INSUFFICIENT EVIDENCE");
assert.strictEqual(buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: dates.slice(-4).map((date) => day(date)) }).status, "PROVISIONAL");
assert.strictEqual(buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: dates.slice(-7).map((date) => day(date)) }).status, "READY");

const lowProtein = buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: dates.slice(-4).map((date) => day(date, 2000, 100)) });
assert.strictEqual(lowProtein.priority.code, "PROTEIN CONSISTENCY");
const lowCalories = buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: dates.slice(-4).map((date) => day(date, 1400, 150)) });
assert.strictEqual(lowCalories.priority.code, "RECOVERY FUELING");
const highCalories = buildNutritionIntelligence({ windowEnd: "2026-07-27", targets, nutritionDays: dates.slice(-4).map((date) => day(date, 2600, 150)) });
assert.strictEqual(highCalories.priority.code, "REVIEW PATTERN");

const split = buildNutritionIntelligence({
  windowEnd: "2026-07-27", targets,
  nutritionDays: dates.slice(-4).map((date, index) => day(date, index < 2 ? 2200 : 1800, 150)),
  trainingDates: dates.slice(-4, -2)
});
assert.strictEqual(split.training.averageCalories, 2200);
assert.strictEqual(split.recovery.averageCalories, 1800);
assert.strictEqual(split.evidenceDays, 4);
assert.strictEqual(split.missingDays, 10);
assert.strictEqual(split.fourteenDay.onTargetDays, 4);

const trend = buildNutritionIntelligence({
  windowEnd: "2026-07-27", targets,
  nutritionDays: dates.map((date, index) => day(date, index < 7 ? 1800 : 2100, index < 7 ? 130 : 155))
});
assert.strictEqual(trend.trend.status, "AVAILABLE");
assert.strictEqual(trend.trend.calories.direction, "UP");
assert.strictEqual(trend.trend.calories.delta, 300);
assert.strictEqual(trend.trend.protein.direction, "UP");
assert.ok(trend.safeguards[0].includes("evidence gaps"));

console.log("nutrition intelligence tests passed");
