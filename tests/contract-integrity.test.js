const assert = require("node:assert/strict");
const integrity = require("../assets/js/contract-integrity.js");

function contract(overrides = {}) {
  return {
    id: "contract-r3",
    revision: 3,
    status: "APPROVED",
    target: "Run a strong half marathon",
    targetDate: "2026-11-01",
    primaryGoal: "HYBRID_PERFORMANCE",
    trainingDaysPerWeek: 6,
    strengthDaysPerWeek: 4,
    runningDaysPerWeek: 4,
    coreDaysPerWeek: 3,
    sessionMinutes: 90,
    twoADays: true,
    nutritionCommitment: "TRACK_DAILY",
    equipment: "FULL_GYM",
    restrictions: "None",
    signature: { signedAt: "2026-08-01T12:00:00.000Z" },
    ...overrides
  };
}

function week(overrides = {}) {
  return {
    id: "week-r3",
    status: "DRAFT",
    weekStart: "2026-08-03",
    contractId: "contract-r3",
    contractRevision: 3,
    days: [
      { weekday: "Monday", twoADay: true },
      { weekday: "Saturday", longRunUncapped: true }
    ],
    ...overrides
  };
}

assert.equal(integrity.VERSION, "021F.1");

{
  const previous = contract({ id: "contract-r2", revision: 2, runningDaysPerWeek: 3, twoADays: false, sessionMinutes: 75 });
  const changes = integrity.amendmentChanges(previous, contract());
  assert.deepEqual(changes.map((item) => item.id), ["runningDaysPerWeek", "sessionMinutes", "twoADays"]);
  assert.deepEqual(changes.find((item) => item.id === "twoADays"), {
    id: "twoADays",
    label: "Two-a-Days",
    from: "Off",
    to: "Enabled"
  });
}

{
  const staged = integrity.calendarIntegrity(contract(), {
    weekDraft: week(),
    committedWeeks: [],
    currentWeek: week({ id: "current-r2", contractId: "contract-r2", contractRevision: 2 })
  });
  assert.equal(staged.status, "DRAFT_MATCHED");
  assert.equal(staged.calendarRevision, 3);
  assert.equal(staged.currentWeekRevision, 2);
  assert.equal(staged.protectedCurrentWeek, true);
  assert.equal(staged.twoADayCount, 1);
  assert.equal(staged.longRunsUncapped, true);
}

{
  const active = integrity.calendarIntegrity(contract(), {
    weekDraft: null,
    committedWeeks: [week({ status: "APPROVED" })],
    currentWeek: week({ status: "APPROVED" })
  });
  assert.equal(active.status, "ACTIVE");
  assert.equal(active.repairRequired, false);
}

{
  const broken = integrity.calendarIntegrity(contract(), {
    weekDraft: week({ contractRevision: 2 }),
    committedWeeks: []
  });
  assert.equal(broken.status, "REPAIR_REQUIRED");
  assert.equal(broken.calendarRevision, null);
  assert.equal(broken.repairRequired, true);
}

{
  const previous = contract({ id: "contract-r2", revision: 2, twoADays: false });
  const state = integrity.calendarIntegrity(contract(), { weekDraft: week(), committedWeeks: [] });
  const receipt = integrity.createHandoffReceipt(previous, contract(), state, { recordedAt: "2026-08-01T12:01:00.000Z" });
  assert.equal(receipt.contractRevision, 3);
  assert.equal(receipt.previousRevision, 2);
  assert.equal(receipt.calendarStatus, "DRAFT_MATCHED");
  assert.equal(receipt.calendarRevision, 3);
  assert.equal(receipt.twoADaysAuthorized, true);
  assert.ok(receipt.changes.some((item) => item.id === "twoADays"));
  assert.equal(integrity.receiptMatchesContract(receipt, contract()), true);
  assert.equal(integrity.receiptMatchesContract(receipt, contract({ revision: 4 })), false);
}

console.log("Build 021F Contract-to-calendar integrity logic passed.");
