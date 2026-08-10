const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const activation = read("assets/js/atlas-activation.js");
const worker = read("sw.js");

assert.match(html, /app\.js\?v=(?:024[lmn]|025[abc])/);
assert.match(worker, /coach-dominion-(?:024[lmn]|025[abc])-v1/);
assert.match(activation, /function reconcileNutritionHistory/);
assert.match(activation, /status: "REPLACED", supersededAt, supersededBy: candidate\.id/);
assert.match(app, /DominionAtlasActivation\.reconcileNutritionHistory\(candidates\.nutrition/);
assert.match(app, /item\.status === "REPLACED" \? "REPLACED"/);

console.log("Build 024L Fuel link idempotency passed.");
