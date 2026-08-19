const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-week-autopilot.js");
const command = read("assets/js/program-command.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");

assert.match(html, /atlas-week-autopilot\.js\?v=024n/);
assert.ok(html.indexOf("atlas-week-autopilot.js") < html.indexOf("app.js"), "autopilot engine must load before app integration");
assert.match(html, /styles\.css\?v=025[abc]/);
assert.match(html, /app\.js\?v=025[abc]/);
assert.match(worker, /coach-dominion-025[abc]-v1/);
assert.match(worker, /atlas-week-autopilot\.js\?v=024n/);
assert.match(worker, /styles\.css\?v=025[abc]/);
assert.match(worker, /app\.js\?v=025[abc]/);

assert.match(engine, /const VERSION = "024N\.1"/);
assert.match(engine, /function buildAutopilot/);
assert.match(engine, /function canAutoCommit/);
assert.match(engine, /function hasManualEdits/);
assert.match(app, /async function runAtlasWeekAutopilot/);
assert.doesNotMatch(app, /runStartupTask\("Atlas week autopilot", runAtlasWeekAutopilot/);
assert.match(app, /const result = await runAtlasWeekAutopilot\(\)/);
assert.match(app, /autopilotCommit/);
assert.match(app, /atlasWeekAutopilot: DominionAtlasWeekAutopilot\.buildCommitReceipt/);
assert.match(app, /weekDraft: null,[\s\S]{0,100}committedWeeks: \[week\]/);
assert.match(app, /program-command-autopilot/);
assert.match(app, /Edit next week/);
assert.match(command, /autopilot: weekAutopilot/);
assert.match(styles, /Build 024N: Atlas Program-to-Week Autopilot/);

console.log("Build 024N integration tests passed.");
