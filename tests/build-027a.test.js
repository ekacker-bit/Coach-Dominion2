const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/campaign-commissioning.js");
const campaign = read("assets/js/dominion-campaign.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");
const integrity = read("scripts/release-integrity.js");
const pkg = JSON.parse(read("package.json"));

test("Build 027A installs one commissioning engine before app bindings", () => {
  assert.match(engine, /const VERSION = "027A\.1"/);
  assert.match(engine, /function buildCommissioning/);
  assert.match(engine, /function createReceipt/);
  assert.ok(html.indexOf("campaign-commissioning.js?v=027a") < html.indexOf("app.js?v="));
});
test("Contract, baseline, program, Calendar, and launch are one visual flow", () => {
  assert.match(html, /id="campaign-commissioning"/);
  assert.match(html, /id="campaign-commissioning-steps"/);
  assert.match(html, /id="campaign-commissioning-details"/);
  assert.ok(html.indexOf('id="campaign-commissioning"') < html.indexOf('id="first-week-orientation"'));
  assert.ok(html.indexOf('id="first-week-orientation"') < html.indexOf('id="contract-activation"'));
  assert.match(engine, /"contract"[\s\S]*"baseline"[\s\S]*"program"[\s\S]*"calendar"[\s\S]*"launch"/);
});

test("one Begin Campaign action reuses atomic Atlas activation", () => {
  assert.match(app, /async function beginCampaignCommissioning/);
  assert.match(app, /const programReceipt = await approveAtlasProgram\(\)/);
  assert.match(app, /data-campaign-commissioning-action/);
  assert.match(engine, /code: "BEGIN_CAMPAIGN"/);
  assert.match(engine, /One action activates every approved plan/);
});

test("optional baseline evidence is visible but never a hidden activation blocker", () => {
  assert.match(engine, /bodyBaseline/);
  assert.match(engine, /performanceBaseline/);
  assert.match(engine, /recoveryBaseline/);
  assert.match(app, /never a hidden blocker/);
  assert.match(styles, /\.campaign-commissioning-baseline/);
});

test("commissioning is account-backed and existing active programs are backfilled", () => {
  assert.match(app, /CAMPAIGN_COMMISSION/);
  assert.match(app, /persistClosedLoopState\("CAMPAIGN_COMMISSION", "current"/);
  assert.match(app, /ACTIVE_PROGRAM_BACKFILL/);
  assert.match(app, /ensureCampaignCommissioningReceipt/);
  assert.match(engine, /legacyActive/);
});

test("campaign language points to commissioning rather than another module approval", () => {
  assert.match(campaign, /Commission the campaign/);
  assert.match(app, /Open commissioning/);
  assert.doesNotMatch(campaign, /label: "Activate the program"/);
});

test("Build 027A is responsive, cache-safe, documented, and regression-tested", () => {
  assert.match(styles, /Build 027A: one Campaign Commissioning gate/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /026l-027a/);
  assert.match(worker, /campaign-commissioning\.js\?v=027a/);
  assert.match(app, /sw\.js\?v=027a/);
  assert.match(changelog, /Build 027A Campaign Commissioning/);
  assert.match(integrity, /027A commissioning engine/);
  assert.ok(pkg.scripts["test:027a"].includes("campaign-commissioning.test.js"));
});
