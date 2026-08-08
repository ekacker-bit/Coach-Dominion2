const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const worker = read("sw.js");

assert.match(html, /app\.js\?v=024[jk]/);
assert.match(worker, /coach-dominion-024[jk]-v1/);
assert.match(worker, /app\.js\?v=024[jk]/);
assert.match(app, /history\.filter\(\(item\) => item && typeof item === "object" && item\.weekStart && item\.weekEnd\)/);
assert.match(app, /let activationPhase = "SAVE_DEVICE_PLANS"/);
assert.match(app, /activationPhase = "COMMIT_VERIFIED_CALENDAR"/);
assert.match(app, /\[atlas:activation-failed\]/);

console.log("Build 024J legacy calendar history recovery passed.");
