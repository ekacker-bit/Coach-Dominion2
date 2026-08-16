const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const styles = read("assets/styles.css");
const continuity = read("assets/js/dominion-continuity.js");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));

test("Build 025N stores recoverable canonical program payloads", () => {
  assert.match(continuity, /const VERSION = "025N\.1"/);
  assert.match(continuity, /const SCHEMA_VERSION = 3/);
  assert.match(continuity, /function semanticFingerprint/);
  assert.match(continuity, /descriptor\.payload = payload/);
  assert.match(continuity, /function mergeRecordCollections/);
  assert.match(app, /function applyContinuityManifestModules/);
  assert.match(app, /function readRecruitContractTombstone/);
});

test("Build 025N proves one Contract-to-program lineage without mislabeling an active transition", () => {
  assert.match(continuity, /function canonicalLineage/);
  assert.match(continuity, /PROTECTED_CURRENT_WEEK/);
  assert.match(continuity, /next week must use Contract/);
  assert.match(app, /continuityLineageStateLabel/);
  assert.match(html, /<!-- Program continuity -->/);
  assert.match(html, /id="continuity-lineage-summary"/);
});

test("Build 025N asks for a choice only on a genuine same-revision divergence", () => {
  assert.match(continuity, /Same immutable revision has different contents/);
  assert.match(continuity, /Only non-program timestamps differed/);
  assert.match(app, /function currentContinuityConflicts/);
  assert.match(app, /data-continuity-action="resolve-device"/);
  assert.match(app, /data-continuity-action="resolve-account"/);
  assert.match(html, /id="continuity-conflict-list"/);
  assert.match(styles, /\.continuity-conflict-list/);
});

test("Build 025N retains and retries failed account writes across every canonical program domain", () => {
  assert.match(app, /function enqueueContinuityRetry/);
  assert.match(app, /function flushContinuityPendingWrites/);
  assert.match(app, /saved program writes/);
  for (const domain of ["contract", "strength", "running", "core", "nutrition", "calendar"]) {
    assert.match(app, new RegExp(`logAccountPersistenceFailure\\("${domain}"`));
    assert.match(app, new RegExp(`acknowledgeContinuityRetry\\("${domain}"`));
  }
  assert.match(html, /id="continuity-pending-panel"/);
  assert.match(html, /data-continuity-action="retry-pending"/);
});

test("Build 025N ships a fresh responsive offline shell", () => {
  assert.match(styles, /\.continuity-lineage-summary/);
  assert.match(styles, /\.continuity-domain\.protected-current-week/);
  assert.match(styles, /\.continuity-pending-panel/);
  assert.match(html, /dominion-continuity\.js\?v=025n/);
  assert.match(html, /styles\.css\?v=[^"\s]*025n/);
  assert.match(html, /app\.js\?v=[^"\s]*025n/);
  assert.match(worker, /coach-dominion-[^"\s]*025n/);
  assert.match(worker, /dominion-continuity\.js\?v=025n/);
  assert.match(app, /service-worker-reload:025n/);
  assert.match(app, /sw\.js\?v=025n/);
  assert.match(changelog, /Build 025N Program Continuity/);
  assert.ok(pkg.scripts["test:025n"]);
});
