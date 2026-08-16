const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "023_weekly_orchestration_state.sql"), "utf8");
const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "weekly-orchestrator-heading",
  "weekly-orchestrator-status",
  "weekly-orchestrator-panel",
  "weekly-orchestrator-feedback",
  "today-committed-week",
  "today-committed-week-state",
  "today-committed-week-panel"
]) {
  assert.match(html, new RegExp(`id="${id}"`), `missing Build 018D surface: ${id}`);
}

assert.match(html, /<div class="kicker">PROGRAM CALENDAR<\/div>/);
assert.match(html, /src="\/assets\/js\/weekly-orchestrator\.js\?v=024d"/);
assert.ok(html.indexOf("weekly-orchestrator.js") < html.indexOf("app.js"), "orchestrator must load before app integration");

assert.match(app, /async function loadWeeklyOrchestrationState\(\)/);
assert.match(app, /async function persistWeeklyOrchestrationState\(stateType, stateKey, payload\)/);
assert.match(app, /function renderWeeklyOrchestrator\(\)/);
assert.match(app, /function renderTodayCommittedWeek\(\)/);
assert.match(app, /CURRENT WEEK PROTECTED/);
assert.match(app, /data-weekly-orchestrator-action="\$\{atlasProgramDraft && !activeProgramMatches \? "activate-program" : "commit"\}"/);
assert.match(app, /The active week is protected/);
assert.match(app, /DominionWeeklyOrchestrator\.strengthScheduleFromWeek\(unifiedWeek\)/);
assert.match(app, /The committed weekly calendar does not assign Core today/);
assert.match(app, /runStartupTask\("Calendar", loadWeeklyOrchestrationState, startupIssues\)/);

assert.match(styles, /Build 018D: unified weekly plan orchestration/);
assert.match(styles, /\.weekly-orchestrator-week\{display:grid;grid-template-columns:repeat\(7/);
assert.match(styles, /\.today-committed-assignments/);
assert.match(styles, /scroll-snap-type:x mandatory/);

assert.match(migration, /create table if not exists public\.weekly_orchestration_state/);
assert.match(migration, /state_type in \('DRAFT', 'WEEK', 'HISTORY'\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /auth\.uid\(\) = user_id/);
assert.match(migration, /grant select, insert, update, delete/);

assert.match(pkg, /weekly-orchestrator\.test\.js/);
assert.match(pkg, /build-018d\.test\.js/);
assert.match(pkg, /"test:018d"/);

console.log("Build 018D integration tests passed.");
