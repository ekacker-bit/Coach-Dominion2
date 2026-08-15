const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("027B is connected across the shell, account continuity, and completion paths", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");
  const worker = read("sw.js");
  const engine = read("assets/js/atlas-progression-engine.js");
  assert.match(engine, /const VERSION = "027B\.1"/);
  assert.match(engine, /Recruit Contract and Dominion Campaign remain unchanged/);
  assert.match(html, /id="atlas-progression-order"/);
  assert.match(html, /atlas-progression-engine\.js\?v=027b/);
  assert.match(app, /function buildCurrentAtlasProgressionOrder/);
  assert.match(app, /persistClosedLoopState\("PROGRESSION_ORDER", "current"/);
  assert.match(app, /reconcileAtlasProgressionOrder\(\{ render: false \}\)/);
  assert.match(app, /data-atlas-progression-action/);
  assert.match(css, /\.atlas-progression-order/);
  assert.match(worker, /atlas-progression-engine\.js\?v=027b/);
  assert.match(worker, /027a-027b/);
});

test("027B exposes bounded progression for all training domains", () => {
  const strength = read("assets/js/strength-training.js");
  const running = read("assets/js/running-progression.js");
  const core = read("assets/js/core-programming.js");
  assert.match(strength, /PROGRESS_REPS/);
  assert.match(running, /progressionMode = "PACE"/);
  assert.match(running, /durationPolicy: session\.type === "LONG" \? "UNCAPPED_BY_TIME"/);
  assert.match(core, /function buildNextCycleDraft/);
  assert.match(core, /\+1 repetition or \+5 seconds; sets unchanged/);
});
