const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const activation = fs.readFileSync(path.join(root, "assets/js/atlas-activation.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

assert.match(html, /atlas-activation\.js\?v=024[bghim]/);
assert.match(html, /styles\.css\?v=(?:024[bcdefgn]|025a)/);
assert.match(html, /app\.js\?v=(?:024[bcdefghijklmn]|025a)/);
assert.match(activation, /const VERSION = "024(?:[BGH]\.1|I\.[123])"/);
assert.match(activation, /function preflightActivation/);
assert.match(activation, /function buildReceipt/);
assert.match(activation, /function auditReceipt/);
assert.match(app, /function buildAtlasProgramPreflight/);
assert.match(app, /function snapshotAtlasActivationState/);
assert.match(app, /function restoreAtlasActivationState/);
assert.match(app, /atlasActivationReceipt/);
assert.match(app, /READY_TO_ACTIVATE/);
assert.match(app, /REPAIR_PROGRAM/);
assert.match(styles, /atlas-program-preflight/);
assert.match(styles, /atlas-program-receipt/);
assert.match(worker, /coach-dominion-(?:024[bcdefghijklmn]|025a)-v1/);
assert.match(worker, /atlas-activation\.js\?v=024[bghim]/);

console.log("Build 024B integration tests passed.");
