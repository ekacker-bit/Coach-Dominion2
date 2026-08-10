const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = read("assets/js/strength-training.js");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const html = read("app.html");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025J\.1"/);
assert.match(engine, /selectedExerciseCodes/);
assert.match(engine, /appliedDecisionCodes/);
assert.match(engine, /heldDecisionCodes/);
assert.match(engine, /function rollbackAdjustment/);
assert.match(engine, /This recommendation belongs to an older plan revision/);
assert.match(engine, /adjustmentActivation: plan\.lastAdjustmentActivation/);

assert.match(app, /function approveStrengthAdjustment/);
assert.match(app, /function rollbackStrengthAdjustment/);
assert.match(app, /data-adjustment-selection=/);
assert.match(app, /data-assignment-action="activate-adjustment"/);
assert.match(app, /data-programming-action="rollback-adjustment"/);
assert.match(app, /Earned targets active/);
assert.match(app, /effectiveMode: "NEXT_MATCHING_SESSION"/);
assert.match(app, /type: "PLAN_REVISION_ACTIVATION"/);
assert.match(app, /type: "PLAN_REVISION_ROLLBACK"/);
assert.match(app, /`receipt:\$\{approved\.adjustment\.id\}`/);
assert.match(app, /service-worker-reload:025j/);

assert.match(css, /\.strength-adjustment-choice/);
assert.match(css, /\.strength-activation-receipt/);
assert.match(css, /\.strength-next-review-actions/);
assert.match(html, /styles\.css\?v=025c3-025i-025j/);
assert.match(html, /strength-training\.js\?v=025g-025i-025j/);
assert.match(html, /app\.js\?v=025c7-025h-025i-025j/);
assert.match(worker, /coach-dominion-025c-v1-025h-025i-025j/);
assert.match(worker, /strength-training\.js\?v=025g-025i-025j/);
assert.match(worker, /app\.js\?v=025c7-025h-025i-025j/);
assert.match(changelog, /Build 025J Earned Progression Activation/);

console.log("Build 025J earned progression activation integration tests passed.");
