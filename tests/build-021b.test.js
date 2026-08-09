const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/025_dominion_continuity.sql"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

assert.match(html, /id="continuity-status"/);
assert.match(html, /id="continuity-repair-dialog"/);
assert.match(html, /data-continuity-action="keep-device"/);
assert.match(html, /data-continuity-action="keep-account"/);
assert.ok(html.indexOf("/assets/js/dominion-continuity.js") < html.indexOf("/assets/js/app.js"));

assert.match(css, /\.continuity-status\.red/);
assert.match(css, /\.continuity-canonical-grid/);
assert.match(css, /\.continuity-conflict-panel/);

assert.match(app, /function buildCurrentContinuityManifest\(\)/);
for (const domain of ["contract", "strength", "running", "core", "nutrition", "calendar"]) {
  assert.match(app, new RegExp(`${domain}: \\{ payload:`));
  assert.match(app, new RegExp(`resolveContinuityPayload\\("${domain}"`));
}
assert.match(app, /recordContinuityWrite\("contract"/);
assert.match(app, /recordContinuityWrite\("strength"/);
assert.match(app, /recordContinuityWrite\("running"/);
assert.match(app, /recordContinuityWrite\("core"/);
assert.match(app, /recordContinuityWrite\("nutrition"/);
assert.match(app, /recordContinuityWrite\("calendar"/);
assert.match(app, /await syncDominionContinuity\(\);/);
assert.match(app, /sync_dominion_continuity_state/);
assert.match(app, /repairDominionContinuity\("DEVICE"\)/);
assert.match(app, /repairDominionContinuity\("ACCOUNT"\)/);

assert.match(migration, /create table if not exists public\.dominion_continuity_state/i);
assert.match(migration, /revision bigint not null/i);
assert.match(migration, /for update;/i);
assert.match(migration, /DOMINION_CONTINUITY_REVISION_CONFLICT/);
assert.match(migration, /auth\.uid\(\) = user_id/);
assert.match(migration, /grant execute on function public\.sync_dominion_continuity_state/i);

assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-g]|(?:023[abcdef]|024[abcdefghijklmn]))-v1/);
assert.match(worker, /dominion-continuity\.js/);

console.log("Build 021B continuity integration checks passed.");
