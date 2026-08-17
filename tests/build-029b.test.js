const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("029B loads the canonical authority before the decision engine", () => {
  const html = read("app.html");
  const canonicalIndex = html.indexOf('/assets/js/canonical-daily-command.js?v=029b');
  const integrityIndex = html.indexOf('/assets/js/daily-decision-integrity.js?v=027f-028f');
  assert.ok(canonicalIndex >= 0);
  assert.ok(canonicalIndex < integrityIndex);
});

test("029B routes daily surfaces through the committed day", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function buildCurrentCanonicalDailyCommand/);
  assert.match(app, /canonicalDailyCommand: currentCanonicalDailyCommand/);
  assert.match(app, /currentCanonicalDailyCommand\.day\.committed/);
  assert.match(app, /function dailyDecisionModuleState/);
  assert.match(app, /function buildCurrentFuelCalendarContext/);
  assert.match(app, /function openFrictionlessLogger[\s\S]*moduleState\.executable/);
  assert.match(app, /function launchMobileModule[\s\S]*moduleState\.executable/);
  assert.match(app, /schedulePending/);
  assert.match(app, /Commit the coordinated week/);
});

test("029B caches one versioned implementation offline", () => {
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  assert.match(worker, /029a-029b/);
  assert.match(worker, /canonical-daily-command\.js\?v=029b/);
  assert.match(worker, /app\.js\?v=[^"]*-029b/);
  assert.match(app, /serviceWorker\.register\("\/sw\.js\?v=029b"/);
});
