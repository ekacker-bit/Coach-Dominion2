const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const orientation = fs.readFileSync(path.join(root, "assets/js/first-week-orientation.js"), "utf8");
const manualRun = fs.readFileSync(path.join(root, "assets/js/manual-run.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(index, /THE STANDARD\s*<br><em>IS EARNED\.<\/em>/);
assert.match(index, /Difficulty is not a defect/);
assert.match(index, /id="password-visibility"/);
assert.match(index, /id="magic-link-form"/);
assert.match(index, /entryError/);
assert.match(styles, /\.entry-shell/);
assert.match(styles, /\.entry-manifesto/);

assert.match(orientation, /const VERSION = "025Q\.1"/);
assert.match(orientation, /function selectCanonicalOrientation/);
assert.match(orientation, /function completionReceipt/);
assert.match(app, /DominionFirstWeekOrientation\.selectCanonicalOrientation/);
assert.match(app, /Week One will not be repeated/);

assert.match(html, /\/assets\/js\/manual-run\.js\?v=(?:025q|030e)/);
assert.ok(html.indexOf("/assets/js/manual-run.js") < html.indexOf("/assets/js/app.js"));
assert.match(app, /id="manual-run-form"/);
assert.match(app, /function applyManualRunToToday/);
assert.match(app, /persistPerformanceEvidenceEntry/);
assert.match(app, /skipPerformanceEvidence/);
assert.match(app, /"average_heart_rate", "capture_method", "count_toward_today"/);
assert.match(manualRun, /capture_method: "MANUAL_RUN_FORM"/);
assert.match(styles, /\.manual-run-card/);

assert.match(html, /styles\.css\?v=.*025q/);
assert.match(worker, /manual-run\.js\?v=(?:025q|030e)/);
assert.match(worker, /first-week-orientation\.js\?v=025q/);
assert.match(worker, /025p-025q/);
assert.match(packageJson, /node tests\/manual-run\.test\.js/);
assert.match(packageJson, /node tests\/build-025q\.test\.js/);

console.log("Build 025Q entry, orientation, and manual run integration checks passed.");
