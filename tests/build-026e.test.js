const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/daily-decision.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/daily-command-preview.html");

test("Build 026E installs the Daily Decision before application bindings", () => {
  assert.match(engine, /const VERSION = "026E\.1"/);
  assert.ok(html.indexOf("daily-decision.js?v=026e") < html.indexOf("app.js?v="));
  assert.match(app, /DominionDailyDecision\.buildDailyDecision/);
  assert.match(app, /DominionDailyDecision\.applyToCommand/);
  assert.match(app, /DominionDailyDecision\.installExperience\(document\)/);
});

test("Today follows one primary order with support and progressive disclosure", () => {
  assert.match(engine, /id="daily-decision-readiness"/);
  assert.match(engine, /id="daily-decision-schedule"/);
  assert.match(engine, /id="daily-decision-execution"/);
  assert.match(engine, /one-command-context/);
  assert.match(engine, /Technical details/);
  assert.match(engine, /today-more-context-stack/);
  assert.match(styles, /body\[data-daily-decision-status="BLOCKED"\]/);
  assert.match(styles, /body\[data-daily-decision-status="LOADING"\]/);
  assert.match(styles, /body\[data-daily-decision-status="EMPTY"\]/);
  assert.match(styles, /body\[data-daily-decision-status="STALE"\]/);
  assert.match(styles, /body\[data-daily-decision-status="COMPLETED"\]/);
});

test("Training, Fuel, Recovery, Core, Running, and Calendar consume the same blocker", () => {
  assert.match(app, /dailyDecisionModuleState\("strength"\)/);
  assert.match(app, /dailyDecisionModuleState\("nutrition"\)/);
  assert.match(app, /dailyDecisionModuleState\("recovery"\)/);
  assert.match(app, /dailyDecisionModuleState\("core"\)/);
  assert.match(app, /dailyDecisionModuleState\("running"\)/);
  assert.match(app, /daily-decision-calendar-blocker/);
  assert.match(app, /progressionAllowed/);
  assert.match(app, /decision\.nutritionContext\.trainingDay/);
});

test("mobile navigation is five destinations and More holds secondary destinations", () => {
  const dock = html.match(/<nav id="mobile-command-dock"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.equal((dock.match(/data-mobile-nav=/g) || []).length, 5);
  for (const destination of ["today", "train", "fuel", "review", "more"]) assert.match(dock, new RegExp(`data-mobile-nav="${destination}"`));
  const more = html.match(/<dialog id="mobile-more-dialog"[\s\S]*?<\/dialog>/)?.[0] || "";
  for (const label of ["Contract", "Trends", "Rank &amp; advancement", "Record", "Connections", "Sign out"]) assert.match(more, new RegExp(label));
  assert.match(styles, /grid-template-columns:\s*repeat\(5/);
  assert.match(styles, /\.status-bar/);
});

test("a finalized Contract is read-only until an explicit amendment", () => {
  assert.match(app, /contractRoot\.dataset\.contractMode/);
  assert.match(app, /editor\.hidden = Boolean\(signed && !draft\)/);
  assert.match(app, /Amendments create a separate draft/);
  assert.match(app, /id="contract-daily-decision"/);
  assert.match(app, /contract-daily-decision-state/);
  assert.match(styles, /data-contract-mode="FINALIZED"/);
  assert.match(styles, /data-contract-mode="AMENDMENT"/);
});

test("Build 026E is cache-safe, documented, and retains Weekly Review regression coverage", () => {
  assert.match(worker, /coach-dominion-[^"\s]*026e(?:-026g)?(?:-026h)?/);
  assert.match(worker, /daily-decision\.js\?v=026e/);
  assert.match(app, /sw\.js\?v=(?:026e|026g|026h)/);
  assert.match(changelog, /Build 026E Daily Command UX Repair/);
  assert.ok(pkg.scripts["test:026e"].includes("weekly-inspection.test.js"));
  assert.ok(pkg.scripts["test:026e"].includes("rank-promotion.test.js"));
  assert.match(preview, /DominionDailyDecision\.buildDailyDecision/);
  assert.match(preview, /data-mobile-nav="more"/);
});
