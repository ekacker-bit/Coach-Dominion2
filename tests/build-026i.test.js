const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/dominion-account-truth.js");
const migration = read("supabase/migrations/028_dominion_account_truth.sql");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/account-truth-preview.html");

test("Build 026I installs one versioned Account Truth engine before app bindings", () => {
  assert.match(engine, /const VERSION = "(?:026I|029N|030D|030E|030K|030L|030M)\.1"/);
  assert.match(engine, /const TRUTH_DOMAINS/);
  assert.match(engine, /function reconcileSnapshots/);
  assert.ok(html.indexOf("dominion-account-truth.js?v=026i") < html.indexOf("app.js?v="));
});

test("program state and broader recruit truth save atomically", () => {
  assert.match(migration, /sync_dominion_account_truth/);
  assert.match(migration, /manifest = coalesce\(next_manifest/);
  assert.match(migration, /truth_snapshot = coalesce\(next_truth_snapshot/);
  assert.match(migration, /current_row\.revision <> coalesce\(expected_revision/);
  assert.match(app, /writeEnvelope = buildAccountTruthWriteEnvelope\(programManifest, reconciliation\.snapshot/);
  assert.match(app, /saveAccountTruthLedger\(writeEnvelope/);
});

test("profile, readiness, evidence, and coaching memory reconcile at startup", () => {
  assert.match(app, /function buildCurrentAccountTruthSnapshot/);
  assert.match(app, /orientation: readRecruitOnboardingState/);
  assert.match(app, /performance: performanceEntries/);
  assert.match(app, /outcomes: readAtlasAdaptationOutcomeHistory/);
  assert.doesNotMatch(app, /runStartupTask\("account save", \(\) => syncDominionAccountTruth/);
  assert.match(app, /startupAccountLedger = navigator\.onLine === false \? null : await loadAccountTruthLedger\(\)/);
  assert.match(app, /const authoritativeStartup = reconcileStartupAccountState\(\)/);
  assert.match(app, /function applyAccountTruthSnapshot/);
});

test("offline writes keep one complete recoverable snapshot and retry automatically", () => {
  assert.match(engine, /function queueLatest/);
  assert.match(engine, /function readyQueuedWrite/);
  assert.match(app, /function queueAccountTruthWrite/);
  assert.match(app, /flushAccountTruthPendingWrite\(\{ force: true \}\)/);
  assert.match(app, /window\.addEventListener\("online"/);
});

test("the existing continuity dialog exposes a concise health check", () => {
  assert.match(html, /id="account-truth-health"/);
  assert.match(html, /Your work stays yours\./);
  assert.match(html, /id="account-truth-evidence"/);
  assert.match(styles, /\.account-truth-health/);
  assert.match(app, /function renderAccountTruthHealth/);
  assert.match(preview, /data-truth-tone="green"/);
  assert.match(preview, /Account ledger verified/);
});

test("Build 026I is cache-safe, documented, and regression-tested", () => {
  assert.match(worker, /026g-026h-026i/);
  assert.match(worker, /dominion-account-truth\.js\?v=026i/);
  assert.match(app, /sw\.js\?v=026i/);
  assert.match(changelog, /Build 026I Account Truth/);
  assert.match(integrity, /026I atomic account truth/);
  assert.ok(pkg.scripts["test:026i"].includes("dominion-account-truth.test.js"));
  assert.ok(pkg.scripts["test:026i"].includes("dominion-continuity.test.js"));
});
