const assert = require("assert");
const fs = require("fs");

const read = (path) => fs.readFileSync(path, "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-decision-center.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const integrity = read("scripts/release-integrity.js");

assert.match(engine, /const VERSION = "025W\.1"/);
assert.match(engine, /FEEDBACK_REASONS/);
assert.match(engine, /function normalizeEvidence/);
assert.match(engine, /function buildFeedback/);
assert.match(html, /<div class="kicker">WHY THIS ORDER<\/div>/);
assert.match(html, /id="atlas-decision-feedback-dialog"/);
assert.match(html, /id="atlas-decision-feedback-options"/);
assert.match(html, /atlas-decision-center\.js\?v=025w/);
assert.match(app, /function atlasDecisionEvidenceMarkup/);
assert.match(app, /function openAtlasDecisionFeedback/);
assert.match(app, /function recordAtlasDecisionFeedback/);
assert.match(app, /DominionAtlasDecisionCenter\.buildFeedback/);
assert.match(css, /\.atlas-decision-why/);
assert.match(css, /\.atlas-decision-feedback-dialog/);
assert.match(worker, /atlas-decision-center\.js\?v=025w/);
assert.match(worker, /025v-025w/);
assert.match(integrity, /025W/);

console.log("Build 025W integration tests passed.");
