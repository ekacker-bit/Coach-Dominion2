const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "014_myfitnesspal_health_bridge.sql"), "utf8");
const endpoint = fs.readFileSync(path.join(root, "api", "nutrition-feed.js"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");

assert.match(migration, /create table if not exists public\.nutrition_feed_tokens/i);
assert.match(migration, /create table if not exists public\.nutrition_feed_events/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(migration, /security definer/i);
assert.match(migration, /digest\(p_token, 'sha256'\)/i);
assert.match(migration, /raw_health_data_stored', false/i);
assert.match(migration, /grant execute on function public\.ingest_nutrition_feed/i);
assert.match(endpoint, /Bearer\\s\+/);
assert.match(endpoint, /rest\/v1\/rpc\/ingest_nutrition_feed/);
assert.match(endpoint, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
assert.doesNotMatch(endpoint, /SERVICE_ROLE/);
assert.match(app, /nutrition_feed_tokens/);
assert.match(app, /runMfpNutritionFeedAction/);
assert.match(app, /data-connected-action\^='mfp-feed-'/);
assert.match(app, /stopImmediatePropagation/);
assert.match(app, /\["Enter", " "\]\.includes\(event\.key\)/);
assert.match(html, /assets\/js\/nutrition-feed\.js/);

console.log("Nutrition feed persistence: 18 assertions passed.");
