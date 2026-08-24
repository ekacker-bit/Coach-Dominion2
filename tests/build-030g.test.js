const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("030G derives every daily domain from one assignment-linked ledger", () => {
  const engine = read("assets/js/unified-execution-ledger.js");
  assert.match(engine, /const VERSION = "030G\.1"/);
  assert.match(engine, /const DOMAINS = Object\.freeze\(\["strength", "running", "core", "nutrition"\]\)/);
  assert.match(engine, /function resolveEntry/);
  assert.match(engine, /function buildLedger/);
  assert.match(engine, /function consistencyReport/);
  assert.match(engine, /assignmentId/);
});

test("030G makes Today, Quick Log, Calendar, and Review consume the ledger", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function buildCurrentExecutionLedger/);
  assert.match(app, /function currentExecutionLedgerAssignments/);
  assert.match(app, /function todaySessionExecution[\s\S]+buildCurrentExecutionLedger/);
  assert.match(app, /function currentFrictionlessExecution[\s\S]+const executionLedger = buildCurrentExecutionLedger/);
  assert.match(app, /function todayQuickLogExistingRun[\s\S]+currentExecutionLedgerEntry\("running"\)/);
  assert.match(app, /function buildCurrentOperatingTruth[\s\S]+currentOperatingTruth\.executionLedger/);
});

test("030G preserves strict evidence boundaries for Run and Fuel", () => {
  const engine = read("assets/js/unified-execution-ledger.js");
  assert.match(engine, /function validRunningEvidence/);
  assert.match(engine, /distance > 0 && duration > 0/);
  assert.match(engine, /function validNutritionEvidence/);
  assert.match(engine, /calories\) > 0 && finite\(values\.protein\) > 0/);
  assert.match(engine, /evidenceAssignmentId\(item\) === expected/);
});

test("030G is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030[GHIJKLMNO]\.1/);
  assert.match(html, /unified-execution-ledger\.js\?v=030g/);
  assert.ok(html.indexOf("unified-execution-ledger.js?v=030g") < html.indexOf("app.js?v="));
  assert.match(worker, /030g-unified-execution-ledger/);
  assert.match(worker, /unified-execution-ledger\.js\?v=030g/);
  assert.match(app, /register\("\/sw\.js\?v=030[ghijklmno]"/);
  assert.match(health, /release: "030[GHIJKLMNO]\.1"/);
  assert.match(health, /executionLedger: "canonical"/);
  assert.match(workflow, /npm run test:030[ghijklmno]/);
  assert.match(workflow, /--expected-release 030[GHIJKLMNO]\.1/);
});
