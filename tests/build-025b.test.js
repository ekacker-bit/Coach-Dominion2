const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/mission-execution.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025B\.1"/);
assert.match(engine, /function buildCockpit/);
assert.match(engine, /function runningSegments/);
assert.match(engine, /function startRunningExecution/);
assert.match(engine, /function completeRunningSegment/);
assert.match(engine, /function finishRunningExecution/);
assert.match(engine, /function reportRunningPain/);
assert.match(engine, /function buildEvidenceReceipt/);

assert.match(html, /id="mission-execution"/);
assert.match(html, /mission-execution\.js\?v=025b/);
assert.ok(html.indexOf("atlas-week-autopilot.js") < html.indexOf("mission-execution.js"));
assert.ok(html.indexOf("mission-execution.js") < html.indexOf("app.js"));
assert.match(html, /styles\.css\?v=025b/);
assert.match(html, /app\.js\?v=025b/);

assert.match(app, /function buildCurrentMissionCockpit/);
assert.match(app, /function renderMissionExecution/);
assert.match(app, /function startMissionSession/);
assert.match(app, /function advanceMissionSession/);
assert.match(app, /function finalizeMissionSession/);
assert.match(app, /function saveMissionExecutionReceipt/);
assert.match(app, /function saveMissionPerformanceEvidence/);
assert.match(app, /"EVIDENCE", `mission:\$\{todayISODate\(\)\}`/);
assert.match(app, /data-mission-action="primary"/);
assert.match(app, /data-mission-action="advance"/);
assert.match(app, /data-mission-action="pain"/);
assert.match(app, /DominionMissionExecution\.completeAllRunningSegments/);
assert.match(app, /Performance evidence and the Mission receipt were added automatically/);

assert.match(styles, /Build 025B: Mission Execution Mode/);
assert.match(styles, /\.mission-player/);
assert.match(styles, /\.mission-window-grid/);
assert.match(styles, /@media \(max-width: 720px\)/);

assert.match(worker, /coach-dominion-025b-v1/);
assert.match(worker, /mission-execution\.js\?v=025b/);
assert.match(worker, /styles\.css\?v=025b/);
assert.match(worker, /app\.js\?v=025b/);
assert.match(changelog, /Build 025B Mission Execution Mode/);

console.log("Build 025B integration tests passed.");
