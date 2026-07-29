const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "012_core_programming.sql"), "utf8");

assert.match(migration, /primary key \(user_id, state_type, state_key\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(app, /\.from\("core_program_state"\)\.upsert/);
assert.match(app, /await loadCoreProgramState\(\)/);
assert.match(app, /persistCoreProgramState\("PLAN"/);
assert.match(app, /persistCoreProgramState\("EXECUTION"/);
assert.match(app, /persistCoreProgramState\("HISTORY"/);
assert.match(app, /performanceEntriesForSession/);
assert.match(html, /assets\/js\/core-programming\.js/);
assert.match(html, /id="core-today-panel"/);

console.log("Core persistence: 11 assertions passed.");
