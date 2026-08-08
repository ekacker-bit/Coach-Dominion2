const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const autosave = fs.readFileSync(path.join(root, "assets/js/contract-autosave.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /assets\/js\/contract-autosave\.js/);
assert.ok(
  html.indexOf("/assets/js/contract-autosave.js") < html.indexOf("/assets/js/app.js"),
  "the recovery helper must load before the application"
);
assert.match(autosave, /const VERSION = "021G\.1"/);
assert.match(autosave, /function enqueue\(previous, task, onError\)/);
assert.match(autosave, /function withTimeout\(value, timeoutMs/);
assert.match(app, /RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS = 8000/);
assert.match(app, /DominionContractAutosave\.withTimeout\(accountWrite, RECRUIT_CONTRACT_ACCOUNT_SYNC_TIMEOUT_MS\)/);
assert.match(app, /function queueRecruitContractAccountSync/);
assert.match(app, /DominionContractAutosave\.enqueue\(recruitContractAutosavePromise, task, recruitContractAutosaveFailure\)/);
assert.match(app, /function saveRecruitContractDraftForNavigation/);
assert.doesNotMatch(app, /await recruitContractAutosavePromise/);
assert.match(app, /Account sync is pending; Continue is available/);
assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-g]|(?:023[abcdef]|024[abcdefghij]))-v1/);
assert.match(worker, /contract-autosave\.js/);
assert.match(packageJson, /node tests\/contract-autosave\.test\.js/);
assert.match(packageJson, /node tests\/build-021g\.test\.js/);

console.log("Build 021G Contract amendment autosave recovery integration passed.");
