"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031A wires early protected restore, canonical identity, date-safe Review, and receipted Fuel", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="031[ABC]\.1"/);
  assert.match(health, /release: "031[ABC]\.1"/);
  assert.match(health, /betaIntegrityRepair: "signed-authority-restored"/);
  assert.match(workflow, /npm run test:031a/);
  assert.match(workflow, /--expected-release 031[ABC]\.1/);
  assert.match(html, /week-progress\.js\?v=031a/);
  assert.match(html, /id="secondary-daily-state"/);
  assert.match(html, /id="integrity-status-channels"/);
  assert.match(app, /reconcileStartupAccountState\(\{ hydrationComplete: false \}\)/);
  assert.match(app, /DominionStartupAuthority\.verifiedDevicePreview/);
  assert.ok(app.indexOf("DominionStartupAuthority.verifiedDevicePreview") < app.indexOf("await accountLedgerPromise"), "verified device content must render before the account request completes");
  assert.match(app, /markStartupRestorePhase\("usable"\)/);
  assert.match(app, /DominionStartupAuthority\.completeHydration/);
  assert.match(app, /DominionWeekProgress\.resolve/);
  assert.match(app, /resolveEffectiveProgramIdentity/);
  assert.match(app, /assignment: activeEntry\?\.assignment/);
  assert.match(app, /\.select\("user_id,state_type,state_key,payload,updated_at"\)\s*\.single\(\)/);
  assert.match(app, /Fuel save was not acknowledged exactly/);
  assert.match(worker, /031a-beta-integrity/);
  assert.match(worker, /week-progress\.js\?v=031a/);
});

test("031A mobile secondary routes remove the full-width daily chrome", () => {
  const css = read("assets/styles.css");
  assert.match(css, /body:not\(\[data-dominion-section="today"\]\) \.secondary-daily-state/);
  assert.match(css, /body:not\(\[data-dominion-section="today"\]\) \.status-bar/);
  assert.match(css, /#roll-call-required \{ display: none !important; \}/);
});
