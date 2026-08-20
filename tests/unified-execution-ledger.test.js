const test = require("node:test");
const assert = require("node:assert/strict");
const ledger = require("../assets/js/unified-execution-ledger.js");

const date = "2026-08-19";
const assignments = [
  { assignmentId: "week-r12:strength:lower-a", module: "STRENGTH", date, title: "Lower A", sessionOrder: 1 },
  { assignmentId: "week-r12:running:easy", module: "RUNNING", date, title: "Easy run", sessionOrder: 2 },
  { assignmentId: "week-r12:core:anti-extension", module: "CORE", date, title: "Core", sessionOrder: 3 },
  { assignmentId: "week-r12:nutrition", module: "NUTRITION", date, title: "Fuel target" }
];

test("030G starts every committed domain from the same scheduled state", () => {
  const result = ledger.buildLedger({ date, assignments });
  assert.equal(result.version, "030G.1");
  assert.equal(result.total, 4);
  assert.equal(result.completed, 0);
  assert.equal(result.next.assignmentId, assignments[0].assignmentId);
  assert.deepEqual(result.entries.map((entry) => entry.state), Array(4).fill("scheduled"));
});

test("030G preserves active execution while incomplete proof remains a draft", () => {
  const result = ledger.buildLedger({
    date,
    assignments,
    executions: [{
      assignmentId: assignments[0].assignmentId,
      module: "STRENGTH",
      state: "IN_PROGRESS",
      setLogs: { BACK_SQUAT: [{ kind: "WORK", reps: 5, load: 225 }] }
    }],
    evidence: [{
      id: "run-draft",
      assignmentId: assignments[1].assignmentId,
      domain: "running",
      metrics: { distance: 3 }
    }, {
      id: "fuel-draft",
      assignmentId: assignments[3].assignmentId,
      domain: "nutrition",
      metrics: { calories: 2400 }
    }]
  });
  assert.equal(ledger.entryForModule(result, "strength").state, "in_progress");
  assert.equal(ledger.entryForModule(result, "running").state, "draft_evidence");
  assert.equal(ledger.entryForModule(result, "fuel").state, "draft_evidence");
  assert.equal(result.next.module, "strength");
});

test("030G completes each module only from assignment-linked proof", () => {
  const result = ledger.buildLedger({
    date,
    assignments,
    executions: [{
      assignmentId: assignments[0].assignmentId,
      module: "STRENGTH",
      state: "COMPLETE",
      completedAt: `${date}T13:00:00.000Z`,
      setLogs: { BACK_SQUAT: [{ kind: "WORK", reps: 5, load: 225 }] }
    }, {
      assignmentId: assignments[2].assignmentId,
      module: "CORE",
      state: "COMPLETE",
      completedAt: `${date}T14:00:00.000Z`,
      completedExercises: { PLANK: true }
    }],
    evidence: [{
      id: "run-proof",
      assignmentId: assignments[1].assignmentId,
      domain: "running",
      evidenceStatus: "VERIFIED",
      metrics: { distance: 4.2, duration_seconds: 2280 }
    }, {
      id: "fuel-proof",
      assignmentId: assignments[3].assignmentId,
      domain: "nutrition",
      state: "COMPLETE",
      metrics: { calories: 2450, protein: 180, carbs: 250, fat: 75 }
    }]
  });
  assert.equal(result.complete, true);
  assert.equal(result.completed, 4);
  assert.equal(ledger.entryForModule(result, "running").state, "verified");
  assert.equal(ledger.entryForModule(result, "nutrition").state, "completed");
  assert.equal(result.consistency.consistent, true);
});

test("030G rejects evidence from a different assignment and reports the orphan", () => {
  const result = ledger.buildLedger({
    date,
    assignments,
    evidence: [{
      id: "old-run-proof",
      assignmentId: "week-r11:running:easy",
      domain: "running",
      metrics: { distance: 4, duration_seconds: 2100 }
    }]
  });
  assert.equal(ledger.entryForModule(result, "running").complete, false);
  assert.equal(result.consistency.consistent, false);
  assert.deepEqual(result.consistency.orphanEvidence, ["old-run-proof"]);
});

test("030G produces the same read model after an unchanged reload", () => {
  const input = {
    date,
    assignments,
    executions: [{ assignmentId: assignments[2].assignmentId, module: "CORE", state: "IN_PROGRESS", completedExercises: { PLANK: true } }]
  };
  const first = ledger.buildLedger(input);
  const restored = ledger.buildLedger(JSON.parse(JSON.stringify(input)));
  assert.equal(restored.fingerprint, first.fingerprint);
  assert.deepEqual(restored.entries.map(({ assignmentId, state }) => ({ assignmentId, state })), first.entries.map(({ assignmentId, state }) => ({ assignmentId, state })));
});

test("030G excludes cancelled and superseded orders from required completion", () => {
  const result = ledger.buildLedger({
    date,
    assignments: [
      { ...assignments[0], status: "CANCELLED" },
      { ...assignments[1], status: "SUPERSEDED" },
      assignments[2]
    ]
  });
  assert.equal(result.total, 1);
  assert.equal(result.entries[0].state, "cancelled");
  assert.equal(result.entries[1].state, "superseded");
  assert.equal(result.entries[2].state, "scheduled");
});
