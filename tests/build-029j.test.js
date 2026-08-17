const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));
const integrity = read("scripts/release-integrity.js");
const runbook = read("docs/rls-policy-performance.md");

assert.match(changelog, /Unreleased - Policy Performance Acceleration/);
assert.match(pkg.scripts["test:029j"], /rls-policy-performance\.test\.js/);
assert.match(pkg.scripts["test:029j"], /test:029i/);
assert.match(integrity, /RLS initPlan acceleration/);
assert.match(integrity, /RLS semantic guard/);
assert.match(runbook, /125.*auth_rls_initplan/i);
assert.match(runbook, /zero.*auth_rls_initplan/i);
assert.match(runbook, /No access predicate changes/i);

console.log("Build 029J policy performance checks passed.");
