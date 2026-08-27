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
const engine = read("assets/js/week-execution-certification.js");
const account = read("assets/js/dominion-account-truth.js");
const weekly = read("assets/js/atlas-weekly-reconciliation.js");
const weeklyExperience = read("assets/js/weekly-advancement.js");
const health = read("api/health.js");
const workflow = read(".github/workflows/release-integrity.yml");
const packageJson = JSON.parse(read("package.json"));

test("030M exposes one production-gated release and caches the certification engine", () => {
  assert.match(html, /coach-dominion-release" content="030[MNOPQRSTU]\.1"/);
  assert.match(html, /week-execution-certification\.js\?v=030m/);
  assert.ok(html.indexOf("week-execution-certification.js?v=030m") < html.indexOf("app.js?v="));
  assert.match(worker, /030m-week-execution-certification/);
  assert.match(worker, /week-execution-certification\.js\?v=030m/);
  assert.match(app, /register\("\/sw\.js\?v=030[mnopqrstu]"/);
  assert.match(health, /release: "030[MNOPQRSTU]\.1"/);
  assert.match(health, /weekExecution: "assignment-outcomes-certified"/);
  assert.match(workflow, /npm run test:030[mnopqrstu]/);
  assert.match(workflow, /--expected-release 030[MNOPQRSTU]\.1/);
  assert.match(packageJson.scripts["test:030m"], /week-execution-certification\.test\.js/);
});

test("030M gives every committed assignment one honest terminal result", () => {
  assert.match(engine, /const VERSION = "030M\.1"/);
  assert.match(engine, /WEEK_EXECUTION_CERTIFICATION/);
  ["COMPLETED", "PARTIAL", "MISSED", "REPLACED", "UNRESOLVED"].forEach((outcome) => assert.match(engine, new RegExp(outcome)));
  assert.match(engine, /sealed \? OUTCOMES\.MISSED : OUTCOMES\.UNRESOLVED/);
  assert.match(engine, /function bestEvidence/);
  assert.match(engine, /evidenceVerified/);
  assert.match(engine, /function certify/);
  assert.match(engine, /lateEvidence: true/);
});

test("030M certification is part of weekly finalization, not an after-the-fact dashboard", () => {
  const handler = app.slice(app.indexOf("async function finalizeWeeklyInspection"), app.indexOf("function loadLocalAnalyticsHistory"));
  const preview = handler.indexOf("const executionPreview = buildWeekExecutionCertification");
  const confirm = handler.indexOf("window.confirm");
  const certify = handler.indexOf("const executionCertification = buildWeekExecutionCertification");
  const snapshot = handler.indexOf("finalizeWeeklyInspectionSnapshot");
  const attach = handler.indexOf("finalized.weekExecutionCertification = executionCertification");
  const payload = handler.indexOf("weeklyPersistencePayload");
  assert.ok(preview > -1 && preview < confirm);
  assert.ok(certify > confirm && certify < snapshot);
  assert.ok(attach > snapshot && attach < payload);
  assert.match(app, /saveWeekExecutionCertification\(executionCertification\)/);
  assert.match(app, /executionCertification: inspection\.weekExecutionCertification/);
  assert.match(weekly, /executionCertificationFingerprint/);
});

test("030M survives reload through Account Truth without a new persistence silo", () => {
  assert.match(account, /const VERSION = "030[MNOPQRSTU]\.1"/);
  assert.match(account, /weeklyExecutions: 52/);
  assert.match(account, /mergeCollection\(value\.weeklyExecutions/);
  assert.match(account, /mergeCollection\(device\.weeklyExecutions, account\.weeklyExecutions/);
  assert.match(app, /saveClosedLoopLocal\("WEEK_EXECUTION_CERTIFICATION", "current", receipt\)/);
  assert.match(app, /persistClosedLoopState\("HISTORY", "week-execution-certification", history\)/);
  assert.match(app, /weeklyExecutions: readWeekExecutionCertificationHistory\(\)/);
  assert.match(app, /coaching\.weeklyExecutions/);
  assert.match(app, /runStartupTask\("week execution"/);
});

test("030M stays compact across Review, Calendar, Today, and phone layouts", () => {
  assert.match(html, /id="week-execution-certification"/);
  assert.match(weeklyExperience, /const VERSION = "030[MNOPQRSTU]\.1"/);
  assert.match(weeklyExperience, /id="week-execution-certification"/);
  assert.match(html, /weekly-advancement\.js\?v=026d-030c-030e-030k-030m(?:-030n)?(?:-030o)?/);
  assert.match(worker, /weekly-advancement\.js\?v=026d-030c-030e-030k-030m(?:-030n)?(?:-030o)?/);
  assert.match(app, /weekExecutionCertificationMarkup\(weekExecution, "calendar"\)/);
  assert.match(app, /weekExecutionCertificationMarkup\(weekExecution, "today"\)/);
  assert.match(css, /\.week-execution-certification\.review/);
  assert.match(css, /\.week-execution-facts/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.week-execution-certification/);
  assert.doesNotMatch(app, />030M</);
  assert.doesNotMatch(html, />030M</);
});
