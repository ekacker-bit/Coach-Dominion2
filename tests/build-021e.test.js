const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const experience = fs.readFileSync(path.join(root, "assets/js/contract-experience.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(experience, /function amendmentReviewRoute/);
assert.match(experience, /pattern: \/\\bage\\b\/i, step: 0/);
assert.match(experience, /pattern: \/target date\/i, step: 1/);
assert.match(experience, /two-a-days\|sessions per training day\|training days/);

assert.match(app, /function routeRecruitContractReview/);
assert.match(app, /Fix before signing:/);
assert.match(app, /routeRecruitContractReview\(draft\);/);
assert.match(app, /event\.preventDefault\(\);\s*experienceButton\.disabled = true/);
assert.match(app, /const completed = await signRecruitContractFromCeremony\(\)/);
assert.match(app, /if \(completed\) document\.getElementById\("contract-signing-dialog"\)\?\.close\("confirm"\)/);
assert.match(app, /followupWarnings\.push\("calendar regeneration needs a retry"\)/);
assert.match(app, /Your signed Contract is already in force/);
assert.match(app, /return true;\s*\n\}/);

assert.match(html, /<button type="button" value="confirm" data-contract-experience-action="sign-confirm">/);
assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-c])-v1/);
assert.match(packageJson, /node tests\/build-021e\.test\.js/);

console.log("Build 021E Contract amendment finalization regression checks passed.");

