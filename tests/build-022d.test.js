const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/plan-command.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

test("022D loads one plan command after the Progress Review engine", () => {
  const review = html.indexOf('/assets/js/progress-review.js?v=022c');
  const command = html.indexOf('/assets/js/plan-command.js?v=022d');
  const application = html.search(/\/assets\/js\/app\.js\?v=(?:022[d-g]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.ok(review > 0 && command > review && application > command);
  assert.match(html, /id="today-plan-command" class="plan-command-surface compact"/);
  assert.match(html, /id="body-plan-command" class="plan-command-surface"/);
  assert.match(html, /id="outcome-plan-revision"[^>]+hidden/);
});

test("022D persists the current decision and history with the account", () => {
  assert.match(app, /function readPlanCommand\(/);
  assert.match(app, /function savePlanCommand\(/);
  assert.match(app, /"plan-command-current"/);
  assert.match(app, /"plan-command"/);
  assert.match(app, /persistClosedLoopState\("ADAPTATION", "plan-command-current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "plan-command"/);
});

test("022D stages calendar impact, activates on date, and restores both layers", () => {
  assert.match(engine, /const VERSION = "022D\.1"/);
  assert.match(app, /function commitPlanCommandCalendar\(/);
  assert.match(app, /function activateDuePlanCommand\(/);
  assert.match(app, /function restorePlanCommandModule\(/);
  assert.match(app, /function rollbackPlanCommand\(/);
  assert.match(app, /await activateDuePlanCommand\(\)/);
  assert.match(app, /scheduledCalendarId/);
  assert.match(app, /data-plan-command-action="APPROVE"/);
  assert.match(app, /data-plan-command-action="ROLLBACK"/);
});

test("022D is word-light, responsive, versioned, and cached", () => {
  assert.match(css, /Build 022D/);
  assert.match(css, /\.plan-command-compare/);
  assert.match(css, /\.plan-command-calendar/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(html, /styles\.css\?v=(?:022[d-g]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.match(worker, /coach-dominion-(?:022[d-g]|(?:023[abcdef]|024[abcdefghi]))-v1/);
  assert.match(worker, /plan-command\.js\?v=022d/);
  assert.match(worker, /app\.js\?v=(?:022[d-g]|(?:023[abcdef]|024[abcdefghi]))/);
});

console.log("Build 022D Review-to-Plan Command integration verified.");
