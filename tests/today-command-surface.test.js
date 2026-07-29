const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../assets/js/app.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");

assert.equal(app.normalizeSectionKey("nutrition"), "nutrition", "nutrition is a first-class workspace");
assert.equal(app.normalizeSectionKey("fuel"), "nutrition", "fuel deep links resolve to nutrition");
assert.match(html, /BUILD 009C \/\/ TODAY COMMAND SURFACE/);
assert.match(html, /class="mobile-command-bar"/);
assert.match(html, /id="today-sequence-training"/);
assert.match(html, /id="today-sequence-fueling"/);
assert.match(html, /id="today-sequence-recovery"/);
assert.match(html, /id="today-sequence-evidence"/);
assert.match(html, /BUILD 011C \/\/ TODAY ACCOUNTABILITY/);
assert.match(html, /id="today-standards-panel"/);
assert.match(js, /function renderTodayStandardsDuty/);
assert.match(js, /function detectStandardsPatterns/);
assert.match(js, /function organizeWorkspaceSections/);
assert.match(js, /element\.hidden = !isMatch/);
assert.match(css, /\.mobile-command-bar\{display:none\}/);
assert.match(css, /position:fixed;display:grid/);

console.log("today command surface tests passed");
