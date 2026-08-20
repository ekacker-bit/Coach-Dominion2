const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("030H separates signed Contract authority from an unsigned draft", () => {
  const engine = read("assets/js/beta-state-integrity.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /activeSignedContractRevision/);
  assert.match(engine, /draftContractRevision/);
  assert.match(engine, /draftContractStatus/);
  assert.match(engine, /draftEffectiveDate/);
  assert.match(engine, /supersededContractRevision/);
  assert.match(app, /function discardRecruitContractDraft/);
  assert.match(app, /Finish R\$\{escapeHtml/);
});

test("030H gives every strength route one canonical active session", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /function readActiveStrengthExecution/);
  assert.match(app, /function activeStrengthSessionResolution/);
  assert.match(app, /activeResolution\.requiresResolution/);
  assert.match(app, /End incomplete session/);
  assert.match(app, /applyAssignedComplianceDefaults/);
});

test("030H makes draft, campaign, Quick Log, evidence, and retries truthful", () => {
  const app = read("assets/js/app.js");
  const campaign = read("assets/js/campaign-commissioning.js");
  const run = read("assets/js/manual-run.js");
  const persistence = read("assets/js/account-persistence.js");
  assert.match(app, /contractRevisionStatusCopy/);
  assert.match(campaign, /draftContractRevision/);
  assert.match(campaign, /Campaign setup is paused until/);
  assert.match(app, /countedLabels/);
  assert.match(run, /evidenceKind/);
  assert.match(run, /operationalDate/);
  assert.match(persistence, /payloadHash/);
  assert.match(app, /Protected writes will retry/);
});

test("030H is cache-busted and release gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030H\.1/);
  assert.match(html, /beta-state-integrity\.js\?v=030h/);
  assert.match(worker, /030h-beta-state-integrity/);
  assert.match(app, /register\("\/sw\.js\?v=030h"/);
  assert.match(health, /release: "030H\.1"/);
  assert.match(workflow, /npm run test:030h/);
  assert.match(workflow, /--expected-release 030H\.1/);
});
