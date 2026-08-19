"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const startup = require("../assets/js/startup-authority.js");
const assignments = require("../assets/js/assignment-evidence-state.js");
const commits = require("../assets/js/calendar-commit-authority.js");
const time = require("../assets/js/operational-time.js");
const persistence = require("../assets/js/account-persistence.js");

test("startup remains protected until authoritative state validates", () => {
  const initial = startup.initial();
  assert.equal(startup.permitsAction(initial), false);
  assert.equal(startup.permitsAccountWrite(initial, "startup"), false);

  const ready = startup.reconcile({
    accountAvailable: true,
    accountSnapshot: { fingerprint: "account-1" },
    validation: { valid: true }
  });
  assert.equal(ready.phase, startup.PHASES.READY);
  assert.equal(startup.permitsAction(ready), true);
  assert.equal(startup.permitsAccountWrite(ready, "navigation"), false);
  assert.equal(startup.permitsAccountWrite(ready, "quick-log"), true);
});

test("account failure only opens a verified device copy in degraded mode", () => {
  const degraded = startup.reconcile({
    accountAvailable: false,
    deviceSnapshot: { fingerprint: "device-1" },
    deviceVerified: true
  });
  assert.equal(degraded.phase, startup.PHASES.DEGRADED);
  assert.equal(startup.permitsAction(degraded), true);
  assert.equal(degraded.readOnly, true);
  assert.equal(startup.permitsAccountWrite(degraded, "quick-log"), false);

  const blocked = startup.reconcile({ accountAvailable: false, deviceSnapshot: {} });
  assert.equal(blocked.phase, startup.PHASES.BLOCKED);
  assert.equal(startup.permitsAction(blocked), false);
});

test("run evidence is valid only when complete and linked to the assignment", () => {
  const assignment = { id: "run-tempo-1", title: "Tempo development", module: "RUNNING" };
  const unlinked = { id: "e-1", assignmentId: "easy-run-1", metrics: { distance: 5, duration_seconds: 2400 } };
  const blank = { id: "e-2", assignmentId: "run-tempo-1", metrics: { distance: "", duration_seconds: "" } };
  assert.equal(assignments.resolve({ assignment, evidence: [unlinked] }).state, "scheduled");
  assert.equal(assignments.resolve({ assignment, evidence: [blank] }).state, "draft_evidence");

  const execution = { assignmentId: "run-tempo-1", state: "IN_PROGRESS" };
  assert.equal(assignments.resolve({ assignment, execution }).action.code, "RESUME");

  const completed = { id: "e-3", assignmentId: "run-tempo-1", metrics: { distance: 5, duration_seconds: 2400 } };
  assert.equal(assignments.resolve({ assignment, evidence: [completed] }).state, "completed");
  const wrongSession = { ...completed, metrics: { ...completed.metrics, run_type: "EASY" } };
  assert.equal(assignments.resolve({ assignment: { ...assignment, type: "TEMPO" }, evidence: [wrongSession] }).state, "draft_evidence");
  const verified = { ...completed, evidenceStatus: "VERIFIED" };
  assert.equal(assignments.resolve({ assignment, evidence: [verified] }).state, "verified");
});

test("calendar commit receipts are deterministic and revision bound", () => {
  const input = {
    contractRevision: "R14",
    weekStart: "2026-08-24",
    calendarRevision: "CAL-14",
    assignmentIds: ["run-2", "lift-1"],
    accountRevision: "account-9",
    committedAt: "2026-08-19T12:00:00.000Z"
  };
  const receipt = commits.create(input);
  assert.equal(receipt.contractRevision, "14");
  assert.equal(receipt.assignmentIds.join(","), "lift-1,run-2");
  assert.equal(commits.matches(receipt, input), true);
  assert.equal(commits.matches(receipt, { ...input, assignmentIds: ["run-2", "lift-2"] }), false);
});

test("operational dates honor the recruit timezone while retaining UTC instants", () => {
  const instant = new Date("2026-08-20T02:30:00.000Z");
  assert.equal(time.dateInZone(instant, "America/Chicago"), "2026-08-19");
  assert.equal(time.dateInZone(instant, "UTC"), "2026-08-20");
  assert.deepEqual(time.stamp(instant, "America/Chicago"), {
    recordedAt: "2026-08-20T02:30:00.000Z",
    operationalDate: "2026-08-19",
    timeZone: "America/Chicago"
  });
});

test("pending account work has one unioned read model", () => {
  const entries = persistence.canonicalPendingEntries(
    [{ id: "calendar-1", domain: "calendar", queuedAt: "2026-08-19T10:00:00.000Z" }],
    [{ mutationId: "account-1", operation: "account truth", queuedAt: "2026-08-19T10:01:00.000Z" }]
  );
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((item) => item.queueSource), ["CONTINUITY", "ACCOUNT_TRUTH"]);
  const state = persistence.pendingState(entries.filter((item) => item.queueSource === "CONTINUITY"), entries.filter((item) => item.queueSource === "ACCOUNT_TRUTH"));
  assert.equal(state.count, 2);
  assert.match(state.detail, /2 protected changes waiting/);
});
