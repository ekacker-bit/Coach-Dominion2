const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/rank-advancement-handoff.js");
const certification = read("assets/js/rank-advancement-certification.js");
const account = read("assets/js/dominion-account-truth.js");
const weekly = read("assets/js/weekly-advancement.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const health = read("api/health.js");
const workflow = read(".github/workflows/release-integrity.yml");
const packageJson = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/rank-handoff-preview.html");

test("030O remains cache-busted and guarded by the current production release", () => {
  assert.match(html, /coach-dominion-release" content="030[OPQRSTU]\.1"/);
  assert.match(html, /rank-advancement-handoff\.js\?v=030o/);
  assert.ok(html.indexOf("rank-advancement-handoff.js?v=030o") < html.indexOf("app.js?v="));
  assert.match(worker, /030o-advancement-handoff/);
  assert.match(worker, /rank-advancement-handoff\.js\?v=030o/);
  assert.match(app, /register\("\/sw\.js\?v=030[opqrstu]"/);
  assert.match(health, /release: "030[OPQRSTU]\.1"/);
  assert.match(health, /rankHandoff: "earned-rank-acknowledged"/);
  assert.match(workflow, /npm run test:030[opqrstu]/);
  assert.match(workflow, /--expected-release 030[OPQRSTU]\.1/);
  assert.match(packageJson.scripts["test:030o"], /rank-advancement-handoff\.test\.js/);
});

test("030O keeps acknowledgment separate from immutable promotion proof", () => {
  assert.match(engine, /const VERSION = "030O\.1"/);
  assert.match(engine, /RANK_ADVANCEMENT_HANDOFF/);
  assert.match(engine, /function acknowledge/);
  assert.match(engine, /certificationId: candidate\.certification\.id/);
  assert.match(engine, /const selected = existing\?\.locked \? existing : receipt/);
  assert.match(certification, /RANK_ADVANCEMENT_CERTIFICATION/);
  assert.doesNotMatch(certification, /acknowledgedAt/);
});

test("030O restores handoff receipts through Account Truth", () => {
  assert.match(account, /const VERSION = "030O\.1"/);
  assert.match(account, /rankHandoffs: 12/);
  assert.match(account, /mergeCollection\(value\.rankHandoffs/);
  assert.match(account, /mergeCollection\(device\.rankHandoffs, account\.rankHandoffs/);
  assert.match(app, /rankHandoffs: readRankAdvancementHandoffHistory\(\)/);
  assert.match(app, /coaching\.rankHandoffs/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "rank-advancement-handoff"/);
});

test("030O gives Review one earned-rank action and next standard", () => {
  assert.match(weekly, /id="rank-advancement-handoff"/);
  assert.match(app, /function buildRankAdvancementHandoff/);
  assert.match(app, /function rankAdvancementHandoffMarkup/);
  assert.match(app, /data-rank-handoff-action="acknowledge"/);
  assert.match(app, /Accept the earned/);
  assert.match(css, /\.rank-advancement-handoff/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.rank-advancement-handoff/);
  assert.match(preview, />Accept Cadet</);
  assert.match(preview, /Next standard/);
  assert.doesNotMatch(app, />030O</);
  assert.doesNotMatch(html, />030O</);
});
