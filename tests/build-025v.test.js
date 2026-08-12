const assert = require("assert");
const fs = require("fs");

const read = (path) => fs.readFileSync(path, "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const integrity = read("scripts/release-integrity.js");

assert.match(html, /id="atlas-decision-center"/);
assert.match(html, /id="atlas-decision-nav-count"/);
assert.match(html, /atlas-decision-center\.js\?v=025v/);
assert.match(app, /function buildCurrentAtlasDecisionCenter/);
assert.match(app, /function renderAtlasDecisionCenter/);
assert.match(app, /data-atlas-decision-action/);
assert.match(app, /"HISTORY", "atlas-decision-center"/);
assert.match(css, /\.atlas-decision-center/);
assert.match(css, /\.atlas-decision-nav-count/);
assert.match(worker, /atlas-decision-center\.js\?v=025v/);
assert.match(integrity, /025V/);

console.log("Build 025V integration tests passed.");
