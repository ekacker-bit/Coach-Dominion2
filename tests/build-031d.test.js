"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031D wires one account-verified weekly verdict and next-week launch", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/weekly-verdict-launch.js");
  const weekly = read("assets/js/weekly-advancement.js");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");

  assert.match(html, /coach-dominion-release" content="031E\.1"/);
  assert.match(html, /weekly-verdict-launch\.js\?v=031e/);
  assert.match(weekly, /id="weekly-verdict-launch"/);
  assert.match(weekly, /Earn the week\. Launch the next\./);
  assert.match(weekly, /<summary>Evidence &amp; rank<\/summary>/);
  assert.match(engine, /const VERSION = "031E\.1"/);
  assert.match(engine, /const RECEIPT_TYPE = "WEEKLY_VERDICT_LAUNCH"/);
  assert.match(engine, /return "ADVANCE"/);
  assert.match(engine, /return "MAINTAIN"/);
  assert.match(engine, /return "REDUCE"/);
  assert.match(engine, /return "RECOVER"/);
  assert.match(engine, /state = "VERIFIED"/);
  assert.match(app, /function buildWeeklyVerdictLaunch/);
  assert.match(app, /function launchNextWeekFromWeeklyVerdict/);
  assert.match(app, /function scheduleWeeklyVerdictLaunchReceipt/);
  assert.match(app, /data-weekly-verdict-launch-action="approve"/);
  assert.match(worker, /031e-weekly-launch-truth/);
  assert.match(worker, /weekly-verdict-launch\.js\?v=031e/);
  assert.match(app, /\/sw\.js\?v=031e/);
  assert.match(health, /release: "031E\.1"/);
  assert.match(health, /weeklyVerdictLaunch: "proof-to-next-week-account-verified"/);
  assert.match(workflow, /npm run test:031d/);
  assert.match(workflow, /--expected-release 031E\.1/);
});

test("031D stays word-light and responsive", () => {
  const weekly = read("assets/js/weekly-advancement.js");
  const css = read("assets/styles.css");
  assert.doesNotMatch(weekly, />\s*(?:BUILD|RELEASE)\s+0?31D/i);
  assert.doesNotMatch(weekly, /WEEKLY_VERDICT_LAUNCH/);
  assert.match(css, /\.weekly-verdict-launch-lines/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.weekly-review-diagnostics/);
});
