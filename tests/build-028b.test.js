const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("Frictionless Execution is loaded before the app and cached for offline resume", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  assert.match(html, /frictionless-execution\.js\?v=028b/);
  assert.ok(html.indexOf("frictionless-execution.js?v=028b") < html.indexOf("app.js?v="));
  assert.match(worker, /frictionless-execution\.js\?v=028b/);
  assert.match(worker, /027f-028a-028b/);
  assert.match(app, /register\("\/sw\.js\?v=028b"/);
});

test("Today exposes a compact direct logger for all six daily surfaces", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const styles = read("assets/styles.css");
  assert.match(html, /id="frictionless-execution"/);
  assert.match(html, />QUICK LOG</);
  assert.match(app, /async function openFrictionlessLogger/);
  for (const module of ["strength", "running", "core", "fuel", "recovery", "closeout"]) {
    assert.match(read("assets/js/frictionless-execution.js"), new RegExp(`id: "${module}"`));
  }
  assert.match(styles, /\.frictionless-execution-modules/);
  assert.match(styles, /grid-template-columns: repeat\(3/);
});

test("unfinished execution inputs persist to the account and restore after reload", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /readClosedLoopState\("EXECUTION_DRAFT", todayISODate\(\)/);
  assert.match(app, /persistClosedLoopState\("EXECUTION_DRAFT", todayISODate\(\), envelope\)/);
  assert.match(app, /\["EXECUTION_DRAFT", todayISODate\(\)\]/);
  assert.match(app, /scheduleFrictionlessDraft\("fuel"/);
  assert.match(app, /scheduleFrictionlessDraft\("running"/);
  assert.match(app, /scheduleFrictionlessDraft\("closeout"/);
  assert.match(app, /restoreFrictionlessDraftForms\(\)/);
});

test("internal release language is not exposed in the execution UI", () => {
  const html = read("app.html").replace(/<!--[^]*?-->/g, "");
  const section = html.match(/<aside id="frictionless-execution"[^]*?<\/aside>/)?.[0] || "";
  assert.ok(section);
  assert.doesNotMatch(section, /028B|BUILD|RELEASE/i);
});
