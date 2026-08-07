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
const engine = read("assets/js/intermittent-fasting.js");

test("023C adds an optional approval-gated fasting protocol to Fuel Plan", () => {
  assert.match(html, /id="intermittent-fasting-form"/);
  assert.match(html, /12:12/);
  assert.match(html, /14:10/);
  assert.match(html, /16:8/);
  assert.match(html, /Required safety check/);
  assert.match(app, /reviewFastingProtocol/);
  assert.match(app, /approveCurrentFastingProtocol/);
});

test("023C persists the approved protocol across devices", () => {
  assert.match(app, /FASTING_PROTOCOL/);
  assert.match(app, /fastingProtocolStorageKey/);
  assert.match(app, /persistNutritionState\("FASTING_PROTOCOL"/);
  assert.match(app, /applyNutritionStateRow/);
});

test("023C injects fasting into the live Fuel command and meal map", () => {
  assert.match(app, /buildCurrentFastingContext/);
  assert.match(app, /fastingContext\?\.mealWindow/);
  assert.match(app, /class="fuel-fasting-brief/);
  assert.match(app, /fuel\.evidence\.fasting(?:Status|Execution)/);
  assert.match(css, /Build 023C: Intermittent Fasting Protocol/);
});

test("023C ships clear safety and target-preservation language", () => {
  assert.match(html, /Training fuel, recovery, symptoms, and medication always take priority/);
  assert.match(app, /Approved daily targets were not changed/);
  assert.match(engine, /No missed-fast penalty applies/);
});

test("023C rotates and caches the mutable shell", () => {
  assert.match(html, /styles\.css\?v=(?:023[cdef]|024[ab])/);
  assert.match(html, /intermittent-fasting\.js\?v=023[cd]/);
  assert.match(html, /fuel-command\.js\?v=(?:023[cdef]|024[ab])/);
  assert.match(html, /app\.js\?v=(?:023[cdef]|024[ab])/);
  assert.match(worker, /coach-dominion-(?:023[cdef]|024[ab])-v1/);
  assert.match(worker, /intermittent-fasting\.js\?v=023[cd]/);
});

console.log("Build 023C Intermittent Fasting integration verified.");
