const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const activation = read("assets/js/atlas-activation.js");
const worker = read("sw.js");
const packageJson = read("package.json");

assert.match(html, /atlas-activation\.js\?v=024g/);
assert.match(html, /app\.js\?v=024g/);
assert.match(worker, /coach-dominion-024g-v1/);
assert.match(worker, /atlas-activation\.js\?v=024g/);
assert.match(worker, /app\.js\?v=024g/);
assert.match(activation, /const VERSION = "024G\.1"/);
assert.match(activation, /function calendarLinkedToCandidates/);
assert.match(activation, /CALENDAR_PLAN_MISMATCH/);
assert.match(app, /DominionAtlasActivation\.calendarLinkedToCandidates\(savedDraft, candidates\)/);
assert.match(packageJson, /test:024g/);

console.log("Build 024G exact-plan calendar handoff tests passed.");
