const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const gate = read("assets/js/beta-readiness-gate.js");
const worker = read("sw.js");

assert.match(gate, /const VERSION = "029H\.1"/);
assert.match(gate, /DECISION_REQUIRED/);
assert.match(gate, /ACCOUNT_RECEIPT_REQUIRED/);
assert.ok(html.indexOf("beta-readiness-gate.js?v=029h") < html.indexOf("app.js?v="));
assert.match(app, /DominionBetaReadinessGate\.evaluate/);
assert.match(app, /document\.body\.dataset\.betaReadiness/);
assert.match(app, /const primaryAction = readiness\?\.primaryAction \|\| report\.primaryAction/);
assert.doesNotMatch(gate, /localStorage|sessionStorage|fetch\(|\.insert\(|\.update\(/);
assert.match(worker, /coach-dominion-029h-beta-readiness/);
assert.match(worker, /beta-readiness-gate\.js\?v=029h/);
assert.match(app, /serviceWorker\.register\("\/sw\.js\?v=029h"/);

console.log("Build 029H beta readiness checks passed.");
