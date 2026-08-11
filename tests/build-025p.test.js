const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/unified-blocker-resolution.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));

test("Build 025P makes continuity the canonical highest-priority command", () => {
  assert.match(engine, /const VERSION = "025P\.1"/);
  assert.match(engine, /priority: 100/);
  assert.match(engine, /CONTINUITY_CHOICE/);
  assert.match(app, /function buildCurrentUnifiedBlocker/);
  assert.match(app, /DominionUnifiedBlockerResolution\.applyToDailyCommand/);
  assert.match(app, /buildCurrentUnifiedBlocker\(\)/);
});

test("Build 025P routes the Today command directly to the saved-copy choice", () => {
  assert.match(engine, /action: "RESOLVE_CONTINUITY"/);
  assert.match(app, /function runUnifiedBlockerAction/);
  assert.match(app, /#continuity-conflict-list button/);
  assert.match(app, /\["RESOLVE_CONTINUITY", "RETRY_CONTINUITY"\]/);
  assert.match(html, /id="continuity-repair-dialog"/);
});

test("Build 025P gives Program, Calendar, mobile, and the header one blocker", () => {
  assert.match(app, /DominionUnifiedBlockerResolution\.programView/);
  assert.match(app, /unifiedBlockerBannerMarkup\(unifiedBlocker, "calendar"\)/);
  assert.match(app, /action: "UNIFIED_BLOCKER"/);
  assert.match(app, /data-unified-blocker-action/);
  assert.match(html, /id="continuity-status"/);
  assert.match(styles, /\.unified-blocker-banner/);
});

test("Build 025P advances automatically after the final choice", () => {
  assert.match(app, /function completeContinuityResolution/);
  assert.match(app, /DominionUnifiedBlockerResolution\.resolutionOutcome/);
  assert.match(app, /dialog\.close\(\)/);
  assert.match(app, /setActiveSection\(outcome\.route \|\| "today"\)/);
  assert.match(app, /refreshContinuityConsumers\(\)/);
  assert.match(html, /id="unified-blocker-resolution-receipt"/);
});

test("Build 025P protects a deliberate account choice from stale queued writes", () => {
  assert.match(app, /selectedRetryKeys/);
  assert.match(app, /saveContinuityRetryQueue\(readContinuityRetryQueue\(\)\.filter/);
  assert.match(app, /preferredSynced/);
  assert.match(app, /flushContinuityPendingWrites\(\)/);
});

test("Build 025P ships a fresh responsive offline shell", () => {
  assert.match(html, /unified-blocker-resolution\.js\?v=025p/);
  assert.match(html, /styles\.css\?v=[^"\s]*025p/);
  assert.match(html, /app\.js\?v=[^"\s]*025p/);
  assert.match(worker, /coach-dominion-[^"\s]*025p/);
  assert.match(worker, /unified-blocker-resolution\.js\?v=025p/);
  assert.match(app, /service-worker-reload:025p/);
  assert.match(app, /sw\.js\?v=025p/);
  assert.match(changelog, /Build 025P Unified Blocker Resolution/);
  assert.ok(pkg.scripts["test:025p"]);
});
