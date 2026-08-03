const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/js/outcome-plan-revision.js"), "utf8");
const body = fs.readFileSync(path.join(root, "assets/js/body-composition.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");

test("Build 021M turns an authorized outcome review into a visible plan-review workspace", () => {
  assert.match(html, /id="outcome-plan-revision"/);
  assert.match(html, /id="outcome-plan-revision-output"/);
  assert.match(body, /nextSection: "trends"/);
  assert.match(app, /function renderOutcomePlanRevision/);
  assert.match(app, /renderOutcomePlanRevision\(outcome\)/);
  assert.match(app, /setTrendView\("body"\)/);
});

test("Build 021M investigates before proposing exactly one bounded lever", () => {
  assert.match(engine, /function investigation/);
  assert.match(engine, /lever: "NUTRITION"/);
  assert.match(engine, /trainingChanged: false/);
  assert.match(engine, /plansChanged: false/);
  assert.match(app, /Protein unchanged/);
  assert.match(app, /Training unchanged/);
});

test("Build 021M requires approval, activates next week, observes, and can roll back", () => {
  assert.match(engine, /function nextOperatingWeek/);
  assert.match(engine, /function refreshLifecycle/);
  assert.match(engine, /function completeObservation/);
  assert.match(app, /data-outcome-plan-action="APPROVE"/);
  assert.match(app, /data-outcome-plan-action="ROLLBACK"/);
  assert.match(app, /function approveOutcomeNutritionBaseline/);
  assert.match(app, /function rollbackOutcomePlanRevision/);
  assert.match(app, /The current baseline remains active until the effective date/);
});

test("Build 021M persists the decision and revision history to the recruit account", () => {
  assert.match(app, /"ADAPTATION", "outcome-plan-current"/);
  assert.match(app, /"HISTORY", "outcome-plan"/);
  assert.match(app, /function saveOutcomePlanRevision/);
  assert.match(app, /persistClosedLoopState\("ADAPTATION", "outcome-plan-current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "outcome-plan"/);
});

test("Build 021M ships a responsive, word-light Dominion comparison surface", () => {
  assert.match(styles, /Build 021M: outcome-to-plan revision command/);
  assert.match(styles, /\.outcome-plan-compare/);
  assert.match(styles, /\.outcome-plan-investigation/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(html, /styles\.css\?v=022[b-d]/);
  assert.match(html, /outcome-plan-revision\.js\?v=021m/);
  assert.match(html, /trends-intelligence\.js\?v=021m/);
  assert.match(html, /app\.js\?v=022[b-d]/);
});
