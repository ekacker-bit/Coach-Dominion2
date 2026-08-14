const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/weekly-advancement.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));

test("Build 026D installs one Weekly Judgment before app bindings", () => {
  assert.match(engine, /const VERSION = "026D\.1"/);
  assert.ok(html.indexOf("weekly-advancement.js?v=026d") < html.indexOf("app.js?v="));
  assert.match(app, /DominionWeeklyAdvancement\.installExperience\(document\)/);
  assert.match(engine, /Did you earn the week\?/);
  assert.match(engine, /doc\.getElementById\("rank"\)\?\.remove\(\)/);
  assert.match(engine, /a\[data-section="rank"\], a\[href="#rank"\]/);
});

test("Rank routes into Inspection and is no longer a competing destination", () => {
  assert.match(app, /const SECTION_ORDER = \[[^\]]*"inspection"[^\]]*\]/);
  assert.doesNotMatch(app.match(/const SECTION_ORDER = \[[^\]]*\]/)?.[0] || "", /"rank"/);
  assert.match(app, /normalized === "rank" \|\| normalized === "promotion" \|\| normalized === "advancement"/);
  assert.match(html, /data-section="inspection"><strong>(?:Advancement|Rank &amp; advancement)<\/strong>/);
});

test("Promotion is rechecked at authorization time and history persists", () => {
  assert.match(app, /const eligibility = evaluatePromotionEligibility\(promotionInput, nextRank\.code\)/);
  assert.match(app, /if \(eligibility\.status !== "ELIGIBLE"\)/);
  assert.match(app, /Promotion is locked until every advancement gate is secured/);
  assert.match(app, /savePromotionHistory\(promotionHistory\)/);
  assert.match(app, /renderWeeklyJudgment\(weeklyInspection \|\| \{\}, weeklyInspectionStorageMode\)/);
});

test("Canonical promotion evidence includes actual standards cases", () => {
  assert.match(app, /const confirmedStandards = openStandards\.filter/);
  assert.match(app, /unresolvedConfirmedViolations: confirmedStandards\.length/);
  assert.match(app, /=== "LEVEL II"/);
  assert.match(app, /=== "LEVEL III"/);
});

test("Build 026D is responsive and refresh-safe", () => {
  assert.match(styles, /Build 026D/);
  assert.match(styles, /\.weekly-judgment/);
  assert.match(styles, /\.weekly-advancement-gates/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /coach-dominion-[^"\s]*026d/);
  assert.match(worker, /weekly-advancement\.js\?v=026d/);
  assert.match(app, /sw\.js\?v=026(?:d|e)/);
  assert.match(changelog, /Build 026D Weekly Judgment/);
  assert.ok(pkg.scripts["test:026d"]);
});
