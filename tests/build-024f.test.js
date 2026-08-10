const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const repair = read("assets/js/atlas-program-repair.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const packageJson = read("package.json");

assert.match(html, /styles\.css\?v=(?:024[fn]|025[abc])/);
assert.match(html, /atlas-program-repair\.js\?v=024f/);
assert.match(html, /app\.js\?v=(?:024[hijklmn]|025[abc])/);
assert.match(worker, /coach-dominion-(?:024[hijklmn]|025[abc])-v1/);
assert.match(repair, /const VERSION = "024F\.1"/);
assert.match(repair, /function weekLinkedToContract/);
assert.match(repair, /function calendarDisposition/);
assert.match(repair, /function normalizeModuleReadiness/);

assert.match(app, /function legacyAtlasProgramStorageKey/);
assert.match(app, /atlasProgramStorageKey\("draft"\)/);
assert.match(app, /saveAtlasProgramDraft\(\{ \.\.\.program, status: program\.status, stagedAt: now \}\)/);
assert.doesNotMatch(app, /saveAtlasProgramReceipt\(\{ \.\.\.program, status: program\.status, stagedAt: now \}\)/);
assert.match(app, /if \(stored\?\.status === "ACTIVE"\) return stored/);
assert.match(app, /if \(legacy\?\.status === "ACTIVE"\)/);

assert.match(app, /function unifiedWeekMatchesContract/);
assert.match(app, /function unifiedWeekDisposition/);
assert.match(app, /const existingMatchesContract = unifiedWeekMatchesContract\(existing, contract\)/);
assert.match(app, /legacyDraftDisposition !== "CURRENT_CONTRACT"/);
assert.match(app, /unifiedWeekMatchesContract\(item, contract\)/);

assert.match(app, /function recruitContractModuleReadiness/);
assert.match(app, /\["strength", "running", "core", "nutrition"\]\.map/);
assert.match(app, /DominionAtlasProgramRepair\.normalizeModuleReadiness/);
assert.match(app, /function runStartupTask/);
assert.match(app, /dataset\.mobileHydration = "ready"/);
assert.match(app, /dataset\.startupRecovery = startupIssues\.length \? "recovered" : "clean"/);
assert.match(app, /if \(!refreshed\) return null/);

assert.match(app, /function programModuleRoute/);
assert.match(app, />Open plan<\/button>/);
assert.match(app, /setNutritionActiveView\("plan"\)/);
assert.match(styles, /Build 024F: contract-linked program integrity/);
assert.match(packageJson, /test:024f/);

console.log("Build 024F Contract-linked program integrity tests passed.");
