const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030K creates one canonical weekly result from finalized evidence", () => {
  const engine = read("assets/js/atlas-weekly-reconciliation.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /const VERSION = "030K\.1"/);
  assert.match(engine, /function buildEvidencePacket/);
  assert.match(engine, /function resultPosition/);
  assert.match(engine, /INSUFFICIENT_EVIDENCE/);
  assert.match(app, /function buildAtlasWeeklyReconciliation/);
  assert.match(app, /readAtlasDecisionProofHistory\(\)/);
  assert.match(app, /readDailyCloseoutHistory\(\)/);
  assert.match(app, /standards: standardsReviewState/);
});

test("030K offers one protected next-week commitment and preserves calendar blockers", () => {
  const engine = read("assets/js/atlas-weekly-reconciliation.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /COMMIT_NEXT_WEEK/);
  assert.match(engine, /blockingConflictCount/);
  assert.match(engine, /function attachCommit/);
  assert.match(app, /data-weekly-reconciliation-action="commit"/);
  assert.match(app, /commitUnifiedWeekDraft\(\{ adaptation: decision, deferRender: true \}\)/);
  assert.match(app, /Resolve the named calendar blocker before commitment/);
});

test("030K reuses the same weekly position across Review, Trends, Campaign, and Rank", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const weekly = read("assets/js/weekly-advancement.js");
  const styles = read("assets/styles.css");
  assert.match(weekly, /id="atlas-weekly-reconciliation"/);
  assert.match(html, /id="trend-weekly-result"/);
  assert.match(html, /id="dominion-campaign-weekly-position"/);
  assert.match(html, /id="rank-weekly-position"/);
  assert.match(app, /function renderAtlasWeeklyReconciliationSignals/);
  assert.match(styles, /\.atlas-weekly-reconciliation-lines/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});

test("030K persists reconciliation history through protected account truth", () => {
  const account = read("assets/js/dominion-account-truth.js");
  const app = read("assets/js/app.js");
  assert.match(account, /weeklyReconciliations: 52/);
  assert.match(account, /weeklyReconciliations: mergeCollection/);
  assert.match(app, /WEEKLY_RECONCILIATION", "current"/);
  assert.match(app, /HISTORY", "atlas-weekly-reconciliation"/);
  assert.match(app, /weeklyReconciliations: readAtlasWeeklyReconciliationHistory\(\)/);
});

test("030K is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030[KLMNOPQRST]\.1/);
  assert.match(html, /atlas-weekly-reconciliation\.js\?v=030k/);
  assert.ok(html.indexOf("atlas-weekly-reconciliation.js?v=030k") < html.indexOf("app.js?v="));
  assert.match(worker, /030k-atlas-weekly-reconciliation/);
  assert.match(worker, /atlas-weekly-reconciliation\.js\?v=030k/);
  assert.match(app, /register\("\/sw\.js\?v=030[klmnopqrst]"/);
  assert.match(health, /release: "030[KLMNOPQRST]\.1"/);
  assert.match(health, /weeklyReconciliation: "finalized-evidence-to-committed-week"/);
  assert.match(workflow, /npm run test:030[klmnopqrst]/);
  assert.match(workflow, /--expected-release 030[KLMNOPQRST]\.1/);
});
