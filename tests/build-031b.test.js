"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031B ships one account-backed recruit journey authority", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/real-account-journey.js");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");

  assert.match(html, /coach-dominion-release" content="031B\.1"/);
  assert.match(html, /real-account-journey\.js\?v=031b/);
  assert.match(engine, /const VERSION = "031B\.1"/);
  assert.match(engine, /const RECEIPT_TYPE = "REAL_ACCOUNT_JOURNEY"/);
  assert.match(engine, /ASSIGNMENT_SURFACE_MISMATCH/);
  assert.match(engine, /EXECUTION_RECEIPT_PENDING/);
  assert.match(engine, /FUEL_RECEIPT_PENDING/);
  assert.match(engine, /CLOSEOUT_RECEIPT_PENDING/);
  assert.match(app, /function buildCurrentRealAccountJourney/);
  assert.match(app, /function scheduleRealAccountJourneyReceipt/);
  assert.match(app, /scheduleAccountTruthSync\(50\)/);
  assert.match(worker, /031b-real-account-journey/);
  assert.match(worker, /real-account-journey\.js\?v=031b/);
  assert.match(app, /\/sw\.js\?v=031b/);
  assert.match(health, /release: "031B\.1"/);
  assert.match(health, /realAccountJourney: "cross-session-account-verified"/);
  assert.match(workflow, /npm run test:031b/);
  assert.match(workflow, /--expected-release 031B\.1/);
});

test("031B keeps engineering and release labels out of recruit-visible markup", () => {
  const html = read("app.html").replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  assert.doesNotMatch(html, />\s*(?:BUILD|RELEASE)\s+0?31B/i);
  assert.doesNotMatch(html, /REAL_ACCOUNT_JOURNEY/);
});
