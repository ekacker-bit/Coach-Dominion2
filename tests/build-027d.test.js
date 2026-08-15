const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("027D ships one exceptions-only Connected Evidence experience", () => {
  const html = read("app.html"), app = read("assets/js/app.js"), styles = read("assets/styles.css"), worker = read("sw.js");
  assert.match(html, /data-connected-view="overview"[\s\S]*data-connected-view="sources"[\s\S]*data-connected-view="reconciliation"/);
  assert.equal((html.match(/data-connected-view=/g) || []).length, 3);
  assert.match(html, /connected-evidence\.js\?v=027d/);
  assert.match(html, /health-connect-import-file/);
  assert.match(app, /function reconcileConnectedEvidence/);
  assert.match(app, /readConnectedEvidenceReport\(\)\?\.proofSources/);
  assert.match(app, /runStartupTask\("Connected Evidence"/);
  assert.match(app, /resolve-connected-primary/);
  assert.match(styles, /Build 027D: connected evidence, exceptions only/);
  assert.match(worker, /connected-evidence\.js\?v=027d/);
  assert.match(worker, /027c-027d/);
  assert.match(app, /sw\.js\?v=027d/);
});
