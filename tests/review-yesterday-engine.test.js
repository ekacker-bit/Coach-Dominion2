"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const review = require("../assets/js/review-yesterday.js");
const journey = require("../assets/js/real-account-journey.js");

function journeyInput(overrides = {}) {
  const authority = {
    contractSigned: true,
    contractRevision: 14,
    programContractRevision: 14,
    weekContractRevision: 14,
    programId: "program-r14",
    weekId: "week-2026-08-31",
    todayId: "command-2026-08-31"
  };
  const assignments = [{ id: "lower-a", module: "STRENGTH", status: "COMPLETED" }];
  const evidence = [{ id: "strength-proof", assignmentId: "lower-a", module: "STRENGTH", verificationStatus: "VERIFIED", accountConfirmedAt: "2026-08-31T21:00:00Z" }];
  const closeout = {
    id: "daily-closeout:2026-08-31",
    date: "2026-08-31",
    status: "SEALED",
    accountConfirmedAt: "2026-08-31T23:00:00Z",
    verificationStatus: "VERIFIED",
    steps: { selfReported: 12100, effective: 12100 },
    discipline: { alcoholAbstained: true, masturbationCount: null, friedFoodAvoided: null, dessertDeclined: null, processedFoodStatus: "UNANSWERED", processedFoods: [] }
  };
  return {
    date: "2026-08-31",
    authority,
    assignments,
    surfaces: { calendar: assignments, today: assignments, activeExecutionId: "" },
    evidence,
    fuel: null,
    closeout,
    review: { operatingDate: "2026-08-31" },
    account: { serverConfirmed: false, pendingWrites: 0, online: true },
    localReceipts: [],
    accountReceipts: [],
    ...overrides
  };
}

test("031F preloads known evidence and keeps optional unknowns unscored", () => {
  const daily = journey.evaluate(journeyInput());
  const model = review.presentation({
    date: "2026-08-31",
    today: "2026-09-01",
    closeout: journeyInput().closeout,
    connectedSteps: 11850,
    journey: daily
  });

  assert.equal(model.date, "2026-08-31");
  assert.equal(model.state, "READY");
  assert.equal(model.saveLabel, "Save Yesterday");
  assert.deepEqual(model.fields.known.map((item) => item.id), ["steps", "alcohol"]);
  assert.deepEqual(model.fields.unknown.map((item) => item.id), ["masturbation", "fried_food", "dessert", "processed_food"]);
  assert.equal(model.fields.missing.length, 0);
});

test("031F gives one exact blocker instead of permitting a stranded save", () => {
  const input = journeyInput({
    assignments: [{ id: "lower-a", module: "STRENGTH", status: "IN_PROGRESS" }],
    surfaces: {
      calendar: [{ id: "lower-a", module: "STRENGTH", status: "IN_PROGRESS" }],
      today: [{ id: "lower-a", module: "STRENGTH", status: "IN_PROGRESS" }],
      activeExecutionId: "lower-a"
    },
    evidence: [],
    closeout: null
  });
  const daily = journey.evaluate(input);
  const model = review.presentation({ date: "2026-08-31", today: "2026-09-01", closeout: null, journey: daily });

  assert.equal(model.state, "BLOCKED");
  assert.equal(model.canSave, false);
  assert.match(model.blocker.detail, /assigned work/i);
});

test("031F uses one stable canonical receipt and restores its saved state", () => {
  const first = journey.evaluate(journeyInput());
  const second = journey.evaluate({ ...journeyInput(), observedAt: "2026-09-01T12:00:00Z" });
  assert.equal(first.state, "READY_TO_SAVE");
  assert.equal(first.candidate.id, second.candidate.id);

  const restored = journey.evaluate({
    ...journeyInput(),
    localReceipts: [first.candidate],
    accountReceipts: [first.candidate],
    account: { serverConfirmed: true, lastVerifiedAt: "2026-09-01T12:01:00Z", pendingWrites: 0, online: true }
  });
  const model = review.presentation({
    date: "2026-08-31",
    today: "2026-09-01",
    closeout: journeyInput().closeout,
    journey: restored
  });
  assert.equal(restored.state, "VERIFIED");
  assert.equal(model.state, "SAVED");
  assert.equal(model.canSave, false);
  assert.equal(model.receiptId, first.candidate.id);
});

test("031F lets a stranded local receipt retry one account save", () => {
  const first = journey.evaluate(journeyInput());
  const protectedReport = journey.evaluate({ ...journeyInput(), localReceipts: [first.candidate] });
  const model = review.presentation({
    date: "2026-08-31",
    today: "2026-09-01",
    closeout: journeyInput().closeout,
    journey: protectedReport,
    online: true
  });
  assert.equal(protectedReport.state, "PROTECTED");
  assert.equal(model.state, "READY");
  assert.equal(model.canSave, true);
  assert.match(model.detail, /retry it now/i);
});

test("031F refuses today or a future date as a prior-day repair", () => {
  const today = review.presentation({ date: "2026-09-01", today: "2026-09-01" });
  const future = review.presentation({ date: "2026-09-02", today: "2026-09-01" });
  assert.equal(today.state, "BLOCKED");
  assert.equal(future.state, "BLOCKED");
  assert.equal(today.blocker.code, "INVALID_REVIEW_DATE");
});
