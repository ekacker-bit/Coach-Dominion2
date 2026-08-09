const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const activation = read("assets/js/atlas-activation.js");
const worker = read("sw.js");

assert.match(html, /atlas-activation\.js\?v=024m/);
assert.match(html, /app\.js\?v=024m/);
assert.match(worker, /coach-dominion-024m-v1/);
assert.match(activation, /function reconcileNutritionHistoryFromReceipt/);
assert.match(activation, /approvedBeforeActivation/);
assert.match(app, /function reconcileAtlasNutritionReceiptState/);
assert.match(app, /Fuel program receipt/);

console.log("Build 024M Fuel receipt reconciliation passed.");
