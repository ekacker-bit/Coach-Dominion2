const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const styles = read("assets/styles.css");
const ledger = read("assets/js/transformation-ledger.js");
const worker = read("sw.js");
const pkg = JSON.parse(read("package.json"));

test("Trends opens with one Transformation Ledger and keeps detail views subordinate", () => {
  assert.match(html, /id="transformation-ledger"/);
  assert.match(html, /id="transformation-ledger-bookends"/);
  assert.match(html, /id="transformation-ledger-signals"/);
  assert.match(html, /WHAT CHANGED/);
  assert.match(html, /WHAT NEXT/);
  assert.match(html, /data-trend-view="training"/);
  assert.doesNotMatch(html, /data-section="transformation-ledger"/);
});

test("the ledger is assembled from existing canonical evidence", () => {
  assert.match(ledger, /const VERSION = "028E\.1"/);
  assert.match(app, /trendModel: model/);
  assert.match(app, /campaign: currentDominionCampaign \|\| buildCurrentDominionCampaign/);
  assert.match(app, /standards: standardsReviewState/);
  assert.match(app, /photos: bodyProgressPhotos/);
  assert.match(app, /renderTransformationLedger\(buildCurrentTransformationLedger\(model\)\)/);
});

test("all requested proof domains are visible and thin evidence remains bounded", () => {
  ["weight", "measurements", "photos", "strength", "running", "adherence", "recovery", "standards", "campaign"].forEach((id) => {
    assert.match(ledger, new RegExp(`signal\\("${id}"`));
  });
  assert.match(ledger, /The baseline is still forming/);
  assert.match(ledger, /Keep logging before claiming a change/);
  assert.doesNotMatch(ledger, /guarantee|caused by|predicted transformation/i);
});

test("the ledger is responsive, cached, and hidden from primary navigation", () => {
  assert.match(styles, /Build 028E: one evidence-backed transformation story/);
  assert.match(styles, /\.transformation-ledger-signals/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(html, /transformation-ledger\.js\?v=028e/);
  assert.match(worker, /transformation-ledger\.js\?v=028e/);
  assert.match(worker, /028d-028e/);
  assert.match(app, /sw\.js\?v=028e/);
  assert.ok(pkg.scripts["test:028e"]);
});
