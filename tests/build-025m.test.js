const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const trends = fs.readFileSync(path.join(root, "assets/js/trends-intelligence.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("Build 025M turns Trends into a five-domain outcome board", () => {
  assert.match(html, /<div class="kicker">TRENDS<\/div>/);
  assert.match(html, /data-trend-view="fuel"/);
  assert.match(html, /data-trend-metric="strength"/);
  assert.match(html, /data-trend-metric="fuel"/);
  assert.match(html, /id="trend-focus-summary"/);
  assert.match(app, /model\.scorecards\.map/);
  assert.match(trends, /const VERSION = "025M\.1"/);
});

test("Build 025M exposes evidence-backed Training, Recovery, Fuel, and Body comparisons", () => {
  assert.match(trends, /function summarizeStrengthWorkload/);
  assert.match(trends, /runPaceSeconds/);
  assert.match(trends, /coreMinutes/);
  assert.match(trends, /rhrDelta/);
  assert.match(trends, /hrvPercentDelta/);
  assert.match(trends, /targetsReady/);
  assert.match(trends, /weeklyRate/);
  assert.match(app, /id="trend-training-command"|trend-training-command/);
  assert.match(app, /trendPace\(training\.runPaceSeconds\)/);
  assert.match(app, /trend-fuel-chart/);
});

test("Build 025M keeps incomplete evidence explicit and coaching bounded", () => {
  assert.match(trends, /comparison building/i);
  assert.match(trends, /Approved targets required/);
  assert.match(trends, /Pain or a stopped Strength session/);
  assert.match(trends, /evidence\.score >= 40/);
  assert.doesNotMatch(trends, /predict|guarantee|caused by/i);
});

test("Build 025M ships responsive styles and a fresh offline shell", () => {
  assert.match(styles, /Build 025M: outcome intelligence/);
  assert.match(styles, /\.trend-focus-summary/);
  assert.match(styles, /\.trend-pane-command/);
  assert.match(styles, /@media \(max-width: 460px\)/);
  assert.match(html, /trends-intelligence\.js\?v=025m/);
  assert.match(html, /styles\.css\?v=[^"\s]*025m/);
  assert.match(html, /app\.js\?v=[^"\s]*025m/);
  assert.match(worker, /coach-dominion-[^"\s]*025m/);
  assert.match(worker, /trends-intelligence\.js\?v=025m/);
  assert.match(app, /service-worker-reload:025n/);
  assert.match(app, /sw\.js\?v=025n/);
  assert.ok(pkg.scripts["test:025m"]);
});
