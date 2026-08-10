const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = read("assets/js/strength-training.js");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const html = read("app.html");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025I\.1"/);
assert.match(engine, /function buildProgressionMemory/);
assert.match(engine, /function recordsForExercise/);
assert.match(engine, /function buildCompletionReport/);
assert.match(engine, /Two consecutive complete, pain-free exposures/);
assert.match(engine, /RPE was not recorded/);
assert.match(engine, /baselineEstablished/);

assert.match(app, /function strengthProgressionMemory/);
assert.match(app, /data-assignment-action="prefill-memory"/);
assert.match(app, /data-memory-mode="LAST"/);
assert.match(app, /data-memory-mode="COACHED"/);
assert.match(app, /function attachStrengthCompletionReport/);
assert.match(app, /progressionReport/);
assert.match(app, /strengthCompletionReportMarkup/);
assert.match(app, /service-worker-reload:025i/);

assert.match(css, /\.strength-progression-memory/);
assert.match(css, /\.strength-progression-result/);
assert.match(css, /\.strength-performance-mark/);
assert.match(html, /styles\.css\?v=025c3-025i/);
assert.match(html, /strength-training\.js\?v=025g-025i/);
assert.match(html, /app\.js\?v=025c7-025h-025i/);
assert.match(worker, /coach-dominion-025c-v1-025h-025i/);
assert.match(worker, /strength-training\.js\?v=025g-025i/);
assert.match(worker, /app\.js\?v=025c7-025h-025i/);
assert.match(changelog, /Build 025I Progression Memory/);

console.log("Build 025I progression memory integration tests passed.");
