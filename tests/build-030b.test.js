"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Today exposes one compact run, Fuel, steps, and closeout form", () => {
  const html = read("app.html");
  const section = html.match(/<aside id="frictionless-execution"[\s\S]*?<\/aside>/)?.[0] || "";
  assert.match(section, /Today in 15 seconds/);
  assert.match(section, /id="today-quick-log-form"/);
  ["runDistance", "runMinutes", "calories", "protein", "carbs", "fat", "selfReportedSteps"]
    .forEach((name) => assert.match(section, new RegExp(`name="${name}"`)));
  assert.match(section, /class="today-quick-log-more"/);
  assert.doesNotMatch(section, /030B|BUILD|RELEASE/i);
});

test("Quick Log resumes training and reuses canonical evidence saves", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function renderTodayQuickLog/);
  assert.match(app, /const activeTraining = \[byId\.strength, byId\.running, byId\.core\]\.find\(\(item\) => item\?\.active\)/);
  assert.match(app, /persistPerformanceEvidenceEntry\(entry\)/);
  assert.match(app, /persistFuelDayTotals\(\{ date: todayISODate\(\), \.\.\.validation\.fuel \}\)/);
  assert.match(app, /DominionDailyCloseout\.buildCloseout\(quickCloseoutInput/);
  assert.match(app, /applyCloseoutSteps\(record\)/);
});

test("Quick Log drafts survive reload and connectivity loss", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function saveTodayQuickLogDraft/);
  assert.match(app, /saveClosedLoopLocal\("EXECUTION_DRAFT", todayISODate\(\), envelope\)/);
  assert.match(app, /persistClosedLoopState\("EXECUTION_DRAFT", todayISODate\(\), envelope\)/);
  assert.match(app, /Draft protected offline/);
  assert.match(app, /function prefillTodayQuickLog/);
  assert.match(app, /drafts\?\.running\?\.updatedAt \|\| new Date\(\)\.toISOString\(\)/);
});

test("active recruits keep Today when stale setup signals reappear", () => {
  const app = read("assets/js/app.js");
  const engine = read("assets/js/today-quick-log.js");
  assert.match(engine, /function shouldSuppressSetup/);
  assert.match(engine, /programState === "ACTIVE"/);
  assert.match(app, /DominionTodayQuickLog\.shouldSuppressSetup/);
  assert.match(app, /suppressedSetup: true/);
});

test("Build 030B is identifiable, cached, and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(read("assets/js/today-quick-log.js"), /const VERSION = "030B\.1"/);
  assert.match(html, /today-quick-log\.js\?v=030b/);
  assert.match(html, /coach-dominion-release" content="030[BC]\.1"/);
  assert.match(worker, /030b-today-in-15-seconds/);
  assert.match(worker, /today-quick-log\.js\?v=030b/);
  assert.match(health, /release: "030[BC]\.1"/);
  assert.match(workflow, /npm run test:030[bc]/);
  assert.match(workflow, /--expected-release 030[BC]\.1/);
  assert.match(packageJson, /"test:030b"/);
});
