const test = require("node:test");
const assert = require("node:assert/strict");
const spine = require("../assets/js/mission-execution-spine.js");

const assignments = [
  { id: "lower-a", module: "STRENGTH", title: "Lower A", windowLabel: "AM", order: 1, record: { state: "IN_PROGRESS", updatedAt: "2026-08-13T12:00:00.000Z" } },
  { id: "easy-run", module: "RUNNING", title: "Easy run", windowLabel: "PM", order: 2, record: { state: "READY" } },
  { id: "fuel", module: "FUEL", title: "Log today\'s Fuel", order: 3, record: { state: "READY" } },
  { id: "recovery", module: "RECOVERY", title: "Complete recovery", order: 4, record: { state: "COMPLETE", completedAt: "2026-08-13T20:00:00.000Z" } }
];

test("Build 026B ranks a resumable active mission ahead of later work", () => {
  const model = spine.buildSpine({ date: "2026-08-13", assignments });
  assert.equal(model.version, "026B.1");
  assert.equal(model.current.id, "lower-a");
  assert.equal(model.current.state, "IN_PROGRESS");
  assert.equal(model.primary.code, "OPEN");
  assert.equal(model.secured, 1);
  assert.equal(model.total, 4);
});
test("Build 026B restores a paused shared checkpoint when canonical work is still ready", () => {
  const saved = {
    date: "2026-08-13",
    updatedAt: "2026-08-13T14:00:00.000Z",
    entries: [{ id: "easy-run", module: "RUNNING", title: "Easy run", state: "PAUSED", updatedAt: "2026-08-13T14:00:00.000Z" }]
  };
  const model = spine.buildSpine({ date: "2026-08-13", assignments: assignments.map((item) => item.id === "lower-a" ? { ...item, record: { state: "COMPLETE" } } : item), saved });
  assert.equal(model.current.id, "easy-run");
  assert.equal(model.current.state, "PAUSED");
  assert.equal(model.primary.code, "RESUME");
  assert.equal(model.lastSavedAt, saved.updatedAt);
});

test("Build 026B transitions one durable checkpoint without duplicating assignments", () => {
  let checkpoint = spine.transition({ date: "2026-08-13", entries: [] }, assignments[1], "START", "2026-08-13T17:00:00.000Z");
  checkpoint = spine.transition(checkpoint, assignments[1], "PAUSE", "2026-08-13T17:30:00.000Z");
  checkpoint = spine.transition(checkpoint, assignments[1], "RESUME", "2026-08-13T18:00:00.000Z");
  assert.equal(checkpoint.entries.length, 1);
  assert.equal(checkpoint.entries[0].state, "IN_PROGRESS");
  assert.equal(checkpoint.entries[0].startedAt, "2026-08-13T17:00:00.000Z");
  assert.equal(checkpoint.entries[0].pausedAt, "2026-08-13T17:30:00.000Z");
});

test("Build 026B converts module completion into a cross-domain account checkpoint", () => {
  const model = spine.buildSpine({ date: "2026-08-13", assignments: assignments.map((item) => ({ ...item, record: { state: "COMPLETE", completedAt: "2026-08-13T21:00:00.000Z" } })) });
  const checkpoint = spine.buildCheckpoint(model, null, "2026-08-13T21:01:00.000Z");
  assert.equal(model.complete, true);
  assert.equal(model.primary.code, "COMPLETE");
  assert.equal(checkpoint.state, "COMPLETE");
  assert.equal(checkpoint.entries.length, 4);
  assert.ok(checkpoint.entries.every((item) => item.state === "SECURED"));
});

test("Build 026B makes the shared spine the Today command only after setup blockers clear", () => {
  const model = spine.buildSpine({ date: "2026-08-13", assignments });
  const command = spine.applyToCommand({ state: "EXECUTION_REQUIRED", title: "Execute Strength", primary: { action: "MODULE" }, progress: {} }, model);
  assert.equal(command.primary.action, "MISSION_SPINE");
  assert.equal(command.primary.module, "strength");
  assert.match(command.primary.label, /CONTINUE/);
  const blocked = spine.applyToCommand({ state: "PLANS_REQUIRED", title: "Repair plans", primary: { action: "PLAN" } }, model);
  assert.equal(blocked.primary.action, "PLAN");
});
