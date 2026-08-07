const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const body = fs.readFileSync(path.join(root, "assets/js/body-composition.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");

test("Build 021L makes the weekly body checkpoint a first-class Today action", () => {
  assert.match(html, /id="today-body-checkpoint"/);
  assert.match(html, /id="today-body-checkin-form"/);
  assert.match(html, /id="today-body-checkpoint-last"/);
  assert.match(html, /id="today-body-checkpoint-next"/);
  assert.match(app, /function renderTodayBodyCheckpoint/);
  assert.match(app, /function saveTodayBodyCheckIn/);
});

test("Build 021L creates an approval-gated four-week outcome review", () => {
  assert.match(body, /function buildOutcomeReview/);
  assert.match(body, /function resolveOutcomeReview/);
  assert.match(body, /plansChanged: false/);
  assert.match(html, /id="body-four-week-review"/);
  assert.match(app, /data-body-review-action="AUTHORIZE_REVIEW"/);
  assert.match(app, /No plan or target changed/);
});

test("Build 021L persists the review decision across accounts and devices", () => {
  assert.match(app, /"ADAPTATION", "body-outcome-current"/);
  assert.match(app, /"HISTORY", "body-outcome"/);
  assert.match(app, /function saveBodyOutcomeReview/);
  assert.match(app, /persistClosedLoopState\("ADAPTATION", "body-outcome-current"/);
});

test("Build 021L ships the responsive Dominion checkpoint experience", () => {
  assert.match(styles, /Build 021L: weekly outcome checkpoint/);
  assert.match(styles, /\.today-body-checkpoint/);
  assert.match(styles, /\.body-review-card/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(html, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdef]))/);
  assert.match(html, /body-composition\.js\?v=022b/);
  assert.match(html, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdef]))/);
});
