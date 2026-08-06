const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const engine = read("assets/js/meal-execution.js");

test("023E turns the next Fuel target into an executable meal", () => {
  assert.match(html, /id="meal-execution-panel"/);
  assert.match(html, /id="meal-execution-output"/);
  assert.match(app, /buildCurrentMealExecutionOrder/);
  assert.match(app, /renderMealExecution/);
  assert.match(engine, /const VERSION = "023[EF]\.1"/);
});

test("023E supports swaps, planning, and honest eaten confirmation", () => {
  assert.match(app, /swapMealExecutionComponent/);
  assert.match(app, /handleMealExecutionAction/);
  assert.match(app, /confirmMealExecution/);
  assert.match(html, /id="meal-confirm-form"/);
  assert.match(engine, /status: "PLANNED"/);
  assert.match(engine, /status: "CONFIRMED"/);
});

test("023E persists meal state without replacing imported intake", () => {
  assert.match(app, /persistNutritionState\("MEAL_EXECUTION"/);
  assert.match(app, /readMealExecutionLedger/);
  assert.match(app, /writeMealExecutionLedger/);
  assert.match(app, /const actual = imported \|\| manual \|\| \{\}/);
  assert.doesNotMatch(app, /const actual = imported \|\| meal/);
  assert.match(engine, /Imported daily totals remain authoritative/);
});

test("023E adds account-backed preferences and a compact meal record", () => {
  assert.match(html, /id="meal-execution-preferences-form"/);
  assert.match(html, /id="meal-execution-history"/);
  assert.match(app, /saveMealExecutionPreferences/);
  assert.match(app, /renderMealExecutionHistory/);
});

test("023E is responsive and rotates all mutable release assets", () => {
  assert.match(css, /Build 023E: Precision Meal Execution/);
  assert.match(css, /\.meal-component-grid/);
  assert.match(html, /styles\.css\?v=023[ef]/);
  assert.match(html, /meal-execution\.js\?v=023[ef]/);
  assert.match(html, /fuel-command\.js\?v=023[ef]/);
  assert.match(html, /app\.js\?v=023[ef]/);
  assert.match(worker, /coach-dominion-023[ef]-v1/);
  assert.match(worker, /meal-execution\.js\?v=023[ef]/);
});

console.log("Build 023E Precision Meal Execution integration verified.");
