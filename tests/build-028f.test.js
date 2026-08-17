const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const migration = read("supabase/migrations/20260816234308_release_stabilization.sql");

test("stabilization engine loads before the daily decision and application", () => {
  assert.match(html, /release-stabilization\.js\?v=028f/);
  assert.ok(html.indexOf("release-stabilization.js?v=028f") < html.indexOf("daily-decision-integrity.js?v=027f-028f"));
  assert.ok(html.indexOf("daily-decision-integrity.js?v=027f-028f") < html.indexOf("app.js?v="));
  assert.match(worker, /coach-dominion-028f-release-stabilization/);
  assert.match(worker, /release-stabilization\.js\?v=028f/);
  assert.match(app, /sw\.js\?v=028f/);
});

test("startup uses one canonical account save and unchanged truth is skipped", () => {
  assert.match(app, /runStartupTask\("account save"/);
  assert.doesNotMatch(app, /runStartupTask\("account continuity"/);
  assert.match(app, /const manifestMatches = Boolean/);
  assert.match(app, /const truthMatches = Boolean/);
  assert.match(app, /if \(!options\.force && data && manifestMatches && truthMatches\)/);
  assert.match(app, /reportSyncLifecycle\("sync_completed", \{ changed: false/);
  assert.match(app, /reportSyncLifecycle\("save_queued"/);
  assert.match(app, /reportSyncLifecycle\("retry_succeeded"/);
  assert.match(app, /reportSyncLifecycle\("retry_failed"/);
  assert.match(app, /DominionContinuity\.reconcileManifests\(localManifest, accountManifest\)/);
  assert.doesNotMatch(app, /console\.error\(`\[startup:/);
});

test("Today is reparented into command-first DOM and keyboard order", () => {
  assert.match(app, /function stabilizeTodayCommandOrder/);
  assert.match(app, /document\.getElementById\("mission-execution"\)/);
  assert.match(app, /document\.getElementById\("morning-verification"\)/);
  assert.match(app, /cursor\.insertAdjacentElement\("afterend", element\)/);
  assert.match(app, /today\.dataset\.commandOrder = "028F"/);
  assert.match(styles, /#today\[data-command-order="028F"\]/);
});

test("recovery semantics and calendar editing guardrails are explicit", () => {
  assert.match(app, /RECOVER \/ PROTECT/);
  assert.match(app, /N\/A — HELD/);
  assert.match(app, /No training is assigned\./);
  assert.match(app, /const dayEditable = canEditCalendar && day\.date >= todayISODate\(\)/);
  assert.match(styles, /calendar-move-control \{ opacity: 0/);
});

test("Connections, mobile continuity, and Data API grants expose truthful states", () => {
  ["CURRENT", "STALE", "SETUP_REQUIRED", "SYNC_PENDING", "CONFLICT", "IMPORT_FAILED", "NO_EVIDENCE"].forEach((state) => {
    assert.match(read("assets/js/release-stabilization.js"), new RegExp(state));
  });
  assert.match(app, /connected-account-health/);
  assert.match(app, /Last successful/);
  assert.match(html, /aria-label="Account sync status: checking"/);
  assert.match(styles, /min-width: 44px !important; min-height: 44px !important/);
  assert.match(migration, /grant select, insert, update, delete on table/);
  assert.match(migration, /public\.performance_entries/);
  assert.match(migration, /public\.dominion_continuity_state/);
});
