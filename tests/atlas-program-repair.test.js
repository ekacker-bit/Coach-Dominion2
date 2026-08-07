const assert = require("node:assert/strict");
const repair = require("../assets/js/atlas-program-repair.js");

function contract(overrides = {}) {
  return {
    id: "contract-repair-1",
    revision: 4,
    status: "APPROVED",
    ...overrides
  };
}

function linked(id, revision = 4) {
  return {
    id,
    status: "APPROVED",
    recruitContractId: "contract-repair-1",
    recruitContractRevision: revision
  };
}

{
  const model = repair.buildRepairPlan({});
  assert.equal(model.status, "CONTRACT_REQUIRED");
  assert.deepEqual(model.primary, { action: "OPEN_CONTRACT", label: "Set the Contract" });
}

{
  const model = repair.buildRepairPlan({
    contract: contract(),
    program: { modules: [
      { id: "strength", included: true },
      { id: "running", included: true },
      { id: "core", included: true },
      { id: "nutrition", included: true }
    ] },
    activePlans: {
      strength: linked("strength-current"),
      running: linked("running-current"),
      core: linked("core-stale", 3),
      nutrition: null
    }
  });
  assert.equal(repair.VERSION, "024F.1");
  assert.equal(model.status, "READY_TO_REPAIR");
  assert.deepEqual(model.primary, { action: "PREPARE", label: "Complete my program" });
  assert.equal(model.progress.kept, 2);
  assert.equal(model.progress.changing, 2);
  assert.equal(model.modules.find((item) => item.id === "strength").state, "KEEP");
  assert.equal(model.modules.find((item) => item.id === "core").state, "REPLACE");
  assert.equal(model.modules.find((item) => item.id === "nutrition").state, "CREATE");
}

{
  const current = contract({ revision: 10 });
  const expiredLegacyWeek = {
    status: "APPROVED",
    contractId: current.id,
    contractRevision: 9,
    weekStart: "2026-07-27",
    weekEnd: "2026-08-02"
  };
  const protectedLegacyWeek = {
    ...expiredLegacyWeek,
    weekStart: "2026-08-03",
    weekEnd: "2026-08-09"
  };
  const replacementWeek = {
    ...protectedLegacyWeek,
    contractRevision: 10
  };
  assert.equal(repair.calendarDisposition(expiredLegacyWeek, current, "2026-08-07"), "EXPIRED_LEGACY_WEEK");
  assert.equal(repair.calendarDisposition(protectedLegacyWeek, current, "2026-08-07"), "PROTECTED_CURRENT_WEEK");
  assert.equal(repair.calendarDisposition(replacementWeek, current, "2026-08-07"), "CURRENT_CONTRACT");
  assert.equal(repair.weekLinkedToContract(replacementWeek, current), true);
  assert.equal(repair.weekLinkedToContract(expiredLegacyWeek, current), false);
}

{
  assert.deepEqual(repair.normalizeModuleReadiness(null, {
    status: "TARGETS_REQUIRED",
    message: "Fuel must be linked."
  }), {
    status: "TARGETS_REQUIRED",
    message: "Fuel must be linked."
  });
  assert.deepEqual(repair.normalizeModuleReadiness({ status: "ready to stage", message: "Ready." }), {
    status: "READY_TO_STAGE",
    message: "Ready."
  });
}

{
  const plans = {
    strength: linked("strength-current"),
    running: linked("running-current"),
    core: linked("core-current"),
    nutrition: linked("nutrition-current")
  };
  const weekDraft = {
    weekStart: "2026-08-10",
    weekEnd: "2026-08-16",
    trainingDays: 5,
    recoveryDays: 2,
    twoADayCount: 1,
    days: [{ estimatedMinutes: 60 }, { estimatedMinutes: 45 }, { estimatedMinutes: 0 }]
  };
  const model = repair.buildRepairPlan({
    contract: contract(),
    program: { modules: Object.keys(plans).map((id) => ({ id, included: true })) },
    activePlans: plans,
    preflight: { status: "READY_TO_ACTIVATE", blockers: [] },
    weekDraft
  });
  assert.equal(model.status, "READY_TO_ACTIVATE");
  assert.deepEqual(model.primary, { action: "ACTIVATE", label: "Activate complete program" });
  assert.deepEqual(model.week, {
    weekStart: "2026-08-10",
    weekEnd: "2026-08-16",
    trainingDays: 5,
    recoveryDays: 2,
    twoADayCount: 1,
    estimatedMinutes: 105
  });
}

{
  const model = repair.buildRepairPlan({
    contract: contract(),
    program: { modules: [] },
    preflight: { blockers: [{ code: "HARD_RUN_STRENGTH_COLLISION", detail: "Move one hard session." }] }
  });
  assert.equal(model.status, "SAFETY_REVIEW");
  assert.equal(model.primary.action, "OPEN_CALENDAR");
  assert.equal(model.blockers[0].kind, "SAFETY_REVIEW");
}

{
  const model = repair.buildRepairPlan({
    contract: contract(),
    program: { modules: [{ id: "strength", included: true, status: "PROFILE_REQUIRED", summary: "Add current weight." }] },
    activePlans: {}
  });
  assert.equal(model.status, "DECISION_REQUIRED");
  assert.equal(model.primary.action, "OPEN_CONTRACT");
}

{
  const plans = Object.fromEntries(["strength", "running", "core", "nutrition"].map((id) => [id, linked(`${id}-current`)]));
  const model = repair.buildRepairPlan({
    contract: contract(),
    program: { modules: Object.keys(plans).map((id) => ({ id, included: true })) },
    activePlans: plans,
    receiptAudit: { status: "ACTIVE" },
    preflight: { blockers: [] }
  });
  assert.equal(model.status, "ACTIVE");
  assert.equal(model.visible, false);
  assert.equal(model.primary.action, "OPEN_TODAY");
}

console.log("Build 024F Atlas Program Repair tests passed.");
