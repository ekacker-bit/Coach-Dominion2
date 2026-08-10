const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/observation-verdict.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

test("022E loads the verdict engine between plan command and application", () => {
  const command = html.indexOf('/assets/js/plan-command.js?v=022d');
  const verdict = html.indexOf('/assets/js/observation-verdict.js?v=022e');
  const application = html.search(/\/assets\/js\/app\.js\?v=(?:022[e-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))/);
  assert.ok(command > 0 && verdict > command && application > verdict);
  assert.match(html, /id="today-observation-verdict"/);
  assert.match(html, /id="body-observation-verdict"/);
});

test("022E compares evidence before and after the approved change", () => {
  assert.match(engine, /const VERSION = "022E\.1"/);
  assert.match(engine, /baselineStart/);
  assert.match(engine, /observationStart/);
  assert.match(engine, /nutritionAdherence/);
  assert.match(engine, /strengthCompletion/);
  assert.match(engine, /runningCompletion/);
  assert.match(engine, /recommendation: "EXTEND"/);
});

test("022E persists current verdicts and decision receipts with the account", () => {
  assert.match(app, /function readObservationVerdict\(/);
  assert.match(app, /function saveObservationVerdict\(/);
  assert.match(app, /"observation-verdict-current"/);
  assert.match(app, /"observation-verdict"/);
  assert.match(app, /persistClosedLoopState\("ADAPTATION", "observation-verdict-current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "observation-verdict"/);
});

test("022E makes retain, rollback, and seven-day extension explicit", () => {
  assert.match(app, /data-observation-verdict-action="RETAIN"/);
  assert.match(app, /data-observation-verdict-action="ROLLBACK"/);
  assert.match(app, /data-observation-verdict-action="EXTEND"/);
  assert.match(app, /observationEnd: receipt\.nextObservationEnd/);
  assert.match(app, /function handleObservationVerdictAction\(/);
  assert.doesNotMatch(app, /command\.status === "REVIEW_DUE"[\s\S]{0,240}data-plan-command-action="RETAIN"/);
});

test("022E is responsive, versioned, and available offline", () => {
  assert.match(css, /Build 022E/);
  assert.match(css, /\.observation-verdict-metrics/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(html, /styles\.css\?v=(?:022[e-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))/);
  assert.match(worker, /coach-dominion-(?:022[e-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))-v1/);
  assert.match(worker, /observation-verdict\.js\?v=022e/);
  assert.match(worker, /app\.js\?v=(?:022[e-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))/);
});

console.log("Build 022E Atlas Observation Verdict integration verified.");
