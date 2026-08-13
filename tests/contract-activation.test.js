const assert = require("node:assert/strict");
const activation = require("../assets/js/contract-activation.js");

const contract = {
  id: "contract-2",
  revision: 2,
  status: "APPROVED",
  planningInputs: {
    strength: { daysPerWeek: 4, sessionMinutes: 60, goal: "MUSCLE", equipment: "FULL_GYM" },
    running: { runningDaysPerWeek: 3, declaredWeeklyDistance: 18, preferredUnit: "mi", goal: "10K" },
    core: { sessionsPerWeek: 3, sessionMinutes: 15, goal: "GENERAL_STRENGTH" },
    nutrition: { goal: "MAINTAIN" }
  }
};

function plan(id, profile = {}) {
  return { id, revision: 1, status: "APPROVED", recruitContractId: contract.id, recruitContractRevision: contract.revision, profile };
}

function linkedContext(overrides = {}) {
  const strengthPlan = plan("strength-2", { daysPerWeek: 4, sessionMinutes: 60, goal: "MUSCLE", equipment: "FULL_GYM" });
  const runningPlan = plan("running-2", { runningDaysPerWeek: 3, declaredWeeklyDistance: 18, preferredUnit: "mi", goal: "10K" });
  const corePlan = plan("core-2", { sessionsPerWeek: 3, sessionMinutes: 15, goal: "GENERAL_STRENGTH" });
  const nutritionBaseline = { id: "nutrition-2", status: "APPROVED", goal: "MAINTAIN" };
  return {
    contract,
    strengthPlan,
    runningPlan,
    corePlan,
    nutritionBaseline,
    nutritionConnection: { status: "PLAN_LINKED", baseline: nutritionBaseline, message: "Nutrition linked." },
    committedWeeks: [],
    ...overrides
  };
}

function matchingWeek(context, overrides = {}) {
  return {
    id: "week-2",
    status: "DRAFT",
    weekStart: "2026-08-03",
    contractId: contract.id,
    contractRevision: contract.revision,
    sourceRefs: {
      strengthPlanId: context.strengthPlan.id,
      strengthPlanRevision: context.strengthPlan.revision,
      runningBlockId: context.runningPlan.id,
      runningBlockRevision: context.runningPlan.revision,
      corePlanId: context.corePlan.id,
      corePlanRevision: context.corePlan.revision,
      nutritionBaselineId: context.nutritionBaseline.id
    },
    ...overrides
  };
}

{
  const state = activation.buildActivation({});
  assert.equal(state.status, "CONTRACT_REQUIRED");
  assert.equal(state.next.action, "EDIT_CONTRACT");
}

{
  const state = activation.buildActivation({ contract, nutritionConnection: { status: "TARGETS_REQUIRED" } });
  assert.equal(state.status, "ACTION_REQUIRED");
  assert.equal(state.modules.find((item) => item.id === "strength").status, "PLAN_REQUIRED");
  assert.equal(state.next.action, "STAGE_PROGRAM");
}

{
  const oldStrength = { id: "strength-1", revision: 1, status: "APPROVED", recruitContractId: "contract-1", recruitContractRevision: 1, profile: { daysPerWeek: 3, sessionMinutes: 45 } };
  const draft = { ...plan("strength-draft"), status: "DRAFT" };
  const runningDraft = { ...plan("running-draft"), status: "DRAFT", weeks: [{}, {}, {}, {}] };
  const coreDraft = { ...plan("core-draft"), status: "DRAFT", weeks: [{}, {}, {}, {}] };
  const nutritionDraft = { status: "READY FOR APPROVAL", recruitContractId: contract.id, recruitContractRevision: contract.revision };
  const state = activation.buildActivation(linkedContext({
    strengthPlan: oldStrength,
    strengthDraft: draft,
    runningPlan: null,
    runningDraft,
    corePlan: null,
    coreDraft,
    nutritionBaseline: null,
    nutritionConnection: { status: "TARGETS_REQUIRED" },
    nutritionDraft
  }));
  const strength = state.modules.find((item) => item.id === "strength");
  assert.equal(strength.status, "DRAFT_READY");
  assert.equal(strength.changes.length, 4);
  assert.equal(state.next.action, "APPROVE_PROGRAM");
}

{
  const state = activation.buildActivation(linkedContext());
  assert.equal(state.status, "READY_TO_BUILD");
  assert.equal(state.modules.filter((item) => item.complete).length, 4);
  assert.equal(state.next.action, "BUILD_WEEK");
}

{
  const context = linkedContext();
  context.weekDraft = matchingWeek(context);
  const state = activation.buildActivation(context);
  assert.equal(state.status, "WEEK_READY");
  assert.equal(state.next.action, "COMMIT_WEEK");
}

{
  const previousRevisionPlans = linkedContext({
    strengthPlan: { ...plan("strength-previous", { daysPerWeek: 4, sessionMinutes: 60, goal: "MUSCLE", equipment: "FULL_GYM" }), recruitContractRevision: 1 },
    runningPlan: { ...plan("running-previous", { runningDaysPerWeek: 3, declaredWeeklyDistance: 18, preferredUnit: "mi", goal: "10K" }), recruitContractRevision: 1 },
    corePlan: { ...plan("core-previous", { sessionsPerWeek: 3, sessionMinutes: 15, goal: "GENERAL_STRENGTH" }), recruitContractRevision: 1 }
  });
  const state = activation.buildActivation(previousRevisionPlans);
  assert.equal(state.status, "READY_TO_BUILD");
  assert.deepEqual(state.modules.filter((item) => item.id !== "nutrition").map((item) => item.status), ["COMPATIBLE", "COMPATIBLE", "COMPATIBLE"]);
  assert.equal(state.modules.every((item) => item.complete), true);
}

{
  const context = linkedContext();
  const committed = matchingWeek(context, { status: "APPROVED" });
  context.committedWeeks = [committed];
  const state = activation.buildActivation(context);
  assert.equal(state.status, "ACTIVE");
  assert.equal(state.progress.complete, state.progress.total);
  assert.equal(state.next.action, "OPEN_TODAY");
}

{
  const context = linkedContext();
  context.committedWeeks = [null];
  assert.doesNotThrow(() => activation.buildActivation(context));
}

{
  const context = linkedContext();
  context.committedWeeks = [matchingWeek(context, { status: "APPROVED" })];
  context.weekDraft = matchingWeek(context, { id: "week-2-revision" });
  const state = activation.buildActivation(context);
  assert.equal(state.status, "WEEK_READY");
  assert.equal(state.next.action, "COMMIT_WEEK");
}

{
  const context = linkedContext({
    nutritionBaseline: { id: "nutrition-old", status: "APPROVED", goal: "PERFORMANCE" },
    nutritionConnection: { status: "PLAN_REVIEW", baseline: { id: "nutrition-old", status: "APPROVED", goal: "PERFORMANCE" }, message: "Goal mismatch." }
  });
  const state = activation.buildActivation(context);
  const nutrition = state.modules.find((item) => item.id === "nutrition");
  assert.equal(nutrition.status, "UPDATE_REQUIRED");
  assert.equal(nutrition.changes.length, 1);
  assert.equal(state.next.action, "STAGE_PROGRAM");
}

{
  const context = linkedContext();
  const previousWeek = matchingWeek(context, { contractId: "contract-1", contractRevision: 1, status: "APPROVED" });
  context.currentWeek = previousWeek;
  const state = activation.buildActivation(context);
  assert.equal(state.status, "READY_TO_BUILD");
  assert.equal(state.protectedWeek.id, previousWeek.id);
}

console.log("Build 018G Contract Activation tests passed.");
