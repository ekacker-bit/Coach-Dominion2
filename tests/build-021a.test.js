const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const mark = fs.readFileSync(path.join(root, "assets", "icons", "dominion-mark.svg"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");

assert.match(html, /data-brand-system="021A"/);
assert.match(html, /family=Bebas\+Neue&family=Raleway/);
assert.match(html, /THE STANDARD IS EARNED/);
assert.doesNotMatch(html, /DOMINION \/\/ CLOSED ALPHA/);
assert.match(html, /class="dominion-footer"/);
assert.match(html, /Discipline\. Accountability\. Dominion\. Ascension\. Precision\./);

assert.match(styles, /Build 021A: Coach Dominion brand system/);
assert.match(styles, /--dominion-black:\s*#0a0a0a/);
assert.match(styles, /--steel-gray:\s*#1e1f21/);
assert.match(styles, /--ascent-green:\s*#2e4b34/);
assert.match(styles, /--victory-gold:\s*#d4af37/);
assert.match(styles, /--stone:\s*#e6e6e4/);
assert.match(styles, /--font-command:\s*"Bebas Neue"/);
assert.match(styles, /--font-body:\s*"Raleway"/);
assert.match(styles, /body\[data-brand-system="021A"\] \.war-room-shell\[data-product-shell="019B"\] \.card/);
assert.match(styles, /clip-path:\s*polygon/);
assert.match(styles, /\.dominion-footer/);
assert.match(styles, /\.mobile-command-bar \[data-mobile-nav\]\.active/);

assert.match(mark, /viewBox="0 0 640 512"/);
assert.match(mark, /winged CD mark/);
assert.match(mark, /id="gold"/);
assert.match(mark, /id="earned"/);
assert.match(mark, /#d4af37/i);
assert.match(manifest, /"theme_color": "#0a0a0a"/);
assert.match(worker, /coach-dominion-(?:021[a-o]|022[a-g]|(?:023[abcdef]|(?:024[abcdefghijklmn]|025[abc])))-v1/);
assert.match(packageJson, /node tests\/build-021a\.test\.js/);

console.log("Build 021A Coach Dominion brand-system integration passed.");
