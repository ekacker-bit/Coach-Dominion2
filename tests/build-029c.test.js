const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const worker = read("sw.js");
const migration = read("supabase/migrations/20260817113359_account_persistence_receipts.sql");

test("029C persistence authority loads before the application", () => {
  assert.match(html, /account-persistence\.js\?v=029c/);
  assert.ok(html.indexOf("account-persistence.js?v=029c") < html.indexOf("app.js?v="));
  assert.match(read("assets/js/account-persistence.js"), /const VERSION = "(?:029C|030C)\.1"/);
});

test("account saves require an exact server receipt", () => {
  assert.match(app, /sync_dominion_account_truth_v2/);
  assert.match(app, /accountTruthReceiptMatches\(saved, writeEnvelope\)/);
  assert.match(app, /SAVE_NOT_ACKNOWLEDGED/);
  assert.match(app, /serverConfirmed: true/);
  assert.match(app, /serverConfirmed: false/);
  assert.match(app, /confirmedMutationId/);
});

test("protected saves drain after auth, connectivity, and visible-tab recovery", () => {
  assert.match(app, /onAuthStateChange/);
  assert.match(app, /shouldDrainForAuthEvent/);
  assert.match(app, /window\.addEventListener\("online"/);
  assert.match(app, /window\.addEventListener\("visibilitychange"/);
  assert.match(app, /scheduleAccountTruthQueueDrain/);
  assert.match(app, /if \(!queue\.length\) return true/);
});

test("database replay is idempotent and stale revisions are rejected", () => {
  assert.match(migration, /add column if not exists truth_snapshot/);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /last_mutation_id = normalized_mutation_id/);
  assert.match(migration, /return current_row/);
  assert.match(migration, /DOMINION_ACCOUNT_MUTATION_ID_REUSED/);
  assert.match(migration, /DOMINION_CONTINUITY_REVISION_CONFLICT/);
  assert.match(migration, /revoke all on function public\.sync_dominion_account_truth_v2[\s\S]*from public, anon/i);
  assert.match(migration, /grant execute on function public\.sync_dominion_account_truth_v2[\s\S]*to authenticated/i);
});

test("029C assets are isolated in a fresh offline shell", () => {
  assert.match(worker, /029b-029c/);
  assert.match(worker, /account-persistence\.js\?v=029c/);
  assert.match(app, /sw\.js\?v=029c/);
});
