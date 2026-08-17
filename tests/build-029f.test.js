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

test("029F connection-health authority loads before the application", () => {
  assert.match(html, /connected-health\.js\?v=029f/);
  assert.ok(html.indexOf("connected-health.js?v=029f") < html.indexOf("app.js?v="));
  assert.match(app, /DominionConnectedHealth\.aggregate/);
});

test("the umbrella status is derived from sources and account-save health", () => {
  assert.match(app, /sources: sourceStates/);
  assert.match(app, /accountState: accountSync\.state/);
  assert.match(app, /remoteLoadFailed: connectedLoadState\.remoteLoadFailed === true/);
  assert.doesNotMatch(app, /Connected sources ready/);
  assert.match(app, /connectedStatus\.textContent = connectedHealth\.label/);
  assert.match(app, />\$\{escapeHtml\(connectedHealth\.label\)\}<\/span>/);
});

test("every source shows evidence freshness and simulated sources cannot count as current", () => {
  assert.match(app, /Last successful/);
  assert.match(app, /No successful import yet/);
  assert.match(app, /isSimulated: account\?\.isSimulated === true/);
});

test("connection health is responsive and visible without technical diagnostics", () => {
  assert.match(app, /class="connected-health-summary/);
  assert.match(css, /\.connected-health-summary/);
  assert.match(css, /\.connected-notice\[data-connection-state="ERROR"\]/);
  assert.match(css, /\.connected-health-summary \{ align-items: flex-start; flex-direction: column/);
});

test("029F has a fresh offline shell", () => {
  assert.match(worker, /029e-029f/);
  assert.match(worker, /connected-health\.js\?v=029f/);
  assert.match(worker, /styles\.css\?v=[^"\n]*029f/);
  assert.match(app, /sw\.js\?v=029f/);
});
