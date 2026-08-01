const assert = require("node:assert/strict");
const truth = require("../assets/js/operating-truth.js");

assert.equal(truth.VERSION, "019D.1");

const linkedModules = ["strength", "running", "core", "nutrition"].map((id) => ({
  id,
  label: id[0].toUpperCase() + id.slice(1),
  included: true,
  complete: true,
  section: id === "nutrition" ? "nutrition" : "performance"
}));

function base(overrides = {}) {
  const source = {
    date: "2026-07-31",
    contract: { approved: true, signed: true, revision: 3 },
    activation: { status: "ACTIVE", modules: linkedModules, next: {} },
    week: { committed: true, draft: false, revision: 2, contractRevision: 3, conflicts: [] },
    today: { rollCallComplete: true, authorized: true },
    modules: [
      { id: "strength", label: "Strength", scheduled: true, executionState: "READY", evidenceCount: 0 },
      { id: "nutrition", label: "Fuel", scheduled: true, executionState: "READY", evidenceCount: 0 }
    ],
    review: { loopState: "EXECUTION OPEN", closed: false, adaptationApproved: false }
  };
  return {
    ...source,
    ...overrides,
    contract: { ...source.contract, ...(overrides.contract || {}) },
    activation: { ...source.activation, ...(overrides.activation || {}) },
    week: { ...source.week, ...(overrides.week || {}) },
    today: { ...source.today, ...(overrides.today || {}) },
    review: { ...source.review, ...(overrides.review || {}) }
  };
}

let model = truth.buildOperatingTruth(base({ contract: { approved: false, signed: false } }));
assert.equal(model.state, "CONTRACT_REQUIRED");
assert.equal(model.action.section, "contract");

model = truth.buildOperatingTruth(base({ contract: { signed: false } }));
assert.equal(model.state, "SIGNATURE_REQUIRED");

const pendingModules = linkedModules.map((item, index) => index === 1 ? { ...item, complete: false, status: "UPDATE_REQUIRED" } : item);
model = truth.buildOperatingTruth(base({ activation: { status: "ACTION_REQUIRED", modules: pendingModules } }));
assert.equal(model.state, "PLANS_REQUIRED");
assert.equal(model.plans.complete, 3);
assert.equal(model.plans.total, 4);
assert.equal(model.action.module, "running");

model = truth.buildOperatingTruth(base({ activation: { status: "READY_TO_BUILD" }, week: { committed: false } }));
assert.equal(model.state, "WEEK_REQUIRED");
assert.equal(model.action.action, "BUILD_WEEK");

model = truth.buildOperatingTruth(base({
  week: {
    conflicts: [{ code: "TIME_COMMITMENT_EXCEEDED", severity: "ADVISORY", detail: "150 planned minutes exceed the 90-minute commitment." }]
  }
}));
assert.equal(model.state, "CONFLICT");
assert.match(model.detail, /150 planned minutes/);

model = truth.buildOperatingTruth(base({ today: { rollCallComplete: false, authorized: false } }));
assert.equal(model.state, "ROLL_CALL_REQUIRED");

model = truth.buildOperatingTruth(base({ today: { authorized: false } }));
assert.equal(model.state, "AUTHORIZATION_REQUIRED");

model = truth.buildOperatingTruth(base());
assert.equal(model.state, "EXECUTION_REQUIRED");
assert.equal(model.modules[0].status, "READY");

model = truth.buildOperatingTruth(base({
  modules: [
    { id: "strength", label: "Strength", scheduled: true, executionState: "COMPLETE", evidenceCount: 0 },
    { id: "nutrition", label: "Fuel", scheduled: true, executionState: "COMPLETE", evidenceCount: 1 }
  ]
}));
assert.equal(model.state, "EVIDENCE_REQUIRED");
assert.equal(model.modules[0].status, "VERIFY");
assert.equal(model.modules[1].status, "COMPLETE");

const completedModules = [
  { id: "strength", label: "Strength", scheduled: true, executionState: "COMPLETE", evidenceCount: 2 },
  { id: "nutrition", label: "Fuel", scheduled: true, executionState: "COMPLETE", evidenceCount: 1 }
];
model = truth.buildOperatingTruth(base({ modules: completedModules, review: { loopState: "REVIEW READY" } }));
assert.equal(model.state, "REVIEW_REQUIRED");
assert.equal(model.canSeal, true);
assert.equal(model.evidence.complete, 2);

model = truth.buildOperatingTruth(base({
  modules: completedModules,
  review: { loopState: "LOOP CLOSED", closed: true, adaptationApproved: true }
}));
assert.equal(model.state, "SECURED");
assert.equal(model.stages.every((item) => item.complete), true);

model = truth.buildOperatingTruth(base({
  modules: [{ id: "running", label: "Run", scheduled: false, executionState: "COMPLETE", evidenceCount: 1 }],
  review: { loopState: "LOOP CLOSED", closed: true, adaptationApproved: true }
}));
assert.equal(model.modules[0].status, "RECORDED");
assert.equal(model.modules[0].complete, false);
assert.equal(model.contradictions[0].code, "UNSCHEDULED_RUNNING_EVIDENCE");

model = truth.buildOperatingTruth(base({ week: { contractRevision: 2 } }));
assert.equal(model.state, "CONFLICT");
assert.equal(model.contradictions[0].code, "WEEK_CONTRACT_MISMATCH");

console.log("Build 019D operating truth engine tests passed.");
