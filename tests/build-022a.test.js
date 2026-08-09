const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets", "js", "atlas-intervention.js"), "utf8");
const adaptive = fs.readFileSync(path.join(root, "assets", "js", "adaptive-coaching.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

test("Build 022A promotes one Atlas coaching call onto Today", () => {
  for (const id of ["adaptive-coaching", "adaptive-coaching-heading", "adaptive-coaching-status", "adaptive-coaching-panel", "adaptive-coaching-feedback"])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /ATLAS COACH CHECK/);
  assert.match(html, /One priority\. One decision\./);
  assert.ok(html.indexOf('id="one-command"') < html.indexOf('id="adaptive-coaching"'));
  assert.ok(html.indexOf('id="adaptive-coaching"') < html.indexOf('id="today-body-checkpoint"'));
});

test("Build 022A keeps the recruit in control of every intervention", () => {
  assert.match(engine, /const VERSION = "022A\.1"/);
  assert.match(engine, /function answerIntervention/);
  assert.match(engine, /function attachResponse/);
  assert.match(app, /DominionAtlasIntervention\.buildIntervention/);
  assert.match(app, /data-atlas-intervention-action="answer"/);
  assert.match(app, /saveAdaptiveCoachingRecord\(answeredProposal\)/);
  assert.match(app, /The adjustment could not be approved without your answer/);
});

test("Build 022A preserves the existing bounded adaptive engine", () => {
  assert.match(adaptive, /automaticPlanMutation: false/);
  assert.match(adaptive, /prior\?\.atlasIntervention\?\.response/);
  assert.match(app, /DominionAdaptiveCoaching\.approveProposal/);
  assert.match(app, /DominionAdaptiveCoaching\.holdProposal/);
});

test("Build 022A is responsive, cached, and versioned", () => {
  assert.match(styles, /Build 022A: Atlas Intervention Engine/);
  assert.match(styles, /\.atlas-intervention-question/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(html, /atlas-intervention\.js\?v=022a/);
  assert.match(html, /adaptive-coaching\.js\?v=022a/);
  assert.match(html, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklm]))/);
  assert.match(html, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklm]))/);
  assert.match(worker, /coach-dominion-(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklm]))-v1/);
  assert.match(worker, /atlas-intervention\.js\?v=022a/);
});

console.log("Build 022A integration tests passed.");
