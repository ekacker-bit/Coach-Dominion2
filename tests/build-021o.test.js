const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

assert.match(html, /<div class="kicker">TODAY<\/div>/);
assert.doesNotMatch(html, /TODAY \/\/ 21N/);
assert.match(html, /<span>Based on<\/span>/);
assert.match(html, />Show why<\/button>/);
assert.match(html, />How this works<\/summary>/);
assert.match(html, /Atlas schedules the complete program\. Move only what life requires\./);

assert.match(app, /const PRODUCT_COPY_REWRITES = new Map/);
assert.match(app, /function productCopyLabel/);
assert.match(app, /function startProductPolishObserver/);
assert.match(app, /dataset\.productPolish = "021O"/);
assert.match(app, /No planned items yet/);
assert.match(app, /SAVED HERE/);

assert.ok(Buffer.byteLength(css) >= 250000, "stylesheet integrity floor must remain enforced");
assert.ok(css.split("\n").length >= 5500, "responsive stylesheet must remain complete");
assert.match(css, /Build 021O: product-wide proportion guardrails and word-light surfaces/);
assert.match(css, /--dominion-page-max: 1480px/);
assert.match(css, /\.dominion-brand-mark[\s\S]*object-fit: contain/);
assert.match(css, /@media \(max-width: 720px\)/);

assert.match(html, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklmn]))/);
assert.match(html, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklmn]))/);
assert.match(worker, /coach-dominion-(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklmn]))-v1/);
assert.match(worker, /styles\.css\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklmn]))/);
assert.match(worker, /app\.js\?v=(?:022[b-g]|(?:023[abcdef]|024[abcdefghijklmn]))/);

console.log("Build 021O word diet and release guardrail tests passed.");
