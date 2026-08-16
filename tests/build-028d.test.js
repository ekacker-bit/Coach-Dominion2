const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("Weekly Review leads with prescribed versus completed and one limiting factor", () => {
  const app = read("assets/js/app.js");
  const engine = read("assets/js/weekly-replanning.js");
  assert.match(engine, /const VERSION = "028D\.1"/);
  assert.match(engine, /function limitingFactor/);
  assert.match(app, /aria-label="Prescribed versus completed"/);
  assert.match(app, />LIMITING FACTOR</);
  assert.match(app, /completed \/ prescribed/);
});

test("the recruit sees a before and after proposal with one approval", () => {
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");
  assert.match(app, />THIS WEEK</);
  assert.match(app, />IF APPROVED</);
  assert.match(app, />What changes and why</);
  assert.match(app, /data-atlas-week-action="approve"/);
  assert.match(app, /decision\.weeklyReplanning = DominionWeeklyReplanning\.decisionReceipt/);
  assert.match(styles, /\.weekly-replanning-before-after/);
  assert.match(styles, /\.weekly-replanning-limiter/);
});

test("the weekly decision persists into the adapted calendar receipt", () => {
  const adaptive = read("assets/js/atlas-adaptive-week.js");
  assert.match(adaptive, /weeklyReplanning: decision\.weeklyReplanning \? deepCopy\(decision\.weeklyReplanning\) : null/);
});

test("028D loads before the app and is available offline", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  assert.match(html, /weekly-replanning\.js\?v=028d/);
  assert.ok(html.indexOf("weekly-replanning.js?v=028d") < html.indexOf("app.js?v="));
  assert.match(worker, /weekly-replanning\.js\?v=028d/);
  assert.match(worker, /028a-028b-028c-028d/);
  assert.match(app, /register\("\/sw\.js\?v=028d"/);
});

test("the recruit-facing replanning surface contains no release language", () => {
  const app = read("assets/js/app.js");
  const surface = app.match(/function weeklyReplanningMarkup[^]*?\n}\n\nfunction renderAtlasWeeklyCommand/)?.[0] || "";
  assert.ok(surface);
  assert.doesNotMatch(surface, /028D|>BUILD<|>RELEASE</i);
});
