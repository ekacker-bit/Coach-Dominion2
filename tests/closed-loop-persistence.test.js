const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "013_closed_loop_coaching.sql"), "utf8");

assert.match(migration, /primary key \(user_id, state_type, state_key\)/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /auth\.uid\(\) = user_id/i);
assert.match(app, /\.from\("coaching_loop_state"\)\.upsert/);
assert.match(app, /await loadClosedLoopState\(\)/);
assert.match(app, /persistClosedLoopState\("DECISION"/);
assert.match(app, /persistClosedLoopState\("REVIEW"/);
assert.match(app, /persistClosedLoopState\("ADAPTATION"/);
assert.match(app, /persistClosedLoopState\("HISTORY"/);
assert.match(app, /await approveCurrentClosedLoopDecision\(\)/);
assert.match(app, /currentAdaptation\?\.status === "APPROVED" && currentAdaptation\.date < date/);
assert.match(app, /adaptation: currentAdaptation/);
assert.match(app, /localTimestamp > remoteTimestamp/);
assert.match(html, /assets\/js\/closed-loop\.js/);
assert.match(html, /id="closed-loop-panel"/);
assert.match(html, /id="training-closed-loop-panel"/);

console.log("Closed-loop persistence: 16 assertions passed.");
