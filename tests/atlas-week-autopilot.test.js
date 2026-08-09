const assert = require("node:assert/strict");
const autopilot = require("../assets/js/atlas-week-autopilot.js");

const contract = { id: "contract-1", revision: 4, status: "APPROVED" };
const plans = {
  strength: { id: "strength-1" },
  running: { id: "running-1" },
  core: { id: "core-1" },
  nutrition: { id: "nutrition-1" }
};
const receipt = {
  status: "ACTIVE",
  contractId: contract.id,
  contractRevision: contract.revision,
  planRefs: {
    strength: plans.strength.id,
    running: plans.running.id,
    core: plans.core.id,
    nutrition: plans.nutrition.id
  }
};
const activeWeek = { id: "week-current", weekStart: "2026-08-03", weekEnd: "2026-08-09", status: "COMMITTED" };
const draft = {
  id: "week-next",
  weekStart: "2026-08-10",
  weekEnd: "2026-08-16",
  status: "DRAFT",
  contractId: contract.id,
  contractRevision: contract.revision,
  sourceRefs: {
    strengthPlanId: plans.strength.id,
    runningBlockId: plans.running.id,
    corePlanId: plans.core.id,
    nutritionBaselineId: plans.nutrition.id
  },
  conflicts: [],
  approvalBlocked: false,
  days: [{ date: "2026-08-10", activities: [] }]
};
const input = { today: "2026-08-08", contract, plans, receipt, activeWeek };

{
  const model = autopilot.buildAutopilot(input);
  assert.equal(model.status, "BUILD_READY");
  assert.equal(model.targetWeekStart, "2026-08-10");
}

{
  const model = autopilot.buildAutopilot({ ...input, draft });
  assert.equal(model.status, "READY_TO_COMMIT");
  assert.equal(autopilot.canAutoCommit(model, { contract, receipt, draft }), true);
  const activation = autopilot.buildCommitReceipt(model, { ...draft, status: "COMMITTED" }, { committedAt: "2026-08-08T12:00:00.000Z" });
  assert.equal(activation.status, "AUTO_COMMITTED");
  assert.equal(activation.weekStart, draft.weekStart);
  assert.deepEqual(activation.sourceRefs, draft.sourceRefs);
}

{
  const futureWeek = { ...draft, status: "COMMITTED" };
  const model = autopilot.buildAutopilot({ ...input, futureWeek });
  assert.equal(model.status, "COMMITTED");
}

{
  const model = autopilot.buildAutopilot({ ...input, plans: { ...plans, running: { id: "running-2" } }, draft });
  assert.equal(model.status, "REVIEW_REQUIRED");
  assert.equal(model.action, "REVIEW_PROGRAM");
}

{
  const edited = { ...draft, calendarEdited: true };
  const model = autopilot.buildAutopilot({ ...input, draft: edited, futureWeek: { ...draft, status: "COMMITTED" } });
  assert.equal(model.status, "REVIEW_REQUIRED");
  assert.match(model.headline, /calendar edits/i);
  assert.equal(autopilot.canAutoCommit(model, { contract, receipt, draft: edited }), false);
}

{
  const blocked = { ...draft, approvalBlocked: true, conflicts: [{ severity: "BLOCKING", detail: "Recovery day collision." }] };
  const model = autopilot.buildAutopilot({ ...input, draft: blocked });
  assert.equal(model.status, "BLOCKED");
  assert.match(model.detail, /collision/i);
}

{
  const model = autopilot.buildAutopilot({ ...input, receipt: { ...receipt, contractRevision: 3 }, draft });
  assert.equal(model.status, "ACTIVATION_REQUIRED");
}

console.log("Build 024N Atlas week autopilot tests passed.");
