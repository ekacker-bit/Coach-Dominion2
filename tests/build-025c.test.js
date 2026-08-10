const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/mission-debrief.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025C\.2"/);
assert.match(engine, /function pendingDebrief/);
assert.match(engine, /function resolveReceiptContext/);
assert.match(engine, /function buildDebrief/);
assert.match(engine, /function coachingDecision/);
assert.match(engine, /planMutationAllowed: false/);
assert.match(engine, /function attachDebrief/);
assert.match(engine, /function summarizeForAtlas/);

assert.match(html, /mission-debrief\.js\?v=025c/);
assert.ok(html.indexOf("mission-execution.js") < html.indexOf("mission-debrief.js"));
assert.ok(html.indexOf("mission-debrief.js") < html.indexOf("app.js"));
assert.match(html, /styles\.css\?v=025c/);
assert.match(html, /app\.js\?v=025c7/);

assert.match(app, /function submitMissionDebrief/);
assert.match(app, /function renderMissionDebriefForm/);
assert.match(app, /function renderMissionHandoff/);
assert.match(app, /"DEBRIEF", `mission:\$\{saved\.date\}`/);
assert.match(app, /"HISTORY", "mission-debrief"/);
assert.match(app, /DominionMissionDebrief\.attachDebrief/);
assert.match(app, /DominionMissionDebrief\.resolveReceiptContext/);
assert.match(app, /DominionMissionDebrief\.summarizeForAtlas/);
assert.match(app, /data-mission-action="debrief-submit"/);
assert.match(app, /data-mission-action="handoff"/);
assert.match(app, /await runAtlasAdaptiveWeek\(\)/);

assert.match(styles, /Build 025C: Mission Debrief and Recovery Handoff/);
assert.match(styles, /\.mission-debrief-grid/);
assert.match(styles, /\.mission-handoff/);
assert.match(styles, /@media \(max-width: 720px\)/);

assert.match(worker, /coach-dominion-025c-v1/);
assert.match(worker, /mission-debrief\.js\?v=025c/);
assert.match(worker, /styles\.css\?v=025c/);
assert.match(worker, /app\.js\?v=025c7/);
assert.match(changelog, /Build 025C Mission Debrief and Recovery Handoff/);

console.log("Build 025C integration tests passed.");
