const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-daily-command.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));

test("Build 025O turns Today into one timed Atlas order", () => {
  assert.match(engine, /const VERSION = "025O\.1"/);
  assert.match(engine, /function buildDailyCommand/);
  assert.match(engine, /function statePriority/);
  assert.match(engine, /function durationFor/);
  assert.match(engine, /function confidenceFor/);
  assert.match(app, /function buildCurrentAtlasDailyCommand/);
  assert.match(app, /DominionAtlasDailyCommand\.buildDailyCommand/);
  assert.match(html, /<span>Duration<\/span>/);
  assert.match(html, /<span>Window<\/span>/);
  assert.match(html, /<span>Confidence<\/span>/);
});

test("Build 025O captures a bounded this-does-not-fit response", () => {
  assert.match(html, /id="atlas-command-adjust"/);
  assert.match(html, /id="atlas-command-adjustment-dialog"/);
  assert.match(engine, /REDUCE_TODAY/);
  assert.match(engine, /MOVE_LATER/);
  assert.match(engine, /RECOVERY_ONLY/);
  assert.match(engine, /futureWeekChanged: false/);
  assert.match(app, /function applyAtlasDailyCommandAdjustment/);
  assert.match(app, /function restoreAtlasDailyCommandOrder/);
  assert.match(styles, /\.atlas-command-adjustment-dialog/);
});

test("Build 025O applies day-only adjustments to execution and account state", () => {
  assert.match(app, /function readAtlasDailyCommandResponse/);
  assert.match(app, /persistClosedLoopState\("DECISION", atlasDailyCommandStateKey/);
  assert.match(app, /DominionAtlasDailyCommand\.responseDirective/);
  assert.match(engine, /reviewDate: date/);
  assert.match(engine, /requiresPlanApproval: false/);
  assert.match(app, /renderTodayCommittedWeek\(\)/);
  assert.match(app, /renderWeeklyOrchestrator\(\)/);
});

test("Build 025O makes the adjustment visible on Today and Calendar", () => {
  assert.match(app, /atlas-calendar-override/);
  assert.match(app, /weekly-orchestrator-day[^`]*atlas-adjusted/);
  assert.match(styles, /\.weekly-orchestrator-day\.atlas-adjusted/);
  assert.match(html, /id="atlas-command-adjustment-status"/);
  assert.match(html, /Restore original order/);
});

test("Build 025O records command actions without storing private notes in telemetry", () => {
  assert.match(engine, /function createEvent/);
  assert.match(app, /function recordAtlasDailyCommandEvent/);
  assert.match(app, /PRIMARY_ACTIVATED/);
  assert.match(app, /ADJUSTMENT_APPLIED/);
  assert.match(app, /"HISTORY", "atlas-daily-command"/);
});

test("Build 025O ships a fresh responsive offline shell", () => {
  assert.match(styles, /Build 025O: Atlas Daily Command/);
  assert.match(html, /atlas-daily-command\.js\?v=025o/);
  assert.match(html, /styles\.css\?v=[^"\s]*025o/);
  assert.match(html, /app\.js\?v=[^"\s]*025o/);
  assert.match(worker, /coach-dominion-[^"\s]*025o/);
  assert.match(worker, /atlas-daily-command\.js\?v=025o/);
  assert.match(app, /service-worker-reload:025o/);
  assert.match(app, /sw\.js\?v=025o/);
  assert.match(changelog, /Build 025O Atlas Daily Command/);
  assert.ok(pkg.scripts["test:025o"]);
});
