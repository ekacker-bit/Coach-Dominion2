const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets", "js", "adaptive-coaching.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "adaptive-coaching",
  "adaptive-coaching-heading",
  "adaptive-coaching-status",
  "adaptive-coaching-panel",
  "adaptive-coaching-feedback"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 018I surface: ${id}`);

assert.match(html, /BUILD 018I \/\/ ADAPTIVE COACHING/);
assert.match(html, /src="\/assets\/js\/adaptive-coaching\.js"/);
assert.ok(html.indexOf("adaptive-coaching.js") < html.indexOf("app.js"), "adaptive engine must load before app integration");

for (const marker of [
  "function buildCurrentAdaptiveCoaching",
  "function buildAdaptiveCoachingEvidence",
  "function readActiveAdaptiveDirective",
  "async function saveAdaptiveCoachingRecord",
  "function renderAdaptiveCoaching",
  "button[data-adaptive-action]",
  "DominionAdaptiveCoaching.adaptStrengthAssignment",
  "DominionAdaptiveCoaching.adaptRunningPrescription",
  "DominionAdaptiveCoaching.adaptCorePrescription"
]) assert.ok(app.includes(marker), `missing app integration: ${marker}`);

for (const marker of [
  'const VERSION = "018I.1"',
  "function buildProposal",
  "function approveProposal",
  "function holdProposal",
  "function directiveForDate",
  "automaticPlanMutation: false",
  "painBlocksProgression: true"
]) assert.ok(engine.includes(marker), `missing engine guardrail: ${marker}`);

assert.match(styles, /Build 018I: evidence-led adaptive coaching/);
assert.match(styles, /\.adaptive-domain-grid/);
assert.match(styles, /\.adaptive-guardrail/);
assert.match(styles, /min-height: 48px/);
assert.match(worker, /coach-dominion-[0-9]{3}[a-z]-v1/);
assert.match(worker, /\/assets\/js\/adaptive-coaching\.js/);
assert.match(packageJson, /node tests\/adaptive-coaching\.test\.js/);
assert.match(packageJson, /node tests\/build-018i\.test\.js/);

console.log("Build 018I integration tests passed.");
