const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("Trust Layer is loaded before the application and cached with the current shell", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  assert.match(html, /trust-layer\.js\?v=028a/);
  assert.ok(html.indexOf("trust-layer.js?v=028a") < html.indexOf("app.js?v="));
  assert.match(worker, /trust-layer\.js\?v=028a/);
  assert.match(worker, /027f-028a/);
  assert.match(worker, /app\.js\?v=[^"]*027f-028a/);
  assert.match(app, /register\("\/sw\.js\?v=028a"/);
});

test("startup verifies and repairs the full account chain without blocking optional surfaces", () => {
  const app = read("assets/js/app.js");
  const engine = read("assets/js/trust-layer.js");
  assert.match(engine, /const VERSION = "028A\.1"/);
  assert.match(engine, /RETRY_SAVED_WORK/);
  assert.match(engine, /SYNC_ACCOUNT_STATE/);
  assert.match(engine, /REBUILD_TODAY/);
  assert.match(engine, /ACTION_REQUIRED/);
  assert.match(app, /runStartupTask\("account health", \(\) => runTrustLayer\(\{ repair: true, startupIssues \}\)/);
  assert.match(app, /await flushContinuityPendingWrites\(\)/);
  assert.match(app, /await runStartupTask\("account save", \(\) => syncDominionAccountTruth\(\{ reason: "startup" \}\)/);
  assert.match(app, /renderOneCommand\(truth\)/);
  assert.match(app, /window\.addEventListener\("online"/);
  assert.match(app, /if \(!element\) return false/);
  assert.match(app, /function reportSafeRuntimeError/);
});

test("Account Health is word-light and exposes only actionable user choices", () => {
  const html = read("app.html");
  const visible = html.replace(/<!--[\s\S]*?-->/g, "");
  assert.match(visible, />ACCOUNT HEALTH</);
  assert.match(visible, />Program</);
  assert.match(visible, />Calendar</);
  assert.match(visible, />Today</);
  assert.match(visible, />Evidence</);
  assert.doesNotMatch(visible, />ACCOUNT TRUTH</);
  assert.doesNotMatch(visible, />Atlas memory</);
  assert.doesNotMatch(visible, />\s*(?:BUILD|RELEASE)\s+028A/i);
});

test("production telemetry is bounded, private, and observable", () => {
  const endpoint = read("api/trust-events.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(endpoint, /payload_too_large/);
  assert.match(endpoint, /coach_dominion_trust/);
  assert.doesNotMatch(endpoint, /body\.email|body\.userId|body\.notes/);
  assert.match(health, /trustTelemetry: "available"/);
  assert.match(workflow, /npm run test:028a/);
});
