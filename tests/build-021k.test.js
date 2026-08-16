const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const trends = fs.readFileSync(path.join(root, "assets/js/trends-intelligence.js"), "utf8");

test("Build 021K adds an operational Body outcome surface", () => {
  assert.match(html, /<div class="kicker">TRENDS<\/div>/);
  assert.match(html, /id="body-checkin-form"/);
  assert.match(html, /id="body-measurement-chart"/);
  assert.match(html, /id="body-outcome-decision"/);
  assert.match(html, /id="body-checkin-history"/);
  assert.match(html, /body-composition\.js\?v=022b/);
});

test("Build 021K persists and re-renders body checkpoints", () => {
  assert.match(app, /async function saveBodyCheckIn/);
  assert.match(app, /from\("performance_entries"\)\.upsert/);
  assert.match(app, /async function deleteBodyCheckIn/);
  assert.match(app, /function renderBodyOutcome/);
  assert.match(app, /function renderWeeklyBodyOutcome/);
  assert.match(app, /function buildCurrentBodyOutcomeModel/);
});

test("Build 021K connects body outcomes to Trends and Inspection without scoring them", () => {
  assert.match(trends, /bodyComposition\?\.decision\?\.code === "REVIEW_ADJUSTMENT"/);
  assert.match(app, /renderWeeklyBodyOutcome\(aggregate\)/);
  assert.match(html, /does not change the discipline score/);
});

test("Build 021K retains the Dominion responsive visual system", () => {
  assert.match(styles, /Build 021K: body-composition outcome loop/);
  assert.match(styles, /\.body-outcome-command/);
  assert.match(styles, /\.body-checkin-grid/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(html, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))/);
  assert.match(html, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))/);
});
