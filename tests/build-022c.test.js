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

test("022C loads the progress review before the application", () => {
  const engine = html.indexOf('/assets/js/progress-review.js?v=022c');
  const application = html.search(/\/assets\/js\/app\.js\?v=(?:022[d-g]|(?:023[abcdef]|024[ab]))/);
  assert.ok(engine > 0);
  assert.ok(application > engine);
  assert.match(html, /id="body-four-week-review" class="progress-review-surface"/);
  assert.match(html, /id="today-body-review" class="progress-review-surface compact"/);
});

test("022C persists one current review and an account-backed history", () => {
  assert.match(app, /function readProgressReview\(/);
  assert.match(app, /function saveProgressReview\(/);
  assert.match(app, /"progress-review-current"/);
  assert.match(app, /"progress-review"/);
  assert.match(app, /persistClosedLoopState\("ADAPTATION", "progress-review-current"/);
});

test("022C renders one recommendation and preserves the approval boundary", () => {
  assert.match(app, /ONE COACHING CALL/);
  assert.match(app, /data-progress-review-action="ACCEPT"/);
  assert.match(app, /requiresPlanApproval/);
  assert.match(app, /No plan changed; the separate plan decision is ready below/);
  assert.match(app, /resolveOutcomeReview\(outcome\.review, "AUTHORIZE_REVIEW"/);
});

test("022C has responsive visual hierarchy and a rotated app shell", () => {
  assert.match(css, /Build 022C/);
  assert.match(css, /\.progress-review-card/);
  assert.match(css, /\.progress-review-call/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(worker, /coach-dominion-(?:022[c-g]|(?:023[abcdef]|024[ab]))-v1/);
  assert.match(worker, /progress-review\.js\?v=022c/);
  assert.match(worker, /app\.js\?v=(?:022[c-g]|(?:023[abcdef]|024[ab]))/);
});

console.log("Build 022C integration contract verified.");
