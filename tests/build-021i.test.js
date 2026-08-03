const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const orchestrator = require("../assets/js/weekly-orchestrator.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const shell = fs.readFileSync(path.join(root, "assets/js/experience-shell.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`✓ ${passed} ${name}`);
}

test("Calendar is a first-class desktop and mobile destination", () => {
  assert.match(html, /href="#calendar" data-section="calendar">CALENDAR<\/a>/);
  assert.match(html, /id="calendar" class="card calendar-command weekly-orchestrator scroll-anchor"/);
  assert.match(html, /data-mobile-nav="calendar" href="#calendar"/);
  assert.equal((html.match(/id="weekly-orchestrator-panel"/g) || []).length, 1);
  assert.match(app, /const SECTION_ORDER = \[[^\]]*"calendar"/);
  assert.match(shell, /calendar: \{ label: "Calendar", mode: "COORDINATE"/);
});

test("calendar assets are cache-busted for Build 021I", () => {
  assert.match(html, /styles\.css\?v=022[b-f]/);
  assert.match(html, /weekly-orchestrator\.js\?v=021i/);
  assert.match(html, /app\.js\?v=022[b-f]/);
});

test("Core pairing creates one training window through 120 minutes", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 60 },
    [
      { id: "lift", module: "STRENGTH", estimatedMinutes: 95 },
      { id: "core", module: "CORE", estimatedMinutes: 25 }
    ]
  );
  assert.equal(orchestrator.VERSION, "021I.1");
  assert.equal(policy.activityCount, 2);
  assert.equal(policy.sessionCount, 1);
  assert.equal(policy.corePaired, true);
  assert.equal(policy.maximumMinutes, 120);
});

test("Core becomes a separate window when the pairing would exceed 120 minutes", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 90 },
    [
      { id: "lift", module: "STRENGTH", estimatedMinutes: 110 },
      { id: "run", module: "RUNNING", type: "EASY", estimatedMinutes: 110 },
      { id: "core", module: "CORE", estimatedMinutes: 20 }
    ]
  );
  assert.equal(policy.sessionCount, 3);
  assert.equal(policy.sessionLimitExceeded, true);
});

test("draft assignments expose move controls and recalculate visible blockers", () => {
  assert.match(app, /select data-calendar-move-activity=/);
  assert.match(app, /DominionWeeklyOrchestrator\.moveDraftActivity/);
  assert.match(app, /function weeklyOrchestrationBlockerMeta/);
  assert.match(app, /id="calendar-blockers"/);
  assert.match(css, /\.calendar-move-control/);
  assert.match(css, /\.calendar-blockers/);
});

test("Today evaluates AM and PM by training window rather than raw activity order", () => {
  assert.match(app, /function splitDayTrainingWindows/);
  assert.match(app, /function todayTrainingWindowExecution/);
  assert.match(app, /const pmWindow = Boolean\(day\?\.twoADay && Number\(item\.sessionOrder/);
  assert.match(app, /sessionOne: todayTrainingWindowExecution\(windows\[0\]\)/);
  assert.match(app, /sessionTwo: todayTrainingWindowExecution\(windows\[1\]\)/);
});

test("long-run windows remain time-uncapped", () => {
  const policy = orchestrator.dailyDurationPolicy(
    { twoADays: true, sessionMinutes: 90 },
    [
      { id: "long", module: "RUNNING", type: "LONG", estimatedMinutes: 300 },
      { id: "core", module: "CORE", estimatedMinutes: 20 }
    ]
  );
  assert.equal(policy.longRunUncapped, true);
  assert.equal(policy.maximumMinutes, null);
  assert.equal(policy.durationLimitExceeded, false);
});

console.log(`Build 021I: ${passed} tests passed.`);
