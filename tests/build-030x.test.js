"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("030X is cache-busted and production gated", () => {
  const html = read("app.html");
  const worker = read("sw.js");
  const app = read("assets/js/app.js");
  const health = read("api/health.js");
  const workflow = read(".github/workflows/release-integrity.yml");
  assert.match(html, /coach-dominion-release" content="030[XY]\.1"/);
  assert.match(html, /recruit-continuity-recovery\.js\?v=030x/);
  assert.match(html, /app\.js\?v=[^"]*-030x(?:-030y)?/);
  assert.match(worker, /030x-recruit-continuity-recovery/);
  assert.match(worker, /recruit-continuity-recovery\.js\?v=030x/);
  assert.match(app, /register\("\/sw\.js\?v=030[xy]"/);
  assert.match(health, /release: "030[XY]\.1"/);
  assert.match(health, /continuityRecovery: "one-action-account-restored"/);
  assert.match(workflow, /npm run test:030x/);
  assert.match(workflow, /--expected-release 030[XY]\.1/);
});

test("030X stores and restores the exact recovery receipt", () => {
  const app = read("assets/js/app.js");
  const truth = read("assets/js/dominion-account-truth.js");
  assert.match(app, /async function persistRecruitContinuityRecoveryHistory/);
  assert.match(app, /state_key: "recruit-continuity-recovery"[\s\S]*\.select\("state_type,state_key,payload,updated_at"\)[\s\S]*\.single\(\)/);
  assert.match(app, /item\?\.id === history\[0\]\.id && item\?\.fingerprint === history\[0\]\.fingerprint/);
  assert.match(app, /continuityRecoveries: readRecruitContinuityRecoveryHistory\(\)/);
  assert.match(app, /evidence\.continuityRecoveries/);
  assert.match(truth, /continuityRecoveries: 120/);
  assert.match(truth, /continuityRecoveries: mergeCollection/);
});

test("030X makes recovery the one Today action and routes exact assignments", () => {
  const app = read("assets/js/app.js");
  assert.match(app, /model = applyRecruitContinuityRecoveryToModel\(model\)/);
  assert.match(app, /action: "CONTINUITY_RECOVERY"/);
  assert.match(app, /primary\.dataset\.oneCommandAssignment = currentRecruitContinuityRecovery\?\.order\?\.assignmentId/);
  assert.match(app, /if \(action === "CONTINUITY_RECOVERY"\)/);
  assert.match(app, /openCommandCompletionTarget\(\{ next: \{ type: "ASSIGNMENT", module: order\.module, assignmentId: order\.assignmentId/);
  assert.match(app, /daily-closeout-panel/);
});

test("030X auto-repairs only deterministic evidence and preserves signed authority", () => {
  const engine = read("assets/js/recruit-continuity-recovery.js");
  const app = read("assets/js/app.js");
  assert.match(engine, /mutatesSignedAuthority: false/);
  assert.match(engine, /inventsCompletion: false/);
  assert.match(engine, /code: "RETRY_PROTECTED_SAVE"/);
  assert.match(engine, /code: "REBUILD_HANDOFF"/);
  assert.match(engine, /code: "ACTIVATE_TODAY"/);
  assert.doesNotMatch(engine, /saveApprovedRecruitContract|commitUnifiedWeekDraft/);
  assert.match(app, /runAutomaticRecruitContinuityRecovery/);
  assert.match(app, /drainAccountPersistence\(\{ reason: "recruit_recovery", force: true \}\)/);
  assert.match(app, /reconcileNextDayCommandHandoff\(\{ date: result\.targetDate, persist: true \}\)/);
  assert.match(app, /reconcileMorningCommandActivation\(\{ date: result\.targetDate, persist: true \}\)/);
});

test("030X runs after the protected 48-hour check without exposing machinery", () => {
  const html = read("app.html");
  const app = read("assets/js/app.js");
  assert.ok(app.indexOf('runStartupTask("48-hour recruit loop"') < app.indexOf('runStartupTask("saved-work recovery"'));
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), />\s*(?:BUILD|RELEASE)\s+030X/i);
  assert.doesNotMatch(html, /Recruit Continuity Recovery/i);
});
