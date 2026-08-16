const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("027E ships one mobile-first Campaign Verdict and re-enlistment path", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/campaign-verdict.js");
  const styles = read("assets/styles.css");
  const worker = read("sw.js");

  assert.match(engine, /const VERSION = "027E\.1"/);
  assert.match(engine, /function buildVerdict/);
  assert.match(engine, /function sealVerdict/);
  assert.match(engine, /function reEnlistmentSeed/);
  assert.match(html, /id="campaign-verdict"/);
  assert.match(html, /id="campaign-verdict-body"/);
  assert.match(html, /id="campaign-verdict-performance"/);
  assert.match(html, /campaign-verdict\.js\?v=027e/);
  assert.ok(html.indexOf("campaign-verdict.js?v=027e") < html.indexOf("app.js?v="));
  assert.match(app, /function reconcileCampaignVerdict/);
  assert.match(app, /function prepareCampaignReEnlistment/);
  assert.match(app, /buildRecruitContractAmendment/);
  assert.match(app, /persistClosedLoopState\("CAMPAIGN_VERDICT", "current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "campaign-verdicts"/);
  assert.match(app, /sw\.js\?v=027e/);
  assert.match(styles, /Build 027E: Campaign Verdict and Re-Enlistment/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(worker, /campaign-verdict\.js\?v=027e/);
  assert.match(worker, /027d-027e/);
});
