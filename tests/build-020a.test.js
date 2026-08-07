const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const orchestrator = require("../assets/js/weekly-orchestrator.js");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.equal(orchestrator.VERSION, "024D.1");
assert.equal(orchestrator.TWO_A_DAY_MINIMUM_SEPARATION_MINUTES, 240);
assert.equal(typeof orchestrator.buildSessionSequence, "function");

const sessions = orchestrator.buildSessionSequence(
  { twoADays: true, primaryGoal: "RUN_FASTER", sessionMinutes: 75 },
  [
    { id: "strength", module: "STRENGTH", type: "STRENGTH", estimatedMinutes: 70 },
    { id: "run", module: "RUNNING", type: "EASY", estimatedMinutes: 65 }
  ]
);
assert.deepEqual(sessions.map((item) => item.id), ["run", "strength"]);
assert.deepEqual(sessions.map((item) => item.sessionWindow), ["AM", "PM"]);
assert.equal(sessions[1].separationBeforeMinutes, 240);
assert.equal(sessions[1].fuelingCheckpoint, true);

assert.match(html, /Today&apos;s training order/);
assert.match(app, /data-today-session-module/);
assert.match(app, /data-two-a-day-action="fuel"/);
assert.match(app, /Finish the AM session first/);
assert.match(app, /function todaySessionExecution/);
assert.match(styles, /\.two-a-day-bridge/);
assert.match(styles, /\.today-session-card\.two-a-day-session/);
assert.match(worker, /coach-dominion-\d{3}[a-z]-v\d+/i);
assert.match(packageJson, /node tests\/build-020a\.test\.js/);

console.log("Build 020A split-day command integration passed.");
