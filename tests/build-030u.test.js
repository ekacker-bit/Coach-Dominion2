"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030U remains cache-busted and protected by the current production gate", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030[UV]\.1"/);
  assert.match(html, /morning-command-activation\.js\?v=030u/);
  assert.match(html, /app\.js\?v=[^"]*-030u(?:-030v)?/);
  assert.match(worker, /030u-morning-command-activation/);
  assert.match(worker, /morning-command-activation\.js\?v=030u/);
  assert.match(app, /register\("\/sw\.js\?v=030[uv]"/);
  assert.match(health, /release: "030[UV]\.1"/);
  assert.match(health, /morningCommand: "overnight-account-certified"/);
  assert.match(workflow, /npm run test:030[uv]/);
  assert.match(workflow, /--expected-release 030[UV]\.1/);
  assert.match(pkg.scripts["test:030u"], /morning-command-certification\.js/);
});

test("030U activates only one exact account-confirmed morning receipt", () => {
  const engine = read("assets/js/morning-command-activation.js");
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(engine, /const VERSION = "030U\.1"/);
  assert.match(engine, /MORNING_COMMAND_ACTIVATION/);
  assert.match(engine, /PRIOR_DAY_EXECUTION_RESOLUTION/);
  assert.match(engine, /value\.accountConfirmedAt/);
  assert.match(app, /async function persistMorningCommandHistory/);
  assert.match(app, /state_key: stateKey[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /data\.payload\.some\(\(item\) => item\?\.id === history\[0\]\.id\)/);
  assert.match(truth, /morningActivations: 120/);
  assert.match(truth, /morningResolutions: 120/);
  assert.match(truth, /morningActivations: mergeCollection/);
  assert.match(truth, /morningResolutions: mergeCollection/);
});

test("030U keeps every daily surface on one authority and opens the actual logger", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/morning-command-activation.js");
  assert.match(html, /id="morning-command-activation"/);
  assert.match(app, /runStartupTask\("next-day command"/);
  assert.match(app, /runStartupTask\("morning command"/);
  assert.ok(app.indexOf('runStartupTask("next-day command"') < app.indexOf('runStartupTask("morning command"'));
  assert.match(engine, /HANDOFF_CONTRACT_MISMATCH/);
  assert.match(engine, /HANDOFF_WEEK_MISMATCH/);
  assert.match(engine, /HANDOFF_TODAY_MISMATCH/);
  assert.match(engine, /HANDOFF_ASSIGNMENTS_CHANGED/);
  assert.match(app, /function openMorningCommandTarget/);
  assert.match(app, /openFrictionlessLogger\(target\.module === "nutrition" \? "fuel" : target\.module\)/);
  assert.match(app, /running-command-panel/);
  assert.match(app, /today-core-detail/);
});

test("030U makes prior-day work a deliberate, evidence-preserving choice", () => {
  const app = read("assets/js/app.js");
  const engine = read("assets/js/morning-command-activation.js");
  assert.match(engine, /MULTIPLE_ACTIVE_EXECUTIONS/);
  assert.match(engine, /RESUME: "RESUME"/);
  assert.match(engine, /RESCHEDULE: "RESCHEDULE"/);
  assert.match(engine, /CLOSE_INCOMPLETE: "CLOSE_INCOMPLETE"/);
  assert.match(app, /function readActiveRunningExecutions/);
  assert.match(app, /function readActiveCoreExecutions/);
  assert.match(app, /async function stopMorningPriorExecution/);
  assert.match(app, /preserveStrengthWorkout\(saved, \{ proposeAdjustment: false \}\)/);
  assert.match(app, /persistRunningState\("EXECUTION", sourceDate, stopped\)/);
  assert.match(app, /persistCoreProgramState\("EXECUTION", sourceDate, stopped\)/);
});

test("030U stays concise and phone ready", () => {
  const html = read("app.html");
  const css = read("assets/styles.css");
  const fixture = read("tests/fixtures/morning-command-preview.html");
  assert.match(css, /\.morning-command-activation/);
  assert.match(css, /\.morning-command-prior-actions \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.morning-command-prior-actions button \{ width: 100%; min-width: 0; \}/);
  assert.match(fixture, /data-activation-state="certified"/);
  assert.match(fixture, /data-activation-state="decision_required"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030U/i);
});

test("030U has a deterministic overnight activation scenario gate", () => {
  const scenarios = read("scripts/morning-command-scenarios.js");
  [
    "CERTIFIED_HANDOFF_REQUIRED",
    "MIDNIGHT_UNFINISHED_WORK_NEEDS_ONE_CHOICE",
    "RESUME_PRESERVES_TODAY",
    "RESCHEDULE_RELEASES_TODAY",
    "CLOSE_INCOMPLETE_RELEASES_TODAY",
    "AUTHORITY_DRIFT_STOPS_THE_LINE",
    "ASSIGNMENT_DRIFT_STOPS_THE_LINE",
    "ACCOUNT_RECEIPT_CERTIFIES_ACTIVATION",
    "SECOND_DEVICE_RESTORES_SAME_COMMAND",
    "DIRECT_ROUTE_OPENS_ACTUAL_LOGGER"
  ].forEach((id) => assert.match(scenarios, new RegExp(id)));
});
