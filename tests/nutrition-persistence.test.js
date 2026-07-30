const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "015_nutrition_state_persistence.sql"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");

assert.match(migration, /create table if not exists public\.nutrition_state/i);
assert.match(migration, /primary key \(user_id, state_type, state_key\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(migration, /grant select, insert, update, delete on public\.nutrition_state to authenticated/i);
assert.match(migration, /'BASELINE_HISTORY'/);
assert.match(migration, /'ADAPTIVE_GOAL'/);
assert.match(migration, /'ADAPTIVE_APPROVAL'/);
assert.match(migration, /'MEAL_WINDOW'/);
assert.match(migration, /'REVIEW_HISTORY'/);
assert.match(migration, /'MANUAL_DAY'/);

assert.match(app, /async function persistNutritionState/);
assert.match(app, /\.from\("nutrition_state"\)\.upsert/);
assert.match(app, /async function loadNutritionState/);
assert.match(app, /await loadNutritionState\(\)/);
assert.match(app, /async function clearNutritionStateType/);
assert.match(app, /\.eq\("state_type", stateType\)/);
assert.match(app, /persistNutritionState\("BASELINE_HISTORY"/);
assert.match(app, /persistNutritionState\("ADAPTIVE_GOAL"/);
assert.match(app, /persistNutritionState\("ADAPTIVE_APPROVAL"/);
assert.match(app, /persistNutritionState\("MEAL_WINDOW"/);
assert.match(app, /persistNutritionState\("REVIEW_HISTORY"/);
assert.match(app, /persistNutritionState\("MANUAL_DAY"/);
assert.match(app, /Saved to your account/);

console.log("Nutrition persistence: 24 assertions passed.");

