"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("031C wires the seven-day account proof chain into Today, Review, and advancement", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const engine = read("assets/js/recruit-proof-week.js");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");

  assert.match(html, /coach-dominion-release" content="031C\.1"/);
  assert.match(html, /recruit-proof-week\.js\?v=031c/);
  assert.match(html, /id="recruit-proof-week-today"/);
  assert.match(engine, /const VERSION = "031C\.1"/);
  assert.match(engine, /const RECEIPT_TYPE = "RECRUIT_PROOF_WEEK"/);
  assert.match(engine, /const DAILY_RECEIPT_TYPE = "REAL_ACCOUNT_JOURNEY"/);
  assert.match(engine, /code: "REVIEW_PRIOR_DAY"/);
  assert.match(engine, /canFinalize: state === "VERIFIED"/);
  assert.match(engine, /canAdvance: state === "VERIFIED"/);
  assert.match(app, /function buildCurrentRecruitProofWeek/);
  assert.match(app, /function scheduleRecruitProofWeekReceipt/);
  assert.match(app, /function buildRecruitProofWeekForInspection/);
  assert.match(app, /data-recruit-proof-week-action/);
  assert.match(app, /proofWeek\?\.canFinalize/);
  assert.match(app, /proofWeek\?\.canAdvance/);
  assert.match(worker, /031c-recruit-proof-week/);
  assert.match(worker, /recruit-proof-week\.js\?v=031c/);
  assert.match(app, /\/sw\.js\?v=031c/);
  assert.match(health, /release: "031C\.1"/);
  assert.match(health, /recruitProofWeek: "seven-day-account-chain"/);
  assert.match(workflow, /npm run test:031c/);
  assert.match(workflow, /--expected-release 031C\.1/);
});

test("031C remains word-light and hides engineering labels from the recruit", () => {
  const html = read("app.html").replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  const css = read("assets/styles.css");
  assert.doesNotMatch(html, />\s*(?:BUILD|RELEASE)\s+0?31C/i);
  assert.doesNotMatch(html, /RECRUIT_PROOF_WEEK/);
  assert.match(css, /\.recruit-proof-week/);
  assert.match(css, /grid-template-columns: repeat\(7, 10px\)/);
});
