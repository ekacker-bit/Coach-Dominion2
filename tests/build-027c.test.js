const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("027C connects one Recovery Command to Roll Call, Today, Calendar, and the account", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  const css = read("assets/styles.css");
  const worker = read("sw.js");
  const engine = read("assets/js/recovery-command.js");

  assert.match(engine, /const VERSION = "027C\.1"/);
  assert.match(engine, /function applyToDay/);
  assert.match(engine, /function buildOutcome/);
  assert.match(html, /ATLAS \/\/ RECOVERY COMMAND/);
  assert.match(html, /recovery-command\.js\?v=027c/);
  assert.match(app, /function runRecoveryCommand/);
  assert.match(app, /await runRecoveryCommand\(\{ render: false \}\)/);
  assert.match(app, /persistClosedLoopState\("RECOVERY_COMMAND", "current"/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "recovery-command-outcomes"/);
  assert.match(app, /DominionRecoveryCommand\.applyToDay/);
  assert.match(app, /DominionRecoveryCommand\.calendarOverride/);
  assert.match(css, /\.today-recovery-signals/);
  assert.match(css, /data-recovery-posture="red"/);
  assert.match(worker, /recovery-command\.js\?v=027c/);
  assert.match(worker, /027b-027c/);
});

test("027C stays word-light and protects the Recruit Contract, campaign, Fuel, and long runs", () => {
  const engine = read("assets/js/recovery-command.js");
  assert.match(engine, /Fuel targets remain protected/);
  assert.match(engine, /PRESERVE_LONG_RUN/);
  assert.match(engine, /Recruit Contract, campaign goal, or Fuel targets/);
  assert.doesNotMatch(engine, /rewriteContract|saveContract|campaignRevision/);
});
