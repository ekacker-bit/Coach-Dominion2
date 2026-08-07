const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "010_running_state_persistence.sql"), "utf8");

assert.match(migration, /primary key \(user_id, state_type, state_key\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(app, /\.from\("running_state"\)\.upsert/);
assert.match(app, /runStartupTask\("Cardio", loadRunningState, startupIssues\)/);
assert.match(app, /persistRunningState\("PLAN"/);
assert.match(app, /persistRunningState\("EXECUTION"/);
assert.match(app, /persistRunningState\("RECONCILIATION"/);

console.log("Running persistence: 8 assertions passed.");
