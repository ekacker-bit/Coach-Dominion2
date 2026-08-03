const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");

for (const helper of [
  "recruitOnboardingStorageKey",
  "readRecruitOnboardingState",
  "saveRecruitOnboardingLocal",
  "recruitOnboardingFromRow",
  "selectRecruitOnboardingState",
  "persistRecruitOnboardingState",
  "loadRecruitOnboardingState",
  "clearRecruitOnboardingState"
]) {
  assert.match(app, new RegExp(`(?:async\\s+)?function\\s+${helper}\\s*\\(`), `missing ${helper}`);
}

assert.match(app, /from\("recruit_onboarding_state"\)\.upsert/);
assert.match(app, /from\("recruit_onboarding_state"\)[\s\S]+\.maybeSingle\(\)/);
assert.match(app, /withTimeout\(accountRead, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS\)/);
assert.match(html, /contract-autosave\.js\?v=021h/);
assert.match(html, /first-week-orientation\.js\?v=021h/);
assert.match(html, /app\.js\?v=(?:022[b-g]|023[abc])/);
console.log("Build 021H orientation persistence recovery integration passed.");
