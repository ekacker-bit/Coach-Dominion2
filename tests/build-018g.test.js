const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /BUILD (?:018G \/\/ CONTRACT ACTIVATION|024A \/\/ ATLAS PROGRAM)/);
assert.match(html, /id="contract-activation"/);
assert.match(html, /id="contract-activation-progress"/);
assert.match(html, /src="\/assets\/js\/contract-activation\.js(?:\?v=(?:024[abcdefghijklmn]|025a))?"/);
assert.match(app, /function contractActivationInputs/);
assert.match(app, /function renderContractActivation/);
assert.match(app, /function applyContractActivationGuards/);
assert.match(app, /function refreshUnifiedWeekDraftForPlans/);
assert.match(app, /function commitUnifiedWeekDraft/);
assert.match(app, /data-contract-activation-action/);
assert.match(app, /await refreshUnifiedWeekDraftForPlans\(\)/);
assert.match(styles, /Build 018G: Contract activation pipeline/);
assert.match(styles, /\.contract-activation-modules/);
assert.match(packageJson, /node tests\/contract-activation\.test\.js/);
assert.match(packageJson, /node tests\/build-018g\.test\.js/);

console.log("Build 018G integration tests passed.");
