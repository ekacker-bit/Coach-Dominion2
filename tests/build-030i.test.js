const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("030I turns Closeout and the canonical ledger into one account-backed verdict", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function buildAtlasClosedLoopDecision/);
  assert.match(app, /buildCurrentExecutionLedger\(date\)/);
  assert.match(app, /function saveAtlasClosedLoopDecision/);
  assert.match(app, /"DAILY_VERDICT"/);
  assert.match(app, /"atlas-closed-loop"/);
  assert.match(app, /reconcileAtlasClosedLoopDecision\(record\)/);
});

test("030I exposes one short decision in Today and Closeout", () => {
  const html = read("app.html");
  const styles = read("assets/styles.css");
  assert.match(html, /id="atlas-closeout-verdict"/);
  assert.match(html, /id="atlas-closed-loop-today"/);
  assert.match(styles, /\.atlas-closed-loop-verdict/);
  assert.match(styles, /\.atlas-closed-loop-signals/);
  assert.match(styles, /@media \(max-width: 560px\)/);
});

test("030I applies accepted decisions consistently without rewriting the committed week", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /applyAtlasClosedLoopToStrengthPrescription/);
  assert.match(app, /applyAtlasClosedLoopToRunningPrescription/);
  assert.match(app, /applyAtlasClosedLoopToCorePrescription/);
  assert.match(app, /DominionAtlasClosedLoop\.applyToDay/);
  assert.match(app, /DominionAtlasClosedLoop\.calendarOverride/);
  assert.doesNotMatch(app, /saveWeeklyOrchestrationLocal\([^\n]+atlas-closed-loop/);
});

test("030I is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  const integrity = read("scripts/release-integrity.js");
  assert.match(html, /coach-dominion-release" content="030[IJKLMNOPQ]\.1/);
  assert.match(html, /atlas-closed-loop\.js\?v=030i/);
  assert.ok(html.indexOf("atlas-closed-loop.js?v=030i") < html.indexOf("app.js?v="));
  assert.match(worker, /030i-closed-loop-coaching/);
  assert.match(worker, /atlas-closed-loop\.js\?v=030i/);
  assert.match(app, /register\("\/sw\.js\?v=030[ijklmnopq]"/);
  assert.match(health, /release: "030[IJKLMNOPQ]\.1"/);
  assert.match(health, /closedLoopCoaching: "evidence-to-next-day"/);
  assert.match(workflow, /npm run test:030[ijklmnopq]/);
  assert.match(workflow, /--expected-release 030[IJKLMNOPQ]\.1/);
  assert.match(packageJson, /"test:030i"/);
  assert.match(integrity, /030I closed-loop coaching/);
});
