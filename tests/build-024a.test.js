const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const activation = fs.readFileSync(path.join(root, "assets/js/contract-activation.js"), "utf8");
const recruit = fs.readFileSync(path.join(root, "assets/js/recruit-contract.js"), "utf8");
const atlas = fs.readFileSync(path.join(root, "assets/js/atlas-program.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

assert.match(html, /name="weightValue"/);
assert.match(html, /name="weightUnit"/);
assert.match(html, /Your complete program/);
assert.match(html, /atlas-program\.js\?v=024[abcdef]/);
assert.match(html, /styles\.css\?v=024[abcdef]/);
assert.match(html, /app\.js\?v=024[abcdef]/);
assert.match(recruit, /const VERSION = "024A\.1"/);
assert.match(atlas, /const VERSION = "024A\.1"/);
assert.match(activation, /APPROVE_PROGRAM/);
assert.match(activation, /STAGE_PROGRAM/);
assert.match(app, /async function approveAtlasProgram/);
assert.match(app, /one coordinated program for a single approval/i);
assert.match(worker, /coach-dominion-024[abcdef]-v1/);
assert.match(worker, /atlas-program\.js\?v=024[abcdef]/);

console.log("Build 024A integration tests passed.");
