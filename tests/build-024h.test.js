
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const activation = read("assets/js/atlas-activation.js");
const worker = read("sw.js");
const packageJson = read("package.json");

assert.match(html, /atlas-activation\.js\?v=024[hi]/);
assert.match(html, /app\.js\?v=024[hi]/);
assert.match(worker, /coach-dominion-024[hi]-v1/);
assert.match(activation, /const VERSION = "024[HI]\.1"/);
assert.match(activation, /function summarizeSyncResults/);
assert.match(activation, /pendingSyncDomains/);
assert.match(app, /DominionAtlasActivation\.summarizeSyncResults\(writeResults\)/);
assert.match(app, /Program activated on this device; account sync will retry/);
assert.match(app, /syncStatus: "SYNC_PENDING"/);
assert.doesNotMatch(app, /Account sync did not confirm every plan\. Nothing was activated/);
assert.match(app, /primary\.textContent = "Activate complete program"/);
assert.match(packageJson, /test:024h/);

console.log("Build 024H resilient program activation tests passed.");