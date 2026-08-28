"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030W is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030W\.1"/);
  assert.match(html, /recruit-loop-certification\.js\?v=030w/);
  assert.match(html, /app\.js\?v=[^"]*-030w/);
  assert.match(worker, /030w-recruit-loop-certification/);
  assert.match(worker, /recruit-loop-certification\.js\?v=030w/);
  assert.match(app, /register\("\/sw\.js\?v=030w"/);
  assert.match(health, /release: "030W\.1"/);
  assert.match(workflow, /npm run test:030w/);
  assert.match(workflow, /--expected-release 030W\.1/);
});

test("030W persists and restores one exact account receipt", () => {
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(app, /async function persistRecruitLoopCertificationHistory/);
  assert.match(app, /state_key: "recruit-loop-certification"[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /item\?\.id === history\[0\]\.id && item\?\.fingerprint === history\[0\]\.fingerprint/);
  assert.match(app, /recruitLoopCertifications: readRecruitLoopCertificationHistory\(\)/);
  assert.match(app, /evidence\.recruitLoopCertifications/);
  assert.match(truth, /recruitLoopCertifications: 120/);
  assert.match(truth, /recruitLoopCertifications: mergeCollection/);
});

test("030W diagnostic stays internal and phone-safe", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");
  const fixture = read("tests/fixtures/recruit-loop-preview.html");
  assert.match(html, /id="recruit-loop-certification"[^>]*hidden/);
  assert.match(app, /query\?\.get\("certify"\) === "1"/);
  assert.match(app, /\["admin", "staff", "coach"\]\.includes\(role\)/);
  assert.match(css, /\.recruit-loop-certification\[hidden\] \{ display: none; \}/);
  assert.match(css, /\.recruit-loop-certification li \{ grid-template-columns: 1fr auto; \}/);
  assert.match(fixture, /data-certification-state="certified"/);
  assert.match(fixture, /data-stage-status="slow"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030W/i);
});

test("030W records restore timing after the protected startup barrier", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /startupRestoreDurationMs = startupRestoreStartedAt === null/);
  assert.ok(app.indexOf("endStartupRestoreWatch();") < app.indexOf('runStartupTask("48-hour recruit loop"'));
  assert.match(app, /restoreDurationMs: startupRestoreDurationMs/);
});
