const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/mission-recovery.js");
const adaptive = read("assets/js/atlas-adaptive-week.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025D\.1"/);
assert.match(engine, /function buildOrder/);
assert.match(engine, /function completeTask/);
assert.match(engine, /function reopenTask/);
assert.match(engine, /function latestRelevant/);
assert.match(engine, /function summarizeForAtlas/);

assert.match(html, /mission-recovery\.js\?v=025d/);
assert.ok(html.indexOf("mission-debrief.js") < html.indexOf("mission-recovery.js"));
assert.ok(html.indexOf("mission-recovery.js") < html.indexOf("app.js"));
assert.match(html, /styles\.css\?v=025c2/);
assert.match(html, /app\.js\?v=025c4/);

assert.match(app, /function currentMissionRecoveryOrder/);
assert.match(app, /function saveMissionRecoveryOrderState/);
assert.match(app, /function completeMissionRecoveryTask/);
assert.match(app, /function reopenMissionRecoveryOrder/);
assert.match(app, /"RECOVERY_ORDER", `mission:\$\{order\.date\}`/);
assert.match(app, /"HISTORY", "mission-recovery"/);
assert.match(app, /data-mission-action="recovery-complete"/);
assert.match(app, /data-today-recovery-action="mission-route"/);
assert.match(app, /recoveryPercent: recoverySummary\.adherencePercent/);

assert.match(adaptive, /const VERSION = "025A\.2"/);
assert.match(adaptive, /Recovery orders are not yet closing consistently/);
assert.match(adaptive, /recoveryPercent: metrics\.recoveryPercent/);
assert.match(styles, /Build 025D: Executable Recovery Orders/);
assert.match(styles, /\.mission-recovery-progress/);
assert.match(styles, /\.today-recovery-checklist li\.current/);
assert.match(worker, /mission-recovery\.js\?v=025d/);
assert.match(worker, /app\.js\?v=025c4/);
assert.match(changelog, /Build 025D Executable Recovery Orders/);

console.log("Build 025D integration tests passed.");
