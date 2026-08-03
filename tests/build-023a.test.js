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

test("023A replaces the stacked Fuel dashboards with one command surface", () => {
  assert.match(html, /class="fuel-command-center"/);
  assert.match(html, /id="nutrition-next-action"[^>]+fuel-command-order/);
  assert.match(html, /id="nutrition-command-output"/);
  assert.match(html, /class="fuel-command-details"/);
  assert.match(html, /Targets, timing &amp; evidence/);
  assert.doesNotMatch(html, /ATLAS \/\/ NEXT BEST ACTION/);
});

test("023A renders decision, remaining targets, next meal, and one primary route from one model", () => {
  assert.match(app, /function buildCurrentFuelCommand\(\)/);
  assert.match(app, /DominionFuelCommand\.buildFuelCommand/);
  assert.match(app, /class="fuel-metrics"/);
  assert.match(app, /class="fuel-next-meal/);
  assert.match(app, /data-nutrition-next-action=/);
  assert.match(app, /fuel\.primaryAction\.route/);
});

test("023A makes the Today card a compact view of the same Fuel command", () => {
  const renderer = app.slice(app.indexOf("function renderTodayNutritionExecution()"), app.indexOf("function renderNutritionCommand()"));
  assert.match(renderer, /buildCurrentFuelCommand\(\)/);
  assert.match(renderer, /today-fuel-compact/);
  assert.doesNotMatch(renderer, /today-nutrition-safeguards/);
});

test("023A keeps approved targets, evidence, timing, and safeguards behind disclosure", () => {
  assert.match(html, /id="fuel-command-evidence"/);
  assert.match(html, /id="meal-training-window"/);
  assert.match(app, /fuel\.safeguards/);
  assert.match(app, /fuel\.evidence\.source/);
  assert.match(css, /Build 023A: Unified Fuel Command/);
  assert.match(css, /\.fuel-command-details/);
});

test("023A rotates the mutable shell and caches the Fuel engine", () => {
  assert.match(html, /styles\.css\?v=023a/);
  assert.match(html, /fuel-command\.js\?v=023a/);
  assert.match(html, /app\.js\?v=023a/);
  assert.match(worker, /coach-dominion-023a-v1/);
  assert.match(worker, /fuel-command\.js\?v=023a/);
  assert.match(worker, /app\.js\?v=023a/);
});

console.log("Build 023A Unified Fuel Command integration verified.");
