const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-adaptation-outcomes.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/adaptation-outcome-preview.html");

test("Build 026H installs its outcome engine before application bindings", () => {
  assert.match(engine, /const VERSION = "026H\.1"/);
  assert.match(engine, /function buildOutcome/);
  assert.match(engine, /function resolveOutcome/);
  assert.match(engine, /function calibrationMemory/);
  assert.ok(html.indexOf("atlas-adaptation-outcomes.js?v=026h") < html.indexOf("app.js?v="));
});

test("completed 72-hour decisions close against readiness, execution, and closeout evidence", () => {
  assert.match(app, /function atlasAdaptationEvidence/);
  assert.match(app, /readMissionExecutionReceipts\(day\.date\)/);
  assert.match(app, /readDailyCloseout\(day\.date\)/);
  assert.match(app, /readinessHistory/);
  assert.match(app, /runStartupTask\("Atlas adaptation outcomes", runAtlasAdaptationOutcomes/);
  assert.match(engine, /INSUFFICIENT_EVIDENCE/);
  assert.match(engine, /HELD_STANDARD/);
  assert.match(engine, /NEEDS_REVIEW/);
});

test("only verified and acknowledged lessons enter Atlas memory", () => {
  assert.match(engine, /confidence !== "LOW"/);
  assert.match(engine, /status: "CHALLENGED"/);
  assert.match(engine, /calibrationEligible: false/);
  assert.match(engine, /item\.status === "ACKNOWLEDGED"/);
  assert.match(app, /This conclusion will not enter Atlas memory/);
  assert.match(app, /DominionAtlasAdaptationOutcomes\.calibrationMemory\(readAtlasAdaptationOutcomeHistory\(\)\)/);
  assert.match(app, /await runAtlasAdaptiveHorizon\(\)/);
  assert.match(read("assets/js/atlas-adaptive-horizon.js"), /Prior verified lesson/);
  assert.match(html, /data-adaptation-outcome-action="KEEP_LESSON"|atlas-adaptation-outcome-actions/);
  assert.match(html, /data-adaptation-outcome-action="CANCEL"/);
});

test("Today and Weekly Review show the same concise outcome without a new dashboard", () => {
  assert.match(html, /id="atlas-adaptation-outcome"/);
  assert.match(html, /ATLAS \/\/ WHAT CHANGED/);
  assert.match(html, /id="weekly-adaptation-outcomes"/);
  assert.match(app, /renderAtlasAdaptationOutcome/);
  assert.match(app, /renderWeeklyAdaptationOutcomes/);
  assert.match(styles, /Build 026H/);
  assert.match(styles, /data-outcome-tone="green"/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.atlas-adaptation-outcome-actions/);
});

test("outcome evidence persists across devices and historical mission receipts hydrate", () => {
  assert.match(app, /persistClosedLoopState\("ADAPTATION_OUTCOME"/);
  assert.match(app, /"HISTORY", "atlas-adaptation-outcomes"/);
  assert.match(app, /item\.state_type === "EVIDENCE"/);
  assert.match(app, /startsWith\("mission:"\)/);
  assert.match(app, /closedLoopPayloadTimestamp/);
});

test("Build 026H is cache-safe, documented, and regression-tested", () => {
  assert.match(worker, /coach-dominion-[^"\s]*026g-026h/);
  assert.match(worker, /atlas-adaptation-outcomes\.js\?v=026h/);
  assert.match(app, /sw\.js\?v=026h/);
  assert.match(changelog, /Build 026H Adaptation Outcomes/);
  assert.match(integrity, /026H evidence and memory guardrails/);
  assert.ok(pkg.scripts["test:026h"].includes("atlas-adaptation-outcomes.test.js"));
  assert.ok(pkg.scripts["test:026h"].includes("weekly-inspection.test.js"));
  assert.match(preview, /DominionAtlasAdaptationOutcomes\.buildOutcome/);
  assert.match(preview, /get\("state"\) === "review"/);
});
