const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const engine = read("assets/js/atlas-program-repair.js");
const activation = read("assets/js/activation-repair.js");
const styles = read("assets/styles.css");
const worker = read("sw.js");
const packageJson = read("package.json");

[
  "atlas-program-repair-dialog",
  "atlas-program-repair-heading",
  "atlas-program-repair-status",
  "atlas-program-repair-panel",
  "atlas-program-repair-primary",
  "atlas-program-repair-feedback"
].forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));

assert.match(html, /atlas-program-repair\.js\?v=024f/);
assert.ok(html.indexOf("atlas-program-repair.js") < html.indexOf("app.js"), "repair engine must load before app integration");
assert.match(html, /styles\.css\?v=024f/);
assert.match(html, /app\.js\?v=024[hijklm]/);
assert.match(engine, /const VERSION = "024F\.1"/);
assert.match(activation, /const VERSION = "024E\.1"/);
assert.match(activation, /action: "REPAIR_PROGRAM", label: "Complete my program"/);
assert.match(app, /stageRecruitContractPlans\(\{ announce = true, repairOnly = false \} = \{\}\)/);
assert.match(app, /currentAtlasActivePlans/);
assert.match(app, /openAtlasProgramRepairPreview/);
assert.match(app, /runAtlasProgramRepairAction/);
assert.match(app, /atlasRepairableBlockers/);
assert.match(app, /data-program-repair-action/);
assert.match(styles, /Build 024E: Atlas Program Repair/);
assert.match(styles, /\.atlas-program-repair-dialog/);
assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.atlas-program-repair-dialog/);
assert.match(worker, /coach-dominion-024[hijklm]-v1/);
assert.match(worker, /atlas-program-repair\.js\?v=024f/);
assert.match(packageJson, /test:024e/);

console.log("Build 024E feature compatibility tests passed on 024H.");
