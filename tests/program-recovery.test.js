const assert = require("assert");
const recovery = require("../assets/js/program-recovery.js");

const missingContract = recovery.buildRecovery({ repair: { status: "CONTRACT_REQUIRED", modules: [] }, contract: null });
assert.equal(recovery.VERSION, "025Z.1");
assert.equal(missingContract.currentStep.id, "contract");
assert.equal(missingContract.primary.action, "OPEN_CONTRACT");
assert.equal(missingContract.progress, 0);

const modules = ["strength", "running", "core", "nutrition"].map((id) => ({ id, state: "KEEP" }));
const ready = recovery.buildRecovery({ repair: { status: "READY_TO_ACTIVATE", modules, week: { weekStart: "2026-08-17" } }, contract: { id: "contract-1" } });
assert.equal(ready.status, "READY_TO_ACTIVATE");
assert.equal(ready.progress, 100);
assert.equal(ready.primary.action, "ACTIVATE");
assert.equal(ready.steps.length, 6);

const partial = recovery.buildRecovery({ repair: { status: "READY_TO_REPAIR", modules: [{ id: "strength", state: "KEEP" }, { id: "running", state: "CREATE" }, { id: "core", state: "KEEP" }, { id: "nutrition", state: "KEEP" }] }, contract: { id: "contract-1" } });
assert.equal(partial.currentStep.id, "running");
assert.equal(partial.primary.action, "PREPARE");
assert.equal(partial.steps.find((step) => step.id === "calendar").state, "BLOCKED");

const active = recovery.buildRecovery({ repair: { status: "ACTIVE", modules, week: {} }, contract: { id: "contract-1" } });
assert.equal(active.status, "ACTIVE");
assert.equal(active.primary.action, "OPEN_TODAY");

console.log("Program Recovery tests passed.");
