"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030D installs deterministic recruit journey continuity", () => {
  const engine = read("assets/js/journey-continuity.js");
  assert.match(engine, /const VERSION = "030D\.1"/);
  assert.match(engine, /RECRUIT_JOURNEY_CONTINUITY/);
  assert.match(engine, /function buildReceipt/);
  assert.match(engine, /function preservesEvidence/);
  assert.match(engine, /ACCOUNT VERIFIED/);
});

test("030D carries continuity receipts through account truth", () => {
  const truth = read("assets/js/dominion-account-truth.js");
  const app = read("assets/js/app.js");
  assert.match(truth, /journeyReceipts: 120/);
  assert.match(truth, /mergeCollection\(device\.journeyReceipts, account\.journeyReceipts/);
  assert.match(app, /function saveJourneyCertificationReceipt/);
  assert.match(app, /function journeyEvidenceItemsForDate/);
  assert.match(app, /item\?\.performanceDate/);
  assert.match(app, /journeyReceipts: readJourneyCertificationReceipts\(\)/);
  assert.match(app, /saveClosedLoopLocal\("HISTORY", "journey-certification"/);
  assert.match(app, /DominionJourneyContinuity\.evaluate/);
  assert.match(app, /"RESOLVE_CONTINUITY", "OPEN_ACCOUNT_HEALTH"/);
});

test("030D certifies effective-date, assignment, sync, and biometric boundaries", () => {
  const engine = read("assets/js/beta-journey-certification.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /ACTIVE_DATE_CONFLICT/);
  assert.match(engine, /ASSIGNMENT_SURFACE_MISMATCH/);
  assert.match(engine, /BIOMETRIC_CONFIRMATION_REQUIRED/);
  assert.match(engine, /offline_queued/);
  assert.match(app, /contractRevision: operatingContractRevision/);
  assert.match(app, /expectedAssignmentIds/);
});

test("030D release identity, shell, and production gate advance together", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const styles = read("assets/styles.css");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(html, /coach-dominion-release" content="030[DEFGHIJKLMNOPQRS]\.1"/);
  assert.match(html, /id="account-truth-continuity"/);
  assert.match(styles, /account-truth-health dl div:last-child:nth-child\(odd\)/);
  assert.match(html, /journey-continuity\.js\?v=030d/);
  assert.match(worker, /030(?:d-recruit-journey-certification|e-authoritative-startup)/);
  assert.match(worker, /journey-continuity\.js\?v=030d/);
  assert.match(health, /release: "030[DEFGHIJKLMNOPQRS]\.1"/);
  assert.match(workflow, /npm run test:030[defghijklmnopqrs]/);
  assert.match(workflow, /--expected-release 030[DEFGHIJKLMNOPQRS]\.1/);
  assert.match(packageJson, /"test:030d"/);
});
