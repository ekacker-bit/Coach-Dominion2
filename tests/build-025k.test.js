const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = read("assets/js/strength-calendar-handoff.js");
const weekly = read("assets/js/weekly-orchestrator.js");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const html = read("app.html");
const worker = read("sw.js");
const changelog = read("CHANGELOG.md");

assert.match(engine, /const VERSION = "025K\.1"/);
assert.match(engine, /function classifyPlanChange/);
assert.match(engine, /function rebindCommittedWeek/);
assert.match(engine, /function reconcileCommittedWeeks/);
assert.match(engine, /function rebindActiveBlock/);
assert.match(engine, /function rebindApprovedSchedule/);
assert.match(engine, /STRUCTURAL_REVIEW/);
assert.match(engine, /datesUnchanged: true/);
assert.match(engine, /protectedDatesForExecution/);

assert.match(weekly, /planRevision: week\.sourceRefs\?\.strengthPlanRevision \|\| first\.planRevision/);
assert.match(app, /function reconcileStrengthPlanRevision/);
assert.match(app, /DominionStrengthCalendarHandoff\.reconcileCommittedWeeks/);
assert.match(app, /calendar-handoff:\$\{adjustment\.id \|\| nextPlan\.id\}/);
assert.match(app, /strengthCalendarHandoffMarkup\(week\.calendarReconciliation, "today"\)/);
assert.match(app, /strengthCalendarHandoffMarkup\(calendarHandoff, "calendar"\)/);
assert.match(app, /strengthCalendarHandoffMarkup\(adjustment\.calendarHandoff, "train"\)/);
assert.match(app, /strengthCalendarHandoffMarkup\(programHandoff, "program"\)/);

assert.match(css, /\.strength-calendar-handoff/);
assert.match(html, /strength-calendar-handoff\.js\?v=025k/);
assert.match(html, /styles\.css\?v=025c3-025i-025j-025k/);
assert.match(html, /app\.js\?v=025c7-025h-025i-025j-025k/);
assert.match(worker, /coach-dominion-025c-v1-025h-025i-025j-025k/);
assert.match(worker, /strength-calendar-handoff\.js\?v=025k/);
assert.match(changelog, /Build 025K Adaptive Calendar Handoff/);

console.log("Build 025K adaptive calendar handoff integration tests passed.");
