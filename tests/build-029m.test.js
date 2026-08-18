"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Build 029M exposes one matching release identity", () => {
  const health = read("api/health.js");
  const html = read("app.html");
  assert.match(health, /release:\s*"029[MN]\.1"/);
  assert.match(health, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(health, /productionCanary:\s*"available"/);
  assert.match(html, /<meta name="coach-dominion-release" content="029[MN]\.1">/);
});

test("Build 029M gates main with a bounded production canary", () => {
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(workflow, /production-canary:/);
  assert.match(workflow, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /timeout-minutes: 8/);
  assert.match(workflow, /https:\/\/coach-dominion2\.vercel\.app/);
  assert.match(workflow, /--expected-release 029[MN]\.1/);
  assert.match(workflow, /--expected-commit \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /--attempts 30/);
  assert.match(workflow, /npm run test:029[MN]/i);
});

test("Build 029M verifies the full live reliability path without personal data", () => {
  const canary = read("scripts/production-canary.js");
  assert.match(canary, /\/api\/health/);
  assert.match(canary, /coach-dominion-release/);
  assert.match(canary, /account-truth-health/);
  assert.match(canary, /\/api\/trust-events/);
  assert.match(canary, /event:\s*"trust_check"/);
  assert.match(canary, /\^CD-\[A-F0-9\]\{8\}\$/);
  assert.doesNotMatch(canary, /\b(?:email|userId|healthData|notes)\s*:/);
  assert.doesNotMatch(canary, /VERCEL_(?:TOKEN|ORG_ID|PROJECT_ID)/);
});

test("Build 029M is wired into release integrity and release notes", () => {
  const packageJson = read("package.json");
  const integrity = read("scripts/release-integrity.js");
  const changelog = read("CHANGELOG.md");
  assert.match(packageJson, /"test:029m"/);
  assert.match(packageJson, /tests\/production-canary\.test\.js/);
  assert.match(packageJson, /tests\/build-029m\.test\.js/);
  assert.match(integrity, /029M release identity/);
  assert.match(integrity, /029M deployment gate/);
  assert.match(changelog, /Production Release Canary/);
});
