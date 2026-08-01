const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

for (const id of [
  "one-command",
  "one-command-eyebrow",
  "one-command-heading",
  "one-command-detail",
  "one-command-state",
  "one-command-progress",
  "one-command-stages",
  "one-command-modules",
  "one-command-primary",
  "one-command-secondary",
  "one-command-context",
  "one-command-source",
  "one-command-evidence",
  "one-command-conflict",
  "today-context-detail",
  "today-sequence-detail"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 019E one-command surface: ${id}`);

assert.match(html, /BUILD 019E \/\/ SINGLE ORDER/);
assert.match(html, /src="\/assets\/js\/one-command\.js"/);
assert.ok(html.indexOf("one-command.js") < html.indexOf("app.js"), "one-command model must load before app integration");
assert.match(html, /Plan &amp; coaching context/);
assert.match(html, /Orders, progress, and safeguards/);

assert.match(app, /function renderOneCommand/);
assert.match(app, /DominionOneCommand\.buildOneCommand/);
assert.match(app, /function runOneCommandAction/);
assert.match(app, /relayClosedLoopAction/);
assert.match(app, /one-command-primary/);
assert.match(app, /ritual\.hidden/);

assert.match(styles, /Build 019E: One Command UX/);
assert.match(styles, /\.one-command-header/);
assert.match(styles, /\.one-command-stages/);
assert.match(styles, /\.today-context-stack/);
assert.match(styles, /data-dominion-section="today"/);
assert.match(styles, /#mobile-command > \.mobile-command-next/);

assert.match(worker, /coach-dominion-019[a-z]-v1/);
assert.match(worker, /\/assets\/js\/one-command\.js/);
assert.match(packageJson, /node tests\/one-command\.test\.js/);
assert.match(packageJson, /node tests\/build-019e\.test\.js/);
assert.match(packageJson, /"test:019e"/);

console.log("Build 019E One Command integration passed.");
