"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Build 030A gates release on six real recruit journeys", () => {
  const engine = read("assets/js/real-recruit-certification.js");
  const scenarios = read("scripts/real-recruit-scenarios.js");
  const runner = read("scripts/real-recruit-certification.js");
  assert.match(engine, /const VERSION = "030A\.1"/);
  assert.match(engine, /type: "REAL_RECRUIT_CERTIFICATION"/);
  assert.match(engine, /function runScenario/);
  assert.match(engine, /function runSuite/);
  ["NEW_RECRUIT_TO_CLOSEOUT", "RETURNING_RECRUIT_RESTORE", "CONTRACT_AMENDMENT_HANDOFF", "OFFLINE_TO_CONFIRMED", "DAILY_EVIDENCE_AND_CLOSEOUT", "ATLAS_DECISION_CONTROL"]
    .forEach((id) => assert.match(scenarios, new RegExp(id)));
  assert.match(runner, /report\.scenarioCount/);
  assert.match(runner, /report\.checkpointCount/);
});

test("Build 030A protects the active week and rejects a stale staged week", () => {
  const journey = read("assets/js/beta-journey-certification.js");
  const app = read("assets/js/app.js");
  assert.match(journey, /protectedCurrentWeek/);
  assert.match(journey, /operatingContractRevision/);
  assert.match(journey, /STAGED_WEEK_CONTRACT_MISMATCH/);
  assert.match(app, /lineage\?\.modules\?\.calendar\?\.state === "PROTECTED_CURRENT_WEEK"/);
  assert.match(app, /stagedWeek: lifecycle\?\.weekDraft/);
});

test("Build 030A proves second-session stability and evidence preservation", () => {
  const engine = read("assets/js/real-recruit-certification.js");
  const tests = read("tests/real-recruit-certification.test.js");
  assert.match(engine, /sameReceiptAs/);
  assert.match(engine, /preserveEvidenceFrom/);
  assert.match(tests, /same suite receipt for an unchanged second run/);
  assert.match(tests, /protected evidence disappears between sessions/);
});

test("Build 030A is identifiable and required by release CI", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(html, /coach-dominion-release" content="030[ABC]\.1"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030A/i);
  assert.match(worker, /030a-real-recruit-certification/);
  assert.match(health, /release: "030[ABC]\.1"/);
  assert.match(health, /realRecruitCertification: "required"/);
  assert.match(workflow, /npm run test:030[abc]/);
  assert.match(workflow, /--expected-release 030[ABC]\.1/);
  assert.match(packageJson, /"test:030a"/);
});
