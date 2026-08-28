"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030R is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030[RSTUV]\.1"/);
  assert.match(html, /beta-state-integrity\.js\?v=030r/);
  assert.match(html, /app\.js\?v=[^"]*-030r/);
  assert.match(worker, /030r-execution-authority-reconciliation/);
  assert.match(worker, /beta-state-integrity\.js\?v=030r/);
  assert.match(app, /register\("\/sw\.js\?v=030[rstuv]"/);
  assert.match(health, /release: "030[RSTUV]\.1"/);
  assert.match(health, /executionAuthority: "signed-week-reconciled"/);
  assert.match(workflow, /npm run test:030[rstuv]/);
  assert.match(workflow, /--expected-release 030[RSTUV]\.1/);
  assert.match(pkg.scripts["test:030r"], /execution-authority\.test\.js/);
});

test("030R reconciles stale Strength identity after Calendar restore", () => {
  const app = read("assets/js/app.js");
  const calendar = app.indexOf('runStartupTask("Calendar"');
  const authority = app.indexOf('runStartupTask("execution authority"');
  const weekExecution = app.indexOf('runStartupTask("week execution"');
  assert.ok(calendar > -1 && authority > calendar && weekExecution > authority);
  assert.match(app, /async function reconcileStrengthExecutionAuthority/);
  assert.match(app, /Archived during signed-week execution reconciliation/);
  assert.match(app, /preserveStrengthWorkout\(stopped, \{ proposeAdjustment: false \}\)/);
  assert.match(app, /if \(options\.proposeAdjustment === false\) return/);
  assert.match(app, /if \(resolution\.activeExecution\) saveStrengthStateLocal\("EXECUTION", "active", resolution\.activeExecution\)/);
  assert.match(app, /execution-authority-reconciliation/);
  assert.match(app, /data-session-authority="reconciled"/);
});

test("030R only clears an account draft after the filtered delete succeeds", () => {
  const app = read("assets/js/app.js");
  const start = app.indexOf("async function clearRecruitContractState");
  const end = app.indexOf("async function loadRecruitContractState", start);
  const clear = app.slice(start, end);
  assert.match(clear, /\.delete\(\)[\s\S]*\.eq\("user_id", session\.user\.id\)[\s\S]*\.eq\("state_type", stateType\)[\s\S]*\.eq\("state_key", "current"\)[\s\S]*\.select\("state_type,state_key"\)/);
  assert.ok(clear.indexOf("if (error) throw error") < clear.lastIndexOf("window.localStorage.removeItem"));
  assert.match(app, /requireNoOperatingChanges: true/);
  assert.match(app, /await refreshAuthoritySurfaces\(\)/);
});

test("030R settles startup health and gives the active week program authority", () => {
  const app = read("assets/js/app.js");
  const integrity = read("assets/js/beta-state-integrity.js");
  assert.match(integrity, /function resolveOperatingProgramAuthority/);
  assert.match(integrity, /source: signedWeek \? "SIGNED_ACTIVE_WEEK"/);
  assert.match(app, /contractRevision: Number\(programAuthority\?\.contractRevision \|\| week\?\.contractRevision/);
  assert.match(app, /function settleAccountHealthSurface/);
  assert.match(app, /dataset\.accountHealthSettled = "true"/);
  assert.doesNotMatch(app, />030R</);
});
