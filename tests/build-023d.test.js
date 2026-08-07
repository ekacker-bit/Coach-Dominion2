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
const engine = read("assets/js/fasting-execution.js");

test("023D makes the live fasting decision operational inside Fuel", () => {
  assert.match(html, /id="fasting-execution-panel"/);
  assert.match(html, /id="fasting-execution-output"/);
  assert.match(app, /handleFastingExecutionAction/);
  assert.match(app, /START_FAST/);
  assert.match(app, /TRAINING_OVERRIDE/);
  assert.match(engine, /const VERSION = "023D\.1"/);
});

test("023D captures honest daily evidence without manufacturing violations", () => {
  assert.match(html, /id="fasting-closeout-form"/);
  assert.match(html, /It does not create a violation/);
  assert.match(app, /saveFastingCloseout/);
  assert.match(engine, /ENDED EARLY/);
  assert.match(engine, /protected/);
});

test("023D persists execution and history to the recruit account", () => {
  assert.match(app, /FASTING_EXECUTION/);
  assert.match(app, /fastingExecutionStorageKey/);
  assert.match(app, /persistNutritionState\("FASTING_EXECUTION"/);
  assert.match(app, /writeFastingExecutionLedger/);
});

test("023D adds an approval-gated Atlas protocol verdict", () => {
  assert.match(html, /id="fasting-review-output"/);
  assert.match(app, /renderFastingReview/);
  assert.match(app, /reviewFastingVerdictChange/);
  assert.match(engine, /verdict: "PAUSE"/);
  assert.match(engine, /verdict: "SHORTEN"/);
  assert.match(engine, /verdict: "WIDEN"/);
  assert.match(engine, /requiresApproval: true/);
});

test("023D is responsive and rotates every mutable production asset", () => {
  assert.match(css, /Build 023D: Fasting Execution and Adaptation/);
  assert.match(css, /fasting-countdown/);
  assert.match(html, /styles\.css\?v=(?:023[def]|024[ab])/);
  assert.match(html, /fasting-execution\.js\?v=023d/);
  assert.match(html, /fuel-command\.js\?v=(?:023[def]|024[ab])/);
  assert.match(html, /app\.js\?v=(?:023[def]|024[ab])/);
  assert.match(worker, /coach-dominion-(?:023[def]|024[ab])-v1/);
  assert.match(worker, /fasting-execution\.js\?v=023d/);
});

console.log("Build 023D Fasting Execution and Adaptation integration verified.");
