const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const account = read("assets/js/dominion-account-truth.js");
const health = read("api/health.js");
const workflow = read(".github/workflows/release-integrity.yml");
const packageJson = JSON.parse(read("package.json"));

test("030L assets and release identity are production-gated", () => {
  assert.match(html, /coach-dominion-release" content="030[LMNOPQRS]\.1"/);
  assert.match(html, /weekly-rollover-certification\.js\?v=030l/);
  assert.ok(html.indexOf("weekly-rollover-certification.js?v=030l") < html.indexOf("app.js?v="));
  assert.match(worker, /030l-weekly-rollover-certification/);
  assert.match(worker, /weekly-rollover-certification\.js\?v=030l/);
  assert.match(health, /release: "030[LMNOPQRS]\.1"/);
  assert.match(health, /weeklyRollover: "commit-to-monday-certified"/);
  assert.match(workflow, /npm run test:030[lmnopqrs]/);
  assert.match(workflow, /--expected-release 030[LMNOPQRS]\.1/);
  assert.match(packageJson.scripts["test:030l"], /weekly-rollover-certification\.test\.js/);
});

test("030L persists one receipt through closed-loop and Account Truth", () => {
  assert.match(account, /const VERSION = "030[LMNOPQRS]\.1"/);
  assert.match(account, /weeklyRollovers: 52/);
  assert.match(account, /mergeCollection\(value\.weeklyRollovers/);
  assert.match(account, /mergeCollection\(device\.weeklyRollovers, account\.weeklyRollovers/);
  assert.match(app, /function readWeeklyRolloverHistory/);
  assert.match(app, /saveClosedLoopLocal\("WEEKLY_ROLLOVER", "current", receipt\)/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "weekly-rollover-certification", history\)/);
  assert.match(app, /weeklyRollovers: readWeeklyRolloverHistory\(\)/);
  assert.match(app, /coaching\.weeklyRollovers/);
});

test("030L commit flow certifies after the exact Calendar revision is committed", () => {
  const commitIndex = app.indexOf("const committedWeek = await commitUnifiedWeekDraft");
  const reconciliationIndex = app.indexOf("DominionAtlasWeeklyReconciliation.attachCommit", commitIndex);
  const rolloverIndex = app.indexOf("reconcileWeeklyRolloverCertification", reconciliationIndex);
  assert.ok(commitIndex > -1);
  assert.ok(reconciliationIndex > commitIndex);
  assert.ok(rolloverIndex > reconciliationIndex);
  assert.match(app, /matchingCalendarCommitReceipt\(targetWeek\)/);
  assert.match(app, /buildCurrentCanonicalDailyCommand\(currentDate\)/);
  assert.match(app, /runStartupTask\("weekly rollover"/);
});

test("030L keeps the UX compact across Review, Calendar, Today, and mobile", () => {
  assert.match(app, /weeklyRolloverCertificationMarkup\([^\n]+"review"\)/);
  assert.match(app, /weeklyRolloverCertificationMarkup\(weeklyRollover, "calendar"\)/);
  assert.match(app, /weeklyRolloverCertificationMarkup\(weeklyRollover, "today"\)/);
  assert.match(css, /Build 030L: certify the handoff/);
  assert.match(css, /\.weekly-rollover-certification\.review ul/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.weekly-rollover-certification/);
  assert.doesNotMatch(app, />030L</);
});
