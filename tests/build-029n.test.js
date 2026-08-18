"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Build 029N makes reconciliation the governing action", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const blocker = read("assets/js/unified-blocker-resolution.js");
  assert.match(html, /coach-dominion-release" content="029[NO]\.1"/);
  assert.match(html, /contract-reconciliation\.js\?v=029n/);
  assert.ok(html.indexOf("contract-reconciliation.js?v=029n") < html.indexOf("app.js?v="));
  assert.match(blocker, /code: first\.domain === "contract" \? "CONTRACT_CONFLICT"/);
  assert.match(blocker, /Compare and choose saved Contract/);
  assert.match(app, /contractConflictExecutionPolicy/);
  assert.match(app, /Mission protected/);
});

test("Build 029N shows differences before choices and writes receipts", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(html, /id="continuity-bulk-actions"[^>]+hidden/);
  assert.match(app, /data-continuity-action="preview"/);
  assert.match(app, /continuity-diff-table/);
  assert.match(app, /saveContractReconciliationReceipt/);
  assert.match(truth, /reconciliationReceipts/);
});

test("Build 029N pauses deterministic retries and refreshes every consumer", () => {
  const app = read("assets/js/app.js");
  const persistence = read("assets/js/account-persistence.js");
  assert.match(persistence, /CONFLICT_REQUIRES_CHOICE/);
  assert.match(persistence, /VALIDATION_FAILURE/);
  assert.match(persistence, /function shouldRetry/);
  assert.match(app, /Automatic retries are paused/);
  assert.match(app, /renderNutritionCommand/);
  assert.match(app, /renderRecoveryReview/);
  assert.match(app, /renderWeeklyJudgment/);
});

test("Build 029N is responsive, cached, and release-gated", () => {
  const css = read("assets/styles.css");
  const worker = read("sw.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(css, /\.continuity-diff-table/);
  assert.match(css, /\.global-contract-blocker/);
  assert.match(worker, /contract-reconciliation\.js\?v=029n/);
  assert.match(worker, /029n-contract-reconciliation/);
  assert.match(workflow, /npm run test:029[no]/i);
  assert.match(workflow, /--expected-release 029[NO]\.1/);
});
