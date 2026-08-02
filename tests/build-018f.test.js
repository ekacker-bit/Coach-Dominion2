const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /BUILD (?:019A \/\/ THE DOMINION CONTRACT|021C \/\/ RECRUIT ENTRY)/);
assert.match(html, /id="recruit-contract-editor"/);
assert.match(html, /id="recruit-contract-editor-summary"/);
assert.match(html, /TODAY \/\/ 21N/);
assert.match(html, /BUILD 018F \/\/ NEXT ACTION/);
assert.match(html, /id="closed-loop-summary"/);
assert.match(html, /id="daily-sequence-summary"/);
assert.match(html, /Full day sequence/);

assert.match(app, /guide\.steps\.filter\(\(step\) => !step\.complete\)\.slice\(0, 1\)/);
assert.match(app, /setText\("daily-sequence-summary"/);
assert.match(app, /setText\("closed-loop-summary"/);
assert.match(app, /editor\.open = !approved \|\| Boolean\(draft\)/);
assert.match(app, /if \(editor\) editor\.open = false/);
assert.match(app, /if \(editor\) editor\.open = true/);

assert.match(styles, /Build 018F: focused operating experience and progressive disclosure/);
assert.match(styles, /\.recruit-contract-editor/);
assert.match(styles, /\.daily-sequence-detail/);
assert.match(styles, /#today > \.daily-execution-queue/);
assert.match(styles, /#today > \.today-coaching-reason/);

assert.match(packageJson, /node tests\/build-018f\.test\.js/);

console.log("Build 018F focused operating experience integration passed.");
