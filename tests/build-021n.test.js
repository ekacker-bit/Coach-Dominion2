
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/js/one-command.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");

test("Build 021N presents one mission, one reason, three facts, and one dominant action", () => {
  for (const id of [
    "one-command-heading",
    "today-mission-reason",
    "today-mission-readiness",
    "today-mission-schedule",
    "today-mission-evidence",
    "today-mission-after",
    "one-command-primary"
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(engine, /function buildTodayMission/);
  assert.match(engine, /function reasonFor/);
  assert.match(app, /DominionOneCommand\.buildTodayMission/);
});

test("Build 021N hides the operating machinery behind Why and Details", () => {
  assert.match(html, /id="one-command-context"[\s\S]*Why this action\?/);
  assert.match(html, /id="today-mission-details"/);
  assert.ok(html.indexOf("one-command-primary") < html.indexOf("one-command-stages"));
  assert.match(styles, /\.today-mission-why/);
  assert.match(styles, /\.today-mission-details/);
});

test("Build 021N keeps readiness, split-day schedule, and evidence grounded in live state", () => {
  assert.match(app, /function todayMissionReadinessLabel/);
  assert.match(app, /function todayMissionScheduleLabel/);
  assert.match(app, /currentSplitDayCommand\(day\)/);
  assert.match(app, /function todayMissionEvidenceLabel/);
});

test("Build 021N makes the daily seal part of the same command experience", () => {
  assert.match(html, /id="one-command"[\s\S]*id="daily-ritual"/);
  assert.equal((html.match(/id="daily-ritual"/g) || []).length, 1);
  assert.match(app, /ritual\.classList\.toggle\("is-close-ready"/);
  assert.match(app, /sequence\.open = true/);
  assert.match(styles, /\.today-mission-closeout/);
});

test("Build 021N ships a responsive branded surface and fresh application cache", () => {
  assert.match(engine, /const VERSION = "021N\.1"/);
  assert.match(styles, /Build 021N: Today 2\.0/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(html, /styles\.css\?v=022b/);
  assert.match(html, /one-command\.js\?v=021n/);
  assert.match(html, /daily-ritual\.js\?v=021n/);
  assert.match(html, /app\.js\?v=022b/);
});

