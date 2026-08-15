const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const html = read("app.html");
const app = read("assets/js/app.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const engine = read("assets/js/fuel-day-ledger.js");

test("026L promotes one daily calories and macros action", () => {
  assert.match(html, /id="fuel-day-ledger"/);
  assert.match(html, /id="nutrition-manual-form" class="fuel-day-ledger-form"/);
  assert.equal((html.match(/id="nutrition-manual-form"/g) || []).length, 1);
  for (const metric of ["calories", "protein", "carbs", "fat"]) assert.match(html, new RegExp(`name="${metric}"[^>]*required`));
  assert.match(html, /class="fuel-precision-tools"/);
});

test("026L uses the same canonical Fuel day across product surfaces", () => {
  assert.match(app, /function buildFuelDayLedger/);
  assert.match(app, /function persistFuelDayTotals/);
  assert.match(app, /nutritionEvidenceHistory[\s\S]*buildFuelDayLedger/);
  assert.match(app, /trendNutritionHistory[\s\S]*buildFuelDayLedger/);
  assert.match(app, /DominionFuelDayLedger\.evidence/);
  assert.match(engine, /sourceType: "FUEL_DAY_TOTAL"/);
  assert.match(app, /Today, Trends, and weekly coaching/);
});

test("026L engine and shell are current and responsive", () => {
  assert.match(engine, /const VERSION = "026L\.1"/);
  assert.match(html, /fuel-day-ledger\.js\?v=026l/);
  assert.ok(html.indexOf("fuel-day-ledger.js?v=026l") < html.indexOf("app.js?v="));
  assert.match(styles, /Build 026L: one daily Fuel ledger/);
  assert.match(styles, /\.fuel-day-ledger-form/);
  assert.match(styles, /@media \(max-width: 600px\)/);
  assert.match(worker, /026k-026l/);
  assert.match(worker, /fuel-day-ledger\.js\?v=026l/);
  assert.match(app, /sw\.js\?v=026l/);
});
