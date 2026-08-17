const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));
const integrity = read("scripts/release-integrity.js");
const runbook = read("docs/foreign-key-index-coverage.md");

assert.match(changelog, /Unreleased - Foreign-Key Index Coverage/);
assert.match(pkg.scripts["test:029k"], /foreign-key-index-coverage\.test\.js/);
assert.match(pkg.scripts["test:029k"], /test:029j/);
assert.match(integrity, /foreign-key index coverage/);
assert.match(integrity, /foreign-key index restraint/);
assert.match(runbook, /Nine `unindexed_foreign_keys`/i);
assert.match(runbook, /Ten `unused_index`/i);
assert.match(runbook, /does not alter constraints, rows, grants, policies, or existing indexes/i);

console.log("Build 029K foreign-key index coverage checks passed.");
