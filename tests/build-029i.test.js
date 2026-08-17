const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const changelog = read("CHANGELOG.md");
const pkg = JSON.parse(read("package.json"));
const integrity = read("scripts/release-integrity.js");
const runbook = read("docs/production-security.md");

assert.match(changelog, /Unreleased - Production Security Hardening/);
assert.match(pkg.scripts["test:029i"], /production-security-hardening\.test\.js/);
assert.match(pkg.scripts["test:029i"], /release-integrity\.js/);
assert.match(integrity, /production legacy quarantine/);
assert.match(integrity, /trigger RPC lockdown/);
assert.match(integrity, /intentional nutrition ingress/);
assert.match(runbook, /Leaked-password protection/i);
assert.match(runbook, /intentionally remains callable/i);

console.log("Build 029I production security checks passed.");
