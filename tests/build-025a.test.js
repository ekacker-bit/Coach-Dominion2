const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-adaptive-week.js");
const adaptive = read("assets/js/adaptive-coaching.js");
const autopilot = read("assets/js/atlas-week-autopilot.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025A\.2"/);
assert.match(engine, /function reviewWindow/);
assert.match(engine, /function buildProposal/);
assert.match(engine, /function approveProposal/);
assert.match(engine, /function holdProposal/);
assert.match(engine, /function applyToDraft/);
assert.match(engine, /planChangesApproved: true/);
assert.match(engine, /Repeated technique-limited evidence/);
assert.match(engine, /A stopped session blocks progression/);

assert.match(html, /atlas-adaptive-week\.js\?v=025a/);
assert.ok(html.indexOf("adaptive-coaching.js") < html.indexOf("atlas-adaptive-week.js"));
assert.ok(html.indexOf("atlas-adaptive-week.js") < html.indexOf("atlas-week-autopilot.js"));
assert.ok(html.indexOf("atlas-adaptive-week.js") < html.indexOf("app.js"));
assert.match(html, /styles\.css\?v=025[abc]/);
assert.match(html, /app\.js\?v=025[abc]/);

assert.match(app, /function buildCurrentAtlasAdaptiveWeek/);
assert.match(app, /function buildAtlasAdaptiveWeekEvidence/);
assert.match(app, /function saveAtlasAdaptiveWeekRecord/);
assert.match(app, /"atlas-week-current"/);
assert.match(app, /runStartupTask\("Atlas adaptive week", runAtlasAdaptiveWeek/);
assert.match(app, /DominionAtlasAdaptiveWeek\.applyToDraft/);
assert.match(app, /data-atlas-week-action="approve"/);
assert.match(app, /data-atlas-week-action="hold"/);
assert.match(app, /WEEK REVIEW/);
assert.match(app, /ATLAS ADAPTIVE WEEK/);
assert.match(app, /readAtlasAdaptiveWeekState\(\), date/);

assert.match(adaptive, /directive\.planChangesApproved !== true/);
assert.match(adaptive, /ADAPTIVE_PROGRESS/);
assert.match(autopilot, /ADAPTATION_REVIEW/);
assert.match(autopilot, /weekMatchesAdaptation/);
assert.match(styles, /Build 025A: Atlas Adaptive Week/);
assert.match(styles, /\.atlas-week-evidence/);
assert.match(styles, /\.atlas-calendar-source\.adaptive/);

assert.match(worker, /coach-dominion-025[abc]-v1/);
assert.match(worker, /atlas-adaptive-week\.js\?v=025a/);
assert.match(worker, /adaptive-coaching\.js\?v=025a/);
assert.match(worker, /styles\.css\?v=025[abc]/);
assert.match(worker, /app\.js\?v=025[abc]/);
assert.match(changelog, /Build 025A Atlas Adaptive Week/);

console.log("Build 025A integration tests passed.");
