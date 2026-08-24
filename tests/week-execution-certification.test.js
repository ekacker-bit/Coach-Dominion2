const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/week-execution-certification.js");

const week = {
  id: "week-2026-08-17-r4",
  weekStart: "2026-08-17",
  weekEnd: "2026-08-23",
  revision: 4,
  contractRevision: 12,
  programFingerprint: "program-r12"
};

function ledger(date, entries = [], issues = []) {
  return { date, entries, consistency: { consistent: !issues.length, issues } };
}

function assignment(date, module, state, suffix = module, evidence = []) {
  const id = `${date}:${suffix}`;
  return {
    date,
    module,
    state,
    assignmentId: id,
    assignment: { id, assignmentId: id, date, module, title: `${module} assignment` },
    evidence
  };
}

function sevenLedgers(overrides = {}) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 7, 17 + index)).toISOString().slice(0, 10);
    return overrides[date] || ledger(date);
  });
}

test("certifies one immutable weekly receipt and counts canonical execution evidence once", () => {
  const strength = assignment("2026-08-17", "strength", "completed", "upper-a", [
    { id: "manual-old", status: "COMPLETED", completedAt: "2026-08-17T16:00:00Z", metrics: { completed_sets: 9 } },
    { id: "connected-best", status: "VERIFIED", evidenceStatus: "CONNECTED_VERIFIED", verifiedAt: "2026-08-17T17:00:00Z", metrics: { completed_sets: 12 } }
  ]);
  const run = assignment("2026-08-19", "running", "verified", "tempo", [
    { id: "run-proof", evidenceStatus: "VERIFIED", metrics: { distance_km: 10, duration_seconds: 3000 } }
  ]);
  const core = assignment("2026-08-19", "core", "completed", "core-a", [
    { id: "core-proof", completedAt: "2026-08-19T17:00:00Z", durationMinutes: 18 }
  ]);
  const fuel = assignment("2026-08-17", "nutrition", "completed", "fuel", [
    { id: "fuel-proof", evidenceStatus: "VERIFIED", metrics: { calories: 2500, protein: 190 } }
  ]);
  const result = engine.certify({
    week,
    ledgers: sevenLedgers({
      "2026-08-17": ledger("2026-08-17", [strength, fuel]),
      "2026-08-19": ledger("2026-08-19", [run, core])
    }),
    closeouts: [{ date: "2026-08-17", status: "SEALED" }],
    readiness: [{ date: "2026-08-17" }, { date: "2026-08-18" }],
    finalizedAt: "2026-08-24T02:00:00Z"
  });

  assert.equal(result.status, "CERTIFIED");
  assert.equal(result.locked, true);
  assert.equal(result.metrics.trainingSessionsPlanned, 3);
  assert.equal(result.metrics.trainingSessionsExecuted, 3);
  assert.equal(result.metrics.strengthSets, 12);
  assert.equal(result.metrics.runningMiles, 6.21);
  assert.equal(result.metrics.runningMinutes, 50);
  assert.equal(result.metrics.coreMinutes, 18);
  assert.equal(result.metrics.fuelDaysLogged, 1);
  assert.equal(result.metrics.rollCallDays, 2);
  assert.equal(result.metrics.closeoutDays, 1);
  assert.equal(result.metrics.recoveryDays, 5);
  assert.equal(result.outcomes.find((item) => item.module === "strength").evidenceId, "connected-best");
});

test("only a sealed Closeout turns an unproved assignment into missed", () => {
  const scheduled = assignment("2026-08-18", "strength", "scheduled", "lower-a");
  const unresolved = engine.evaluate({
    week,
    ledgers: sevenLedgers({ "2026-08-18": ledger("2026-08-18", [scheduled]) })
  });
  assert.equal(unresolved.status, "BLOCKED");
  assert.equal(unresolved.counts.UNRESOLVED, 1);
  assert.match(unresolved.repair.label, /Resolve Tuesday/);

  const missed = engine.certify({
    week,
    ledgers: sevenLedgers({ "2026-08-18": ledger("2026-08-18", [scheduled]) }),
    closeouts: [{ date: "2026-08-18", completedAt: "2026-08-19T01:00:00Z" }],
    finalizedAt: "2026-08-24T02:00:00Z"
  });
  assert.equal(missed.status, "CERTIFIED");
  assert.equal(missed.counts.MISSED, 1);
  assert.equal(missed.counts.UNRESOLVED, 0);
});

test("partial evidence is an honest terminal outcome and recovery ignores Fuel assignment presence", () => {
  const partialCore = assignment("2026-08-20", "core", "draft_evidence", "core-b");
  const scheduledFuel = assignment("2026-08-21", "nutrition", "scheduled", "fuel");
  const result = engine.certify({
    week,
    ledgers: sevenLedgers({
      "2026-08-20": ledger("2026-08-20", [partialCore]),
      "2026-08-21": ledger("2026-08-21", [scheduledFuel])
    }),
    closeouts: [{ date: "2026-08-21", status: "CLOSED" }],
    finalizedAt: "2026-08-24T02:00:00Z"
  });
  assert.equal(result.status, "CERTIFIED");
  assert.equal(result.counts.PARTIAL, 1);
  assert.equal(result.counts.MISSED, 1);
  assert.equal(result.days.find((day) => day.date === "2026-08-21").status, "RECOVERY");
});

test("identity faults block certification behind one repair", () => {
  const entry = assignment("2026-08-17", "strength", "completed", "upper-a");
  const result = engine.evaluate({
    week,
    ledgers: sevenLedgers({
      "2026-08-17": ledger("2026-08-17", [entry], [{ code: "ORPHAN_EVIDENCE", evidenceId: "orphan" }])
    })
  });
  assert.equal(result.canFinalize, false);
  assert.equal(result.repair.code, "REPAIR_WEEK_EVIDENCE");
  assert.equal(result.repair.section, "inspection");
});

test("a locked receipt is idempotent and late evidence cannot mutate it", () => {
  const base = engine.certify({ week, ledgers: sevenLedgers(), finalizedAt: "2026-08-24T02:00:00Z" });
  const exact = engine.certify({ week, ledgers: sevenLedgers(), priorReceipt: base, finalizedAt: "2026-08-25T02:00:00Z" });
  assert.equal(exact.id, base.id);
  assert.equal(exact.certifiedAt, base.certifiedAt);
  assert.equal(exact.idempotent, true);

  const completed = assignment("2026-08-17", "strength", "completed", "upper-a", [{ id: "late-proof", completedAt: "2026-08-17T16:00:00Z" }]);
  const locked = engine.certify({
    week,
    ledgers: sevenLedgers({ "2026-08-17": ledger("2026-08-17", [completed]) }),
    priorReceipt: base
  });
  assert.equal(locked.id, base.id);
  assert.equal(locked.fingerprint, base.fingerprint);
  assert.equal(locked.lateEvidence, true);
  assert.notEqual(locked.observedFingerprint, base.fingerprint);
});

test("history preserves the first locked receipt for a week", () => {
  const first = engine.certify({ week, ledgers: sevenLedgers(), finalizedAt: "2026-08-24T02:00:00Z" });
  const competing = { ...first, id: "competing", fingerprint: "different" };
  const history = engine.upsertHistory([first], competing);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, first.id);
});
