"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030Z is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030Z\.1"/);
  assert.match(html, /field-command-closure\.js\?v=030z/);
  assert.ok(html.indexOf("field-command-closure.js?v=030z") < html.indexOf("app.js?v="));
  assert.match(worker, /030z-field-verified-command-closure/);
  assert.match(worker, /field-command-closure\.js\?v=030z/);
  assert.match(app, /register\("\/sw\.js\?v=030z"/);
  assert.match(health, /release: "030Z\.1"/);
  assert.match(health, /fieldCommandClosure: "assignment-account-confirmed"/);
  assert.match(workflow, /npm run test:030z/);
  assert.match(workflow, /--expected-release 030Z\.1/);
  const fixture = read("tests/fixtures/field-command-closure.html");
  assert.match(fixture, /data-route=/);
  assert.match(fixture, /Complete current assignment/);
  assert.match(fixture, /field-command-closure\.js\?v=030z/);
});

test("030Z makes one exact account receipt govern advancement", () => {
  const engine = read("assets/js/field-command-closure.js");
  const completion = read("assets/js/command-completion-certification.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /const VERSION = "030Z\.1"/);
  assert.match(engine, /COMMAND_COMPLETION_CERTIFICATION/);
  assert.match(engine, /status === "CERTIFIED"/);
  assert.match(engine, /verificationStatus === "VERIFIED"/);
  assert.match(engine, /sourceEvidenceConfirmed !== false/);
  assert.match(engine, /function exactAuthority/);
  assert.match(completion, /sourceAccountConfirmed/);
  assert.match(completion, /ledgerFingerprintBefore/);
  assert.match(app, /function buildCurrentFieldCommandClosure/);
  assert.match(app, /applyFieldCommandClosureSurfaces/);
  assert.match(app, /dataFieldClosure|dataset\.fieldClosure/);
});

test("030Z keeps protected work from falsely advancing Today or Closeout", () => {
  const app = read("assets/js/app.js");
  const ledger = read("assets/js/unified-execution-ledger.js");
  assert.match(ledger, /function commandClosure/);
  assert.match(ledger, /value\?\.status === "CERTIFIED"/);
  assert.match(app, /closureTerminal\("strength"\)/);
  assert.match(app, /closureTerminal\("running"\)/);
  assert.match(app, /closureTerminal\("core"\)/);
  assert.match(app, /closureTerminal\("nutrition"\)/);
  assert.match(app, /const closeoutAvailable = fieldCommandDayTerminal/);
  assert.match(app, /Finish and save every assigned item before closing the day/);
});

test("030Z closes every supported field module through the same receipt", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /saveMissionExecutionReceipt\("RUNNING"/);
  assert.match(app, /saveMissionExecutionReceipt\(code, execution/);
  assert.match(app, /sourceAccountConfirmed: synced/);
  assert.match(app, /id: `fuel-total:/);
  assert.match(app, /module: "NUTRITION"/);
  assert.match(app, /state: "LOGGED"/);
  assert.match(app, /module: "RECOVERY"/);
  assert.match(app, /function fieldRecoveryAssignmentId/);
  assert.match(app, /assignmentId: fieldRecoveryAssignmentId/);
  assert.match(app, /assignments\.every\(\(item\) => item\.terminal\)/);
});

test("030Z permits next-day handoff only after account-confirmed Closeout", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /accountConfirmedAt: confirmedAt/);
  assert.match(app, /verificationStatus: "VERIFIED"/);
  assert.match(app, /accountSaved && dailyLoop\?\.state === "CERTIFIED"/);
  assert.match(app, /dayComplete: closeout\?\.status === "SEALED" && Boolean\(closeout\?\.accountConfirmedAt\)/);
});

test("030Z remains invisible as release language to recruits", () => {
  const html = read("app.html").replace(/<!--[\s\S]*?-->/g, "");
  const body = html.slice(html.indexOf("<body"), html.indexOf("<script src="));
  assert.doesNotMatch(body, /(?:BUILD|RELEASE)\s+030Z/i);
  assert.doesNotMatch(body, /Field-Verified Command Closure/i);
});
