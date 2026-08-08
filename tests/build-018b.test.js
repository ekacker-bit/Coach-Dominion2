
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "022_recruit_contract_state.sql"), "utf8");

for (const id of [
  "contract",
  "recruit-contract-form",
  "recruit-contract-status",
  "recruit-contract-storage",
  "recruit-contract-feedback",
  "recruit-contract-output"
]) {
  assert.match(html, new RegExp(`id="${id}"`), `missing Recruit Contract surface: ${id}`);
}

for (const field of [
  "primaryGoal",
  "target",
  "targetDate",
  "trainingDaysPerWeek",
  "strengthDaysPerWeek",
  "runningDaysPerWeek",
  "coreDaysPerWeek",
  "sessionMinutes",
  "nutritionCommitment",
  "declaredWeeklyDistance"
]) {
  assert.match(html, new RegExp(`name="${field}"`), `missing Recruit Contract field: ${field}`);
}

assert.match(html, /href="#program" data-section="program">PROGRAM</);
assert.match(html, /href="#contract" data-section="contract">(?:<strong>)?Contract/);
assert.match(html, /src="\/assets\/js\/recruit-contract\.js(?:\?v=024[abcdefghi])?"/);
assert.match(css, /Build 018B: centralized Recruit Contract/);
assert.match(css, /\.recruit-contract-week\{display:grid;grid-template-columns:repeat\(7/);
assert.match(css, /scroll-snap-type:x mandatory/, "mobile weekly contract should remain horizontally scannable");

assert.match(js, /async function loadRecruitContractState\(\)/);
assert.match(js, /async function persistRecruitContractState\(stateType, payload\)/);
assert.match(js, /async function stageRecruitContractPlans\(/);
assert.match(js, /Current \$\{protectedPlans\.join/);
assert.match(js, /Active module plans remain unchanged/);
assert.match(js, /hasRecruitContract: Boolean\(readApprovedRecruitContract\(\)\)/);
assert.match(js, /runStartupTask\("Recruit Contract", loadRecruitContractState, startupIssues\)/);

assert.match(migration, /create table if not exists public\.recruit_contract_state/);
assert.match(migration, /state_type in \('DRAFT', 'APPROVED', 'HISTORY'\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /auth\.uid\(\) = user_id/);
assert.match(migration, /grant select, insert, update, delete/);

console.log("Build 018B integration tests passed.");