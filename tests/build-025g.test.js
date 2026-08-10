const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const strength = read("assets/js/strength-training.js");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(strength, /const VERSION = "025(?:G|I|J)\.1"/);
assert.match(strength, /function sessionLaunchDecision/);
assert.match(strength, /ACTIVE_OTHER/);
assert.match(strength, /SAFETY_HOLD/);
assert.match(app, /data-programming-action="train-session"/);
assert.match(app, /function launchApprovedStrengthSession/);
assert.match(app, /launchSource: "APPROVED_PLAN"/);
assert.match(app, /calendarChanged: false/);
assert.match(app, /Record each set below; Calendar was not changed/);
assert.match(html, /strength-training\.js\?v=025g/);
assert.match(html, /app\.js\?v=025c7/);
assert.match(worker, /coach-dominion-025c-v1/);
assert.match(worker, /strength-training\.js\?v=025g/);
assert.match(worker, /app\.js\?v=025c7/);
assert.match(changelog, /Build 025G Direct Workout Logging/);

console.log("Build 025G direct workout logging integration tests passed.");
