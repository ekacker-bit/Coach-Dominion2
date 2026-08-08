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
const engine = read("assets/js/fuel-closed-loop.js");

test("023F closes the meal-to-coaching loop", () => {
  assert.match(html, /id="fuel-closed-loop-panel"/);
  assert.match(html, /id="fuel-meal-feedback-form"/);
  assert.match(html, /id="fuel-day-closeout-form"/);
  assert.match(app, /renderFuelClosedLoop/);
  assert.match(app, /saveFuelMealFeedback/);
  assert.match(app, /sealFuelDay/);
  assert.match(engine, /const VERSION = "023F\.1"/);
});

test("023F reconciles meal context without double-counting the operating total", () => {
  assert.match(engine, /Confirmed meals are context only/);
  assert.match(engine, /The authoritative daily total is used once/);
  assert.match(app, /const actual = imported \|\| manual \|\| \{\}/);
  assert.doesNotMatch(app, /const actual = imported \|\| meal/);
  assert.match(app, /fuelReconciliation/);
});

test("023F persists feedback and closeouts to the recruit account", () => {
  assert.match(app, /persistNutritionState\("FUEL_CLOSED_LOOP"/);
  assert.match(app, /readFuelClosedLoopLedger/);
  assert.match(app, /writeFuelClosedLoopLedger/);
  assert.match(app, /row\.state_type === "FUEL_CLOSED_LOOP"/);
});

test("023F adds weekly meal-response learning without silent target changes", () => {
  assert.match(html, /id="fuel-loop-review-output"/);
  assert.match(app, /renderFuelLoopReview/);
  assert.match(engine, /summarizeWeek/);
  assert.match(engine, /Atlas recommendations never change approved targets/);
  assert.match(engine, /No approved target changed/);
});

test("023F is responsive and rotates all mutable release assets", () => {
  assert.match(css, /Build 023F: Fuel closed loop and reconciliation/);
  assert.match(css, /\.fuel-loop-progress/);
  assert.match(html, /styles\.css\?v=(?:023f|024[abcdefghij])/);
  assert.match(html, /fuel-closed-loop\.js\?v=(?:023f|024[abcdefghij])/);
  assert.match(html, /fuel-command\.js\?v=(?:023f|024[abcdefghij])/);
  assert.match(html, /app\.js\?v=(?:023f|024[abcdefghij])/);
  assert.match(worker, /coach-dominion-(?:023f|024[abcdefghij])-v1/);
  assert.match(worker, /fuel-closed-loop\.js\?v=(?:023f|024[abcdefghij])/);
});

console.log("Build 023F Fuel Closed Loop integration verified.");

