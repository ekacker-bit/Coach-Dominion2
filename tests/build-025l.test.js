const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = read("assets/js/strength-progression-trial.js");
const handoff = read("assets/js/strength-calendar-handoff.js");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const html = read("app.html");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025L\.1"/);
assert.match(engine, /function createTrial/);
assert.match(engine, /function trialMatchesExecution/);
assert.match(engine, /function evaluateTrial/);
assert.match(engine, /function retainTrial/);
assert.match(engine, /function repeatTrial/);
assert.match(engine, /function rollbackTrial/);
assert.match(engine, /ROLLBACK_RECOMMENDED/);
assert.match(engine, /REPEAT_SCHEDULED/);

assert.match(app, /function readStrengthProgressionTrial/);
assert.match(app, /function strengthProgressionTrialMarkup/);
assert.match(app, /function resolveStrengthProgressionTrial/);
assert.match(app, /DominionStrengthProgressionTrial\.createTrial/);
assert.match(app, /DominionStrengthProgressionTrial\.evaluateTrial/);
assert.match(app, /Resolve the active progression trial before approving another strength revision/);
assert.match(app, /strengthProgressionTrialMarkup\(readStrengthProgressionTrial\(\), "today"\)/);
assert.match(app, /strengthProgressionTrialMarkup\(progressionTrial, "train"\)/);
assert.match(app, /strengthProgressionTrialMarkup\(readStrengthProgressionTrial\(\), "program"\)/);
assert.match(app, /strengthProgressionTrialMarkup\(readStrengthProgressionTrial\(\), "calendar"\)/);
assert.match(app, /clearStrengthTrainingState\("TRIAL", "current"\)/);

assert.match(handoff, /lastProgressionTrialId/);
assert.match(css, /\.strength-progression-trial/);
assert.match(css, /\.strength-trial-actions/);
assert.match(html, /strength-progression-trial\.js\?v=025l/);
assert.match(html, /styles\.css\?v=025c3-025i-025j-025k-025l/);
assert.match(html, /app\.js\?v=025c7-025h-025i-025j-025k-025l/);
assert.match(worker, /coach-dominion-025c-v1-025h-025i-025j-025k-025l/);
assert.match(worker, /strength-progression-trial\.js\?v=025l/);
assert.match(changelog, /Build 025L Progression Trial/);

console.log("Build 025L progression trial integration tests passed.");
