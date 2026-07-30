const assert = require("node:assert/strict");
const feed = require("../assets/js/nutrition-feed.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
}

test("feed keys require the Coach Dominion prefix and sufficient entropy", () => {
  assert.equal(feed.validateTokenFormat(`cdnf_${"A".repeat(43)}`), true);
  assert.equal(feed.validateTokenFormat("short"), false);
});

test("flat Shortcut totals normalize into the canonical payload", () => {
  const result = feed.normalizeNutritionFeedPayload({
    date: "2026-07-29",
    timezone: "America/Chicago",
    calories: 2210.04,
    protein: 181.24,
    carbs: 230,
    fat: 72,
    sampleCount: 12
  });
  assert.equal(result.valid, true);
  assert.equal(result.payload.totals.calories, 2210);
  assert.equal(result.payload.totals.protein, 181.2);
  assert.equal(result.payload.source, "MYFITNESSPAL_APPLE_HEALTH");
});

test("nested totals normalize without food diary details", () => {
  const result = feed.normalizeNutritionFeedPayload({
    date: "2026-07-29",
    totals: { calories: 2000, protein_grams: 175, carbohydrate_grams: 210, fat_grams: 65 }
  });
  assert.deepEqual(result.payload.totals, { calories: 2000, protein: 175, carbs: 210, fat: 65 });
  assert.equal(Object.hasOwn(result.payload, "meals"), false);
});

test("a date is required for a real ingestion", () => {
  assert.equal(feed.normalizeNutritionFeedPayload({ totals: { calories: 1000 } }).valid, false);
});

test("a dry run validates authorization without nutrition totals", () => {
  const result = feed.normalizeNutritionFeedPayload({ dryRun: true });
  assert.equal(result.valid, true);
  assert.equal(result.payload.dryRun, true);
});

test("negative values are bounded to zero", () => {
  const result = feed.normalizeNutritionFeedPayload({
    date: "2026-07-29",
    totals: { calories: 2000, protein: -10, carbs: 200, fat: 60 }
  });
  assert.equal(result.payload.totals.protein, 0);
});

test("impossible daily totals are rejected", () => {
  const result = feed.normalizeNutritionFeedPayload({
    date: "2026-07-29",
    totals: { calories: 50000 }
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /calories exceeds/);
});

test("the same nutrition input produces the same fingerprint", () => {
  const input = { date: "2026-07-29", totals: { calories: 2000, protein: 180 } };
  assert.equal(feed.normalizeNutritionFeedPayload(input).fingerprint, feed.normalizeNutritionFeedPayload(input).fingerprint);
});

test("shortcut template uses bearer authorization and no password", () => {
  const template = feed.buildShortcutTemplate("https://coach-dominion2.vercel.app/", "cdnf_secret");
  assert.equal(template.endpoint, "https://coach-dominion2.vercel.app/api/nutrition-feed");
  assert.equal(template.headers.Authorization, "Bearer cdnf_secret");
  assert.equal(JSON.stringify(template).includes("password"), false);
});

console.log(`Nutrition feed: ${passed} tests passed.`);
