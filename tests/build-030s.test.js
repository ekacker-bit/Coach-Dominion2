"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030S is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.match(html, /coach-dominion-release" content="030S\.1"/);
  assert.match(html, /daily-loop-certification\.js\?v=030s/);
  assert.match(html, /app\.js\?v=[^"]*-030s/);
  assert.match(worker, /030s-real-recruit-daily-loop/);
  assert.match(worker, /daily-loop-certification\.js\?v=030s/);
  assert.match(app, /register\("\/sw\.js\?v=030s"/);
  assert.match(health, /release: "030S\.1"/);
  assert.match(health, /dailyLoopCertification: "account-receipt-confirmed"/);
  assert.match(workflow, /npm run test:030s/);
  assert.match(workflow, /--expected-release 030S\.1/);
  assert.match(pkg.scripts["test:030s"], /real-daily-loop-certification\.js/);
});

test("030S persists an exact account-confirmed receipt", () => {
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(app, /async function persistDailyLoopCertificationHistory/);
  assert.match(app, /\.upsert\([\s\S]*state_key: "daily-loop-certification"[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /data\.payload\.some\(\(item\) => item\?\.id === history\[0\]\.id\)/);
  assert.match(app, /saveClosedLoopLocal\("HISTORY", "daily-loop-certification", history\)/);
  assert.match(truth, /dailyLoopReceipts: 120/);
  assert.match(truth, /dailyLoopReceipts: mergeCollection/);
});

test("030S joins closeout, tomorrow decision, startup, and the word-light proof", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");
  assert.match(html, /id="daily-loop-certification"/);
  assert.match(app, /const dailyLoop = await reconcileDailyLoopCertification\(\{ closeout: record, decision: verdict, persist: true \}\)/);
  assert.match(app, /runStartupTask\("daily loop certification"/);
  assert.match(app, /Day secured/);
  assert.match(css, /\.daily-loop-certification\[data-daily-loop-state="certified"\]/);
  assert.doesNotMatch(html, />030S</);
});

test("030S has a stop-the-line scenario gate", () => {
  const scenarios = read("scripts/real-daily-loop-scenarios.js");
  const engine = read("assets/js/daily-loop-certification.js");
  [
    "OPEN_DAY_REMAINS_OPEN",
    "SEALED_DAY_WAITS_FOR_ATLAS",
    "PARTIAL_AND_MISSED_ARE_HONESTLY_CLASSIFIED",
    "SURFACE_DIVERGENCE_STOPS_THE_LINE",
    "ACCOUNT_RECEIPT_CERTIFIES_THE_DAY",
    "MOBILE_RESTORE_KEEPS_THE_SAME_RECEIPT"
  ].forEach((id) => assert.match(scenarios, new RegExp(id)));
  assert.match(engine, /ASSIGNMENT_SURFACE_MISMATCH/);
  assert.match(engine, /NEXT_DAY_DECISION_MISSING/);
  assert.match(engine, /ASSIGNMENT_OUTCOME_UNRESOLVED/);
});
