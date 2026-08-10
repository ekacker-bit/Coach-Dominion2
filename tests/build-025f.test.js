const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const atlas = read("assets/js/atlas-program.js");
const continuity = read("assets/js/dominion-continuity.js");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.doesNotMatch(app, /Command center loaded\. One saved item needs reconciliation/);
assert.match(app, /dataset\.startupRecoveryCount/);
assert.match(app, /\["READY FOR APPROVAL", "APPROVED"\]\.includes\(nutritionDraft\.status\)/);
assert.match(app, /function atlasNutritionProfileContext/);
assert.match(atlas, /context\.heightCm/);
assert.match(atlas, /context\.age/);

assert.match(continuity, /const VERSION = "025F\.1"/);
assert.match(continuity, /const SCHEMA_VERSION = 2/);
assert.match(continuity, /function withSnapshot/);
assert.match(continuity, /function snapshotPayload/);
assert.match(app, /function buildCoreContinuitySnapshot/);
assert.match(app, /function loadCoreContinuitySnapshot/);
assert.match(app, /function persistCoreContinuityFallback/);
assert.match(app, /coreProgramRemoteMode === "CONTINUITY"/);
assert.doesNotMatch(app, /Account sync will activate after migration 012/);

assert.match(html, /atlas-program\.js\?v=024f2/);
assert.match(html, /dominion-continuity\.js\?v=025f/);
assert.match(html, /app\.js\?v=025c7/);
assert.match(worker, /atlas-program\.js\?v=024f2/);
assert.match(worker, /dominion-continuity\.js\?v=025f/);
assert.match(worker, /app\.js\?v=025c7/);
assert.match(changelog, /Build 025F State Repair/);

console.log("Build 025F state repair integration tests passed.");
