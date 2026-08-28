"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030V is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030V\.1"/);
  assert.match(html, /command-completion-certification\.js\?v=030v/);
  assert.match(html, /app\.js\?v=[^"]*-030v/);
  assert.match(worker, /030v-command-completion-certification/);
  assert.match(worker, /command-completion-certification\.js\?v=030v/);
  assert.match(app, /register\("\/sw\.js\?v=030v"/);
  assert.match(health, /release: "030V\.1"/);
  assert.match(health, /commandCompletion: "account-receipt-certified"/);
  assert.match(workflow, /npm run test:030v/);
  assert.match(workflow, /--expected-release 030V\.1/);
  assert.match(pkg.scripts["test:030v"], /command-completion-certification\.js/);
});

test("030V certifies only exact account-confirmed completion evidence", () => {
  const engine = read("assets/js/command-completion-certification.js");
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(engine, /const VERSION = "030V\.1"/);
  assert.match(engine, /COMMAND_COMPLETION_CERTIFICATION/);
  assert.match(engine, /SIGNED_CONTRACT_REQUIRED/);
  assert.match(engine, /COMMITTED_WEEK_REQUIRED/);
  assert.match(engine, /STALE_ASSIGNMENT_REJECTED/);
  assert.match(engine, /ASSIGNMENT_MODULE_MISMATCH/);
  assert.match(engine, /\["strength", "running", "core", "nutrition", "recovery"\]/);
  assert.match(app, /async function persistCommandCompletionHistory/);
  assert.match(app, /state_key: "command-completion-certification"[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /item\?\.id === history\[0\]\.id && item\?\.fingerprint === history\[0\]\.fingerprint/);
  assert.match(truth, /commandCompletions: 365/);
  assert.match(truth, /commandCompletions: mergeCollection/);
});

test("030V advances the actual daily command without inventing completion", () => {
  const engine = read("assets/js/command-completion-certification.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /TERMINAL_STATES/);
  assert.match(engine, /const COMPLETE_STATES = new Set\(\["COMPLETE", "COMPLETED", "SECURED", "SEALED"\]\)/);
  assert.match(engine, /receipt\.sessionComplete = COMPLETE_STATES\.has\(completion\.state\)/);
  assert.match(engine, /receipt\?\.completion\?\.state === "PAIN_HOLD"/);
  assert.match(engine, /type: "CLOSEOUT"/);
  assert.match(engine, /tertiary: value\.tertiary === true \|\| module === "core"/);
  assert.match(app, /function openCommandCompletionTarget/);
  assert.match(app, /next\.type === "CLOSEOUT"/);
  assert.match(app, /next\.type === "SAFETY" \|\| next\.module === "recovery"/);
  assert.match(app, /openMissionSessionDetails\(next\.module\.toUpperCase\(\)\)/);
  assert.match(app, /async function sealFuelDay[\s\S]*reconcileCommandCompletionCertification/);
});

test("030V shares the receipt with account truth, evidence, and execution surfaces", () => {
  const app = read("assets/js/app.js");
  const html = read("app.html");
  assert.match(app, /function readCommandCompletionHistory/);
  assert.match(app, /commandCompletions: readCommandCompletionHistory\(\)/);
  assert.match(app, /function reconcileCommandCompletionCertification/);
  assert.match(app, /saveClosedLoopLocal\("HISTORY", "command-completion-certification", history\)/);
  assert.match(app, /evidenceAutopilotMissionReceipts[\s\S]*readCommandCompletionHistory\(\)/);
  assert.match(app, /readMissionExecutionReceipts\(targetDate\),[\s\S]*readCommandCompletionHistory\(\)\.filter\(\(item\) => item\?\.operationalDate === targetDate\)/);
  assert.match(html, /id="command-completion-certification"/);
  assert.match(html, /id="daily-closeout-panel"/);
});

test("030V stays concise and phone ready", () => {
  const html = read("app.html");
  const css = read("assets/styles.css");
  const fixture = read("tests/fixtures/command-completion-preview.html");
  assert.match(css, /\.command-completion-certification/);
  assert.match(css, /\.command-completion-certification > button,[\s\S]*\.command-completion-certification > small \{ grid-column: 1; grid-row: auto; width: 100%; min-width: 0; \}/);
  assert.match(fixture, /data-completion-state="certified"/);
  assert.match(fixture, /data-completion-state="protected"/);
  assert.match(fixture, /data-completion-state="action_required"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030V/i);
});

test("030V has a deterministic command completion scenario gate", () => {
  const scenarios = read("scripts/command-completion-scenarios.js");
  [
    "STRENGTH_COMPLETION_CERTIFIED",
    "RUNNING_ACTUALS_CERTIFIED",
    "CORE_COMPLETION_CERTIFIED",
    "RECOVERY_COMPLETION_CERTIFIED",
    "FUEL_DAY_CERTIFIED",
    "TWO_A_DAY_ADVANCES_TO_PM",
    "CORE_REMAINS_TERTIARY",
    "FINAL_SESSION_OPENS_CLOSEOUT",
    "PARTIAL_SESSION_PRESERVED",
    "OFFLINE_COMPLETION_PROTECTED",
    "DUPLICATE_SUBMISSION_IDEMPOTENT",
    "STALE_ASSIGNMENT_REJECTED",
    "SECOND_DEVICE_RESTORES_RECEIPT"
  ].forEach((id) => assert.match(scenarios, new RegExp(id)));
});
