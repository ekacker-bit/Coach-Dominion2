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
  "shell-truth-summary",
  "shell-truth-source",
  "shell-truth-evidence",
  "shell-truth-alert",
  "shell-truth-alert-detail"
]) assert.match(html, new RegExp(`id="${id}"`), `missing 019D truth surface: ${id}`);

for (const step of ["contract", "plans", "week", "today", "evidence", "review"]) {
  assert.match(html, new RegExp(`data-shell-step="${step}"`), `missing truth stage: ${step}`);
}

assert.match(html, /data-truth-layer="019D"/);
assert.match(html, /BUILD 019D \/\/ OPERATING TRUTH/);
assert.match(html, /src="\/assets\/js\/operating-truth\.js"/);
assert.ok(html.indexOf("operating-truth.js") < html.indexOf("app.js"), "truth engine must load before app integration");

assert.match(app, /function buildCurrentOperatingTruth/);
assert.match(app, /DominionOperatingTruth\.buildOperatingTruth/);
assert.match(app, /const truth = buildCurrentOperatingTruth\(\)/);
assert.match(app, /action === "operating_truth"/);
assert.match(app, /action === "TRUTH"/);
assert.match(app, /command\.modules = command\.modules\.map/);
assert.match(app, /shell-truth-alert-detail/);

assert.match(styles, /Build 019D: one canonical Contract/);
assert.match(styles, /\.shell-truth-summary/);
assert.match(styles, /\.shell-truth-alert/);
assert.match(styles, /data-dominion-phase="conflict"/);
assert.match(styles, /grid-template-columns: repeat\(6/);

assert.match(worker, /coach-dominion-019[a-z]-v1/);
assert.match(worker, /\/assets\/js\/operating-truth\.js/);
assert.match(packageJson, /node tests\/operating-truth\.test\.js/);
assert.match(packageJson, /node tests\/build-019d\.test\.js/);
assert.match(packageJson, /"test:019d"/);

console.log("Build 019D Truth Layer integration passed.");
