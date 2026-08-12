const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/js/running-verdict.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(engine, /const VERSION = "025R\.1"/);
assert.match(engine, /function validateActual/);
assert.match(engine, /function buildVerdict/);
assert.match(engine, /completionState: "COMPLETE"|completionState/);
assert.ok(html.indexOf("/assets/js/running-verdict.js?v=025r") < html.indexOf("/assets/js/app.js"));
assert.match(app, /function runningActualReviewMarkup/);
assert.match(app, /function finalizeRunningSession/);
assert.match(app, /data-running-actual-distance/);
assert.match(app, /Actual distance and time are now the canonical run evidence/);
assert.match(app, /planned_distance/);
assert.match(app, /verdict_code/);
assert.match(app, /DominionRunningVerdict\.applyActual/);
assert.doesNotMatch(app, /Run complete\. A Mission Execution receipt and Performance entry were saved automatically\./);
assert.match(styles, /\.running-actual-review/);
assert.match(styles, /\.running-verdict/);
assert.match(worker, /running-verdict\.js\?v=025r/);
assert.match(worker, /025q-025r/);
assert.match(packageJson, /node tests\/running-verdict\.test\.js/);
assert.match(packageJson, /node tests\/build-025r\.test\.js/);

console.log("Build 025R recorded running evidence integration checks passed.");
