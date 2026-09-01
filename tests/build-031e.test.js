"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031E makes Weekly Review fail closed with one visible lifecycle", () => {
  const engine = read("assets/js/weekly-verdict-launch.js");
  const app = read("assets/js/app.js");
  const weekly = read("assets/js/weekly-advancement.js");

  assert.match(engine, /const VERSION = "031E\.1"/);
  assert.match(engine, /function presentation/);
  assert.match(engine, /finalizeVisible: false/);
  assert.match(engine, /retryVisible: true/);
  assert.match(app, /function applyWeeklyReviewLifecycle/);
  assert.match(app, /renderWeeklyVerdictLaunch\(null, \{ loading: true \}\)/);
  assert.match(app, /renderWeeklyVerdictLaunch\(null, \{ error:/);
  assert.match(app, /Weekly Review could not render safely/);
  assert.match(weekly, /id="finalize-week" type="button" hidden disabled/);
});

test("031E binds the approved week to its first mission and safe edit path", () => {
  const engine = read("assets/js/weekly-verdict-launch.js");
  const app = read("assets/js/app.js");

  assert.match(engine, /function firstMission/);
  assert.match(engine, /First order:/);
  assert.match(engine, /operatingDate < targetWeek\.weekStart/);
  assert.match(engine, /REOPEN_NEXT_WEEK/);
  assert.match(app, /function reopenNextWeekFromWeeklyVerdict/);
  assert.match(app, /weekly_launch_reopened/);
  assert.match(app, /approved version remains protected until you approve a replacement/);
});

test("031E ships a fresh responsive production shell", () => {
  const html = read("app.html");
  const css = read("assets/styles.css");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = read("package.json");

  assert.match(html, /coach-dominion-release" content="031E\.1"/);
  assert.match(html, /weekly-verdict-launch\.js\?v=031e/);
  assert.match(worker, /031e-weekly-launch-truth/);
  assert.match(worker, /weekly-verdict-launch\.js\?v=031e/);
  assert.match(app, /\/sw\.js\?v=031e/);
  assert.match(health, /release: "031E\.1"/);
  assert.match(health, /weeklyLaunchTruth: "single-state-fail-closed"/);
  assert.match(workflow, /npm run test:031e/);
  assert.match(workflow, /--expected-release 031E\.1/);
  assert.match(pkg, /"test:031e"/);
  assert.match(css, /\.weekly-verdict-launch-loading/);
  assert.match(css, /@media \(max-width: 720px\)/);
});
