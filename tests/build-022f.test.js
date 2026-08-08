
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/daily-closeout.js");
const ritual = read("assets/js/daily-ritual.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

test("022F loads the closeout engine before the ritual and application", () => {
  const closeout = html.indexOf('/assets/js/daily-closeout.js?v=022f');
  const ritualIndex = html.indexOf('/assets/js/daily-ritual.js?v=022f');
  const application = html.search(/\/assets\/js\/app\.js\?v=(?:022[fg]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.ok(closeout > 0 && ritualIndex > closeout && application > ritualIndex);
  assert.match(html, /id="daily-closeout-form"/);
  assert.match(html, /name="selfReportedSteps"/);
  assert.match(html, /name="masturbationCount"/);
  assert.match(html, /name="processedFoods"/);
});

test("022F makes closeout mandatory before the existing evidence seal", () => {
  assert.match(ritual, /const VERSION = "022F\.1"/);
  assert.match(ritual, /state = "CLOSEOUT_READY"/);
  assert.match(ritual, /action = "open_closeout"/);
  assert.match(app, /readDailyCloseout\(\)\?\.status !== "SEALED"/);
  assert.match(app, /function submitDailyCloseout\(/);
});

test("022F persists one account-backed closeout and preserves a daily history", () => {
  assert.match(app, /saveClosedLoopLocal\("CLOSEOUT", record\.date, record\)/);
  assert.match(app, /persistClosedLoopState\("CLOSEOUT", record\.date, record\)/);
  assert.match(app, /"HISTORY", "daily-closeout"/);
  assert.match(app, /steps: "SELF_REPORTED_CLOSEOUT"/);
  assert.match(app, /filter\(\(item\) => item\.id !== record\.id\)/);
});

test("022F exposes supplemental weekly evidence without changing the core weekly score", () => {
  assert.match(html, /id="weekly-closeout-evidence"/);
  assert.match(html, /Supplemental &middot; not part of the weekly score/);
  assert.match(app, /function renderWeeklyCloseoutEvidence\(/);
  assert.match(engine, /disciplineCoverage/);
  assert.match(engine, /observedAdherence/);
});

test("022F is responsive, versioned, and available offline", () => {
  assert.match(css, /Build 022F/);
  assert.match(css, /\.daily-closeout-panel/);
  assert.match(css, /\.weekly-closeout-evidence/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(html, /styles\.css\?v=(?:022[fg]|(?:023[abcdef]|024[abcdefghi]))/);
  assert.match(worker, /coach-dominion-(?:022[fg]|(?:023[abcdef]|024[abcdefghi]))-v1/);
  assert.match(worker, /daily-closeout\.js\?v=022f/);
  assert.match(worker, /daily-ritual\.js\?v=022f/);
  assert.match(worker, /app\.js\?v=(?:022[fg]|(?:023[abcdef]|024[abcdefghi]))/);
});

console.log("Build 022F Daily Closeout integration verified.");