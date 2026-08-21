const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("029L keeps production reliability context intact from browser to log", () => {
  const trust = read("assets/js/trust-layer.js");
  const endpoint = read("api/trust-events.js");
  assert.match(trust, /const RELIABILITY_VERSION = "029L\.1"/);
  assert.match(trust, /oldestQueuedAgeMs/);
  assert.match(trust, /operationStatus/);
  assert.match(endpoint, /category: "production_reliability"/);
  assert.match(endpoint, /requestId:/);
  assert.match(endpoint, /supportCode:/);
  assert.match(endpoint, /receivedAt:/);
});

test("029L makes real failures visible without turning protected recovery into errors", () => {
  const endpoint = read("api/trust-events.js");
  const app = read("assets/js/app.js");
  assert.match(endpoint, /FAILURE_EVENTS/);
  assert.match(endpoint, /event === "retry_failed"/);
  assert.match(endpoint, /severity === "error"/);
  assert.match(endpoint, /severity === "warning"/);
  assert.match(app, /function currentReliabilityContext/);
  assert.match(app, /function shouldReportTrustPayload/);
  assert.match(app, /event\.error \|\| event\.message/);
  assert.match(app, /event\.reason/);
});

test("029L exposes a short support reference only when it is needed", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.match(html, /id="account-truth-support"[^>]*hidden/);
  assert.match(html, /id="account-truth-support-code"/);
  assert.match(app, /lastSupportSignal/);
  assert.match(app, /\["warning", "error"\]/);
  assert.match(app, /renderReliabilitySupportCode/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+029L/i);
});

test("029L ships its current offline shell and CI gate", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(html, /trust-layer\.js\?v=028a-029l/);
  assert.match(worker, /trust-layer\.js\?v=028a-029l/);
  assert.match(worker, /029l-production-reliability/);
  assert.match(app, /register\("\/sw\.js\?v=(?:029[l-o]|030[a-i])"/);
  assert.ok(
    /npm run test:029l/.test(workflow) ||
    (/npm run test:029m/.test(workflow) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:029n/.test(workflow) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:029o/.test(workflow) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030c/.test(workflow) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030d/.test(workflow) && /"test:030d"[^\n]+npm run test:030c/.test(packageJson) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030e/.test(workflow) && /"test:030e"[^\n]+npm run test:030d/.test(packageJson) && /"test:030d"[^\n]+npm run test:030c/.test(packageJson) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030f/.test(workflow) && /"test:030f"[^\n]+npm run test:030e/.test(packageJson) && /"test:030e"[^\n]+npm run test:030d/.test(packageJson) && /"test:030d"[^\n]+npm run test:030c/.test(packageJson) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030h/.test(workflow) && /"test:030h"[^\n]+npm run test:030g/.test(packageJson) && /"test:030g"[^\n]+npm run test:030f/.test(packageJson) && /"test:030f"[^\n]+npm run test:030e/.test(packageJson) && /"test:030e"[^\n]+npm run test:030d/.test(packageJson) && /"test:030d"[^\n]+npm run test:030c/.test(packageJson) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)) ||
    (/npm run test:030i/.test(workflow) && /"test:030i"[^\n]+npm run test:030h/.test(packageJson) && /"test:030h"[^\n]+npm run test:030g/.test(packageJson) && /"test:030g"[^\n]+npm run test:030f/.test(packageJson) && /"test:030f"[^\n]+npm run test:030e/.test(packageJson) && /"test:030e"[^\n]+npm run test:030d/.test(packageJson) && /"test:030d"[^\n]+npm run test:030c/.test(packageJson) && /"test:030c"[^\n]+npm run test:030b/.test(packageJson) && /"test:030b"[^\n]+npm run test:030a/.test(packageJson) && /"test:030a"[^\n]+npm run test:029o/.test(packageJson) && /"test:029o"[^\n]+npm run test:029n/.test(packageJson) && /"test:029n"[^\n]+npm run test:029m/.test(packageJson) && /"test:029m"[^\n]+npm run test:029l/.test(packageJson)),
    "CI must run the 029L gate directly or through its verified successor"
  );
});
