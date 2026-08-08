const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const worker = read("sw.js");

assert.match(html, /app\.js\?v=024[kl]/);
assert.match(worker, /coach-dominion-024[kl]-v1/);
assert.match(app, /function refreshProgramActivationSurfaces/);
assert.match(app, /Active program saved; one surface will recover on reload/);
assert.match(app, /commitUnifiedWeekDraft\(\{ activationPreflight: preflight, deferRender: true \}\)/);
assert.match(app, /if \(!options\.deferRender\) refreshProgramActivationSurfaces\(\)/);
assert.match(app, /refreshProgramActivationSurfaces\(\);\s+return receipt;/);

console.log("Build 024K activation transaction boundary passed.");
