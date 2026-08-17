const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

test("029D authority loads before the application", () => {
  assert.match(html, /command-first-today\.js\?v=029d/);
  assert.ok(html.indexOf("command-first-today.js?v=029d") < html.indexOf("app.js?v="));
  assert.match(app, /DominionCommandFirstToday\.apply\(document\)/);
  assert.match(app, /today\.dataset\.commandOrder = "029D"/);
});

test("the command owns the first mobile viewport", () => {
  assert.match(css, /data-today-hierarchy="029D\.1"/);
  assert.match(css, /#one-command\[data-primary-command="true"\]/);
  assert.match(css, /min-height: calc\(100svh - 132px\)/);
  assert.match(css, /#daily-state-summary:not\(\[hidden\]\) dl/);
});

test("029D has a fresh offline shell", () => {
  assert.match(worker, /029c-029d/);
  assert.match(worker, /command-first-today\.js\?v=029d/);
  assert.match(app, /sw\.js\?v=029d/);
  assert.match(html, /styles\.css\?v=[^"\n]*029d/);
});
