const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/atlas-weekly-command.js");

const proposal = { id: "week-1", status: "PROPOSED", code: "PROGRESS", tone: "green", targetWeekStart: "2026-08-17", targetWeekEnd: "2026-08-23", headline: "Progress the week", detail: "Evidence supports a bounded advance.", metrics: { strengthPercent: 100, runningPercent: 90, corePercent: 80, fuelPercent: 70, recoveryPercent: 85 }, changes: [{ domain: "STRENGTH", action: "STAGE_PROGRESS", detail: "Small load advance" }] };

test("025U produces one concise cross-domain command", () => {
  const command = engine.buildCommand({ proposal, runningProgression: { status: "PROPOSED", code: "PROGRESS", detail: "Add five percent." }, fuelSummary: { closedDays: 5, confidence: "USEFUL" } });
  assert.equal(engine.VERSION, "025U.1");
  assert.equal(command.win.code, "STRENGTH");
  assert.equal(command.watch.code, "FUELING");
  assert.ok(command.proposedChanges.some((change) => change.domain === "RUNNING"));
  assert.equal(command.approvalRequired, true);
});

test("weekly approval attaches an immutable receipt to the adaptive decision", () => {
  const command = engine.approveCommand(engine.buildCommand({ proposal }), "2026-08-16T12:00:00.000Z");
  const decision = engine.attachToDecision({ id: "adaptive-1", status: "APPROVED" }, command);
  assert.equal(decision.atlasWeeklyCommand.decision, "PROGRESS");
  assert.equal(decision.atlasWeeklyCommand.watch.code, "FUELING");
});

test("holding the command removes every staged change", () => {
  const held = engine.holdCommand(engine.buildCommand({ proposal }), "2026-08-16T12:00:00.000Z");
  assert.equal(held.status, "HELD");
  assert.deepEqual(held.proposedChanges, []);
});
