"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Build 029O certifies the complete recruit journey through Account Health", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.match(html, /beta-journey-certification\.js\?v=029o(?:-030a)?(?:-030d)?/);
  assert.ok(html.indexOf("beta-journey-certification.js?v=029o") < html.indexOf("app.js?v="));
  assert.match(app, /function buildCurrentBetaJourneyCertification/);
  assert.match(app, /DominionBetaJourneyCertification\.evaluate/);
  assert.match(app, /dataset\.betaJourney/);
  assert.match(app, /currentBetaJourneyCertification/);
});

test("Build 029O names one first failure and reuses existing repair routes", () => {
  const engine = read("assets/js/beta-journey-certification.js");
  const app = read("assets/js/app.js");
  const html = read("app.html");
  assert.match(engine, /const firstProblem = stages\.find/);
  assert.match(engine, /RESOLVE_CONTINUITY/);
  assert.match(app, /\["CHOOSE_SAVED_COPY", "RESOLVE_CONTINUITY", "OPEN_ACCOUNT_HEALTH"\]/);
  assert.doesNotMatch(html, /id="beta-journey-dashboard"/);
  assert.doesNotMatch(html, />\s*(?:BUILD|RELEASE)\s+029O/i);
});

test("Build 029O proves an unchanged second session deterministically", () => {
  const engine = read("assets/js/beta-journey-certification.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /function certificationReceipt/);
  assert.match(engine, /type: "BETA_JOURNEY_CERTIFICATION"/);
  assert.match(engine, /fingerprint: result\.fingerprint/);
  assert.match(app, /betaJourneyReceipt/);
});

test("Build 029O is identifiable, cached, and production-gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(html, /coach-dominion-release" content="(?:029O|030[ABCDEFGHIJK])\.1"/);
  assert.match(worker, /029o-beta-journey-certification/);
  assert.match(worker, /beta-journey-certification\.js\?v=029o(?:-030a)?(?:-030d)?/);
  assert.match(health, /release: "(?:029O|030[ABCDEFGHIJK])\.1"/);
  assert.match(health, /betaJourney: "available"/);
  assert.match(workflow, /npm run test:(?:029o|030[abcdefghijk])/);
  assert.match(workflow, /--expected-release (?:029O|030[ABCDEFGHIJK])\.1/);
  assert.match(packageJson, /"test:029o"/);
});
