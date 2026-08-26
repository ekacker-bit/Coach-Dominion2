"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030Q is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030[QRS]\.1"/);
  assert.match(html, /app\.js\?v=[^"]*-030q/);
  assert.match(worker, /030q-calendar-restore-repair/);
  assert.match(worker, /app\.js\?v=[^"]*-030q/);
  assert.match(app, /register\("\/sw\.js\?v=030[qrs]"/);
  assert.match(health, /release: "030[QRS]\.1"/);
  assert.match(health, /calendarRestore: "active-week-fail-safe"/);
  assert.match(workflow, /npm run test:030[qrs]/);
  assert.match(workflow, /--expected-release 030[QRS]\.1/);
  assert.match(pkg.scripts["test:030q"], /build-030q\.test\.js/);
});

test("030Q protects Calendar rendering from optional rollover failures", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function renderWeeklyOrchestratorContent\(\)/);
  assert.match(app, /function renderWeeklyOrchestratorRecovery\(error = null\)/);
  assert.match(app, /return renderWeeklyOrchestratorRecovery\(error\)/);
  assert.match(app, /function calendarRecoveryWeek\(\)/);
  assert.match(app, /ACTIVE · LIMITED VIEW/);
  assert.match(app, /data-weekly-orchestrator-action="retry-render"/);
  assert.match(app, /data-calendar-execution-action="strength"/);
  assert.match(app, /dataset\.calendarRender = "recovered"/);
  assert.match(app, /dataset\.calendarRender = "ready"/);
});

test("030Q turns malformed handoff context into a bounded recovery result", () => {
  const app = read("assets/js/app.js");
  const start = app.indexOf("function buildCurrentWeeklyRolloverCertification");
  const end = app.indexOf("async function saveWeeklyRolloverCertification", start);
  const implementation = app.slice(start, end);
  assert.ok(start > -1 && end > start);
  assert.match(implementation, /catch \(error\)/);
  assert.match(implementation, /code: "ROLLOVER_RECOVERY_REQUIRED"/);
  assert.match(implementation, /Your active Calendar remains protected/);
  assert.match(implementation, /\[weekly-rollover:recovery\]/);
  assert.match(app, /const status = String\(result\.status \|\| \(result\.valid \? "READY" : "BLOCKED"\)\)/);
  assert.doesNotMatch(implementation, /throw error/);
});

test("030Q startup diagnostics identify the recoverable surface without raw payloads", () => {
  const app = read("assets/js/app.js");
  const start = app.indexOf("async function runStartupTask");
  const end = app.indexOf("async function readStartupAccountLedger", start);
  const implementation = app.slice(start, end);
  assert.match(implementation, /Optional surface used protected local state: \$\{detail\}/);
  assert.match(implementation, /slice\(0, 180\)/);
  assert.doesNotMatch(implementation, /console\.(?:info|warn|error)\([^\n]+,\s*error\)/);
  assert.match(app, /function finalizeStartupRecoverySummary\(issues = \[\], state = startupAuthorityState\)/);
  assert.match(app, /Saved program loaded\. Optional context will retry without blocking your Calendar\./);
});
