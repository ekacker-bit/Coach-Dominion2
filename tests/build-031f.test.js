"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031F binds exact-date repair to one account-confirmed daily receipt", () => {
  const app = read("assets/js/app.js");
  const engine = read("assets/js/review-yesterday.js");

  assert.match(engine, /const VERSION = "031F\.1"/);
  assert.match(engine, /Optional unknowns stay unscored/);
  assert.match(app, /function confirmRealAccountJourneyForDate/);
  assert.match(app, /saveJourneyCertificationReceipt\(report\.candidate\)/);
  assert.match(app, /syncDominionAccountTruth\(\{ force: true, reason: "review_yesterday" \}\)/);
  assert.match(app, /renderRecruitProofWeek\(proofWeek\)/);
  assert.match(app, /Week now \$\{secureCount\} of 7/);
  assert.match(app, /deferReceipt: true/);
});
test("031F renders one word-light repair surface and hides known duplicate fields", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");

  assert.match(html, /id="review-yesterday-context"/);
  assert.match(html, /data-review-field="steps"/);
  assert.match(html, /data-review-field="processed_food"/);
  assert.match(app, /function renderReviewYesterdayPresentation/);
  assert.match(app, /model\.fields\.known\.forEach/);
  assert.match(app, /Blocked: \$\{model\.blocker\.detail\}/);
  assert.match(css, /\.review-yesterday-context/);
  assert.match(css, /\[data-review-field\]\[hidden\]/);
  assert.match(css, /@media \(max-width: 720px\)/);
});

test("031F ships a fresh cache and production identity", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = read("package.json");

  assert.match(html, /coach-dominion-release" content="031F\.1"/);
  assert.match(html, /review-yesterday\.js\?v=031f/);
  assert.match(worker, /031f-review-yesterday-resolution/);
  assert.match(worker, /review-yesterday\.js\?v=031f/);
  assert.match(app, /\/sw\.js\?v=031f/);
  assert.match(health, /release: "031F\.1"/);
  assert.match(health, /reviewYesterday: "exact-date-account-confirmed"/);
  assert.match(workflow, /npm run test:031f/);
  assert.match(workflow, /--expected-release 031F\.1/);
  assert.match(pkg, /"test:031f"/);
});
