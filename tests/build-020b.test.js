const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const splitDay = require("../assets/js/split-day-command.js");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/024_split_day_checkpoint_state.sql"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.equal(splitDay.VERSION, "020B.2");
assert.equal(splitDay.MINIMUM_SEPARATION_MINUTES, 240);
assert.equal(splitDay.MINIMUM_SECOND_SESSION_ENERGY, 5);
assert.match(html, /assets\/js\/split-day-command\.js/);
assert.match(app, /function persistSplitDayCheckpoint/);
assert.match(app, /data-split-day-checkpoint/);
assert.match(app, /function splitDayModuleAuthorization/);
assert.match(app, /loadSplitDayCheckpointState/);
assert.match(app, /AM\/PM Two-a-Day/);
assert.match(app, /Two-a-Days are off in the signed Contract/);
assert.match(app, /reconcileCoreProgramWithContract/);
assert.match(styles, /\.split-day-checkpoint-form/);
assert.match(styles, /\.split-day-blockers/);
assert.match(migration, /create table if not exists public\.split_day_checkpoint_state/);
assert.match(migration, /enable row level security/);
assert.match(worker, /coach-dominion-020b-v2/);
assert.match(worker, /assets\/js\/split-day-command\.js/);
assert.match(packageJson, /node tests\/build-020b\.test\.js/);

console.log("Build 020B split-day checkpoint integration passed.");

