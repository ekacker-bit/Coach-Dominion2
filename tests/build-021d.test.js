const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const activation = fs.readFileSync(path.join(root, "assets/js/contract-activation.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /id="recruit-contract-autosave-status"/);
assert.match(app, /function queueRecruitContractAutosave/);
assert.match(app, /saveRecruitContractDraftFromForm/);
assert.match(app, /addEventListener\("input", queueRecruitContractAutosave\)/);
assert.match(app, /const amendmentPending = Boolean\(signed && draft\)/);
assert.match(app, /canSign && \(!signed \|\| amendmentPending\)/);
assert.match(app, /data-contract-experience-action="review-amendment"/);
assert.match(app, /AMENDMENT UNSIGNED/);
assert.match(app, /refreshUnifiedWeekDraftForPlans\(\{ force: true, contractHandoff: true \}\)/);
assert.match(app, /calendar draft now uses/);
assert.match(app, /rebaseOrientation\(previousOrientation, previous, signed/);
assert.match(activation, /status: "COMPATIBLE"/);
assert.match(activation, /changes\.length === 0/);
assert.match(styles, /Build 021D: Contract amendment to calendar handoff/);
assert.match(styles, /\.contract-amendment-handoff/);
assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-g]|(?:023[abcdef]|024[abcdefghi]))-v1/);
assert.match(packageJson, /node tests\/build-021d\.test\.js/);

console.log("Build 021D Contract-to-Calendar handoff integration checks passed.");
