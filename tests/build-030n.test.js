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
const engine = read("assets/js/rank-advancement-certification.js");
const account = read("assets/js/dominion-account-truth.js");
const weekly = read("assets/js/weekly-advancement.js");
const health = read("api/health.js");
const workflow = read(".github/workflows/release-integrity.yml");
const packageJson = JSON.parse(read("package.json"));
const preview = read("tests/fixtures/rank-advancement-preview.html");

test("030N is cache-busted and guarded by the production release gate", () => {
  assert.match(html, /coach-dominion-release" content="030[NOPQ]\.1"/);
  assert.match(html, /rank-advancement-certification\.js\?v=030n/);
  assert.ok(html.indexOf("rank-advancement-certification.js?v=030n") < html.indexOf("app.js?v="));
  assert.match(worker, /rank-advancement-certification\.js\?v=030n/);
  assert.match(app, /register\("\/sw\.js\?v=030[nopq]"/);
  assert.match(health, /release: "030[NOPQ]\.1"/);
  assert.match(health, /rankAdvancement: "finalized-proof-certified"/);
  assert.match(workflow, /npm run test:030[nopq]/);
  assert.match(workflow, /--expected-release 030[NOPQ]\.1/);
  assert.match(packageJson.scripts["test:030n"], /rank-advancement-certification\.test\.js/);
});

test("030N requires exact weekly proof and one valid rank transition", () => {
  assert.match(engine, /const VERSION = "030N\.1"/);
  assert.match(engine, /RANK_ADVANCEMENT_CERTIFICATION/);
  assert.match(engine, /function validTransition/);
  assert.match(engine, /LATEST_EXECUTION_NOT_CERTIFIED/);
  assert.match(engine, /OPEN_STANDARD/);
  assert.match(engine, /function certify/);
  assert.match(engine, /lateEvidence: true/);
  assert.match(engine, /function validateHistory/);
});

test("030N makes certified history account truth and the authority for rank", () => {
  assert.match(account, /const VERSION = "030[NOPQ]\.1"/);
  assert.match(account, /rankAdvancements: 12/);
  assert.match(account, /mergeCollection\(value\.rankAdvancements/);
  assert.match(account, /mergeCollection\(device\.rankAdvancements, account\.rankAdvancements/);
  assert.match(app, /rankAdvancements: readRankAdvancementHistory\(\)/);
  assert.match(app, /coaching\.rankAdvancements/);
  assert.match(app, /DominionRankAdvancementCertification\.validateHistory/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "rank-advancement-certification"/);
});

test("030N replaces browser-only promotion with one compact proof and action", () => {
  assert.match(weekly, /const VERSION = "030[NOPQ]\.1"/);
  assert.match(weekly, /id="rank-advancement-certification"/);
  assert.match(app, /function buildRankAdvancementCertification/);
  assert.match(app, /preview\?\.status !== "READY"/);
  assert.match(app, /snapshot\?\.status !== "CERTIFIED"/);
  assert.match(app, /The proof is locked to your account/);
  assert.match(css, /Rank advancement certification/);
  assert.match(css, /\.rank-advancement-proof/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.rank-advancement-proof/);
  assert.match(preview, /data-rank-proof="ready"/);
  assert.match(preview, />Authorize promotion</);
  assert.doesNotMatch(app, />030N</);
  assert.doesNotMatch(html, />030N</);
});
