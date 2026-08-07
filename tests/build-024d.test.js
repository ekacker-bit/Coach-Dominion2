const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/weekly-orchestrator.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const packageJson = read("package.json");

assert.match(html, /BUILD 024D \/\/ ATLAS PROGRAM CALENDAR/);
assert.match(html, /weekly-orchestrator\.js\?v=024d/);
assert.match(html, /styles\.css\?v=024[de]/);
assert.match(html, /app\.js\?v=024[de]/);
assert.match(engine, /const VERSION = "024D\.1"/);
assert.match(engine, /function atlasProgramActivities/);
assert.match(engine, /function placeAtlasProgramActivities/);
assert.match(engine, /generatedBy: "ATLAS_PROGRAM"/);
assert.match(engine, /programId: options\.programId/);
assert.match(app, /ATLAS PROGRAM CALENDAR/);
assert.match(app, /activate-program/);
assert.match(app, /savedDraft\.programId === program\?\.id/);
assert.match(app, /buildUnifiedWeekDraft\(savedDraft\.weekStart \|\| targetWeekStart\)/);
assert.match(app, /Atlas activated the plans and this exact calendar together/);
assert.match(styles, /Build 024D: Atlas Program Calendar/);
assert.match(styles, /\.atlas-calendar-source/);
assert.match(worker, /coach-dominion-024[de]-v1/);
assert.match(worker, /weekly-orchestrator\.js\?v=024d/);
assert.match(packageJson, /test:024d/);
assert.match(packageJson, /atlas-program-calendar\.test\.js/);

console.log("Build 024D integration tests passed.");
