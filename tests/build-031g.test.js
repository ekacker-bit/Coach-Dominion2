"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031G certifies one full recruit week from signed authority through next-week Calendar", () => {
  const engine = read("assets/js/recruit-week-certification.js");
  const app = read("assets/js/app.js");

  assert.match(engine, /const VERSION = "031G\.1"/);
  assert.match(engine, /const RECEIPT_TYPE = "RECRUIT_WEEK_CERTIFICATION"/);
  assert.match(engine, /function buildReceipt/);
  assert.match(engine, /dailyReceiptIds\.length !== 7/);
  assert.match(engine, /function launchMatches/);
  assert.match(engine, /firstProblem/);
  assert.match(engine, /diagnostic/);
  assert.match(app, /function buildRecruitWeekCertification/);
  assert.match(app, /readRecruitWeekCertificationReceipts/);
  assert.match(app, /scheduleRecruitWeekCertificationReceipt/);
  assert.match(app, /renderRecruitWeekCertification\(aggregate, \{ proofWeek, weeklyLaunch \}\)/);
  assert.match(app, /renderRecruitWeekCertification\(weeklyInspection\)/);
});

test("031G replaces duplicate weekly controls with one responsive repair action", () => {
  const app = read("assets/js/app.js");
  const weekly = read("assets/js/weekly-advancement.js");
  const css = read("assets/styles.css");

  assert.match(weekly, /id="recruit-week-certification"/);
  assert.match(app, /data-recruit-week-action/);
  assert.match(app, /action === "REVIEW_PRIOR_DAY"/);
  assert.match(app, /action === "FINALIZE_WEEK"/);
  assert.match(app, /action === "APPROVE_NEXT_WEEK"/);
  assert.match(app, /action === "RETRY_ACCOUNT"/);
  assert.match(app, /Support details/);
  assert.match(css, /\.recruit-week-certification/);
  assert.match(css, /#inspection\[data-week-certification\] #weekly-verdict-launch/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.recruit-week-certification-action button \{ width: 100%; \}/);
});

test("031G ships a fresh cache, health identity, and production gate", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = read("package.json");

  assert.match(html, /coach-dominion-release" content="031G\.1"/);
  assert.match(html, /recruit-week-certification\.js\?v=031g/);
  assert.match(html, /styles\.css\?v=[^"]*-031g/);
  assert.match(html, /app\.js\?v=[^"]*-031g/);
  assert.match(worker, /031g-recruit-week-certification/);
  assert.match(worker, /recruit-week-certification\.js\?v=031g/);
  assert.match(app, /\/sw\.js\?v=031g/);
  assert.match(health, /release: "031G\.1"/);
  assert.match(health, /recruitWeekCertification: "full-week-account-restored"/);
  assert.match(workflow, /npm run test:031g/);
  assert.match(workflow, /--expected-release 031G\.1/);
  assert.match(pkg, /"test:031g"/);
});
