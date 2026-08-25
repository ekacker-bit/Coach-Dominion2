"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030P is cache-busted, offline-cached, and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030P\.1"/);
  assert.match(html, /nutrition-state-contract\.js\?v=030p/);
  assert.ok(html.indexOf("nutrition-state-contract.js?v=030p") < html.indexOf("app.js?v="));
  assert.match(worker, /030p-public-beta-integrity-repair/);
  assert.match(worker, /nutrition-state-contract\.js\?v=030p/);
  assert.match(app, /register\("\/sw\.js\?v=030p"/);
  assert.match(health, /release: "030P\.1"/);
  assert.match(workflow, /npm run test:030p/);
  assert.match(workflow, /--expected-release 030P\.1/);
  assert.match(pkg.scripts["test:030p"], /public-beta-integrity\.test\.js/);
});

test("030P aligns Fuel types in client and migration without exposing database errors", () => {
  const engine = read("assets/js/nutrition-state-contract.js");
  const migration = read("supabase/migrations/20260824114430_public_beta_integrity_repair.sql");
  const app = read("assets/js/app.js");
  for (const stateType of ["BASELINE_HISTORY", "ADAPTIVE_GOAL", "ADAPTIVE_APPROVAL", "MEAL_WINDOW", "REVIEW_HISTORY", "MANUAL_DAY", "FASTING_PROTOCOL", "FASTING_EXECUTION", "MEAL_EXECUTION", "FUEL_CLOSED_LOOP"]) {
    assert.match(engine, new RegExp(`"${stateType}"`));
    assert.match(migration, new RegExp(`'${stateType}'`));
  }
  assert.match(migration, /when 'FASTING' then 'FASTING_PROTOCOL'/);
  assert.match(app, /Fuel save needs retry/);
  assert.match(app, /shouldPersist/);
});

test("030P protects signed calendar and makes historical Strength conflict deliberate", () => {
  const app = read("assets/js/app.js");
  const integrity = read("assets/js/beta-state-integrity.js");
  assert.match(app, /Number\(week\.contractRevision \|\| 0\) <= signedRevision/);
  assert.match(app, /Signed week protected/);
  assert.match(app, /data-session-resolution="required"/);
  assert.match(app, /data-assignment-action="reconcile-resume"/);
  assert.match(app, /data-assignment-action="reconcile-start-today"/);
  assert.match(integrity, /signedContractRevisionId/);
  assert.match(integrity, /committedWeekId/);
  assert.match(integrity, /calendarAssignmentId/);
  assert.match(integrity, /activeSessionId/);
  assert.match(integrity, /evidenceId/);
});

test("030P keeps Review and Today word-light and explicit", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");
  assert.match(html, /applicable evidence observations—not training windows/);
  assert.match(app, /missingLabels/);
  assert.match(app, /Campaign closes/);
  assert.match(css, /Build 030P: public-beta state integrity/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.today-quick-log-run/);
  assert.doesNotMatch(html, />030P</);
  assert.doesNotMatch(app, />030P</);
});
