const assert = require("node:assert/strict");
const repair = require("../assets/js/activation-repair.js");

const modules = [
  { id: "strength", label: "Strength", included: true, complete: true, status: "LINKED", message: "Strength is linked." },
  { id: "running", label: "Running", included: true, complete: false, status: "UPDATE_REQUIRED", message: "Running predates the Contract." },
  { id: "core", label: "Core", included: true, complete: true, status: "LINKED", message: "Core is linked." },
  { id: "nutrition", label: "Nutrition", included: true, complete: false, status: "PLAN_REQUIRED", message: "Nutrition targets are required." }
];

{
  const model = repair.buildRepairFlow(
    { state: "PLANS_REQUIRED", detail: "2 of 4 plans match Contract 3." },
    { status: "ACTION_REQUIRED", modules, next: { action: "STAGE_DRAFTS", module: "running" } }
  );
  assert.equal(repair.VERSION, "024E.1");
  assert.equal(model.visible, true);
  assert.equal(model.headline, "Complete the Atlas program");
  assert.deepEqual(model.primary, { action: "REPAIR_PROGRAM", label: "Complete my program", module: null });
  assert.equal(model.progress.complete, 2);
  assert.equal(model.progress.total, 4);
  assert.equal(model.stages.find((item) => item.id === "plans").current, true);
}

{
  const draftModules = modules.map((item) => item.id === "running"
    ? { ...item, status: "DRAFT_READY", message: "Review the Running draft." }
    : item);
  const model = repair.buildRepairFlow(
    { state: "PLANS_REQUIRED" },
    { status: "ACTION_REQUIRED", modules: draftModules, next: { action: "OPEN_MODULE", module: "running" } }
  );
  assert.deepEqual(model.primary, { action: "REPAIR_PROGRAM", label: "Complete my program", module: null });
}

{
  const linked = modules.map((item) => ({ ...item, complete: true, status: "LINKED" }));
  const build = repair.buildRepairFlow(
    { state: "WEEK_REQUIRED", detail: "Build the coordinated week." },
    { status: "READY_TO_BUILD", modules: linked, next: { action: "BUILD_WEEK", label: "Build coordinated week" } }
  );
  assert.equal(build.primary.action, "BUILD_WEEK");
  assert.equal(build.headline, "Build the coordinated week");
  assert.equal(build.stages.find((item) => item.id === "plans").complete, true);

  const commit = repair.buildRepairFlow(
    { state: "WEEK_REQUIRED", detail: "Commit the coordinated week." },
    { status: "WEEK_READY", modules: linked, next: { action: "COMMIT_WEEK", label: "Commit coordinated week" } }
  );
  assert.equal(commit.primary.action, "COMMIT_WEEK");
  assert.equal(commit.headline, "Commit the coordinated week");
}

{
  const timeout = repair.buildRepairFlow({}, {}, { timedOut: true });
  assert.equal(timeout.visible, true);
  assert.equal(timeout.timedOut, true);
  assert.equal(timeout.primary.action, "RETRY");
  assert.match(timeout.detail, /without losing any saved work/i);
}

{
  const active = repair.buildRepairFlow(
    { state: "ROLL_CALL_REQUIRED" },
    { status: "ACTIVE", modules: modules.map((item) => ({ ...item, complete: true, status: "LINKED" })) }
  );
  assert.equal(active.visible, false);
  assert.equal(active.operational, true);
  assert.equal(active.headline, "Your week is operational");
}

console.log("Build 019F activation repair model tests passed.");
