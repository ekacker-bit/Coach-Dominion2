const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const mark = fs.readFileSync(path.join(root, "assets/icons/dominion-mark.svg"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

[
  "activation-repair",
  "activation-repair-heading",
  "activation-repair-detail",
  "activation-repair-state",
  "activation-repair-stages",
  "activation-repair-progress",
  "activation-repair-modules",
  "activation-repair-primary",
  "activation-repair-contract",
  "activation-repair-feedback"
].forEach((id) => assert.match(html, new RegExp(`id="${id}"`), `missing 019F surface: ${id}`));

assert.match(html, /src="\/assets\/js\/activation-repair\.js"/);
assert.ok(html.indexOf("activation-repair.js") < html.indexOf("one-command.js"));
assert.match(app, /function buildCurrentActivationRepair/);
assert.match(app, /function renderActivationRepair/);
assert.match(app, /function runActivationRepairAction/);
assert.match(app, /function scheduleOperatingTruthReconciliation/);
assert.match(app, /fallbackOneCommandModel/);
assert.match(app, /Your week is operational/);
assert.match(app, /data-activation-repair-action/);
assert.match(app, /scheduleOperatingTruthReconciliation\(\)/);
assert.match(styles, /\.activation-repair-stages/);
assert.match(styles, /\.activation-repair-modules/);
[
  "today-recovery-card",
  "today-recovery-heading",
  "today-recovery-status",
  "today-recovery-output",
  "today-recovery-feedback"
].forEach((id) => assert.match(html, new RegExp(`id="${id}"`), `missing recovery surface: ${id}`));
assert.doesNotMatch(html, /Placeholder for recovery actions/);
assert.match(app, /function buildTodayRecoveryOrder\(\)/);
assert.match(app, /function renderTodayRecoveryExecution\(\)/);
assert.match(app, /data-today-recovery-action/);
assert.match(app, /recoveryComplete: true/);
assert.match(app, /recoveryComplete: false/);
assert.match(styles, /\.today-recovery-order/);
assert.match(styles, /\.today-recovery-checklist/);
assert.match(mark, /Dominion shield/);
assert.match(mark, /linearGradient id="edge"/);
assert.match(mark, /fill="#38d48d"/);
assert.match(worker, /coach-dominion-019[a-z]-v\d+/i);
assert.match(worker, /\/assets\/js\/activation-repair\.js/);
assert.match(packageJson, /node tests\/activation-repair\.test\.js/);
assert.match(packageJson, /node tests\/build-019f\.test\.js/);

console.log("Build 019F Activation Repair integration passed.");
