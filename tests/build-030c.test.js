const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030C protects the active week and stages the future Contract", () => {
  const engine = read("assets/js/execution-context.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /const VERSION = "030C\.1"/);
  assert.match(engine, /Today executes active R\$\{activeContractRevision\} assignment\./);
  assert.match(engine, /Next week is ready to commit\./);
  assert.match(engine, /Current week protected under R/);
  assert.match(engine, /label: "Future program update pending"/);
  assert.match(engine, /label: "Commit next week"/);
  assert.match(app, /function buildCurrentExecutionContext/);
  assert.match(app, /function currentExecutionConflicts/);
  assert.match(app, /executionContext\?\.expectedVersionSplit/);
  assert.match(app, /const contractAction = executionContext\?\.contractAction/);
  assert.match(app, /contractAction\?\.label \|\| next\.label/);
});

test("030C derives Today and Quick Log from the effective assignment only", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function currentFrictionlessExecution/);
  assert.match(app, /const day = readEffectiveUnifiedDay\(todayISODate\(\)\)/);
  assert.match(app, /const strengthActivity = activityFor\("strength"\)/);
  assert.match(app, /const runningActivity = activityFor\("running"\)/);
  assert.match(app, /const coreActivity = activityFor\("core"\)/);
  assert.match(app, /strength: \{ planned: Boolean\((?:strengthActivity|strengthLedger)\)/);
  assert.match(app, /running: \{ planned: Boolean\((?:runningActivity|runningLedger)\)/);
  assert.match(app, /core: \{ planned: Boolean\((?:coreActivity|coreLedger)\)/);
  assert.match(app, /runType: runDraft\.runType \|\| String\(readEffectiveUnifiedDay\(date\)\?\.activities/);
});

test("030C quarantines implausible biometrics with an explicit audited choice", () => {
  const engine = read("assets/js/biometric-integrity.js");
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.match(engine, /"CONFIRMATION_REQUIRED"/);
  assert.match(engine, /safe\[item\.metric\] = null/);
  assert.match(engine, /resolution === "CONFIRM"/);
  assert.match(engine, /resolution === "CORRECT"/);
  assert.match(html, /id="biometric-confirmation-dialog"/);
  assert.match(html, /data-biometric-action="CORRECT"/);
  assert.match(html, /data-biometric-action="CONFIRM"/);
  assert.match(app, /saveBiometricIntegrityAudit/);
  assert.match(app, /QUARANTINED/);
});

test("030C uses one truthful sync and Review vocabulary", () => {
  const persistence = read("assets/js/account-persistence.js");
  const integrity = read("assets/js/daily-decision-integrity.js");
  const readiness = read("assets/js/readiness-baselines.js");
  ["synced", "transient_retry", "offline_queued", "user_action_required", "conflict", "failed"]
    .forEach((state) => assert.match(persistence, new RegExp(`"${state}"`)));
  assert.match(integrity, /score === null \? "Not evaluated"/);
  assert.match(integrity, /Coverage incomplete/);
  assert.match(integrity, /basis/);
  assert.match(readiness, /sleep, resting heart rate, energy, soreness, pain, and recent training load do not corroborate a recovery adjustment/);
});

test("030C is identifiable, cached, gated, and does not expose release language", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  const packageJson = read("package.json");
  assert.match(html, /coach-dominion-release" content="030[CDEFGHIJKLMN]\.1"/);
  assert.match(html, /execution-context\.js\?v=030c/);
  assert.match(html, /biometric-integrity\.js\?v=030c/);
  assert.match(worker, /030(?:c-daily-command-integrity|d-recruit-journey-certification|e-authoritative-startup)/);
  assert.match(worker, /execution-context\.js\?v=030c/);
  assert.match(worker, /biometric-integrity\.js\?v=030c/);
  assert.match(health, /release: "030[CDEFGHIJKLMN]\.1"/);
  assert.match(workflow, /npm run test:030[cdefghijklmn]/);
  assert.match(workflow, /--expected-release 030[CDEFGHIJKLMN]\.1/);
  assert.match(packageJson, /"test:030c"/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030C/i);
});
