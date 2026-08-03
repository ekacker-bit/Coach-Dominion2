const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const contract = fs.readFileSync(path.join(root, "assets/js/recruit-contract.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/026_first_week_orientation.sql"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const name of ["age", "heightValue", "heightUnit", "gender", "trainingYears"]) {
  assert.match(html, new RegExp(`name="${name}"`), `missing recruit profile field ${name}`);
}
for (const id of ["first-week-orientation", "first-week-orientation-steps", "contract-delete-dialog", "contract-delete-confirmation"]) {
  assert.match(html, new RegExp(`id="${id}"`), `missing 021C surface ${id}`);
}
assert.ok(html.indexOf("/assets/js/first-week-orientation.js") < html.indexOf("/assets/js/app.js"));

assert.match(contract, /function deriveAthleteType/);
assert.match(contract, /athleteProfile/);
assert.match(contract, /trainingYears/);
assert.match(app, /function renderFirstWeekOrientation/);
assert.match(app, /function retireActiveRecruitContract/);
assert.match(app, /data-contract-lifecycle-action/);
assert.match(app, /recruitProfileForAtlas/);
assert.match(app, /Hold progression through Week One/);
for (const helper of [
  "recruitOnboardingStorageKey",
  "readRecruitOnboardingState",
  "saveRecruitOnboardingLocal",
  "persistRecruitOnboardingState",
  "loadRecruitOnboardingState",
  "clearRecruitOnboardingState"
]) {
  assert.match(app, new RegExp(`(?:async\\s+)?function\\s+${helper}\\s*\\(`), `missing orientation persistence helper ${helper}`);
}

assert.match(css, /\.first-week-orientation/);
assert.match(css, /\.orientation-baseline-grid/);
assert.match(css, /\.contract-lifecycle-actions/);

assert.match(migration, /create table if not exists public\.recruit_onboarding_state/i);
assert.match(migration, /auth\.uid\(\) = user_id/);
assert.match(migration, /grant select, insert, update, delete/i);
assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-c])-v1/);
assert.match(worker, /first-week-orientation\.js/);
assert.match(packageJson, /node tests\/first-week-orientation\.test\.js/);
assert.match(packageJson, /node tests\/build-021c\.test\.js/);

console.log("Build 021C First Week Orientation integration checks passed.");

