
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");
const meals = read("assets/js/meal-coaching.js");

test("023B makes the committed calendar Fuel's planning authority", () => {
  assert.match(html, /fuel-calendar\.js\?v=023b/);
  assert.match(app, /function buildCurrentFuelCalendarContext/);
  assert.match(app, /readCommittedUnifiedDay\(date\)/);
  assert.match(app, /calendarContext\?\.trainingDay/);
  assert.match(app, /calendarContext\?\.mealWindow/);
});

test("023B surfaces calendar context without crowding the command", () => {
  assert.match(app, /class="fuel-calendar-brief/);
  assert.match(app, /fuel-calendar-sessions/);
  assert.match(css, /Build 023B: calendar-aware fueling/);
  assert.match(css, /\.fuel-calendar-brief/);
});

test("023B supports split-day and uncapped long-run meal maps", () => {
  assert.match(meals, /SPLIT_DAY/);
  assert.match(meals, /Between-session recovery/);
  assert.match(meals, /LONG_RUN/);
  assert.match(meals, /During-run plan/);
});

test("023B sends missing calendar context to Calendar", () => {
  assert.match(app, /nutritionNextAction === "calendar"/);
  assert.match(app, /setActiveSection\("calendar"\)/);
});

test("023B rotates the mutable shell and caches both Fuel engines", () => {
  assert.match(html, /styles\.css\?v=(?:023[bcdef]|024[abcdefghi])/);
  assert.match(html, /fuel-command\.js\?v=(?:023[bcdef]|024[abcdefghi])/);
  assert.match(html, /app\.js\?v=(?:023[bcdef]|024[abcdefghi])/);
  assert.match(worker, /coach-dominion-(?:023[bcdef]|024[abcdefghi])-v1/);
  assert.match(worker, /fuel-calendar\.js\?v=023b/);
  assert.match(worker, /fuel-command\.js\?v=(?:023[bcdef]|024[abcdefghi])/);
});

console.log("Build 023B Calendar-Aware Fueling integration verified.");