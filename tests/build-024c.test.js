const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/program-command.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");

assert.match(html, /id="program"[^>]+program-command/);
assert.match(html, /href="#program" data-section="program">PROGRAM/);
assert.match(html, /id="program-change-form"/);
assert.match(html, /program-command\.js\?v=024c/);
assert.match(html, /styles\.css\?v=024[cdefgn]/);
assert.match(html, /app\.js\?v=024[cdefghijklmn]/);
assert.match(engine, /const VERSION = "024C\.1"/);
assert.match(engine, /function buildProgramCommand/);
assert.match(engine, /function previewChange/);
assert.match(app, /function buildCurrentProgramCommand/);
assert.match(app, /function renderProgramCommand/);
assert.match(app, /function renderProgramChangeImpact/);
assert.match(styles, /Build 024C: Program Command Center/);
assert.match(styles, /\.program-command-next/);
assert.match(styles, /\.program-change-impact/);
assert.match(worker, /coach-dominion-024[cdefghijklmn]-v1/);
assert.match(worker, /program-command\.js\?v=024c/);

console.log("Build 024C integration tests passed.");
