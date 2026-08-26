const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("030J stores one account-backed proof for each applied daily verdict", () => {
  const app = read("assets/js/app.js");
  const accountTruth = read("assets/js/dominion-account-truth.js");
  assert.match(app, /function buildAtlasDecisionProof/);
  assert.match(app, /function reconcileAtlasDecisionProofs/);
  assert.match(app, /"atlas-decision-proof"/);
  assert.match(accountTruth, /dailyVerdicts/);
  assert.match(accountTruth, /proofs/);
});

test("030J keeps outcome proof compact across Today, Closeout, and Trends", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");
  assert.match(html, /id="trend-coaching-results"/);
  assert.match(app, /LAST COACHING CALL/);
  assert.match(app, /renderAtlasDecisionProofTrends/);
  assert.match(styles, /\.atlas-decision-proof-inline/);
  assert.match(styles, /\.trend-coaching-results/);
});

test("030J evaluates after Closeout and after protected startup hydration", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /reconcileAtlasClosedLoopDecision\(record\);\s*await reconcileAtlasDecisionProofs/);
  assert.match(app, /scheduleAtlasDecisionProofReconciliation\(\)/);
  assert.match(app, /DominionStartupAuthority\.permitsAccountWrite/);
});

test("030J is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030[JKLMNOPQRST]\.1/);
  assert.match(html, /atlas-decision-proof\.js\?v=030j/);
  assert.ok(html.indexOf("atlas-decision-proof.js?v=030j") < html.indexOf("app.js?v="));
  assert.match(worker, /030j-atlas-decision-proof/);
  assert.match(worker, /atlas-decision-proof\.js\?v=030j/);
  assert.match(app, /register\("\/sw\.js\?v=030[jklmnopqrst]"/);
  assert.match(health, /release: "030[JKLMNOPQRST]\.1"/);
  assert.match(health, /decisionProof: "outcome-verified"/);
  assert.match(workflow, /npm run test:030[jklmnopqrst]/);
  assert.match(workflow, /--expected-release 030[JKLMNOPQRST]\.1/);
});
