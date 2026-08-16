const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets", "js", "running-command.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");

assert.match(html, /RUNNING COMMITMENT/);
assert.match(html, />Running Plan</);
assert.match(css, /Build 018C: contract-driven running blocks/);

assert.match(engine, /function buildRunningBlock/);
assert.match(engine, /function approveRunningBlock/);
assert.match(engine, /function weeklyPlanForDate/);
assert.match(engine, /No benchmark is required to begin/);
assert.match(engine, /maximumWeeklyProgressionPercent: 5/);
assert.match(engine, /activePlanProtected: true/);

assert.match(app, /function readRunningBlockDraft/);
assert.match(app, /function readApprovedRunningBlock/);
assert.match(app, /DominionRunning\.weeklyPlanForDate\(block, todayISODate\(\)\)/);
assert.match(app, /persistRunningState\("PLAN", "draft", draft\)/);
assert.match(app, /persistRunningState\("PLAN", "active", approved\)/);
assert.match(app, /data-running-action="approve-block"/);
assert.match(app, /async function stageRecruitContractPlans/);
assert.match(app, /active Running block/);
assert.match(app, /Today now follows the active block/);

console.log("Build 018C integration tests passed.");
