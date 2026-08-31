"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const ProofWeek = require("../assets/js/recruit-proof-week.js");

const authority = {
  contractRevision: 14,
  programId: "program-r14",
  weekId: "week-2026-08-24",
  weekStartDate: "2026-08-24",
  weekEndDate: "2026-08-30"
};

function dayReceipt(date, overrides = {}) {
  return {
    id: `real-account-journey:${date}:proof`,
    type: ProofWeek.DAILY_RECEIPT_TYPE,
    authority: { date, contractRevision: 14, programId: "program-r14", weekId: "week-2026-08-24" },
    observedAt: `${date}T22:00:00.000Z`,
    ...overrides
  };
}

const dates = ProofWeek.weekDates(authority);

test("counts only elapsed account receipts and leaves future days unscored", () => {
  const accountReceipts = dates.slice(0, 3).map(dayReceipt);
  const result = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-27",
    accountReceipts,
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-27T23:00:00.000Z", online: true }
  });
  assert.equal(result.headline, "Week 1 · 3 of 7 days secure");
  assert.deepEqual(result.counts, { elapsed: 4, secure: 3, protected: 0, open: 1, actionRequired: 0, unscored: 1 });
  assert.equal(result.days.at(-1).state, "FUTURE");
  assert.equal(result.canFinalize, false);
  assert.equal(result.canAdvance, false);
});

test("points one exact repair at an incomplete prior day", () => {
  const accountReceipts = [dates[0], dates[1], dates[3]].map(dayReceipt);
  const result = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-27",
    accountReceipts,
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-27T23:00:00.000Z", online: true }
  });
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.deepEqual(result.repair, {
    code: "REVIEW_PRIOR_DAY",
    label: "Review yesterday",
    section: "today",
    operatingDate: "2026-08-26",
    detail: "Aug 26 is missing its account-backed daily proof."
  });
  assert.equal(result.days.find((day) => day.date === "2026-08-26").state, "ACTION_REQUIRED");
});

test("unsigned or stale daily authority never enters the proof chain", () => {
  const stale = dayReceipt("2026-08-24", { authority: { date: "2026-08-24", contractRevision: 15, programId: "program-r15", weekId: "week-r15" } });
  const result = ProofWeek.evaluate({ authority, asOfDate: "2026-08-25", accountReceipts: [stale] });
  assert.equal(result.counts.secure, 0);
  assert.equal(result.counts.actionRequired, 1);
  assert.equal(result.repair.operatingDate, "2026-08-24");
});

test("seven exact account days produce one idempotent week receipt", () => {
  const daily = dates.map(dayReceipt);
  const first = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-30",
    accountReceipts: daily,
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-30T23:00:00.000Z", online: true }
  });
  assert.equal(first.state, "READY_TO_SAVE");
  assert.equal(first.shouldSave, true);
  assert.ok(first.candidate?.id);

  const localReceipts = ProofWeek.appendReceipt(daily, first.candidate);
  const protectedResult = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-30",
    localReceipts,
    accountReceipts: daily,
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-30T23:00:00.000Z", online: true }
  });
  assert.equal(protectedResult.state, "PROTECTED");
  assert.equal(protectedResult.canFinalize, false);

  const secondSession = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-30",
    localReceipts,
    accountReceipts: [...daily, first.candidate],
    account: { serverConfirmed: true, lastVerifiedAt: "2026-08-30T23:05:00.000Z", online: true }
  });
  assert.equal(secondSession.state, "VERIFIED");
  assert.equal(secondSession.canFinalize, true);
  assert.equal(secondSession.canAdvance, true);
  assert.equal(secondSession.candidate.id, first.candidate.id);
  assert.equal(ProofWeek.appendReceipt(localReceipts, first.candidate).filter((item) => item.id === first.candidate.id).length, 1);
});

test("a live cross-surface mismatch blocks today instead of inventing proof", () => {
  const result = ProofWeek.evaluate({
    authority,
    asOfDate: "2026-08-24",
    liveDaily: {
      date: "2026-08-24",
      report: {
        state: "ACTION_REQUIRED",
        detail: "Calendar and Today disagree.",
        firstProblem: { code: "ASSIGNMENT_SURFACE_MISMATCH" },
        primaryAction: { code: "OPEN_CALENDAR", label: "Review Calendar", section: "calendar" }
      }
    }
  });
  assert.equal(result.state, "ACTION_REQUIRED");
  assert.equal(result.days[0].issue, "ASSIGNMENT_SURFACE_MISMATCH");
  assert.equal(result.repair.code, "OPEN_CALENDAR");
  assert.equal(result.counts.unscored, 1);
});
