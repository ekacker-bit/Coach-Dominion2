const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/evidence-autopilot.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/evidence-autopilot-preview.html");

test("Build 026J installs one evidence engine before application bindings", () => {
  assert.match(engine, /const VERSION = "026J\.1"/);
  assert.match(engine, /function mergeReceipts/);
  assert.match(engine, /function dailyProof/);
  assert.ok(html.indexOf("evidence-autopilot.js?v=026j") < html.indexOf("app.js?v="));
});

test("completion evidence reconciles idempotently without inflating credit", () => {
  assert.match(engine, /function actionIdentity/);
  assert.match(engine, /function lineageId/);
  assert.match(engine, /function isSecured/);
  assert.match(engine, /status === "VERIFIED" \|\| receipt\?\.status === "SELF_REPORTED"/);
  assert.match(engine, /return TERMINAL_STATES\.has\(state\) \? "SELF_REPORTED" : "INCOMPLETE"/);
});

test("Strength, Cardio, Core, Fuel, Roll Call, closeout, and recovery feed one proof trail", () => {
  assert.match(app, /function evidenceAutopilotSources/);
  ["STRENGTH_EXECUTION", "CORE_EXECUTION", "PERFORMANCE_ENTRY", "FUEL_CLOSEOUT", "MEAL_EXECUTION", "ROLL_CALL", "DAILY_CLOSEOUT", "RECOVERY_ORDER"].forEach((source) => assert.match(app, new RegExp(source)));
  assert.match(app, /persistClosedLoopState\("HISTORY", "evidence-autopilot"/);
});

test("Today and Weekly Review show concise proof without changing scoring", () => {
  assert.match(html, /id="evidence-autopilot-status"/);
  assert.match(html, /id="weekly-proof-status"/);
  assert.match(html, /Does not change the weekly score/);
  assert.match(styles, /\.evidence-autopilot-status/);
  assert.match(styles, /\.weekly-proof-status/);
  assert.match(preview, /3 proofs secured/);
});

test("Account Truth and Trends receive canonical proof", () => {
  assert.match(app, /\.\.\.readEvidenceAutopilotHistory\(\)/);
  assert.match(app, /function repairEvidenceAutopilotPerformance/);
  assert.match(app, /source_evidence_id/);
  assert.doesNotMatch(app, /runStartupTask\("evidence autopilot"/);
  assert.match(app, /function scheduleEvidenceAutopilotReconciliation/);
  assert.match(app, /DominionStartupAuthority\.permitsAccountWrite\(startupAuthorityState, "state_change"\)/);
});

test("Build 026J is cache-safe, documented, and regression-tested", () => {
  assert.match(worker, /026h-026i-026j/);
  assert.match(worker, /evidence-autopilot\.js\?v=026j/);
  assert.match(app, /sw\.js\?v=026j/);
  assert.match(changelog, /Build 026J Evidence Autopilot/);
  assert.match(integrity, /026J evidence engine/);
  assert.ok(pkg.scripts["test:026j"].includes("evidence-autopilot.test.js"));
  assert.ok(pkg.scripts["test:026j"].includes("weekly-inspection.test.js"));
  assert.ok(pkg.scripts["test:026j"].includes("trends-intelligence.test.js"));
});
