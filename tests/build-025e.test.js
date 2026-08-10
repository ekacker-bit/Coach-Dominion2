const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/morning-verification.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025E\.1"/);
assert.match(engine, /function buildReceipt/);
assert.match(engine, /RECOVERY_ONLY/);
assert.match(engine, /REDUCE_TODAY/);
assert.match(engine, /planMutationAllowed: false/);
assert.match(engine, /signals:[\s\S]*slice\(0, 3\)/);

assert.match(html, /id="morning-verification"/);
assert.match(html, /morning-verification\.js\?v=025e/);
assert.ok(html.indexOf("mission-recovery.js") < html.indexOf("morning-verification.js"));
assert.ok(html.indexOf("morning-verification.js") < html.indexOf("app.js"));
assert.match(html, /styles\.css\?v=025c3/);
assert.match(html, /app\.js\?v=025c7/);

assert.match(app, /function ensureMorningVerification/);
assert.match(app, /function renderMorningVerification/);
assert.match(app, /"MORNING_VERIFICATION", receipt\.date/);
assert.match(app, /"HISTORY", "morning-verification"/);
assert.match(app, /morningVerificationReadiness/);
assert.match(app, /trainingAllowed === false/);
assert.match(app, /approved plan remains intact/i);
assert.match(app, /data-morning-verification-action/);

assert.match(styles, /Build 025E/);
assert.match(styles, /\.morning-verification-decision/);
assert.match(styles, /@media \(max-width: 720px\)/);
assert.match(worker, /morning-verification\.js\?v=025e/);
assert.match(worker, /styles\.css\?v=025c3/);
assert.match(worker, /app\.js\?v=025c7/);
assert.match(changelog, /Build 025E Morning Verification Loop/);

console.log("Build 025E integration tests passed.");
