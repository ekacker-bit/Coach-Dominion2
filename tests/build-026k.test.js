const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/dominion-campaign.js");
const weekly = read("assets/js/weekly-advancement.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/dominion-campaign-preview.html");

test("Build 026K installs one deterministic campaign engine before app bindings", () => {
  assert.match(engine, /const VERSION = "026K\.1"/);
  assert.match(engine, /const CAMPAIGN_WEEKS = 12/);
  assert.match(engine, /function buildCampaign/);
  assert.match(engine, /function upsertHistory/);
  assert.ok(html.indexOf("dominion-campaign.js?v=026k") < html.indexOf("app.js?v="));
});

test("the campaign gives an approved program four phases and explicit win conditions", () => {
  ["FOUNDATION", "BUILD", "PRESSURE", "PROVE"].forEach((phase) => assert.match(engine, new RegExp(phase)));
  assert.match(engine, /const QUALIFYING_WEEK_TARGET = 9/);
  ["EXECUTION", "EVIDENCE", "WEEKS", "STANDARDS", "OUTCOME"].forEach((condition) => assert.match(engine, new RegExp(`condition\\(\"${condition}\"`)));
  assert.match(engine, /function currentOrder/);
  assert.match(engine, /function forecast/);
});

test("Program is campaign headquarters while Today and Review stay concise", () => {
  assert.match(html, /id="dominion-campaign"/);
  assert.match(html, /id="dominion-campaign-phases"/);
  assert.match(html, /id="dominion-campaign-condition-list"/);
  assert.match(html, /id="dominion-campaign-today"/);
  assert.match(weekly, /id="dominion-campaign-review"/);
  assert.match(app, /function renderDominionCampaign/);
  assert.match(preview, /CURRENT CAMPAIGN ORDER/);
});

test("campaign state follows Contract, program, Calendar, proof, inspection, standards, and outcomes", () => {
  assert.match(app, /function dominionCampaignInput/);
  ["contract:", "programReceipt:", "weeks:", "receipts:", "inspections:", "standards:", "outcome:"].forEach((source) => assert.match(app, new RegExp(source)));
  assert.match(app, /scheduleDominionCampaignReconciliation/);
  assert.doesNotMatch(app, /runStartupTask\("Campaign"/);
  assert.match(app, /function scheduleDominionCampaignReconciliation/);
  assert.match(app, /DominionStartupAuthority\.permitsAccountWrite\(startupAuthorityState, "state_change"\)/);
});

test("campaign continuity is account-backed and idempotent", () => {
  assert.match(app, /persistClosedLoopState\("CAMPAIGN", "current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "dominion-campaign"/);
  assert.match(app, /\["CAMPAIGN", "current"\]/);
  assert.match(app, /\["HISTORY", "dominion-campaign"\]/);
  assert.match(engine, /function historyEntry/);
  assert.match(engine, /filter\(\(item\) => item\?\.id !== entry\.id\)/);
});

test("Build 026K is responsive, cache-safe, documented, and regression-tested", () => {
  assert.match(styles, /\.dominion-campaign-phases/);
  assert.match(styles, /\.dominion-campaign-today/);
  assert.match(styles, /\.dominion-campaign-review/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /026i-026j-026k/);
  assert.match(worker, /dominion-campaign\.js\?v=026k/);
  assert.match(app, /sw\.js\?v=026k/);
  assert.match(changelog, /Build 026K Dominion Campaign/);
  assert.match(integrity, /026K campaign engine/);
  assert.ok(pkg.scripts["test:026k"].includes("dominion-campaign.test.js"));
  assert.ok(pkg.scripts["test:026k"].includes("weekly-inspection.test.js"));
});
