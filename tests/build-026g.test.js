const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-adaptive-horizon.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/adaptive-horizon-preview.html");

test("Build 026G installs a bounded 72-hour engine before the application", () => {
  assert.match(engine, /const VERSION = "026G\.1"/);
  assert.match(engine, /const WINDOW_DAYS = 3/);
  assert.match(engine, /function buildProposal/);
  assert.match(engine, /function directiveForDate/);
  assert.match(engine, /function applyToDay/);
  assert.ok(html.indexOf("atlas-adaptive-horizon.js?v=026g") < html.indexOf("app.js?v="));
});

test("the next-72-hour surface is concise, explainable, and recruit-controlled", () => {
  assert.match(html, /id="atlas-adaptive-horizon"/);
  assert.match(html, /id="atlas-adaptive-horizon-days"/);
  assert.match(html, /data-horizon-action="ACCEPT"|atlas-adaptive-horizon-actions/);
  assert.match(html, /select name="reason" required/);
  assert.match(html, /No added sessions\. Fuel targets stay approved\. Long-run time stays open\./);
  assert.match(app, /data-adaptive-horizon-action/);
  assert.match(app, /resolveAtlasAdaptiveHorizon/);
  assert.match(app, /REOPEN_CONTEXT/);
});

test("approved adaptation is durable and governs Today, Training, and Calendar", () => {
  assert.match(app, /persistClosedLoopState\("ADAPTIVE_HORIZON"/);
  assert.match(app, /"HISTORY", "atlas-adaptive-horizon"/);
  assert.match(app, /function readEffectiveUnifiedDay/);
  assert.match(app, /function activeAtlasAdaptiveHorizon/);
  assert.match(app, /DominionAtlasAdaptiveHorizon\.applyToDay/);
  assert.match(app, /DominionAtlasAdaptiveHorizon\.applyToCommand/);
  assert.match(app, /DominionAtlasAdaptiveHorizon\.calendarOverrideForDate/);
  assert.match(app, /currentDailyCalendarOverride/);
});

test("adaptation remains bounded and invalidates stale program context", () => {
  assert.match(engine, /automaticPlanMutation: false/);
  assert.match(engine, /sessionsAdded: 0/);
  assert.match(engine, /fuelTargetsChanged: false/);
  assert.match(engine, /longRunsCapped: false/);
  assert.match(engine, /contractRevision/);
  assert.match(engine, /weekRevision/);
  assert.match(engine, /expiresAfterDays: WINDOW_DAYS/);
  assert.match(engine, /durationOpen: openLongRun/);
});

test("proposal tones and the phone layout remain legible without crowding Today", () => {
  assert.match(styles, /Build 026G/);
  assert.match(styles, /data-horizon-tone="red"/);
  assert.match(styles, /data-horizon-tone="green"/);
  assert.match(styles, /grid-template-columns:\s*repeat\(3/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*#atlas-adaptive-horizon-days \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /data-horizon-status="WAITING"/);
  assert.match(styles, /data-horizon-status="CURRENT"/);
});

test("Build 026G starts with the app, is cache-safe, documented, and regression-tested", () => {
  assert.match(app, /runStartupTask\("Atlas adaptive horizon", runAtlasAdaptiveHorizon/);
  assert.match(app, /DominionAtlasAdaptiveHorizon\.installExperience\(document\)/);
  assert.match(app, /sw\.js\?v=026g/);
  assert.match(worker, /coach-dominion-[^"\s]*026e-026g/);
  assert.match(worker, /atlas-adaptive-horizon\.js\?v=026g/);
  assert.match(changelog, /Build 026G Adaptive Tomorrow/);
  assert.match(integrity, /026G adaptive horizon guardrails/);
  assert.ok(pkg.scripts["test:026g"].includes("build-026e.test.js"));
  assert.ok(pkg.scripts["test:026g"].includes("weekly-orchestrator.test.js"));
  assert.match(preview, /DominionAtlasAdaptiveHorizon\.buildProposal/);
  assert.match(preview, /get\("state"\) === "protect"/);
});
