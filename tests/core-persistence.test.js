const assert = require("assert");
const fs = require("fs");
const path = require("path");
const appModule = require("../assets/js/app.js");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "012_core_programming.sql"), "utf8");

assert.match(migration, /primary key \(user_id, state_type, state_key\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(app, /\.from\("core_program_state"\)\.upsert/);
assert.match(app, /await loadCoreProgramState\(\)/);
assert.match(app, /await reconcileCoreProgramWithContract\(\)/);
assert.match(app, /function selectCoreProgramState/);
assert.match(app, /persistCoreProgramState\("PLAN"/);
assert.match(app, /persistCoreProgramState\("EXECUTION"/);
assert.match(app, /persistCoreProgramState\("HISTORY"/);
assert.match(app, /performanceEntriesForSession/);
assert.match(html, /assets\/js\/core-programming\.js/);
assert.match(html, /id="core-today-panel"/);

const newerLocalPlan = { id: "core-new", approvedAt: "2026-08-01T12:00:00.000Z" };
const staleRemotePlan = {
  payload: { id: "core-old", approvedAt: "2026-07-30T12:00:00.000Z" },
  updated_at: "2026-07-30T12:05:00.000Z"
};
assert.equal(appModule.selectCoreProgramState(newerLocalPlan, staleRemotePlan).source, "LOCAL");
assert.equal(appModule.selectCoreProgramState(newerLocalPlan, staleRemotePlan).payload.id, "core-new");
assert.equal(appModule.selectCoreProgramState(null, staleRemotePlan).source, "REMOTE");
assert.equal(appModule.corePlanMatchesContract(
  { recruitContractId: "contract-7", recruitContractRevision: 7 },
  { id: "contract-7", revision: 7 }
), true);

console.log("Core persistence: restore and contract reconciliation assertions passed.");
