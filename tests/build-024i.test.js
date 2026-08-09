const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const activation = read("assets/js/atlas-activation.js");
const worker = read("sw.js");

assert.match(html, /atlas-activation\.js\?v=024i/);
assert.match(html, /app\.js\?v=024[ijklm]/);
assert.match(worker, /coach-dominion-024[ijklm]-v1/);
assert.match(activation, /const VERSION = "024I\.[123]"/);
assert.match(activation, /function canCommitCalendarFromPreflight/);
assert.match(app, /commitUnifiedWeekDraft\(options = \{\}\)/);
assert.match(app, /canCommitCalendarFromPreflight\(options\.activationPreflight/);
assert.match(app, /commitUnifiedWeekDraft\(\{ activationPreflight: preflight, deferRender: true \}\)/);
assert.match(app, /!verifiedPackageCommit && activation/);

console.log("Build 024I verified Atlas calendar handoff passed.");
