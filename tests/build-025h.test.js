const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const truth = read("assets/js/operating-truth.js");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(truth, /const VERSION = "025H\.1"/);
assert.match(truth, /const activeExecution = modules\.find/);
assert.match(truth, /Resume \$\{activeExecution\.detail \|\| activeExecution\.label\}/);
assert.match(truth, /finish the live session before repairing future programming/);

assert.match(app, /activePlan\.sessions\.some\(\(sessionItem\) => sessionItem\.id === item\.id\)/);
assert.match(app, /previewingDraft: Boolean\(savedDraft\)/);
assert.match(app, /Log approved \$\{sessionItem\.name\}/);
assert.match(app, /this draft remains unchanged/);

assert.match(app, /service-worker-reload:025h/);
assert.match(app, /register\("\/sw\.js\?v=025h", \{ updateViaCache: "none" \}\)/);
assert.match(app, /controllerchange/);
assert.match(app, /window\.location\.reload\(\)/);
assert.match(worker, /coach-dominion-025c-v1-025h/);
assert.match(worker, /fetch\(request, \{ cache: "no-store" \}\)/);

assert.match(html, /operating-truth\.js\?v=025h/);
assert.match(html, /app\.js\?v=025c7-025h/);
assert.match(worker, /operating-truth\.js\?v=025h/);
assert.match(worker, /app\.js\?v=025c7-025h/);
assert.match(changelog, /Build 025H Training Integrity/);

console.log("Build 025H training integrity integration tests passed.");
