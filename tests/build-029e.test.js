const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const worker = read("sw.js");

test("029E lifecycle authority loads before the application", () => {
  assert.match(html, /program-lifecycle\.js\?v=029e/);
  assert.ok(html.indexOf("program-lifecycle.js?v=029e") < html.indexOf("app.js?v="));
  assert.match(app, /DominionProgramLifecycle\.derive/);
});

test("Contract, Calendar, Today, Review, Trends, and Program share one lifecycle", () => {
  assert.match(app, /\["program", "contract", "calendar", "today", "inspection", "trends", "rank"\]/);
  assert.match(app, /\["recruit-contract-status", "weekly-orchestrator-status", "program-command-status"\]/);
  assert.doesNotMatch(app, /lifecycle\.state === "DRAFT_REVISION"/);
  assert.doesNotMatch(app, /ACTIVE WEEK · DRAFT UNAPPLIED/);
});

test("attention is distinct from program state", () => {
  assert.match(app, /dataset\.programAttention/);
  assert.match(app, /lifecycle\.attention \? `\$\{lifecycle\.label\} · \$\{lifecycle\.attention\}`/);
});

test("029E has a fresh offline shell", () => {
  assert.match(worker, /029d-029e/);
  assert.match(worker, /program-lifecycle\.js\?v=029e/);
  assert.match(app, /sw\.js\?v=029e/);
  assert.match(html, /app\.js\?v=[^"\n]*029e/);
});
