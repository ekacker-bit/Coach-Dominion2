const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const contract = fs.readFileSync(path.join(root, "assets/js/recruit-contract.js"), "utf8");
const experience = fs.readFileSync(path.join(root, "assets/js/contract-experience.js"), "utf8");
const orchestrator = fs.readFileSync(path.join(root, "assets/js/weekly-orchestrator.js"), "utf8");
const running = fs.readFileSync(path.join(root, "assets/js/running-command.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /name="twoADays" type="checkbox" value="true"/);
assert.match(html, /more than 120 combined minutes, up to 240 minutes per day/i);
assert.match(html, /Long runs remain uncapped by time/i);
assert.match(app, /field\.type === "checkbox"/);
assert.match(app, /current\.twoADays \? "Two-a-Days"/);
assert.match(app, /day\.longRunUncapped/);
assert.match(app, /day\.twoADay/);
assert.match(contract, /TWO_A_DAY_TARGET_MINUTES = 121/);
assert.match(contract, /TWO_A_DAY_MAX_MINUTES = 240/);
assert.match(contract, /twoADays: booleanValue/);
assert.match(experience, /two sessions and up to 240 combined minutes/i);
assert.match(orchestrator, /function dailyDurationPolicy/);
assert.match(orchestrator, /TWO_A_DAY_TARGET_UNMET/);
assert.match(orchestrator, /TWO_A_DAY_CAP_EXCEEDED/);
assert.match(orchestrator, /LONG_RUN_UNCAPPED/);
assert.match(running, /durationCapMinutes: run\.type === "LONG" \? null/);
assert.match(running, /longRunDurationPolicy: "UNCAPPED_BY_TIME"/);
assert.match(styles, /\.recruit-contract-two-a-days/);
assert.match(styles, /\.weekly-orchestrator-day\.two_a_day/);
assert.match(worker, /coach-dominion-019g-v2/);
assert.match(packageJson, /node tests\/build-019g\.test\.js/);

console.log("Build 019G Two-a-Day capacity integration passed.");
