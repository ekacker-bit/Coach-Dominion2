const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const appHtml = fs.readFileSync(path.join(root, "app.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const moduleSource = fs.readFileSync(path.join(root, "assets/js/trends-intelligence.js"), "utf8");

assert.match(appHtml, /id="trends" class="card trends-analytics trend-command/);
assert.match(appHtml, /data-trend-range="28"/);
assert.match(appHtml, /data-trend-view="training"/);
assert.match(appHtml, /data-trend-view="recovery"/);
assert.match(appHtml, /data-trend-view="body"/);
assert.match(appHtml, /id="trend-kpi-grid"/);
assert.match(appHtml, /id="trend-evidence-ring"/);
assert.match(appHtml, /trends-intelligence\.js\?v=021m/);
assert.match(appHtml, /styles\.css\?v=(?:022[b-g]|023[abcd])/);
assert.match(appHtml, /app\.js\?v=(?:022[b-g]|023[abcd])/);
assert.doesNotMatch(appHtml, /Atlas Trend Report/);

assert.match(appJs, /DominionTrends\.buildProgramTrendModel/);
assert.match(appJs, /trendNutritionHistory\(84\)/);
assert.match(appJs, /cutoff\.getUTCDate\(\) - 84/);
assert.match(appJs, /button\[data-trend-range\]/);
assert.match(appJs, /function renderTrendPrimaryChart/);
assert.ok(appJs.indexOf("await loadConnectedDominion();") < appJs.indexOf("await loadTrendsAnalytics();", appJs.indexOf("async function init")), "Trends loads after connected evidence");

assert.match(styles, /Build 021J: operational, word-light program trends/);
assert.match(styles, /\.trend-kpi-grid/);
assert.match(styles, /\.trend-body-focus/);
assert.match(moduleSource, /const VERSION = "021M\.1"/);
assert.doesNotMatch(moduleSource, /<svg/i);

console.log("Build 021J integration tests passed");
