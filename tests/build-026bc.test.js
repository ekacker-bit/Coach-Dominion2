const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const spine = read("assets/js/mission-execution-spine.js");
const adaptation = read("assets/js/atlas-live-adaptation.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));

test("Build 026B makes one cross-domain mission spine authoritative on Today", () => {
  assert.match(spine, /const VERSION = "026B\.1"/);
  assert.match(spine, /function buildSpine/);
  assert.match(spine, /function transition/);
  assert.match(spine, /function buildCheckpoint/);
  assert.match(spine, /function applyToCommand/);
  assert.match(html, /id="mission-execution-spine"/);
  assert.match(app, /function buildCurrentMissionExecutionSpine/);
  assert.match(app, /function saveCurrentMissionExecutionSpine/);
  assert.match(app, /function runMissionExecutionSpinePrimary/);
  assert.match(app, /"EXECUTION_SPINE", missionExecutionSpineStateKey/);
  assert.match(app, /if \(action === "MISSION_SPINE"\)/);
});
test("Build 026B keeps canonical module engines and advances only after evidence", () => {
  assert.match(app, /missionExecutionSpineAssignments/);
  assert.match(app, /buildCurrentMissionCockpit/);
  assert.match(app, /buildCurrentDailyExecutionQueue/);
  assert.match(app, /await saveCurrentMissionExecutionSpine\(\)/);
  assert.match(app, /saveMissionExecutionReceipt/);
  assert.match(html, /Progress saves with every mission action|Your progress is protected/);
});

test("Build 026C requires a visible recruit decision for live changes", () => {
  assert.match(adaptation, /const VERSION = "026C\.1"/);
  assert.match(adaptation, /function buildProposal/);
  assert.match(adaptation, /function resolveProposal/);
  assert.match(adaptation, /function activeDirective/);
  assert.match(adaptation, /function applyToCommand/);
  assert.match(html, /id="atlas-live-adaptation"/);
  assert.match(html, /data-live-adaptation-action="ACCEPT"/);
  assert.match(html, /data-live-adaptation-action="HOLD"/);
  assert.match(html, /data-live-adaptation-action="NOT_FIT"/);
  assert.match(app, /function resolveAtlasLiveAdaptation/);
  assert.match(app, /"LIVE_ADAPTATION", atlasLiveAdaptationStateKey/);
});

test("Build 026C uses one approved override in Today, Calendar, and prescriptions", () => {
  assert.match(app, /function currentDailyCalendarOverride/);
  assert.match(app, /const dayOverride = currentDailyCalendarOverride\(day\.date\)/);
  assert.match(app, /const dayOverride = currentDailyCalendarOverride\(todayISODate\(\)\)/);
  assert.match(app, /DominionAtlasLiveAdaptation\.activeDirective/);
  assert.match(adaptation, /futureWeekChanged: false/);
  assert.match(adaptation, /\["FUELING", "HOLD_TARGETS"/);
  assert.match(adaptation, /status: "RESTORED"/);
});

test("Build 026B-C ships a responsive, fresh offline shell", () => {
  assert.ok(html.indexOf("mission-execution-spine.js?v=026b") < html.indexOf("app.js?v="));
  assert.ok(html.indexOf("atlas-live-adaptation.js?v=026c") < html.indexOf("app.js?v="));
  assert.match(html, /styles\.css\?v=[^"\s]*026bc/);
  assert.match(html, /app\.js\?v=[^"\s]*026bc/);
  assert.match(styles, /Builds 026B-026C/);
  assert.match(styles, /\.mission-execution-spine/);
  assert.match(styles, /\.atlas-live-adaptation/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /coach-dominion-[^"\s]*026bc/);
  assert.match(worker, /mission-execution-spine\.js\?v=026b/);
  assert.match(worker, /atlas-live-adaptation\.js\?v=026c/);
  assert.match(app, /sw\.js\?v=(?:026bc|026d|026e|026g)/);
  assert.match(changelog, /Build 026B Mission Execution Spine/);
  assert.match(changelog, /Build 026C Atlas Live Adaptation/);
  assert.ok(pkg.scripts["test:026bc"]);
});
