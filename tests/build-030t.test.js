"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030T is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030[TUV]\.1"/);
  assert.match(html, /next-day-command-handoff\.js\?v=030t/);
  assert.match(html, /app\.js\?v=[^"]*-030t(?:-030u)?/);
  assert.match(worker, /030t-next-day-command-handoff/);
  assert.match(worker, /next-day-command-handoff\.js\?v=030t/);
  assert.match(app, /register\("\/sw\.js\?v=030[tuv]"/);
  assert.match(health, /release: "030[TUV]\.1"/);
  assert.match(health, /nextDayCommand: "certified-handoff"/);
  assert.match(workflow, /npm run test:030[tuv]/);
  assert.match(workflow, /--expected-release 030[TUV]\.1/);
  assert.match(pkg.scripts["test:030t"], /next-day-command-certification\.js/);
});

test("030T creates one exact account-confirmed handoff", () => {
  const engine = read("assets/js/next-day-command-handoff.js");
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(engine, /const VERSION = "030T\.1"/);
  assert.match(engine, /NEXT_DAY_COMMAND_HANDOFF/);
  assert.match(engine, /REVIEW_REQUIRED/);
  assert.match(app, /async function persistNextDayCommandHandoffHistory/);
  assert.match(app, /state_key: "next-day-command-handoff"[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /data\.payload\.some\(\(item\) => item\?\.id === history\[0\]\.id\)/);
  assert.match(truth, /nextDayHandoffs: 120/);
  assert.match(truth, /nextDayHandoffs: mergeCollection/);
});

test("030T joins closeout, consent, startup, and every daily surface", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/next-day-command-handoff.js");
  assert.match(html, /id="next-day-command-handoff"/);
  assert.match(app, /sourceReceipt: dailyLoop\.receipt/);
  assert.match(app, /runStartupTask\("next-day command"/);
  assert.match(app, /data-atlas-closed-loop-action="ACCEPT"/);
  ["calendar", "today", "train", "quickLog", "fuel"].forEach((surface) => assert.match(engine, new RegExp(surface)));
  assert.match(engine, /supersededByContract/);
  assert.match(engine, /crossedWeekBoundary/);
});

test("030T stays word-light and phone ready", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/next-day-command-handoff.js");
  const css = read("assets/styles.css");
  const fixture = read("tests/fixtures/next-day-command-preview.html");
  assert.match(engine, /Recovery governs/);
  assert.match(engine, /Plan holds/);
  assert.match(css, /\.next-day-command-handoff/);
  assert.match(css, /\.next-day-command-actions \{ flex-direction: column; \}/);
  assert.match(css, /\.next-day-command-actions button \{ width: 100%; \}/);
  assert.match(fixture, /data-handoff-state="certified"/);
  assert.match(fixture, /data-handoff-state="review_required"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030T/i);
});

test("030T has a deterministic stop-the-line scenario gate", () => {
  const scenarios = read("scripts/next-day-command-scenarios.js");
  [
    "PRIOR_DAY_MUST_BE_CERTIFIED",
    "PROPOSED_CHANGE_NEEDS_ONE_CHOICE",
    "SURFACE_DIVERGENCE_STOPS_THE_LINE",
    "CURRENT_CONTRACT_OUTRANKS_STALE_CALL",
    "NEW_WEEK_STAYS_INTACT",
    "ACCOUNT_RECEIPT_CERTIFIES_COMMAND",
    "SECOND_DEVICE_RESTORES_SAME_COMMAND"
  ].forEach((id) => assert.match(scenarios, new RegExp(id)));
});
